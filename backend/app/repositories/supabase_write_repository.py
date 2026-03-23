from __future__ import annotations

from typing import Any, TypeVar

from pydantic import BaseModel

from app.integrations.supabase import SupabaseDatabaseHelper
from app.schemas.database import (
    PresentationInsert,
    PresentationRow,
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

    @staticmethod
    def _fetch_one_response(response: Any, model: type[ModelT]) -> ModelT:
        payload = response.data
        if isinstance(payload, list):
            if not payload:
                raise ValueError("Expected a record from Supabase but received an empty list.")
            payload = payload[0]
        return model.model_validate(payload)
