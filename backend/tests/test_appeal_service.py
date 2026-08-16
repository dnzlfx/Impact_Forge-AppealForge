import unittest
from app.services.pdf_parser import extract_medical_codes, extract_text_from_pdf_bytes
from app.core.prompts import WRITER_SYSTEM_PROMPT, AUDITOR_SYSTEM_PROMPT
from app.core.config import settings


class TestAppealService(unittest.TestCase):
    def test_extract_medical_codes_icd10_and_cpt(self):
        sample_text = """
        Patient was diagnosed with M54.5 (Low back pain) and M51.26.
        Recommended procedure is lumbar spine surgery under CPT 22612 and MRI scan under CPT 72148.
        Patient resides in ZIP code 90210 and case ID is 54321.
        """
        codes = extract_medical_codes(sample_text)
        
        self.assertIn("M54.5", codes["icd10"])
        self.assertIn("M51.26", codes["icd10"])
        self.assertIn("22612", codes["cpt"])
        self.assertIn("72148", codes["cpt"])
        # Verify non-medical 5-digit zip/case IDs are ignored when not in known catalog or prefixed by CPT
        self.assertNotIn("90210", codes["cpt"])

    def test_dual_model_prompts_configured(self):
        self.assertIn("Clinical Guidelines", WRITER_SYSTEM_PROMPT)
        self.assertIn("UNVERIFIED_IN_RECORD", AUDITOR_SYSTEM_PROMPT)

    def test_settings_dual_models(self):
        self.assertTrue(bool(settings.DEFAULT_MODEL))
        self.assertTrue(bool(settings.AUDITOR_MODEL))

    def test_pdf_extraction_fallback_empty(self):
        extracted = extract_text_from_pdf_bytes(b"non-pdf-garbage")
        self.assertIsInstance(extracted, str)


if __name__ == "__main__":
    unittest.main()

