from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.appeal import AppealResponse

app = FastAPI(title="AppealForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_RESPONSE = {
    "appeal_text": (
        "Apreciables señores de la aseguradora:\n\n"
        "La presente constituye una apelación formal a la denegación de la Resonancia Magnética "
        "de columna lumbar (CPT 72148) para el paciente, la cual consideramos médicamente necesaria.\n\n"
        "El paciente presenta radiculopatía L5 con signo de Lasègue positivo documentado en el "
        "expediente, así como 6 semanas de manejo conservador (fisioterapia y AINEs) sin mejoría. "
        "Lo anterior cumple con los criterios de la LCD L34212 y de las guías clínicas citadas.\n\n"
        "Solicitamos la reconsideración inmediata de esta denegación conforme a sus políticas de "
        "apelación interna y reservamos nuestros derechos de apelación externa."
    ),
    "codes_detected": {"cpt": ["72148"], "icd10": ["M54.5", "M51.1"]},
    "rag_citations": [
        {
            "source": "CMS LCD L34212 (Lumbar MRI)",
            "text": "La resonancia magnética lumbar está indicada médicamente tras al menos 4 a 6 semanas "
            "de manejo conservador documentado (fisioterapia, AINEs) en ausencia de banderas rojas.",
        },
        {
            "source": "Clinical Coverage Criteria CPT 72148",
            "text": "CPT 72148 requiere radiculopatía documentada con examen físico positivo refractario "
            "a analgésicos de primera línea.",
        },
    ],
    "audit_flags": [
        {
            "claim_text": "6 semanas de manejo conservador",
            "issue_type": "UNVERIFIED_IN_RECORD",
            "severity": "HIGH",
            "explanation": "El expediente solo registra 2 semanas de fisioterapia; verificar antes de enviar.",
        },
        {
            "claim_text": "signo de Lasègue positivo",
            "issue_type": "MISMATCHED_DATA",
            "severity": "MEDIUM",
            "explanation": "El signo aparece en la nota del 2026-08-10 pero el resultado consignado en el resumen difiere.",
        },
    ],
    "status": "completed",
}


@app.post("/api/v1/appeal/generate", response_model=AppealResponse)
async def generate_appeal() -> dict:
    return MOCK_RESPONSE

