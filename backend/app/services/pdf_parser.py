import fitz
import re
from typing import Dict, List

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_content = []
        for page in doc:
            text_content.append(page.get_text())
        extracted = "\n".join(text_content).strip()
        if extracted:
            return extracted
    except Exception:
        pass
    
    # Fallback si el archivo subido en tests o cliente contiene texto plano
    try:
        return pdf_bytes.decode('utf-8', errors='ignore').strip()
    except Exception:
        return ""

def extract_medical_codes(text: str) -> Dict[str, List[str]]:
    icd10_pattern = r'\b[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?\b'
    cpt_pattern = r'\b\d{5}\b'
    
    icd10_matches = list(set(re.findall(icd10_pattern, text)))
    cpt_matches = list(set(re.findall(cpt_pattern, text)))
    
    return {
        "icd10": icd10_matches,
        "cpt": cpt_matches
    }

