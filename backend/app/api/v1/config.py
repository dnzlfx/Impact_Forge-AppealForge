from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.core.config import settings

router = APIRouter(prefix="/config", tags=["config"])

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

class ConfigStatusResponse(BaseModel):
    is_configured: bool
    base_url: str

class SaveConfigRequest(BaseModel):
    api_key: str
    base_url: str = "https://api.featherless.ai/v1"

@router.get("/status", response_model=ConfigStatusResponse)
async def get_config_status():
    has_key = bool(settings.FEATHERLESS_API_KEY and settings.FEATHERLESS_API_KEY.strip())
    return ConfigStatusResponse(
        is_configured=has_key,
        base_url=settings.FEATHERLESS_BASE_URL or "https://api.featherless.ai/v1"
    )

@router.post("/setup")
async def setup_config(req: SaveConfigRequest):
    api_key = req.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key cannot be empty")
    
    base_url = req.base_url.strip() or "https://api.featherless.ai/v1"
    
    env_content = f"FEATHERLESS_API_KEY={api_key}\nFEATHERLESS_BASE_URL={base_url}\n"
    
    # Save to multiple possible locations (.env and config/.env for Docker persistence)
    paths_to_write = [
        ENV_PATH,
        Path("config/.env"),
        Path(".env")
    ]
    for p in paths_to_write:
        try:
            p.parent.mkdir(parents=True, exist_ok=True)
            with open(p, "w", encoding="utf-8") as f:
                f.write(env_content)
        except Exception:
            pass
    
    # Update runtime settings
    settings.FEATHERLESS_API_KEY = api_key
    settings.FEATHERLESS_BASE_URL = base_url
    
    return {"status": "ok", "message": "Configuration saved to .env"}
