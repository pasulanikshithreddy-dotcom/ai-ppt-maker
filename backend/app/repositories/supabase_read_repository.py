from __future__ import annotations

from datetime import date
from typing import Any, TypeVar
from uuid import UUID

from pydantic import BaseModel

from app.integrations.supabase import SupabaseDatabaseHelper
from app.schemas.database import (
    PresentationRow,
    SubscriptionRow,
    TemplateRow,
    UsageLogRow,
    UserRow,
)

ModelT = TypeVar("ModelT", bound=BaseModel)


class SupabaseReadRepository:
    def __init__(self, database: SupabaseDatabaseHelper) -> None:
        self.database = database

    def get_user_by_id(self, user_id: str | UUID) -> UserRow | None:
        query = (
            self.database.table("users")
            .select("*")
            .eq("id", str(user_id))
            .maybe_single()
        )
        return self._fetch_one(query, UserRow)

    def list_templates(
        self,
        *,
        active_only: bool = True,
        pro_only: bool | None = None,
        limit: int = 100,
    ) -> list[TemplateRow]:
        query = self.database.table("templates").select("*").order("name").limit(limit)
        if active_only:
            query = query.eq("is_active", True)
        if pro_only is not None:
            query = query.eq("is_pro_only", pro_only)
        return self._fetch_many(query, TemplateRow)

    def get_template_by_slug(self, slug: str) -> TemplateRow | None:
        query = (
            self.database.table("templates")
            .select("*")
            .eq("slug", slug)
            .maybe_single()
        )
        return self._fetch_one(query, TemplateRow)

    def list_presentations(
        self,
        *,
        user_id: str | UUID,
        limit: int = 50,
    ) -> list[PresentationRow]:
        query = (
            self.database.table("presentations")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(limit)
        )
        return self._fetch_many(query, PresentationRow)

    def get_presentation_by_id(
        self,
        presentation_id: str | UUID,
        *,
        user_id: str | UUID | None = None,
    ) -> PresentationRow | None:
        query = (
            self.database.table("presentations")
            .select("*")
            .eq("id", str(presentation_id))
        )
        if user_id is not None:
            query = query.eq("user_id", str(user_id))
        return self._fetch_one(query.maybe_single(), PresentationRow)

    def get_usage_log_for_day(
        self,
        *,
        user_id: str | UUID,
        action: str,
        usage_date: date,
    ) -> UsageLogRow | None:
        query = (
            self.database.table("usage_logs")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("action", action)
            .eq("usage_date", usage_date.isoformat())
            .maybe_single()
        )
        return self._fetch_one(query, UsageLogRow)

    def list_usage_logs(
        self,
        *,
        user_id: str | UUID,
        limit: int = 30,
    ) -> list[UsageLogRow]:
        query = (
            self.database.table("usage_logs")
            .select("*")
            .eq("user_id", str(user_id))
            .order("usage_date", desc=True)
            .limit(limit)
        )
        return self._fetch_many(query, UsageLogRow)

    def get_active_subscription(
        self,
        *,
        user_id: str | UUID,
    ) -> SubscriptionRow | None:
        query = (
            self.database.table("subscriptions")
            .select("*")
            .eq("user_id", str(user_id))
            .in_("subscription_status", ["trialing", "active"])
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
        )
        return self._fetch_one(query, SubscriptionRow)

    def list_subscriptions(
        self,
        *,
        user_id: str | UUID,
        limit: int = 20,
    ) -> list[SubscriptionRow]:
        query = (
            self.database.table("subscriptions")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(limit)
        )
        return self._fetch_many(query, SubscriptionRow)

    def get_subscription_by_order_id(
        self,
        *,
        provider: str,
        provider_order_id: str,
    ) -> SubscriptionRow | None:
        query = (
            self.database.table("subscriptions")
            .select("*")
            .eq("provider", provider)
            .eq("provider_order_id", provider_order_id)
            .order("created_at", desc=True)
            .limit(1)
            .maybe_single()
        )
        return self._fetch_one(query, SubscriptionRow)

    @staticmethod
    def _fetch_one(query: Any, model: type[ModelT]) -> ModelT | None:
        response = query.execute()
        payload = response.data
        if payload in (None, []):
            return None
        if isinstance(payload, list):
            if not payload:
                return None
            payload = payload[0]
        return model.model_validate(payload)

    @staticmethod
    def _fetch_many(query: Any, model: type[ModelT]) -> list[ModelT]:
        response = query.execute()
        payload = response.data or []
        if not isinstance(payload, list):
            payload = [payload]
        return [model.model_validate(item) for item in payload]
