import logging
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form

from app.schemas.appeal import AppealCreate, AppealResponse
from app.services.appeal import appeal_service
from app.services.pdf_parser import extract_text_from_pdf_bytes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/appeal", tags=["appeal"])


@router.post("/generate", response_model=AppealResponse)
async def generate_appeal(
    payload: AppealCreate,
    x_featherless_api_key: str | None = Header(None),
    x_featherless_base_url: str | None = Header(None),
) -> AppealResponse:
    try:
        return await appeal_service.generate_appeal(
            payload,
            api_key=x_featherless_api_key,
            base_url=x_featherless_base_url,
        )
    except Exception as e:
        logger.exception("Error generating appeal")
        raise HTTPException(status_code=500, detail=f"Error processing appeal generation: {str(e)}")


@router.post("/generate-from-files", response_model=AppealResponse)
async def generate_appeal_from_files(
    denial_file: UploadFile | None = File(None),
    medical_record_file: UploadFile | None = File(None),
    patient_name: str | None = Form(None),
    insurer_name: str | None = Form(None),
    additional_notes: str | None = Form(""),
    x_featherless_api_key: str | None = Header(None),
    x_featherless_base_url: str | None = Header(None),
) -> AppealResponse:
    try:
        denial_text = ""
        medical_record_text = ""

        if denial_file:
            bytes_content = await denial_file.read()
            denial_text = extract_text_from_pdf_bytes(bytes_content)

        if medical_record_file:
            bytes_content = await medical_record_file.read()
            medical_record_text = extract_text_from_pdf_bytes(bytes_content)

        payload = AppealCreate(
            denial_letter_text=denial_text,
            medical_record_text=medical_record_text,
            patient_name=patient_name,
            insurer_name=insurer_name,
            additional_notes=additional_notes or "",
        )

        return await appeal_service.generate_appeal(
            payload,
            api_key=x_featherless_api_key,
            base_url=x_featherless_base_url,
        )
    except Exception as e:
        logger.exception("Error generating appeal from files")
        raise HTTPException(status_code=500, detail=f"Error parsing files or generating appeal: {str(e)}")
