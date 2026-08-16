import fitz
import re
from typing import Dict, List

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_content = []
    for page in doc:
        text_content.append(page.get_text())
    return "\n".join(text_content).strip()

def extract_medical_codes(text: str) -> Dict[str, List[str]]:
    icd10_pattern = r'\b[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?\b'
    cpt_pattern = r'\b\d{5}\b'
    
    icd10_matches = list(set(re.findall(icd10_pattern, text)))
    cpt_matches = list(set(re.findall(cpt_pattern, text)))
    
    return {
        "icd10": icd10_matches,
        "cpt": cpt_matches
    }
