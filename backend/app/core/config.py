from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    FEATHERLESS_API_KEY: str = ""
    FEATHERLESS_BASE_URL: str = "https://api.featherless.ai/v1"
    DEFAULT_MODEL: str = "deepseek-ai/DeepSeek-V4-Pro"
    AUDITOR_MODEL: str = "deepseek-ai/DeepSeek-V4-Pro"
    VISION_MODEL: str = "deepseek-ai/DeepSeek-V4-Pro"

    model_config = SettingsConfigDict(
        env_file=(".env", "config/.env", "../backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
