from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.models import LeadStatus, LeadScore


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Lead Schemas ──────────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[str] = None
    pain_points: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[LeadStatus] = LeadStatus.NEW


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[str] = None
    pain_points: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[LeadStatus] = None
    generated_email: Optional[str] = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str]
    job_title: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    linkedin_url: Optional[str]
    industry: Optional[str]
    company_size: Optional[str]
    annual_revenue: Optional[str]
    pain_points: Optional[str]
    notes: Optional[str]
    status: LeadStatus
    score: LeadScore
    score_reason: Optional[str]
    qualification_result: Optional[str]
    generated_email: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── AI Schemas ────────────────────────────────────────────────────────────────

class QualifyRequest(BaseModel):
    lead_id: int


class QualifyResponse(BaseModel):
    lead_id: int
    score: LeadScore
    score_reason: str
    qualification_result: str


class EmailGenRequest(BaseModel):
    lead_id: int
    sdr_name: Optional[str] = None
    company_name: Optional[str] = None
    company_pitch: Optional[str] = None


class EmailGenResponse(BaseModel):
    lead_id: int
    email_content: str


class CallScriptRequest(BaseModel):
    lead_id: int
    sdr_name: Optional[str] = None
    company_name: Optional[str] = None
    company_pitch: Optional[str] = None


class CallScriptResponse(BaseModel):
    lead_id: int
    call_script: str


class DiscoverLeadsRequest(BaseModel):
    keyword: str
