from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, cast

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "exp://127.0.0.1:8081",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "AI PPT Maker API"
    app_env: str = "development"
    app_debug: bool = False
    api_v1_prefix: str = "/api/v1"
    docs_enabled: bool = True

    # Keep this env-backed field permissive so deployment providers can supply
    # either JSON arrays or comma-separated strings without breaking startup.
    cors_allowed_origins: Any = Field(
        default_factory=lambda: DEFAULT_CORS_ALLOWED_ORIGINS.copy()
    )
    cors_allow_credentials: bool = True

    supabase_url: str | None = None
    supabase_anon_key: SecretStr | None = None
    supabase_service_role_key: SecretStr | None = None
    supabase_schema: str = "public"
    supabase_presentations_bucket: str = "presentations"
    supabase_templates_bucket: str = "templates"

    openai_api_key: SecretStr | None = None
    openai_model: str = "gpt-4.1-mini"

    free_topic_daily_limit: int = 3

    razorpay_key_id: str | None = None
    razorpay_key_secret: SecretStr | None = None
    razorpay_currency: str = "INR"
    razorpay_pro_monthly_amount: int = 99900

    ppt_template_dir: Path = Path("assets/templates")
    template_catalog_path: Path = Path("assets/templates/catalog.json")
    generated_ppt_dir: Path = Path("storage/presentations")

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def parse_cors_allowed_origins(cls, value: Any) -> list[str]:
        if value in (None, ""):
            return DEFAULT_CORS_ALLOWED_ORIGINS.copy()

        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                parsed = json.loads(stripped)
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [item.strip() for item in stripped.split(",") if item.strip()]

        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        raise TypeError("Unsupported CORS origin format")

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return cast(list[str], self.cors_allowed_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()
