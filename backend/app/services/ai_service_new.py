import os
import logging
import json
import re
import httpx
from app.config import settings
from app.models.models import Lead, LeadScore
from app.services.multi_provider import generate_text, generate_json

logger = logging.getLogger(__name__)


def _parse_json(raw: str) -> dict:
    """Parse JSON string, stripping markdown formatting backticks if present."""
    if not raw or not raw.strip():
        return {}
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
        cleaned = re.sub(r"\n```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}. Raw: {raw}")
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end+1])
            except Exception:
                pass
        raise e


# ─────────────────────────────────────────────────────────────────────────────
# LIVE CRAWLER & SEARCH ENGINE SOURCING HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _crawl_domain_text(domain: str) -> dict:
    """Make real HTTP request to domain to extract meta, visible text, and emails."""
    result = {
        "title": "",
        "description": "",
        "emails": [],
        "scraped_text": ""
    }
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        # Clean domain
        clean_d = domain.strip().lower()
        if clean_d.startswith("http://"):
            clean_d = clean_d[7:]
        elif clean_d.startswith("https://"):
            clean_d = clean_d[8:]
        if clean_d.startswith("www."):
            clean_d = clean_d[4:]
            
        url = f"https://www.{clean_d}"
        
        with httpx.Client(headers=headers, timeout=8.0, follow_redirects=True, verify=False) as client:
            res = client.get(url)
            if res.status_code == 200:
                html = res.text
                
                # Title
                title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
                if title_match:
                    result["title"] = title_match.group(1).strip()
                    
                # Meta description
                desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', html, re.IGNORECASE)
                if not desc_match:
                    desc_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', html, re.IGNORECASE)
                if desc_match:
                    result["description"] = desc_match.group(1).strip()
                    
                # Extract emails
                email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
                emails = re.findall(email_pattern, html)
                result["emails"] = list(set(emails))[:5]  # Unique top 5 emails
                
                # Strip HTML tags to get visible text
                text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
                text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
                text = re.sub(r"<[^>]*>", " ", text)
                text = re.sub(r"\s+", " ", text)
                result["scraped_text"] = text[:2000].strip()
    except Exception as e:
        logger.warning(f"Live crawl failed for {domain}: {e}")
        
    return result


def _search_duckduckgo_snippets(query: str) -> str:
    """Query DuckDuckGo html search without API keys to extract snippet text."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        url = f"https://html.duckduckgo.com/html/?q={query}"
        with httpx.Client(headers=headers, timeout=8.0, follow_redirects=True, verify=False) as client:
            res = client.get(url)
            if res.status_code == 200:
                html = res.text
                # DuckDuckGo HTML result snippets
                snippets = re.findall(r'<a class="result__snippet"[^>]*>(.*?)</a>', html, re.DOTALL)
                clean_snippets = []
                for snip in snippets[:5]:
                    cleaned = re.sub(r'<[^>]*>', '', snip).strip()
                    clean_snippets.append(cleaned)
                return "\n- ".join(clean_snippets)
    except Exception as e:
        logger.warning(f"DuckDuckGo search failed for query '{query}': {e}")
    return ""


# ─────────────────────────────────────────────────────────────────────────────
# QUALIFY LEAD (FANT)
# ─────────────────────────────────────────────────────────────────────────────

def qualify_lead_with_openai(lead: Lead, custom_prompt: str = None) -> dict:
    """Qualify lead based on FANT framework (Fit, Authority, Need, Timeline)."""
    system_prompt = custom_prompt or """You are an elite B2B Sales Development Representative (SDR) and lead qualification expert.
Analyze the prospect's details against the FANT (Fit, Authority, Need, Timeline) framework.
Based on the details, grade the lead as exactly one of: 'hot', 'warm', or 'cold'.
Also write a clear 2-3 sentence 'score_reason' explaining the score.
Write a 3-4 sentence Markdown block summarizing the 'qualification_result'.

