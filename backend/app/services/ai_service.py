"""
ai_service.py
─────────────
All AI operations route through multi_provider.generate_text / generate_json.
Provider fallback order: Gemini → Groq → OpenRouter → OpenAI (auto on quota/limit).
"""

import json
import logging
from app.models.models import Lead, LeadScore
from app.services.multi_provider import generate_text, generate_json

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: parse JSON safely from any provider response
# ─────────────────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    """Strip markdown code fences if present and parse JSON."""
    content = raw.strip()
    if "```" in content:
        for part in content.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{") and part.endswith("}"):
                content = part
                break
    return json.loads(content)


# ─────────────────────────────────────────────────────────────────────────────
# QUALIFY LEAD
# ─────────────────────────────────────────────────────────────────────────────

def qualify_lead_with_openai(lead: Lead) -> dict:
    """
    Qualify a lead using AI (any available provider).
    Requires active AI provider configuration. No fallbacks allowed.
    """
    system_prompt = """You are an expert B2B Sales Development Representative with 10 years of experience.
Analyze the lead information and provide a qualification score.

Scoring criteria:
- HOT: Decision maker at mid-large company, clear pain points, budget likely available, high urgency
- WARM: Has potential but missing some key criteria (smaller company, unclear budget, not decision maker)
- COLD: Small company, unclear fit, no clear pain points, or unlikely to convert

Respond ONLY with a valid JSON object in this exact format:
{
    "score": "hot" | "warm" | "cold",
    "score_reason": "2-3 sentence explanation of why you gave this score",
    "qualification_result": "Detailed 3-5 sentence analysis covering: fit, urgency, authority, need, and timeline (FANT framework)"
}"""

    user_prompt = f"""Qualify this lead:
Name: {lead.name}
Email: {lead.email}
Company: {lead.company or 'N/A'}
Job Title: {lead.job_title or 'N/A'}
Industry: {lead.industry or 'N/A'}
Company Size: {lead.company_size or 'N/A'}
Annual Revenue: {lead.annual_revenue or 'N/A'}
Pain Points: {lead.pain_points or 'N/A'}
Notes: {lead.notes or 'N/A'}"""

    try:
        raw = generate_json(system_prompt, user_prompt)
        return _parse_json(raw)
    except Exception as exc:
        logger.error(f"[ai_service] AI qualification failed: {exc}")
        raise RuntimeError(f"AI qualification failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def generate_email_with_gemini(
    lead: Lead,
    sdr_name: str = None,
    company_name: str = None,
    company_pitch: str = None
) -> str:
    """Generate a personalized cold outreach email using any available AI provider."""
    sdr_name = sdr_name or "Alex Chen"
    company_name = company_name or "TechCorp"
    company_pitch = company_pitch or "Our intelligent agent framework automates these workflows directly, saving hours of manual prospect mapping."

    score_context = {
        "hot": "This is a high-priority lead — be confident, direct, and create urgency.",
        "warm": "This is a warm lead — be consultative, focus on value and benefits.",
        "cold": "This is a cold lead — be very brief, low-pressure, just spark curiosity.",
        "unscored": "This is a new lead — be professional and focus on discovery.",
    }

    prompt = f"""You are an expert SDR named {sdr_name} at a B2B SaaS company named {company_name}. Write a highly personalized cold outreach email.
Our company pitch / value proposition is: {company_pitch}

Lead Details:
- Name: {lead.name}
- Company: {lead.company or 'their company'}
- Job Title: {lead.job_title or 'professional'}
- Industry: {lead.industry or 'their industry'}
- Company Size: {lead.company_size or 'unknown'}
- Pain Points: {lead.pain_points or 'not specified'}
- Notes: {lead.notes or 'none'}
- Lead Score: {lead.score.value}

Context: {score_context.get(lead.score.value, score_context['unscored'])}

Requirements:
1. Subject line that gets opened (personalized, curiosity-driven)
2. Opening that references something specific about them or their company
3. 2-3 lines of value proposition tied to their pain points
4. A soft, easy CTA (15-min call, reply to this email)
5. Professional signature from "{sdr_name}, SDR at {company_name}"
6. Keep it under 150 words total (excluding subject)

Format:
Subject: [subject line]

[email body]"""

    try:
        return generate_text(prompt)
    except Exception as exc:
        logger.error(f"[ai_service] AI email generation failed: {exc}")
        raise RuntimeError(f"AI email generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE CALL SCRIPT
# ─────────────────────────────────────────────────────────────────────────────

def generate_call_script_with_gemini(
    lead: Lead,
    sdr_name: str = None,
    company_name: str = None,
    company_pitch: str = None
) -> str:
    """Generate a personalized B2B cold call script using any available AI provider."""
    sdr_name = sdr_name or "Alex Chen"
    company_name = company_name or "TechCorp"
    company_pitch = company_pitch or "We provide autonomous sales development reps that qualify and outbound-map prospects, saving teams up to 20 hours per week."

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
        logger.error(f"[ai_service] Script generation failed: {exc}")
        raise RuntimeError(f"Script generation failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
# DISCOVER LEADS
# ─────────────────────────────────────────────────────────────────────────────

def discover_leads_with_ai(keyword: str) -> list[dict]:
    """Generate 3 target leads matching the given keyword using AI."""
    system_prompt = """You are an expert B2B lead generation assistant.
Generate exactly 3 realistic target prospect leads matching the user's query/keyword description.
For each lead, provide:
- name: Full name of the prospect
- email: Professional business email (e.g. name@company.domain)
- company: Company name
- job_title: Match the targeted role
- industry: Relevant industry
- company_size: Employee count (e.g., '11-50', '51-200', '201-500', etc.)
- annual_revenue: Estimated revenue (e.g., '$1M-$5M', '$5M-$10M', '$10M-$50M')
- pain_points: 1-2 sentences of typical business pain points they would have

Respond ONLY with a valid JSON array of 3 objects containing the fields above.
Example:
[
  {
    "name": "Jane Doe",
    "email": "jane.doe@acme.com",
    "company": "Acme Corp",
    "job_title": "Director of Engineering",
    "industry": "SaaS",
    "company_size": "51-200",
    "annual_revenue": "$5M-$10M",
    "pain_points": "Legacy pipeline bottlenecks and slow deployment times."
  }
]"""
    user_prompt = f"Generate 3 B2B leads for keyword: {keyword}"
    
    raw = generate_json(system_prompt, user_prompt)
    parsed = _parse_json(raw)
    if not isinstance(parsed, list):
        if isinstance(parsed, dict) and "leads" in parsed:
            parsed = parsed["leads"]
        else:
            raise ValueError("AI response is not a valid list of leads")
    return parsed
