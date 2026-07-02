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
    system_prompt: Optional[str] = None


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
    system_prompt: Optional[str] = None


class EmailGenResponse(BaseModel):
    lead_id: int
    email_content: str


class CallScriptRequest(BaseModel):
    lead_id: int
    sdr_name: Optional[str] = None
    company_name: Optional[str] = None
    company_pitch: Optional[str] = None
    system_prompt: Optional[str] = None


class CallScriptResponse(BaseModel):
    lead_id: int
    call_script: str


class LinkedInGenRequest(BaseModel):
    lead_id: int
    system_prompt: Optional[str] = None


class LinkedInGenResponse(BaseModel):
    lead_id: int
    connection_note: str
    inmail_draft: str


class ResearchGenRequest(BaseModel):
    lead_id: int
    system_prompt: Optional[str] = None


class ResearchGenResponse(BaseModel):
    lead_id: int
    company_profile: str
    tech_stack: str
    competitors: str


class BattleCardGenRequest(BaseModel):
    lead_id: int
    system_prompt: Optional[str] = None


class BattleCardGenResponse(BaseModel):
    lead_id: int
    battle_card: str


class DiscoverLeadsRequest(BaseModel):
    keyword: str


class DialerResponseRequest(BaseModel):
    lead_id: int
    user_objection: str
    conversation_history: Optional[str] = ""


class DialerResponseResponse(BaseModel):
    lead_id: int
    ai_response: str


class DomainEnrichmentRequest(BaseModel):
    domain: str


class PitchRateRequest(BaseModel):
    prospect_profile: str
    user_pitch: str


class PitchRateResponse(BaseModel):
    overall_score: int
    empathy_score: int
    value_pitch_score: int
    objection_handling_score: int
    feedback: str


class ICPLeadsRequest(BaseModel):
    value_prop: str


