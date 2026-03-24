from __future__ import annotations

from typing import Any, TypeVar

from pydantic import BaseModel

from app.integrations.supabase import SupabaseDatabaseHelper
from app.schemas.database import (
    PresentationInsert,
    PresentationRow,
    SubscriptionInsert,
    SubscriptionRow,
    UsageLogInsert,
    UsageLogRow,
    UserProfileInsert,
    UserRow,
)

ModelT = TypeVar("ModelT", bound=BaseModel)


class SupabaseWriteRepository:
    def __init__(self, database: SupabaseDatabaseHelper) -> None:
        self.database = database

    def create_presentation(self, payload: PresentationInsert) -> PresentationRow:
        response = (
            self.database.table("presentations")
            .insert(payload.model_dump(mode="json"))
            .execute()
        )
        return self._fetch_one_response(response, PresentationRow)

    def create_user_profile(self, payload: UserProfileInsert) -> UserRow:
        response = (
            self.database.table("users")
            .insert(payload.model_dump(mode="json"))
            .execute()
        )
        return self._fetch_one_response(response, UserRow)

    def create_usage_log(self, payload: UsageLogInsert) -> UsageLogRow:
        response = (
            self.database.table("usage_logs")
            .insert(payload.model_dump(mode="json"))
            .execute()
        )
        return self._fetch_one_response(response, UsageLogRow)

    def update_usage_log(
        self,
        usage_log_id: str,
        payload: dict[str, object],
    ) -> UsageLogRow:
        response = (
            self.database.table("usage_logs")
            .update(payload)
            .eq("id", usage_log_id)
            .execute()
        )
        return self._fetch_one_response(response, UsageLogRow)

    def create_subscription(self, payload: SubscriptionInsert) -> SubscriptionRow:
        response = (
            self.database.table("subscriptions")
            .insert(payload.model_dump(mode="json"))
            .execute()
        )
        return self._fetch_one_response(response, SubscriptionRow)

    def update_subscription(
        self,
        subscription_id: str,
        payload: dict[str, object],
    ) -> SubscriptionRow:
        response = (
            self.database.table("subscriptions")
            .update(payload)
            .eq("id", subscription_id)
            .execute()
        )
        return self._fetch_one_response(response, SubscriptionRow)

    def update_user_plan(
        self,
        user_id: str,
        *,
        plan_type: str,
    ) -> UserRow:
        response = (
            self.database.table("users")
            .update({"plan_type": plan_type})
            .eq("id", user_id)
            .execute()
        )
        return self._fetch_one_response(response, UserRow)

    @staticmethod
    def _fetch_one_response(response: Any, model: type[ModelT]) -> ModelT:
        payload = response.data
        if isinstance(payload, list):
            if not payload:
                raise ValueError("Expected a record from Supabase but received an empty list.")
            payload = payload[0]
        return model.model_validate(payload)