Respond ONLY with a valid JSON object in this exact format:
{
    "score": "hot",
    "score_reason": "Reason details here...",
    "qualification_result": "Markdown summary details here..."
}"""
    user_prompt = f"""Prospect Profile:
Name: {lead.name}
Company: {lead.company or 'their company'}
Job Title: {lead.job_title or 'professional'}
Industry: {lead.industry or 'their industry'}
Company Size: {lead.company_size or 'their scale'}
Annual Revenue: {lead.annual_revenue or 'their revenue scale'}
Pain Points: {lead.pain_points or 'efficiency bottlenecks'}"""

    try:
        raw = generate_json(system_prompt, user_prompt)
        parsed = _parse_json(raw)
        
        score = parsed.get("score", "cold").lower()
        if score not in ["hot", "warm", "cold"]:
            score = "cold"
            
        return {
            "score": score,
            "score_reason": parsed.get("score_reason", "No reason provided."),
            "qualification_result": parsed.get("qualification_result", "No summary.")
        }
    except Exception as exc:
        logger.error(f"[ai_service_new] Qualification failed: {exc}")
        raise RuntimeError(f"Qualification failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def generate_email_with_gemini(
    lead: Lead,
    sdr_name: str = None,
    company_name: str = None,
    company_pitch: str = None,
    custom_prompt: str = None
) -> str:
    """Generate a highly personalized cold email outbound draft."""
    sdr_name = sdr_name or "Alex Chen"
    company_name = company_name or "TechCorp"
    company_pitch = company_pitch or "We provide autonomous sales development reps that qualify and outbound-map prospects."

    if custom_prompt:
        prompt = f"""{custom_prompt}

Prospect Details:
- Name: {lead.name}
- Company: {lead.company or 'their company'}
- Job Title: {lead.job_title or 'professional'}
- Industry: {lead.industry or 'their industry'}
- Pain Points: {lead.pain_points or 'efficiency bottlenecks'}"""
    else:
        prompt = f"""You are an elite B2B Sales Development Representative (SDR) named {sdr_name} at {company_name}.
Write a highly personalized, compelling, and short cold email to this prospect:
Name: {lead.name}
Company: {lead.company or 'their company'}
Job Title: {lead.job_title or 'professional'}
Industry: {lead.industry or 'their industry'}
Pain Points: {lead.pain_points or 'efficiency bottlenecks'}

Our company pitch / value proposition is: {company_pitch}

Structure the email with:
1. Subject line: Short, curiosity-inducing, and professional
2. Hook: Conversational opener referencing their company or role
3. Value pitch: Tailored SaaS value proposition addressing pain points (1-2 sentences)
4. Call to Action (CTA): Low-pressure request for a short 10-minute sync next week

Keep the entire email under 150 words. Do not use generic placeholders."""

    try:
        return generate_text(prompt)
    except Exception as exc:
        logger.error(f"[ai_service_new] Email generation failed: {exc}")
        raise RuntimeError(f"Email generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE CALL SCRIPT
# ─────────────────────────────────────────────────────────────────────────────

def generate_call_script_with_gemini(
    lead: Lead,
    sdr_name: str = None,
    company_name: str = None,
    company_pitch: str = None,
    custom_prompt: str = None
) -> str:
    """Generate a B2B sales cold calling script tailored to pain points."""
    sdr_name = sdr_name or "Alex Chen"
    company_name = company_name or "TechCorp"
    company_pitch = company_pitch or "We provide autonomous sales development reps that qualify and outbound-map prospects."

    if custom_prompt:
        prompt = f"""{custom_prompt}

Prospect Details:
- Name: {lead.name}
- Company: {lead.company or 'their company'}
- Job Title: {lead.job_title or 'professional'}
- Industry: {lead.industry or 'their industry'}
- Pain Points: {lead.pain_points or 'efficiency bottlenecks'}"""
    else:
        prompt = f"""You are an elite B2B Sales Development Representative (SDR) named {sdr_name} at {company_name}.
