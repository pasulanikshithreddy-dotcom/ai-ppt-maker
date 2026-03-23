from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.schemas.database import SubscriptionRow, UserRow
from app.services.auth_service import (
    AuthConfigurationError,
    AuthenticationError,
    AuthService,
)
from app.services.plan_service import PlanService

TEST_USER_ID = "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"


class FakeAuthClient:
    def __init__(self, *, response=None, error: Exception | None = None) -> None:
        self.response = response
        self.error = error
        self.calls: list[str] = []

    def get_user(self, jwt: str | None = None):
        self.calls.append(jwt or "")
        if self.error is not None:
            raise self.error
        return self.response


class FakeSupabaseService:
    def __init__(
        self,
        *,
        configured: bool = True,
        profile: UserRow | None = None,
        subscription: SubscriptionRow | None = None,
        auth_response=None,
        auth_error: Exception | None = None,
    ) -> None:
        self.configured = configured
        self.profile = profile
        self.subscription = subscription
        self.auth_client = FakeAuthClient(response=auth_response, error=auth_error)
        self.create_calls = []

    def is_configured(self) -> bool:
        return self.configured

    def get_auth_client(self) -> FakeAuthClient:
        return self.auth_client

    def get_user_by_id(self, _user_id: str):
        return self.profile

    def create_user_profile(self, payload):
        self.create_calls.append(payload)
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        self.profile = UserRow(
            id=payload.id,
            email=payload.email,
            full_name=payload.full_name,
            plan_type=payload.plan_type,
            created_at=now,
            updated_at=now,
        )
        return self.profile

    def get_active_subscription(self, *, user_id: str):
        assert user_id == TEST_USER_ID
        return self.subscription


def test_auth_service_creates_missing_profile_with_free_plan() -> None:
    auth_response = SimpleNamespace(
        user=SimpleNamespace(
            id=TEST_USER_ID,
            email="nik@example.com",
            user_metadata={"full_name": "Nik Sharma"},
            app_metadata={"provider": "email"},
        )
    )
    service = AuthService(
        FakeSupabaseService(auth_response=auth_response),
        PlanService(),
    )

    result = service.get_authenticated_user("test-token")

    assert result.id == TEST_USER_ID
    assert result.email == "nik@example.com"
    assert result.full_name == "Nik Sharma"
    assert result.plan_code == "free"
    assert result.profile.plan_type == "free"


def test_auth_service_prefers_active_subscription_plan() -> None:
    now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
    auth_response = SimpleNamespace(
        user=SimpleNamespace(
            id=TEST_USER_ID,
            email="nik@example.com",
            user_metadata={"full_name": "Nik Sharma"},
            app_metadata={"provider": "email"},
        )
    )
    existing_profile = UserRow(
        id=UUID(TEST_USER_ID),
        email="nik@example.com",
        full_name="Nik Sharma",
        plan_type="free",
        created_at=now,
        updated_at=now,
    )
    active_subscription = SubscriptionRow(
        id=UUID("54a6a67b-3961-4280-a11b-730afb28da1b"),
        user_id=UUID(TEST_USER_ID),
        plan_type="pro",
        provider="razorpay",
        provider_customer_id="cust_123",
        provider_subscription_id="sub_123",
        provider_order_id="order_123",
        payment_status="paid",
        subscription_status="active",
        amount=999,
        currency="INR",
        current_period_start=now,
        current_period_end=now,
        created_at=now,
        updated_at=now,
    )
    service = AuthService(
        FakeSupabaseService(
            profile=existing_profile,
            subscription=active_subscription,
            auth_response=auth_response,
        ),
        PlanService(),
    )

    result = service.get_authenticated_user("test-token")

    assert result.plan_code == "pro"
    assert result.subscription is not None
    assert result.subscription.subscription_status == "active"


def test_auth_service_rejects_invalid_tokens() -> None:
    service = AuthService(
        FakeSupabaseService(auth_error=RuntimeError("invalid jwt")),
        PlanService(),
    )

    with pytest.raises(AuthenticationError):
        service.get_authenticated_user("bad-token")


def test_auth_service_requires_supabase_configuration() -> None:
    service = AuthService(FakeSupabaseService(configured=False), PlanService())

    with pytest.raises(AuthConfigurationError):
        service.get_authenticated_user("test-token")
