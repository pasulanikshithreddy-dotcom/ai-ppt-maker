from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from app.config.settings import Settings
from app.integrations.supabase import (
    SupabaseClientFactory,
    SupabaseDatabaseHelper,
    SupabaseStorageHelper,
)
from app.repositories.supabase_read_repository import SupabaseReadRepository
from app.schemas.database import (
    PresentationRow,
    SubscriptionRow,
    TemplateRow,
    UsageLogRow,
    UserRow,
)
from app.utils.runtime import is_secret_configured


class SupabaseService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client_factory = SupabaseClientFactory(settings)
        self.database = SupabaseDatabaseHelper(self.client_factory)
        self.storage = SupabaseStorageHelper(self.client_factory)
        self.read_repository = SupabaseReadRepository(self.database)

    def is_configured(self) -> bool:
        return bool(self.settings.supabase_url) and is_secret_configured(
            self.settings.supabase_service_role_key
        )

    def readiness_detail(self) -> str:
        if self.is_configured():
            return (
                "Supabase URL and service role key are configured for schema "
                f"{self.settings.supabase_schema}."
            )
        return "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable persistence."

    def get_client(self):
        return self.client_factory.get_client()

    def get_database_client(self):
        return self.database.get_client()

    def get_storage_client(self):
        return self.storage.get_client()

    def get_storage_bucket(self, bucket_name: str) -> Any:
        return self.storage.get_bucket(bucket_name)

    def get_presentations_bucket(self) -> Any:
        return self.storage.get_presentations_bucket()

    def get_templates_bucket(self) -> Any:
        return self.storage.get_templates_bucket()

    def get_user_by_id(self, user_id: str | UUID) -> UserRow | None:
        return self.read_repository.get_user_by_id(user_id)

    def list_templates(
        self,
        *,
        active_only: bool = True,
        pro_only: bool | None = None,
        limit: int = 100,
    ) -> list[TemplateRow]:
        return self.read_repository.list_templates(
            active_only=active_only,
            pro_only=pro_only,
            limit=limit,
        )

    def list_presentations(
        self,
        *,
        user_id: str | UUID,
        limit: int = 50,
    ) -> list[PresentationRow]:
        return self.read_repository.list_presentations(user_id=user_id, limit=limit)

    def get_presentation_by_id(
        self,
        presentation_id: str | UUID,
        *,
        user_id: str | UUID | None = None,
    ) -> PresentationRow | None:
        return self.read_repository.get_presentation_by_id(
            presentation_id,
            user_id=user_id,
        )

    def get_usage_log_for_day(
        self,
        *,
        user_id: str | UUID,
        action: str,
        usage_date: date,
    ) -> UsageLogRow | None:
        return self.read_repository.get_usage_log_for_day(
            user_id=user_id,
            action=action,
            usage_date=usage_date,
        )

    def list_usage_logs(
        self,
        *,
        user_id: str | UUID,
        limit: int = 30,
    ) -> list[UsageLogRow]:
        return self.read_repository.list_usage_logs(user_id=user_id, limit=limit)

    def get_active_subscription(
        self,
        *,
        user_id: str | UUID,
    ) -> SubscriptionRow | None:
        return self.read_repository.get_active_subscription(user_id=user_id)

    def list_subscriptions(
        self,
        *,
        user_id: str | UUID,
        limit: int = 20,
    ) -> list[SubscriptionRow]:
        return self.read_repository.list_subscriptions(user_id=user_id, limit=limit)
