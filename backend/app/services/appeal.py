import json
import logging
import re
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.prompts import AUDITOR_SYSTEM_PROMPT, WRITER_SYSTEM_PROMPT
from app.schemas.appeal import AppealCreate, AppealResponse, AuditFlag, RagCitation
from app.services.pdf_parser import extract_medical_codes
from app.services.rag_engine import rag_engine

logger = logging.getLogger(__name__)


class AppealService:
    def __init__(self):
        self._cached_client: AsyncOpenAI | None = None
        self._cached_key: str | None = None
        self._cached_base_url: str | None = None

    def get_client(self, override_key: str | None = None, override_base_url: str | None = None) -> AsyncOpenAI:
        current_key = override_key or settings.FEATHERLESS_API_KEY or "dummy-key"
        current_base_url = override_base_url or settings.FEATHERLESS_BASE_URL
        if (
            self._cached_client is None
            or self._cached_key != current_key
            or self._cached_base_url != current_base_url
        ):
            self._cached_key = current_key
            self._cached_base_url = current_base_url
            self._cached_client = AsyncOpenAI(
                api_key=current_key,
                base_url=current_base_url,
                default_headers={"User-Agent": "AppealForge/1.0"},
            )
        return self._cached_client

    @property
    def client(self) -> AsyncOpenAI:
        return self.get_client()

    @property
    def model(self) -> str:
        return settings.DEFAULT_MODEL

    @property
    def auditor_model(self) -> str:
        return settings.AUDITOR_MODEL

    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> str:
        target_model = model or self.model
        client = self.get_client(override_key=api_key, override_base_url=base_url)
        logger.info(f"Invoking LLM model '{target_model}' (prompt length: {len(user_prompt)} chars)...")
        response = await client.chat.completions.create(
            model=target_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=4096,
        )
        msg = response.choices[0].message
        content = msg.content or ""

        # Si el modelo envía el texto dentro de reasoning o tags <think>
        if not content:
            raw_text = getattr(msg, "reasoning", "") or getattr(msg, "reasoning_content", "") or ""
            # Si contiene etiqueta </think>, tomamos lo que viene después (la respuesta final)
            if "</think>" in raw_text:
                content = raw_text.split("</think>", 1)[1]
            elif "\n\n# " in raw_text:
                content = raw_text[raw_text.find("\n\n# "):]
            elif "\n# " in raw_text:
                content = raw_text[raw_text.find("\n# "):]
            else:
                content = raw_text
        else:
            if "<think>" in content and "</think>" in content:
                content = re.sub(r"<think>[\s\S]*?</think>", "", content)

        cleaned = content.strip()
        if cleaned.startswith("```markdown"):
            cleaned = cleaned[11:]
        elif cleaned.startswith("```md"):
            cleaned = cleaned[5:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        content = cleaned.strip()

        logger.info(f"LLM model '{target_model}' response received ({len(content)} chars).")
        return content

    async def _generate_draft(
        self,
        payload: AppealCreate,
        codes: dict[str, list[str]],
        citations: list[RagCitation],
        api_key: str | None = None,
        base_url: str | None = None,
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

        return await self._call_llm(
            WRITER_SYSTEM_PROMPT,
            user_content,
            api_key=api_key,
            base_url=base_url,
        )

    async def _audit_draft(
        self,
        draft_text: str,
        medical_record_text: str,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> list[AuditFlag]:
        user_content = (
            f"ORIGINAL MEDICAL RECORD:\n{medical_record_text}\n\n"
            f"DRAFT APPEAL LETTER TO AUDIT:\n{draft_text}\n\n"
            f"Cross-examine the appeal draft against the medical record and return the JSON flags."
        )

        audit_raw = await self._call_llm(
            AUDITOR_SYSTEM_PROMPT,
            user_content,
            model=self.auditor_model,
            api_key=api_key,
            base_url=base_url,
        )
        flags: list[AuditFlag] = []

        try:
            cleaned = audit_raw.strip()
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if match:
                data = json.loads(match.group(0))
                for item in data.get("flags", []):
                    claim = item.get("claim_text") or item.get("draft_value") or item.get("claim") or ""
                    expl = item.get("explanation") or item.get("description") or item.get("recommended_correction") or ""
                    flags.append(
                        AuditFlag(
                            claim_text=claim,
                            issue_type=item.get("issue_type") or item.get("flag_type") or "UNVERIFIED_IN_RECORD",
                            severity=item.get("severity", "MEDIUM"),
                            explanation=expl,
                        )
                    )
        except Exception as ex:
            logger.warning(f"Failed to parse auditor response as JSON: {ex}")

        return flags

    async def generate_appeal(
        self,
        payload: AppealCreate,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> AppealResponse:
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
        appeal_text = await self._generate_draft(
            payload,
            codes,
            citations,
            api_key=api_key,
            base_url=base_url,
        )
        logs.append(f"[AI Writer] Draft synthesized successfully ({len(appeal_text)} characters generated)")

        audit_flags: list[AuditFlag] = []
        if payload.medical_record_text.strip():
            logs.append(f"[AI Auditor] Invoking secondary fact-checker model '{self.auditor_model}' to cross-examine claims vs patient chart...")
            audit_flags = await self._audit_draft(
                appeal_text,
                payload.medical_record_text,
                api_key=api_key,
                base_url=base_url,
            )
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
