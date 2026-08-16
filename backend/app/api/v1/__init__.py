from fastapi import APIRouter
from app.api.v1.appeal import router as appeal_router
from app.api.v1.config import router as config_router

api_router = APIRouter()
api_router.include_router(appeal_router)
api_router.include_router(config_router)
