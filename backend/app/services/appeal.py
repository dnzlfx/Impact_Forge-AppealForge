import json
import logging
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.prompts import AUDITOR_SYSTEM_PROMPT, WRITER_SYSTEM_PROMPT
from app.schemas.appeal import AppealCreate, AppealResponse, AuditFlag, RagCitation
from app.services.pdf_parser import extract_medical_codes
from app.services.rag_engine import rag_engine

logger = logging.getLogger(__name__)


class AppealService:
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
        target_model = model or self.model
        logger.info(f"Invoking LLM model '{target_model}' (prompt length: {len(user_prompt)} chars)...")
        response = await self.client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
        )
        msg = response.choices[0].message
        content = msg.content or ""
        if not content:
            if hasattr(msg, "reasoning") and msg.reasoning:
                content = msg.reasoning
            elif hasattr(msg, "reasoning_content") and msg.reasoning_content:
                content = msg.reasoning_content
        logger.info(f"LLM model '{target_model}' response received ({len(content)} chars).")
        return content

    async def _generate_draft(
        self,
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
            f"ADDITIONAL INSTRUCTIONS:\n{payload.additional_notes or 'None'}\n\n"
            f"Draft the formal insurance appeal letter following the required structure."
        )

        return await self._call_llm(WRITER_SYSTEM_PROMPT, user_content)

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
            logger.warning(f"Failed to parse auditor response as JSON: {ex}")

        return flags

    async def generate_appeal(self, payload: AppealCreate) -> AppealResponse:
        logs: list[str] = ["[Pipeline] Starting AppealForge clinical synthesis engine..."]

        codes = extract_medical_codes(
            f"{payload.denial_letter_text}\n{payload.medical_record_text}"
        )
        cpt_list = codes.get("cpt", [])
        icd_list = codes.get("icd10", [])
        logs.append(f"[Extraction] Extracted CPT codes: {cpt_list or 'None'} | ICD-10 codes: {icd_list or 'None'}")

        query_text = (
            f"{payload.denial_letter_text[:500]} "
            f"{' '.join(cpt_list)} {' '.join(icd_list)}"
        ).strip()
        citations = rag_engine.query_guidelines(query_text or "Lumbar MRI radiculopathy")
        logs.append(f"[RAG Engine] Retrieved {len(citations)} CMS National & Local Coverage Determinations (NCD/LCD)")

        logs.append(f"[AI Writer] Invoking primary legal-clinical model '{self.model}' to synthesize formal appeal draft...")
        appeal_text = await self._generate_draft(payload, codes, citations)
        logs.append(f"[AI Writer] Draft synthesized successfully ({len(appeal_text)} characters generated)")

        audit_flags: list[AuditFlag] = []
        if payload.medical_record_text.strip():
            logs.append(f"[AI Auditor] Invoking secondary fact-checker model '{self.auditor_model}' to cross-examine claims vs patient chart...")
            audit_flags = await self._audit_draft(appeal_text, payload.medical_record_text)
            logs.append(f"[AI Auditor] Audit completed: {len(audit_flags)} potential clinical discrepancy/hallucination flags identified")
        else:
            logs.append("[AI Auditor] No separate medical record attached; skipping cross-examination audit phase")

        logs.append("[Pipeline] Workflow execution complete · Ready for payer submission")

        return AppealResponse(
            appeal_text=appeal_text,
            codes_detected=codes,
            rag_citations=citations,
            audit_flags=audit_flags,
            generation_logs=logs,
        )


appeal_service = AppealService()
