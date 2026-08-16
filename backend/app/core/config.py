from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    FEATHERLESS_API_KEY: str = ""
    FEATHERLESS_BASE_URL: str = "https://api.featherless.ai/v1"
    DEFAULT_MODEL: str = "deepseek-ai/DeepSeek-V4-Flash-0731"
    AUDITOR_MODEL: str = "Qwen/Qwen3-32B"
    VISION_MODEL: str = "DavidAU/Gemma-3-27b-it-vl-SuperBrain7x-High-Reasoning-ULTRAMIND-Heretic-Uncensored"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
