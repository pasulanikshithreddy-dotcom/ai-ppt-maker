from __future__ import annotations

from functools import cached_property
from typing import Any

from app.config.settings import Settings
from app.utils.runtime import is_secret_configured
from supabase import (
    Client,
    ClientOptions,
    SupabaseStorageClient,
    create_client,
)


class SupabaseClientFactory:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return bool(self.settings.supabase_url) and is_secret_configured(
            self.settings.supabase_service_role_key
        )

    @cached_property
    def client(self) -> Client:
        if not self.is_configured():
            raise RuntimeError("Supabase is not configured.")

        options = ClientOptions(
            schema=self.settings.supabase_schema,
            auto_refresh_token=False,
            persist_session=False,
            headers={"X-Client-Info": "ai-ppt-maker-backend"},
        )
        return create_client(
            self.settings.supabase_url,
            self.settings.supabase_service_role_key.get_secret_value(),
            options=options,
        )

    def get_client(self) -> Client:
        return self.client


class SupabaseDatabaseHelper:
    def __init__(self, client_factory: SupabaseClientFactory) -> None:
        self.client_factory = client_factory

    def get_client(self) -> Client:
        return self.client_factory.get_client()

    def table(self, table_name: str):
        return self.get_client().table(table_name)


class SupabaseStorageHelper:
    def __init__(self, client_factory: SupabaseClientFactory) -> None:
        self.client_factory = client_factory

    def get_client(self) -> SupabaseStorageClient:
        return self.client_factory.get_client().storage

    def get_bucket(self, bucket_name: str) -> Any:
        return self.get_client().from_(bucket_name)

    def get_presentations_bucket(self) -> Any:
        return self.get_bucket(
            self.client_factory.settings.supabase_presentations_bucket
        )

    def get_templates_bucket(self) -> Any:
        return self.get_bucket(self.client_factory.settings.supabase_templates_bucket)