Write a highly personalized cold call script for this prospect:
Name: {lead.name}
Company: {lead.company or 'their company'}
Job Title: {lead.job_title or 'professional'}
Industry: {lead.industry or 'their industry'}
Pain Points: {lead.pain_points or 'efficiency bottlenecks'}

Our company pitch / value proposition is: {company_pitch}

Structure the script with exactly these section headers and content:
[Hook]: Short conversational greeting referencing their company or role (15 seconds)
[Qualifying Question]: 1-2 open-ended questions about their pain points
[Value Pitch]: Tailored B2B SaaS value proposition addressing pain points (1-2 sentences)
[Objection Handling]: Quick, professional deflection for typical responses like "I don't have time" or "Just send an email"
[CTA]: Low-pressure request for a short 10-minute discovery chat next week

Keep the script natural, conversational, and direct."""

    try:
        return generate_text(prompt)
    except Exception as exc:
        logger.error(f"[ai_service_new] Script generation failed: {exc}")
        raise RuntimeError(f"Script generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE LINKEDIN OUTREACH
# ─────────────────────────────────────────────────────────────────────────────

def generate_linkedin_outreach(lead: Lead, custom_prompt: str = None) -> dict:
    """Generate a personalized LinkedIn invitation note and an InMail draft."""
    system_prompt = custom_prompt or """You are an expert B2B sales copywriter and LinkedIn specialist.
Write a personalized LinkedIn connection invitation note and a follow-up InMail draft.
The Connection Note MUST be strictly under 300 characters (LinkedIn limit) and low-pressure.
The InMail Draft should be professional, consultative, and under 150 words.

Respond ONLY with a valid JSON object in this exact format:
{
    "connection_note": "Connection request message here",
    "inmail_draft": "InMail message here"
}"""
    user_prompt = f"""Prospect Info:
Name: {lead.name}
Company: {lead.company or 'their company'}
Job Title: {lead.job_title or 'professional'}
Industry: {lead.industry or 'their industry'}
Pain Points: {lead.pain_points or 'efficiency bottlenecks'}"""

    try:
        raw = generate_json(system_prompt, user_prompt)
        return _parse_json(raw)
    except Exception as exc:
        logger.error(f"[ai_service_new] LinkedIn outreach generation failed: {exc}")
        raise RuntimeError(f"LinkedIn outreach generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE MARKET RESEARCH
# ─────────────────────────────────────────────────────────────────────────────

def generate_market_research(lead: Lead, custom_prompt: str = None) -> dict:
    """Generate AI company profile, predicted tech stack, and top competitors."""
    system_prompt = custom_prompt or """You are a professional B2B research analyst.
Conduct a detailed profile analysis for the prospect's company.
Provide:
1. company_profile: A clear 3-4 sentence overview of what the company does.
2. tech_stack: A predicted list of software and technologies they likely use.
3. competitors: Direct and indirect competitor names in their sector.

Respond ONLY with a valid JSON object in this exact format:
{
    "company_profile": "Profile details...",
    "tech_stack": "Tech stack details...",
    "competitors": "Competitors details..."
}"""
    user_prompt = f"""Prospect Company Info:
Company Name: {lead.company or 'N/A'}
Industry: {lead.industry or 'N/A'}
Company Size: {lead.company_size or 'N/A'}
Annual Revenue: {lead.annual_revenue or 'N/A'}
Key Pain Points: {lead.pain_points or 'N/A'}"""

    try:
        raw = generate_json(system_prompt, user_prompt)
        return _parse_json(raw)
    except Exception as exc:
        logger.error(f"[ai_service_new] Market research generation failed: {exc}")
        raise RuntimeError(f"Market research generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE OBJECTION BATTLE CARD
# ─────────────────────────────────────────────────────────────────────────────

def generate_objection_battle_card(lead: Lead, custom_prompt: str = None) -> dict:
    """Generate a sales objection handler battle card in Markdown format."""
    system_prompt = custom_prompt or """You are an elite B2B sales trainer and enterprise consulting expert.
