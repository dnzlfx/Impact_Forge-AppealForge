from pydantic import BaseModel
from typing import Dict, List


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

