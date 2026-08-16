import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional

from app.schemas.appeal import AppealCreate, AppealResponse
from app.services.appeal import appeal_service
from app.services.pdf_parser import extract_text_from_pdf_bytes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/appeal", tags=["appeal"])


@router.post("/generate", response_model=AppealResponse)
async def generate_appeal(payload: AppealCreate):
    try:
        return await appeal_service.generate_appeal(payload)
    except Exception as e:
        logger.exception("Error generating appeal")
        raise HTTPException(status_code=500, detail=f"Error processing appeal generation: {str(e)}")


@router.post("/generate-from-files", response_model=AppealResponse)
async def generate_appeal_from_files(
    denial_file: Optional[UploadFile] = File(None),
    medical_record_file: Optional[UploadFile] = File(None),
    patient_name: Optional[str] = Form(None),
    insurer_name: Optional[str] = Form(None),
    additional_notes: Optional[str] = Form(""),
):
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
            additional_notes=additional_notes,
        )

        return await appeal_service.generate_appeal(payload)
    except Exception as e:
        logger.exception("Error generating appeal from files")
        raise HTTPException(status_code=500, detail=f"Error parsing files or generating appeal: {str(e)}")