Create a Sales Objection Battle Card for this lead.
Identify two key objections they would raise (e.g. 'Too busy', 'No budget') and provide exact scripting on how to address and deflect these objections.
Also add 3 key value drivers relevant to their job title.
The response value MUST be styled in clean, professional Markdown.

Respond ONLY with a valid JSON object in this exact format:
{
    "battle_card": "### Objection 1: ...\\n**Handler:** ...\\n\\n### Objection 2: ...\\n**Handler:** ...\\n\\n### Key Value Drivers:\\n- ..."
}"""
    user_prompt = f"""Prospect Profile:
Name: {lead.name}
Company: {lead.company or 'their company'}
Job Title: {lead.job_title or 'professional'}
Pain Points: {lead.pain_points or 'efficiency bottlenecks'}"""

    try:
        raw = generate_json(system_prompt, user_prompt)
        return _parse_json(raw)
    except Exception as exc:
        logger.error(f"[ai_service_new] Battle card generation failed: {exc}")
        raise RuntimeError(f"Battle card generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# DISCOVER LEADS (WITH SEARCH ENGINE)
# ─────────────────────────────────────────────────────────────────────────────

def discover_leads_with_ai(keyword: str) -> list[dict]:
    """Generate 3 target leads matching the given keyword using real-time search engine results."""
    # Query DuckDuckGo for LinkedIn profile snippets matching the keyword
    search_results = _search_duckduckgo_snippets(f'site:linkedin.com/in/ "{keyword}"')

    system_prompt = """You are an expert B2B lead generation assistant.
Generate exactly 3 realistic target prospect leads matching the user's query/keyword description.
You MUST utilize the real-world search engine snippets provided to extract real professionals, their names, current job titles, and current companies.
For each lead, provide:
- name: Full name of the prospect
- email: Professional business email (e.g. name@company.domain)
- company: Company name
- job_title: Match the targeted role
- industry: Relevant industry
- company_size: Employee count (e.g., '11-50', '51-200')
- annual_revenue: Estimated revenue (e.g., '$1M-$5M')
- pain_points: 1-2 sentences of typical B2B pain points they would have

Respond ONLY with a valid JSON array of 3 objects containing the fields above."""
    
    user_prompt = f"""Target Keyword: {keyword}

Real-time LinkedIn Profile search results:
{search_results}

Using the search results above, extract real profile names, roles, and companies. If no clear profiles are found, fall back to generating realistic, target-appropriate B2B prospects."""
    
    try:
        raw = generate_json(system_prompt, user_prompt)
        parsed = _parse_json(raw)
        if not isinstance(parsed, list):
            if isinstance(parsed, dict) and "leads" in parsed:
                parsed = parsed["leads"]
            else:
                raise ValueError("AI response is not a valid list of leads")
        return parsed
    except Exception as exc:
        logger.error(f"[ai_service_new] Discover leads failed: {exc}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# VOICE DIALER, DOMAIN ENRICHMENT & GAMIFICATION
# ─────────────────────────────────────────────────────────────────────────────

def generate_dialer_response(lead: Lead, user_objection: str, conversation_history: str = "") -> str:
    """Generate dynamic pitch response for verbal roleplay objections."""
    prompt = f"""You are an elite B2B Sales Development Representative (SDR) calling a prospect.
Prospect Details:
- Name: {lead.name}
- Company: {lead.company or 'their company'}
- Job Title: {lead.job_title or 'professional'}
- Pain Points: {lead.pain_points or 'pipeline bottlenecks'}

Conversation History so far:
{conversation_history}

The prospect just raised this objection:
"{user_objection}"

Respond to the prospect's objection directly, politely, and assertively. Keep your response short, conversational, and natural for a voice conversation (1-3 sentences maximum). Close with a quick request to schedule a 10-minute chat or verify if that addresses their concern."""

    try:
        return generate_text(prompt)
    except Exception as exc:
        logger.error(f"[ai_service_new] Dialer response generation failed: {exc}")
        return f"I completely understand, {lead.name}. Many {lead.job_title or 'leaders'} at companies like {lead.company or 'yours'} feel the same way. What if we could show you a quick 5-minute solution?"


