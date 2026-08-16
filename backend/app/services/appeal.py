import json
import logging
from typing import Dict, List
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.prompts import AUDITOR_SYSTEM_PROMPT, WRITER_SYSTEM_PROMPT
from app.schemas.appeal import AppealCreate, AppealResponse, AuditFlag, RagCitation
from app.services.pdf_parser import extract_medical_codes
from app.services.rag_engine import rag_engine

logger = logging.getLogger(__name__)


class AppealService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.FEATHERLESS_API_KEY or "dummy-key",
            base_url=settings.FEATHERLESS_BASE_URL,
        )
        self.model = settings.DEFAULT_MODEL
        self.auditor_model = settings.AUDITOR_MODEL

    async def _call_llm(self, system_prompt: str, user_prompt: str, model: str | None = None) -> str:
        response = await self.client.chat.completions.create(
            model=model or self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    async def _generate_draft(
        self,
        payload: AppealCreate,
        codes: Dict[str, List[str]],
        citations: List[RagCitation],
    ) -> str:
        guidelines_text = "\n\n".join(
            [f"- [{c.source}]: {c.text}" for c in citations]
        ) or "No guidelines retrieved."

        user_content = (
            f"INPUT DATA:\n"
            f"Patient Name: {payload.patient_name or 'Not specified'}\n"
            f"Insurance Company: {payload.insurer_name or 'Not specified'}\n"
            f"Detected CPT Codes: {', '.join(codes.get('cpt', [])) or 'None detected'}\n"
            f"Detected ICD-10 Codes: {', '.join(codes.get('icd10', [])) or 'None detected'}\n\n"
            f"DENIAL LETTER TEXT:\n{payload.denial_letter_text}\n\n"
            f"PATIENT MEDICAL RECORD:\n{payload.medical_record_text}\n\n"
            f"RELEVANT CLINICAL GUIDELINES:\n{guidelines_text}\n\n"
            f"ADDITIONAL INSTRUCTIONS:\n{payload.additional_notes or 'None'}\n\n"
            f"Draft the formal insurance appeal letter following the required structure."
        )

        return await self._call_llm(WRITER_SYSTEM_PROMPT, user_content)

    async def _audit_draft(
        self, draft_text: str, medical_record_text: str
    ) -> List[AuditFlag]:
        user_content = (
            f"ORIGINAL MEDICAL RECORD:\n{medical_record_text}\n\n"
            f"DRAFT APPEAL LETTER TO AUDIT:\n{draft_text}\n\n"
            f"Cross-examine the appeal draft against the medical record and return the JSON flags."
        )

        audit_raw = await self._call_llm(AUDITOR_SYSTEM_PROMPT, user_content, model=self.auditor_model)
        flags: List[AuditFlag] = []

        try:
            cleaned = audit_raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            for item in data.get("flags", []):
                flags.append(
                    AuditFlag(
                        claim_text=item.get("claim_text", ""),
                        issue_type=item.get("issue_type", "UNVERIFIED_IN_RECORD"),
                        severity=item.get("severity", "MEDIUM"),
                        explanation=item.get("explanation", ""),
                    )
                )
        except Exception as ex:
            logger.warning(f"No se pudo parsear el resultado del auditor como JSON: {ex}")

        return flags

    async def generate_appeal(self, payload: AppealCreate) -> AppealResponse:
        codes = extract_medical_codes(
            f"{payload.denial_letter_text}\n{payload.medical_record_text}"
        )

        query_text = (
            f"{payload.denial_letter_text[:500]} "
            f"{' '.join(codes.get('cpt', []))} {' '.join(codes.get('icd10', []))}"
        ).strip()
        citations = rag_engine.query_guidelines(query_text or "Lumbar MRI radiculopathy")

        appeal_text = await self._generate_draft(payload, codes, citations)

        audit_flags = []
        if payload.medical_record_text.strip():
            audit_flags = await self._audit_draft(appeal_text, payload.medical_record_text)

        return AppealResponse(
            appeal_text=appeal_text,
            codes_detected=codes,
            rag_citations=citations,
            audit_flags=audit_flags,
        )


appeal_service = AppealService()
