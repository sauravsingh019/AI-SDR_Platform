from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Lead, User, LeadScore
from app.schemas.schemas import QualifyRequest, QualifyResponse, EmailGenRequest, EmailGenResponse, CallScriptRequest, CallScriptResponse, DiscoverLeadsRequest, LeadOut
from app.utils.auth import get_current_user
from app.services.ai_service import qualify_lead_with_openai, generate_email_with_gemini, generate_call_script_with_gemini, discover_leads_with_ai
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
        result = qualify_lead_with_openai(lead)
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
            company_pitch=payload.company_pitch
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
            company_pitch=payload.company_pitch
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")

    return CallScriptResponse(lead_id=lead.id, call_script=script)


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
