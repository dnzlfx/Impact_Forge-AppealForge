from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    FEATHERLESS_API_KEY: str = ""
    FEATHERLESS_BASE_URL: str = "https://api.featherless.ai/v1"
    DEFAULT_MODEL: str = "deepseek-ai/DeepSeek-V4-Flash-0731"
    AUDITOR_MODEL: str = "Qwen/Qwen3.8-27B"
    VISION_MODEL: str = "google/gemma-4-vision"

    model_config = SettingsConfigDict(
        env_file=(".env", "config/.env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