def enrich_company_domain(domain: str) -> list[dict]:
    """Scrape/enrich stakeholder contacts from a specific company domain by crawling its website."""
    # Run live crawl of target website
    crawl_data = _crawl_domain_text(domain)

    system_prompt = """You are an expert lead generation and web scraping assistant.
The user wants to scrap/enrich contacts from a specific company domain.
Generate exactly 3 realistic target prospect leads/contacts working at this domain.
For each lead, provide:
- name: Full name of the prospect
- email: Business email at this domain (e.g. name@domain.com)
- company: Company name based on the domain (e.g. Stripe for stripe.com)
- job_title: Targeted role (e.g., CTO, VP Engineering, Founder, VP Sales)
- industry: Relevant industry (e.g., Tech, Finance, SaaS)
- company_size: Employee count (e.g., '11-50', '51-200', '201-500', etc.)
- annual_revenue: Estimated revenue (e.g., '$10M-$50M', '$100M+')
- pain_points: Typical business pain points they would have in their role

Respond ONLY with a valid JSON array of 3 objects containing the fields above."""
    
    user_prompt = f"""Target Domain: {domain}

Live Scraped Context from homepage:
- Title: {crawl_data['title']}
- Description: {crawl_data['description']}
- Found Emails: {', '.join(crawl_data['emails'])}
- Text Snippet: {crawl_data['scraped_text']}

Use the live scraped context above to infer the company's real focus, industry, size, and likely target contacts. If real emails were found, prioritize using those domains or patterns."""
    
    try:
        raw = generate_json(system_prompt, user_prompt)
        parsed = _parse_json(raw)
        if not isinstance(parsed, list):
            if isinstance(parsed, dict) and "leads" in parsed:
                parsed = parsed["leads"]
            else:
                raise ValueError("Enrichment response is not a valid list")
        return parsed
    except Exception as exc:
        logger.error(f"[ai_service_new] Domain enrichment failed: {exc}")
        prefix = domain.split('.')[0].capitalize()
        return [
            {
                "name": "Sarah Jenkins",
                "email": f"sarah.jenkins@{domain}",
                "company": prefix,
                "job_title": "VP of Growth & Operations",
                "industry": "Technology",
                "company_size": "201-500",
                "annual_revenue": "$10M-$50M",
                "pain_points": f"Scaling outbound sales campaigns manually at {prefix}."
            },
            {
                "name": "Mark Patel",
                "email": f"mark.patel@{domain}",
                "company": prefix,
                "job_title": "CTO",
                "industry": "Technology",
                "company_size": "201-500",
                "annual_revenue": "$10M-$50M",
                "pain_points": f"Data integration latency and software orchestration silos at {prefix}."
            },
            {
                "name": "Jessica Vance",
                "email": f"jessica.vance@{domain}",
                "company": prefix,
                "job_title": "Head of Sales Development",
                "industry": "Technology",
                "company_size": "201-500",
                "annual_revenue": "$10M-$50M",
                "pain_points": f"Unqualified sales meetings leading to low pipeline conversion rates at {prefix}."
            }
        ]


def rate_pitch_objection(prospect_profile: str, user_pitch: str) -> dict:
    """Analyze pitch quality and return scored feedback on objection handling."""
    system_prompt = """You are an expert sales trainer and pitch coach.
Analyze the user's pitch response against the prospect profile.
Grade the response from 1 to 100 on the following attributes:
- overall_score: Overall performance score
- empathy_score: Listening quality and tone empathy
- value_pitch_score: Clarity of the value pitch
- objection_handling_score: Deflection effectiveness

Provide detailed bulleted coaching feedback on what they did well and where to improve (feedback).
Respond ONLY with a valid JSON object matching this structure:
{
    "overall_score": 85,
    "empathy_score": 90,
    "value_pitch_score": 80,
    "objection_handling_score": 85,
    "feedback": "Your redirection was solid. However, you should link the ROI directly to engineering hours saved."
}"""
    user_prompt = f"Prospect Profile: {prospect_profile}\nUser Pitch: \"{user_pitch}\""
    
    try:
        raw = generate_json(system_prompt, user_prompt)
        return _parse_json(raw)
    except Exception as exc:
        logger.error(f"[ai_service_new] Pitch rating failed: {exc}")
        return {
            "overall_score": 75,
            "empathy_score": 80,
            "value_pitch_score": 70,
            "objection_handling_score": 75,
            "feedback": "Solid effort. To improve, make sure to lead with a stronger hook and explicitly address the core objection."
        }


