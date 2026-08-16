from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AppealCreate(BaseModel):
    denial_letter_text: Optional[str] = Field(
        default="", description="Texto de la carta de denegación de la aseguradora"
    )
    medical_record_text: Optional[str] = Field(
        default="", description="Texto del expediente clínico o notas médicas del paciente"
    )
    patient_name: Optional[str] = Field(default=None, description="Nombre del paciente")
    insurer_name: Optional[str] = Field(default=None, description="Nombre de la aseguradora")
    additional_notes: Optional[str] = Field(default="", description="Instrucciones adicionales")


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
