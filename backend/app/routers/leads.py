from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.models import Lead, User, LeadStatus
from app.schemas.schemas import LeadCreate, LeadUpdate, LeadOut
from app.utils.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = Lead(**payload.model_dump(), owner_id=current_user.id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/", response_model=List[LeadOut])
def list_leads(
    status: Optional[LeadStatus] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Lead).filter(Lead.owner_id == current_user.id)
    if status:
        query = query.filter(Lead.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Lead.name.ilike(search_term)
            | Lead.email.ilike(search_term)
            | Lead.company.ilike(search_term)
        )
    return query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    leads = db.query(Lead).filter(Lead.owner_id == current_user.id).all()
    total = len(leads)
    by_status = {}
    by_score = {}
    emails_generated = 0
    for lead in leads:
        by_status[lead.status.value] = by_status.get(lead.status.value, 0) + 1
        by_score[lead.score.value] = by_score.get(lead.score.value, 0) + 1
        if lead.generated_email:
            emails_generated += 1
    return {
        "total": total,
        "by_status": by_status,
        "by_score": by_score,
        "emails_generated": emails_generated,
        "qualified_rate": round(by_score.get("hot", 0) / total * 100, 1) if total else 0,
    }


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
