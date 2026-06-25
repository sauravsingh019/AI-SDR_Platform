from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, leads, ai
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI SDR API",
    description="Mini AI Sales Development Representative",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Services"])


@app.get("/")
def root():
    return {"message": "AI SDR API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ─────────────────────────────────────────────────────────────────────────────
# DEMO ACCOUNT SETUP
# ─────────────────────────────────────────────────────────────────────────────

DEMO_EMAIL = "demo@aisdr.com"
DEMO_PASSWORD = b"AI_SDR_Demo_Secure_2026!"

DEMO_LEADS = [
    # 1 ── HOT / converted
    dict(
        name="Priya Sharma",
        email="priya@techfin.io",
        company="TechFin Solutions",
        job_title="VP of Engineering",
        industry="Fintech",
        company_size="200-500",
        annual_revenue="$10M-$50M",
        pain_points="Scaling infra, reducing deployment time, automating DevOps pipelines",
        notes="Met at SaaS Summit 2025. Very interested in automation.",
        score="hot",
        score_reason="Decision-maker at a high-growth fintech with clear infra pain points and ample budget.",
        qualification_result="FANT: Fit=HOT, Authority=HIGH (VP level), Need=STRONG (infra scaling), Timeline=URGENT",
        status="converted",
        generated_email="""Subject: Cut TechFin's deployment time by 60% — quick question

Hi Priya,

I noticed TechFin Solutions has been scaling rapidly in the fintech space — impressive growth over the past year.

At TechCorp, we help engineering teams like yours reduce deployment overhead by up to 60% through intelligent pipeline automation. Given your focus on scaling infra, I thought this might be worth a quick conversation.

Would you be open to a 15-minute call this week to explore if there's a fit?

Best,
Alex Chen
SDR at TechCorp""",
        linkedin_url="https://linkedin.com/in/priya-sharma-vpe",
    ),
    # 2 ── HOT / qualified
    dict(
        name="Arjun Mehta",
        email="arjun@growthco.in",
        company="GrowthCo",
        job_title="CEO",
        industry="SaaS",
        company_size="10-50",
        annual_revenue="$1M-$5M",
        pain_points="Lead generation and sales automation at scale",
        notes="Found via LinkedIn. Replied to our cold email. Highly engaged.",
        score="hot",
        score_reason="CEO with direct budget authority at a fast-growing SaaS startup actively looking for sales automation.",
        qualification_result="FANT: Fit=HOT, Authority=HIGHEST (CEO), Need=STRONG (sales automation), Timeline=NEAR-TERM",
        status="qualified",
        generated_email="""Subject: Automate GrowthCo's outbound — 3x pipeline in 30 days

Hi Arjun,

Love what you're building at GrowthCo. Scaling outbound is one of the toughest challenges for early-stage SaaS founders.

Our platform automates lead qualification, cold email drafting, and follow-up sequences — saving SDR teams up to 20 hours/week.

Can we grab 15 minutes to see if it's a fit?

Best,
Alex Chen
SDR at TechCorp""",
        linkedin_url="https://linkedin.com/in/arjun-mehta-ceo",
    ),
    # 3 ── WARM / contacted
    dict(
        name="Sneha Patel",
        email="sneha@retailchain.com",
        company="RetailChain India",
        job_title="CTO",
        industry="E-commerce",
        company_size="500-1000",
        annual_revenue="$50M-$100M",
        pain_points="Inventory management, real-time analytics, reducing manual reporting",
        notes="Responded to email with interest. Follow-up scheduled.",
        score="warm",
        score_reason="Technical decision-maker at a large e-commerce firm with clear data/analytics pain points.",
        qualification_result="FANT: Fit=WARM, Authority=HIGH (CTO), Need=MODERATE, Timeline=3 months",
        status="contacted",
        generated_email="""Subject: Real-time inventory intelligence for RetailChain

Hi Sneha,

Managing inventory at scale across hundreds of SKUs is incredibly complex — especially when reports are manual and lag behind reality.

TechCorp's analytics layer integrates directly with your existing stack to deliver real-time inventory insights, automated alerts, and predictive restocking.

Worth a 15-minute chat?

Best,
Alex Chen
SDR at TechCorp""",
    ),
    # 4 ── HOT / qualified
    dict(
        name="Rahul Verma",
        email="rahul@dataedge.io",
        company="DataEdge Inc",
        job_title="Head of Growth",
        industry="AI / ML",
        company_size="51-200",
        annual_revenue="$5M-$20M",
        pain_points="Outbound conversion rates below 8%, no personalization at scale",
        notes="Inbound inquiry via website. High intent signal.",
        score="hot",
        score_reason="Growth leader at an AI company with explicit outbound personalization need and inbound interest.",
        qualification_result="FANT: Fit=HOT, Authority=HIGH, Need=STRONG, Timeline=IMMEDIATE",
        status="qualified",
        generated_email="""Subject: From 8% → 25%+ reply rates for DataEdge outbound

Hi Rahul,

An 8% conversion rate on outbound tells me your messaging isn't personalized enough — not that your product isn't good.

TechCorp's AI SDR layer generates hyper-personalized cold emails for every prospect in seconds, consistently hitting 20-30% reply rates for growth teams in the AI space.

Let's talk? Happy to share a live demo.

Best,
Alex Chen
SDR at TechCorp""",
    ),
    # 5 ── WARM / new
    dict(
        name="Kavya Reddy",
        email="kavya@healthbridge.in",
        company="HealthBridge",
        job_title="Director of Operations",
        industry="HealthTech",
        company_size="51-200",
        annual_revenue="$5M-$10M",
        pain_points="Manual patient outreach, low appointment conversion, staff overload",
        notes="Referred by a mutual connection.",
        score="warm",
        score_reason="Operations Director at a healthtech company with clear outreach automation pain points.",
        qualification_result="FANT: Fit=WARM, Authority=MEDIUM, Need=STRONG, Timeline=Q3",
        status="new",
    ),
    # 6 ── COLD / new
    dict(
        name="Vikram Malhotra",
        email="vikram@logisticsnow.com",
        company="LogisticsNow",
        job_title="IT Manager",
        industry="Logistics",
        company_size="11-50",
        annual_revenue="<$1M",
        pain_points="Route optimization, manual tracking spreadsheets",
        notes="Scraped from LinkedIn. Low intent so far.",
        score="cold",
        score_reason="IT Manager with low authority for procurement; small company with limited budget signals.",
        qualification_result="FANT: Fit=COLD, Authority=LOW, Need=WEAK, Timeline=UNSCHEDULED",
        status="new",
    ),
    # 7 ── HOT / contacted
    dict(
        name="Meera Nair",
        email="meera@eduvance.io",
        company="Eduvance",
        job_title="Founder & CEO",
        industry="EdTech",
        company_size="10-50",
        annual_revenue="$1M-$5M",
        pain_points="Scaling B2B sales, enterprise contract pipeline thin, low outbound volume",
        notes="DM'd on LinkedIn. Very responsive.",
        score="hot",
        score_reason="Founder/CEO actively building enterprise B2B pipeline — highest authority, strong fit.",
        qualification_result="FANT: Fit=HOT, Authority=HIGHEST (Founder), Need=STRONG, Timeline=URGENT",
        status="contacted",
        generated_email="""Subject: Double Eduvance's enterprise pipeline — without hiring

Hi Meera,

Building enterprise sales from the ground up as a founder is brutal — especially when you're also running the product.

TechCorp automates your entire outbound motion: qualification, personalized email drafts, and follow-up sequences. Founders using our platform close their first 5 enterprise contracts 2x faster on average.

15 minutes this week?

Best,
Alex Chen
SDR at TechCorp""",
    ),
    # 8 ── WARM / contacted
    dict(
        name="Siddharth Roy",
        email="siddharth@cybershield.in",
        company="CyberShield",
        job_title="VP of Sales",
        industry="Cybersecurity",
        company_size="200-500",
        annual_revenue="$20M-$50M",
        pain_points="Long sales cycles, low SDR productivity, repetitive manual tasks",
        notes="Attended our webinar last month.",
        score="warm",
        score_reason="VP Sales at a mid-size cybersecurity firm with clear SDR productivity pain point.",
        qualification_result="FANT: Fit=WARM, Authority=HIGH, Need=MODERATE, Timeline=Q4",
        status="contacted",
        generated_email="""Subject: Cut CyberShield's SDR cycle time by 40%

Hi Siddharth,

Cybersecurity sales cycles are notoriously long — but a big part of that is SDR time spent on manual research and templated emails that don't convert.

TechCorp's AI layer qualifies leads and drafts personalized outreach in seconds, giving your SDRs back 15+ hours per week to focus on closing.

Worth exploring together?

Best,
Alex Chen
SDR at TechCorp""",
    ),
    # 9 ── WARM / new
    dict(
        name="Ananya Krishnan",
        email="ananya@realproptech.com",
        company="RealPropTech",
        job_title="Co-Founder",
        industry="Real Estate",
        company_size="10-50",
        annual_revenue="$1M-$5M",
        pain_points="Manual lead follow-up, CRM not integrated with email outreach",
        notes="Downloaded our whitepaper. Potential ICP.",
        score="warm",
        score_reason="Co-Founder with budget authority in a growing proptech startup with CRM/outreach integration need.",
        qualification_result="FANT: Fit=WARM, Authority=HIGH (Co-founder), Need=MODERATE, Timeline=6 months",
        status="new",
    ),
    # 10 ── COLD / unqualified
    dict(
        name="Rohan Joshi",
        email="rohan@smallbizshop.in",
        company="SmallBiz Shop",
        job_title="Owner",
        industry="E-commerce",
        company_size="1-10",
        annual_revenue="<$500K",
        pain_points="Too many tools, wants simplicity",
        notes="Came through a referral but not a strong ICP fit.",
        score="cold",
        score_reason="Solo owner of a micro business — no enterprise sales team, very limited budget.",
        qualification_result="FANT: Fit=COLD, Authority=LOW, Need=WEAK, Timeline=UNSCHEDULED",
        status="unqualified",
    ),
]


@app.on_event("startup")
def seed_demo_account():
    from app.database import SessionLocal
    from app.models.models import User, Lead, LeadStatus, LeadScore
    import bcrypt

    db = SessionLocal()
    try:
        # ── Ensure demo user exists & has correct password ────────────────
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if not user:
            user = User(
                name="Demo User",
                email=DEMO_EMAIL,
                hashed_password=bcrypt.hashpw(DEMO_PASSWORD, bcrypt.gensalt()).decode("utf-8"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("--- Startup: Created demo@aisdr.com ---")
        else:
            # Always refresh password so demo login never breaks
            user.hashed_password = bcrypt.hashpw(DEMO_PASSWORD, bcrypt.gensalt()).decode("utf-8")
            db.commit()

        # ── Top up demo leads to full 10 ──────────────────────────────────
        existing_count = db.query(Lead).filter(Lead.owner_id == user.id).count()
        # Existing names so we don't duplicate
        existing_names = {
            r[0] for r in db.query(Lead.name).filter(Lead.owner_id == user.id).all()
        }

        added = 0
        for ld in DEMO_LEADS:
            if ld["name"] in existing_names:
                continue  # already in DB

            status_val = LeadStatus(ld.get("status", "new"))
            score_val  = LeadScore(ld.get("score", "unscored"))

            lead = Lead(
                owner_id=user.id,
                name=ld["name"],
                email=ld["email"],
                company=ld.get("company"),
                job_title=ld.get("job_title"),
                industry=ld.get("industry"),
                company_size=ld.get("company_size"),
                annual_revenue=ld.get("annual_revenue"),
                pain_points=ld.get("pain_points"),
                notes=ld.get("notes"),
                linkedin_url=ld.get("linkedin_url"),
                status=status_val,
                score=score_val,
                score_reason=ld.get("score_reason"),
                qualification_result=ld.get("qualification_result"),
                generated_email=ld.get("generated_email"),
            )
            db.add(lead)
            added += 1

        if added:
            db.commit()
            print(f"--- Startup: Added {added} demo leads (total now {existing_count + added}) ---")
        else:
            print(f"--- Startup: Demo leads already complete ({existing_count} leads) ---")

    except Exception as e:
        db.rollback()
        print(f"--- Startup Error (demo seed): {e} ---")
    finally:
        db.close()
