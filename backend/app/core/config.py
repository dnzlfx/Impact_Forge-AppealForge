from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    FEATHERLESS_API_KEY: str = ""
    FEATHERLESS_BASE_URL: str = "https://api.featherless.ai/v1"
    # Dual-model architecture defaults
    DEFAULT_MODEL: str = "deepseek-ai/DeepSeek-V4-Pro"
    AUDITOR_MODEL: str = "moonshotai/Kimi-K3"
    VISION_MODEL: str = "deepseek-ai/DeepSeek-V4-Pro"

    model_config = SettingsConfigDict(
        env_file=(
            Path(__file__).resolve().parent.parent.parent / ".env",
            ".env",
            "backend/.env",
            "config/.env",
            "../backend/.env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()

