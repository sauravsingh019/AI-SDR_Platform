from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Lead, User, LeadScore
from app.schemas.schemas import (
    QualifyRequest, QualifyResponse, EmailGenRequest, EmailGenResponse,
    CallScriptRequest, CallScriptResponse, DiscoverLeadsRequest, LeadOut,
    LinkedInGenRequest, LinkedInGenResponse, ResearchGenRequest, ResearchGenResponse,
    BattleCardGenRequest, BattleCardGenResponse, DialerResponseRequest, DialerResponseResponse,
    DomainEnrichmentRequest, PitchRateRequest, PitchRateResponse, ICPLeadsRequest
)
from app.utils.auth import get_current_user
from app.services.sdr_ai import (
    qualify_lead_with_openai, generate_email_with_gemini, generate_call_script_with_gemini,
    discover_leads_with_ai, generate_linkedin_outreach, generate_market_research,
    generate_objection_battle_card, generate_dialer_response, enrich_company_domain,
    rate_pitch_objection, generate_icp_leads
)
from app.config import settings


router = APIRouter()


@router.post("/qualify", response_model=QualifyResponse)
def qualify_lead(
    payload: QualifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        result = qualify_lead_with_openai(lead, custom_prompt=payload.system_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI qualification failed: {str(e)}")

    # Persist results to DB
    lead.score = LeadScore(result["score"])
    lead.score_reason = result["score_reason"]
    lead.qualification_result = result["qualification_result"]
    db.commit()
    db.refresh(lead)

    return QualifyResponse(
        lead_id=lead.id,
        score=lead.score,
        score_reason=lead.score_reason,
        qualification_result=lead.qualification_result,
    )


@router.post("/generate-email", response_model=EmailGenResponse)
def generate_email(
    payload: EmailGenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        email_content = generate_email_with_gemini(
            lead,
            sdr_name=payload.sdr_name,
            company_name=payload.company_name,
            company_pitch=payload.company_pitch,
            custom_prompt=payload.system_prompt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")

    lead.generated_email = email_content
    db.commit()

    return EmailGenResponse(lead_id=lead.id, email_content=email_content)


@router.post("/generate-call-script", response_model=CallScriptResponse)
def generate_call_script(
    payload: CallScriptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        script = generate_call_script_with_gemini(
            lead,
            sdr_name=payload.sdr_name,
            company_name=payload.company_name,
            company_pitch=payload.company_pitch,
            custom_prompt=payload.system_prompt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")

    return CallScriptResponse(lead_id=lead.id, call_script=script)


@router.post("/generate-linkedin", response_model=LinkedInGenResponse)
def generate_linkedin(
    payload: LinkedInGenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    try:
        res = generate_linkedin_outreach(lead, custom_prompt=payload.system_prompt)
        return LinkedInGenResponse(
            lead_id=lead.id,
            connection_note=res.get("connection_note", ""),
            inmail_draft=res.get("inmail_draft", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-research", response_model=ResearchGenResponse)
def generate_research(
    payload: ResearchGenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    try:
        res = generate_market_research(lead, custom_prompt=payload.system_prompt)
        return ResearchGenResponse(
            lead_id=lead.id,
            company_profile=res.get("company_profile", ""),
            tech_stack=res.get("tech_stack", ""),
            competitors=res.get("competitors", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-battle-card", response_model=BattleCardGenResponse)
def generate_battle_card_route(
    payload: BattleCardGenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    try:
        res = generate_objection_battle_card(lead, custom_prompt=payload.system_prompt)
        return BattleCardGenResponse(
            lead_id=lead.id,
            battle_card=res.get("battle_card", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/discover-leads", response_model=List[LeadOut])
def discover_leads(
    payload: DiscoverLeadsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        leads_data = discover_leads_with_ai(payload.keyword)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    created_leads = []
    for ld in leads_data:
        lead = Lead(
            name=ld.get("name", "Unknown Name"),
            email=ld.get("email", "unknown@company.domain"),
            company=ld.get("company"),
            job_title=ld.get("job_title"),
            industry=ld.get("industry"),
            company_size=ld.get("company_size"),
            annual_revenue=ld.get("annual_revenue"),
            pain_points=ld.get("pain_points"),
            owner_id=current_user.id
        )
        db.add(lead)
        created_leads.append(lead)

    db.commit()
    for lead in created_leads:
        db.refresh(lead)

    return created_leads


@router.post("/respond-dialer", response_model=DialerResponseResponse)
def respond_dialer(
    payload: DialerResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    try:
        res = generate_dialer_response(lead, payload.user_objection, payload.conversation_history)
        return DialerResponseResponse(lead_id=lead.id, ai_response=res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enrich-domain", response_model=List[LeadOut])
def enrich_domain(
    payload: DomainEnrichmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        leads_data = enrich_company_domain(payload.domain)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    created_leads = []
    for ld in leads_data:
        lead = Lead(
            name=ld.get("name", "Unknown Name"),
            email=ld.get("email", "unknown@company.domain"),
            company=ld.get("company"),
            job_title=ld.get("job_title"),
            industry=ld.get("industry"),
            company_size=ld.get("company_size"),
            annual_revenue=ld.get("annual_revenue"),
            pain_points=ld.get("pain_points"),
            owner_id=current_user.id
        )
        db.add(lead)
        created_leads.append(lead)

    db.commit()
    for lead in created_leads:
        db.refresh(lead)

    return created_leads


@router.post("/rate-pitch", response_model=PitchRateResponse)
def rate_pitch(
    payload: PitchRateRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        res = rate_pitch_objection(payload.prospect_profile, payload.user_pitch)
        return PitchRateResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/icp-leads", response_model=List[LeadOut])
def icp_leads(
    payload: ICPLeadsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        leads_data = generate_icp_leads(payload.value_prop)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    created_leads = []
    for ld in leads_data:
        lead = Lead(
            name=ld.get("name", "Unknown Name"),
            email=ld.get("email", "unknown@company.domain"),
            company=ld.get("company"),
            job_title=ld.get("job_title"),
            industry=ld.get("industry"),
            company_size=ld.get("company_size"),
            annual_revenue=ld.get("annual_revenue"),
            pain_points=ld.get("pain_points"),
            owner_id=current_user.id
        )
        db.add(lead)
        created_leads.append(lead)

    db.commit()
    for lead in created_leads:
        db.refresh(lead)

    return created_leads


