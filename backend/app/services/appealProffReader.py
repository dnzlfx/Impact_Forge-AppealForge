import json
import logging
import re
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.prompts import AUDITOR_SYSTEM_PROMPT, WRITER_PROOFREADER_SYSTEM_PROMPT
from app.schemas.appeal import AppealCreate, AppealResponse, AuditFlag, RagCitation
from app.services.pdf_parser import extract_medical_codes
from app.services.rag_engine import rag_engine

logger = logging.getLogger(__name__)


class AppealProofreaderService:
    @property
    def client(self) -> AsyncOpenAI:
        return AsyncOpenAI(
            api_key=settings.FEATHERLESS_API_KEY or "dummy-key",
            base_url=settings.FEATHERLESS_BASE_URL,
            default_headers={"User-Agent": "AppealForge/1.0"},
        )

    @property
    def model(self) -> str:
        return settings.DEFAULT_MODEL

    @property
    def auditor_model(self) -> str:
        return settings.AUDITOR_MODEL

    async def _call_llm(self, system_prompt: str, user_prompt: str, model: str | None = None) -> str:
        response = await self.client.chat.completions.create(
            model=model or self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=4096,
        )
        msg = response.choices[0].message
        content = msg.content or ""
        if not content:
            if hasattr(msg, "reasoning") and msg.reasoning:
                content = msg.reasoning
            elif hasattr(msg, "reasoning_content") and msg.reasoning_content:
                content = msg.reasoning_content

        cleaned = content.strip()
        if cleaned.startswith("```markdown"):
            cleaned = cleaned[11:]
        elif cleaned.startswith("```md"):
            cleaned = cleaned[5:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()

    async def proofread_draft(
        self,
        draft_text: str,
        payload: AppealCreate,
        codes: dict[str, list[str]],
        citations: list[RagCitation],
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
            f"INITIAL DRAFT:\n{draft_text}\n\n"
            f"Review, polish, and generate the final version of the formal appeal letter."
        )

        return await self._call_llm(WRITER_PROOFREADER_SYSTEM_PROMPT, user_content)

    async def _audit_draft(
        self, draft_text: str, medical_record_text: str
    ) -> list[AuditFlag]:
        user_content = (
            f"ORIGINAL MEDICAL RECORD:\n{medical_record_text}\n\n"
            f"DRAFT APPEAL LETTER TO AUDIT:\n{draft_text}\n\n"
            f"Cross-examine the appeal draft against the medical record and return the JSON flags."
        )

        audit_raw = await self._call_llm(AUDITOR_SYSTEM_PROMPT, user_content, model=self.auditor_model)
        flags: list[AuditFlag] = []

        try:
            cleaned = audit_raw.strip()
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if match:
                data = json.loads(match.group(0))
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
            logger.warning(f"Failed to parse auditor response as JSON: {ex}")

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

        appeal_text = await self.proofread_draft("", payload, codes, citations)

        audit_flags: list[AuditFlag] = []
        if payload.medical_record_text.strip():
            audit_flags = await self._audit_draft(appeal_text, payload.medical_record_text)

        return AppealResponse(
            appeal_text=appeal_text,
            codes_detected=codes,
            rag_citations=citations,
            audit_flags=audit_flags,
        )


appeal_proofreader_service = AppealProofreaderService()
appealProofreader_service = appeal_proofreader_service
appealProffreader_service = appeal_proofreader_service
