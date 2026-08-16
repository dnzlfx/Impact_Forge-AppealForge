import re
import pymupdf


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        text_content = [page.get_text() for page in doc]
        extracted = "\n".join(text_content).strip()
        if extracted:
            return extracted
    except Exception:
        pass

    try:
        return pdf_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def extract_medical_codes(text: str) -> dict[str, list[str]]:
    icd10_pattern = r"\b[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?\b"
    cpt_pattern = r"\b\d{5}\b"

    icd10_matches = sorted(set(re.findall(icd10_pattern, text)))
    cpt_matches = sorted(set(re.findall(cpt_pattern, text)))

    return {
        "icd10": icd10_matches,
        "cpt": cpt_matches,
    }

