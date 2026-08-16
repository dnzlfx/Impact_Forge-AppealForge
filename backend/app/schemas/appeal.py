from pydantic import BaseModel, Field


class AppealCreate(BaseModel):
    denial_letter_text: str = Field(
        default="", description="Text extracted from the insurer's denial letter"
    )
    medical_record_text: str = Field(
        default="", description="Text extracted from the patient's medical records or clinical chart"
    )
    patient_name: str | None = Field(default=None, description="Patient's full name")
    insurer_name: str | None = Field(default=None, description="Health insurance company name")
    additional_notes: str = Field(default="", description="Additional clinical or procedural instructions")


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
    codes_detected: dict[str, list[str]]
    rag_citations: list[RagCitation]
    audit_flags: list[AuditFlag]
    generation_logs: list[str] = Field(default_factory=list, description="Execution and AI audit step logs")
    status: str = "completed"

