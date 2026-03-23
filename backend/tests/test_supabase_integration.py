from __future__ import annotations

from datetime import date, datetime
from types import SimpleNamespace

from pydantic import SecretStr

from app.config.settings import Settings
from app.integrations.supabase import SupabaseClientFactory
from app.repositories.supabase_read_repository import SupabaseReadRepository
from app.services.supabase_service import SupabaseService


class FakeQuery:
    def __init__(self, payload):
        self.payload = payload

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def maybe_single(self):
        return self

    def in_(self, *_args, **_kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=self.payload)


class FakeDatabaseHelper:
    def __init__(self, payloads):
        self.payloads = payloads

    def table(self, table_name: str):
        return FakeQuery(self.payloads[table_name])


def test_supabase_client_factory_uses_service_role_key(monkeypatch) -> None:
    captured = {}

    class FakeClient:
        def __init__(self) -> None:
            self.storage = SimpleNamespace(
                from_=lambda bucket_name: {"bucket": bucket_name}
            )

        def table(self, table_name: str):
            return {"table": table_name}

    def fake_create_client(url, key, options):
        captured["url"] = url
        captured["key"] = key
        captured["options"] = options
        return FakeClient()

    monkeypatch.setattr("app.integrations.supabase.create_client", fake_create_client)

    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key=SecretStr("service-key"),
        supabase_schema="public",
        supabase_presentations_bucket="presentations",
        supabase_templates_bucket="templates",
    )
    factory = SupabaseClientFactory(settings)

    client = factory.get_client()

    assert captured["url"] == "https://example.supabase.co"
    assert captured["key"] == "service-key"
    assert captured["options"].schema == "public"
    assert captured["options"].persist_session is False
    assert client.table("users") == {"table": "users"}


def test_supabase_read_repository_returns_typed_rows() -> None:
    now = datetime.fromisoformat("2026-03-20T12:00:00+00:00")
    payloads = {
        "users": {
            "id": "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
            "email": "nik@example.com",
            "full_name": "Nik",
            "plan_type": "pro",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        "templates": [
            {
                "id": "13b85da7-2264-451f-8f51-d1a4f42ca0df",
                "slug": "starter",
                "name": "Starter",
                "description": "Starter template",
                "config": {"theme": "clean"},
                "is_pro_only": False,
                "is_active": True,
                "preview_image_url": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
        ],
        "presentations": [
            {
                "id": "c1b2a4f6-dbe0-4eb1-a1d1-62e8135c0d8e",
                "user_id": "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
                "template_id": "13b85da7-2264-451f-8f51-d1a4f42ca0df",
                "mode": "topic",
                "status": "completed",
                "topic": "AI PPT",
                "content": {"slides": []},
                "file_url": "https://cdn.example.com/file.pptx",
                "has_watermark": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
        ],
        "usage_logs": {
            "id": "6e340b11-a1d8-4cc1-9d86-f4268402abf1",
            "user_id": "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
            "action": "generate_topic",
            "usage_date": "2026-03-20",
            "request_count": 1,
            "free_limit": 3,
            "metadata": {"source": "web"},
            "last_used_at": now.isoformat(),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        "subscriptions": {
            "id": "54a6a67b-3961-4280-a11b-730afb28da1b",
            "user_id": "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
            "plan_type": "pro",
            "provider": "razorpay",
            "provider_customer_id": "cust_123",
            "provider_subscription_id": "sub_123",
            "provider_order_id": "order_123",
            "payment_status": "paid",
            "subscription_status": "active",
            "amount": 999,
            "currency": "INR",
            "current_period_start": now.isoformat(),
            "current_period_end": now.isoformat(),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
    }
    repository = SupabaseReadRepository(FakeDatabaseHelper(payloads))

    user = repository.get_user_by_id("4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e")
    templates = repository.list_templates()
    presentations = repository.list_presentations(
        user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"
    )
    usage_log = repository.get_usage_log_for_day(
        user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
        action="generate_topic",
        usage_date=date(2026, 3, 20),
    )
    subscription = repository.get_active_subscription(
        user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"
    )

    assert user is not None
    assert user.plan_type == "pro"
    assert templates[0].config["theme"] == "clean"
    assert presentations[0].topic == "AI PPT"
    assert presentations[0].watermark_applied is False
    assert usage_log is not None
    assert usage_log.request_count == 1
    assert subscription is not None
    assert subscription.payment_status == "paid"


def test_supabase_service_exposes_read_and_storage_helpers() -> None:
    class FakeStorageHelper:
        def get_client(self):
            return {"kind": "storage"}

        def get_bucket(self, bucket_name: str):
            return {"bucket": bucket_name}

        def get_presentations_bucket(self):
            return {"bucket": "presentations"}

        def get_templates_bucket(self):
            return {"bucket": "templates"}

    class FakeRepository:
        def get_user_by_id(self, _user_id):
            return "user"

        def list_templates(self, **_kwargs):
            return ["template"]

        def list_presentations(self, **_kwargs):
            return ["presentation"]

        def get_presentation_by_id(self, *_args, **_kwargs):
            return "presentation"

        def get_usage_log_for_day(self, **_kwargs):
            return "usage"

        def list_usage_logs(self, **_kwargs):
            return ["usage"]

        def get_active_subscription(self, **_kwargs):
            return "subscription"

        def list_subscriptions(self, **_kwargs):
            return ["subscription"]

    settings = Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key=SecretStr("service-key"),
    )
    service = SupabaseService(settings)
    service.storage = FakeStorageHelper()
    service.read_repository = FakeRepository()

    assert service.get_storage_client() == {"kind": "storage"}
    assert service.get_templates_bucket() == {"bucket": "templates"}
    assert service.get_user_by_id("user-id") == "user"
    assert service.list_subscriptions(user_id="user-id") == ["subscription"]