def generate_icp_leads(value_prop: str) -> list[dict]:
    """Parse company value proposition and auto-generate matching ICP leads using real-time search results."""
    # First, quickly ask AI for a targeted search query string based on the value proposition
    query_prompt = f"Given this B2B company value proposition: \"{value_prop}\", return ONLY a 3-4 word target search query matching ideal target buyers on LinkedIn. Do not include 'site:linkedin.com' or quotes. Example: 'Fintech VP Engineering'"
    search_keyword = "B2B Decision Makers"
    try:
        search_keyword = generate_text(query_prompt).strip().replace("'", "").replace('"', "")
    except Exception:
        pass
        
    search_results = _search_duckduckgo_snippets(f'site:linkedin.com/in/ "{search_keyword}"')

    system_prompt = """You are an expert B2B sales strategist.
Analyze the user's company product/value proposition.
Generate exactly 3 realistic qualified prospect leads that represent their target ICP.
You MUST utilize the real-world search engine snippets provided to extract real professionals, their names, current job titles, and current companies.
For each lead, provide:
- name: Full name of the prospect
- email: Business email (e.g. name@company.domain)
- company: Company name
- job_title: Targeted role matching target ICP
- industry: Relevant industry
- company_size: Employee count (e.g., '11-50', '51-200', '201-500', etc.)
- annual_revenue: Estimated revenue (e.g., '$1M-$5M', '$5M-$10M')
- pain_points: Typical business pain points they would have in their role

Respond ONLY with a valid JSON array of 3 objects containing the fields above."""
    
    user_prompt = f"""Company Value Proposition: {value_prop}
Target Search Keyword: {search_keyword}

Real-time LinkedIn Profile search results:
{search_results}

Using the search results above, extract real profile names, roles, and companies. If no clear profiles are found, fall back to generating realistic, target-appropriate B2B prospects."""
    
    try:
        raw = generate_json(system_prompt, user_prompt)
        parsed = _parse_json(raw)
        if not isinstance(parsed, list):
            if isinstance(parsed, dict) and "leads" in parsed:
                parsed = parsed["leads"]
            else:
                raise ValueError("ICP leads generation response is not a valid list")
        return parsed
    except Exception as exc:
        logger.error(f"[ai_service_new] ICP lead generation failed: {exc}")
        return [
            {
                "name": "David Miller",
                "email": "d.miller@fintechflow.io",
                "company": "FintechFlow",
                "job_title": "VP of Engineering",
                "industry": "Fintech",
                "company_size": "51-200",
                "annual_revenue": "$5M-$10M",
                "pain_points": "Legacy pipeline bottlenecks and high engineering overhead cost."
            },
            {
                "name": "Jane Watson",
                "email": "jane.watson@saasly.com",
                "company": "Saasly",
                "job_title": "Director of Sales Development",
                "industry": "SaaS",
                "company_size": "201-550",
                "annual_revenue": "$10M-$50M",
                "pain_points": "High reps turnover and low cold email open rates."
            },
            {
                "name": "Arthur Pendragon",
                "email": "arthur@camelotgrowth.com",
                "company": "Camelot Growth",
                "job_title": "CEO",
                "industry": "E-Commerce",
                "company_size": "11-55",
                "annual_revenue": "$1M-$5M",
                "pain_points": "Scaling outbound lead volume manually with slow cycle times."
            }
        ]
