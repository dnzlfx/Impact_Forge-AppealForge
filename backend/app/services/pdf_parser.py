import re
import pymupdf


COMMON_MEDICAL_CPT_CODES = {
    # Surgery / Orthopedic / Spinal / Neurosurgery
    "22551", "22552", "22612", "22840", "22842", "22845", "22853", "27447", "27130", "29881", "29880", "29827", "29824", "63030", "63047", "63048", "63056",
    # Radiology / Diagnostic Imaging (MRI, CT, PET, Ultrasound)
    "70551", "70552", "70553", "72141", "72142", "72146", "72148", "72149", "72156", "72158", "73221", "73222", "73223", "73721", "73722", "73723", "74176", "74177", "74178", "78815", "78816",
    # Medicine / Injections / Physical Therapy / Cardiology
    "99213", "99214", "99215", "99203", "99204", "99205", "97110", "97140", "97112", "97530", "62322", "62323", "64483", "64484", "93000", "93306", "93458",
    # Biologics, Oncology & Specialty Infusions / Chemotherapy
    "96413", "96415", "96365", "96366", "96372", "90834", "90837",
}


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
    # Strict ICD-10-CM format: 1 letter (except U for unclassified, though U07.1 is COVID), 2 digits, optional dot and 1-4 alphanumeric chars
    icd10_pattern = r"\b[A-TV-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?\b"
    raw_icd10 = set(re.findall(icd10_pattern, text))
    
    # Filter out false positives (e.g. common words or alphanumeric tokens like 'BOX', 'PAGE', 'V1.0')
    valid_icd10 = {
        code for code in raw_icd10
        if not code.isalpha() and not (len(code) == 3 and code[0] in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" and code[1:].isalpha())
    }

    # CPT extraction: Must be in known list OR explicitly preceded by CPT / procedure / billing keywords
    contextual_cpt_pattern = r"(?:CPT|procedure|HCPCS|billing|proc)[\s:#-]*(\b\d{5}\b)"
    contextual_matches = set(re.findall(contextual_cpt_pattern, text, re.IGNORECASE))
    
    all_5digits = set(re.findall(r"\b\d{5}\b", text))
    known_cpt_matches = {d for d in all_5digits if d in COMMON_MEDICAL_CPT_CODES}
    
    # Exclude zip codes and case numbers
    non_cpt_pattern = r"(?:ZIP|postal|address|suite|ste|box|case|ID|ref)[\s:#-]*(\b\d{5}\b)"
    non_cpt_matches = set(re.findall(non_cpt_pattern, text, re.IGNORECASE))
    
    valid_cpt = (contextual_matches.union(known_cpt_matches)) - non_cpt_matches


    return {
        "icd10": sorted(valid_icd10),
        "cpt": sorted(valid_cpt),
    }
