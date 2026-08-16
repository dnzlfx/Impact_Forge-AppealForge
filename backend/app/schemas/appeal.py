from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AppealCreate(BaseModel):
    denial_letter_text: Optional[str] = Field(
        default="", description="Text extracted from the insurer's denial letter"
    )
    medical_record_text: Optional[str] = Field(
        default="", description="Text extracted from the patient's medical records or clinical chart"
    )
    patient_name: Optional[str] = Field(default=None, description="Patient's full name")
    insurer_name: Optional[str] = Field(default=None, description="Health insurance company name")
    additional_notes: Optional[str] = Field(default="", description="Additional clinical or procedural instructions")


class RagCitation(BaseModel):
    source: str
    text: str


class AuditFlag(BaseModel):
    claim_text: str
    issue_type: str
    severity: str
    explanation: str


class AppealResponse(BaseModel):
    appeal_text: str
    codes_detected: Dict[str, List[str]]
    rag_citations: List[RagCitation]
    audit_flags: List[AuditFlag]
    status: str = "completed"
