from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from uuid import UUID

from pydantic import SecretStr

from app.config.settings import Settings
from app.schemas.database import SubscriptionRow, UserRow
from app.schemas.payment import CreateOrderRequest, VerifyPaymentRequest
from app.schemas.user import AuthenticatedUserContext
from app.services.payment_service import PaymentService
from app.services.plan_service import PlanService

TEST_USER_ID = "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"


class FakeSupabaseService:
    def __init__(self) -> None:
        self.created_subscriptions = []
        self.updated_subscriptions = []
        self.updated_user_plans = []
        self.subscription_by_order: SubscriptionRow | None = None

    def is_configured(self) -> bool:
        return True

    def create_subscription(self, payload):
        self.created_subscriptions.append(payload)
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        self.subscription_by_order = SubscriptionRow(
            id=UUID("54a6a67b-3961-4280-a11b-730afb28da1b"),
            user_id=payload.user_id,
            plan_type=payload.plan_type,
            provider=payload.provider,
            provider_customer_id=payload.provider_customer_id,
            provider_subscription_id=payload.provider_subscription_id,
            provider_order_id=payload.provider_order_id,
            provider_payment_id=payload.provider_payment_id,
            payment_status=payload.payment_status,
            subscription_status=payload.subscription_status,
            amount=payload.amount,
            currency=payload.currency,
            current_period_start=payload.current_period_start,
            current_period_end=payload.current_period_end,
            created_at=now,
            updated_at=now,
        )
        return self.subscription_by_order

    def get_subscription_by_order_id(self, *, provider: str, provider_order_id: str):
        if self.subscription_by_order is None:
            return None
        if (
            self.subscription_by_order.provider == provider
            and self.subscription_by_order.provider_order_id == provider_order_id
        ):
            return self.subscription_by_order
        return None

    def update_subscription(self, subscription_id: str, payload: dict[str, object]):
        self.updated_subscriptions.append((subscription_id, payload))
        return payload

    def update_user_plan(self, user_id: str, *, plan_type: str):
        self.updated_user_plans.append((user_id, plan_type))
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return UserRow(
            id=UUID(user_id),
            email="nik@example.com",
            full_name="Nik Sharma",
            plan_type=plan_type,
            created_at=now,
            updated_at=now,
        )


def test_payment_service_creates_pending_order_without_upgrading_user(monkeypatch) -> None:
    supabase_service = FakeSupabaseService()
    service = PaymentService(
        settings=_build_settings(),
        supabase_service=supabase_service,
        plan_service=PlanService(),
    )

    fake_order_client = SimpleNamespace(
        order=SimpleNamespace(create=lambda data: {"id": "order_12345", **data})
    )
    monkeypatch.setattr(service, "get_client", lambda: fake_order_client)

    result = service.create_order(
        CreateOrderRequest(plan_code="pro"),
        current_user=_build_current_user(plan_code="free"),
    )

    assert result.order_id == "order_12345"
    assert result.provider == "razorpay"
    assert supabase_service.created_subscriptions[0].payment_status == "pending"
    assert supabase_service.created_subscriptions[0].subscription_status == "past_due"
    assert supabase_service.updated_user_plans == []


def test_payment_service_verifies_payment_and_upgrades_user(monkeypatch) -> None:
    supabase_service = FakeSupabaseService()
    service = PaymentService(
        settings=_build_settings(),
        supabase_service=supabase_service,
        plan_service=PlanService(),
    )
    fake_order_client = SimpleNamespace(
        order=SimpleNamespace(create=lambda data: {"id": "order_12345", **data})
    )
    monkeypatch.setattr(service, "get_client", lambda: fake_order_client)
    service.create_order(
        CreateOrderRequest(plan_code="pro"),
        current_user=_build_current_user(plan_code="free"),
    )
    monkeypatch.setattr(service, "_verify_signature", lambda payload: True)

    result = service.verify_payment(
        VerifyPaymentRequest(
            order_id="order_12345",
            payment_id="pay_12345",
            signature="sig_12345",
        ),
        current_user=_build_current_user(plan_code="free"),
    )

    assert result.status == "verified"
    assert result.plan_code == "pro"
    assert supabase_service.updated_subscriptions[-1][1]["payment_status"] == "paid"
    assert supabase_service.updated_subscriptions[-1][1]["subscription_status"] == "active"
    assert supabase_service.updated_user_plans == [(TEST_USER_ID, "pro")]


def test_payment_service_marks_failed_verification_without_upgrading_user(
    monkeypatch,
) -> None:
    supabase_service = FakeSupabaseService()
    service = PaymentService(
        settings=_build_settings(),
        supabase_service=supabase_service,
        plan_service=PlanService(),
    )
    fake_order_client = SimpleNamespace(
        order=SimpleNamespace(create=lambda data: {"id": "order_12345", **data})
    )
    monkeypatch.setattr(service, "get_client", lambda: fake_order_client)
    service.create_order(
        CreateOrderRequest(plan_code="pro"),
        current_user=_build_current_user(plan_code="free"),
    )
    monkeypatch.setattr(service, "_verify_signature", lambda payload: False)

    result = service.verify_payment(
        VerifyPaymentRequest(
            order_id="order_12345",
            payment_id="pay_12345",
            signature="bad_signature",
        ),
        current_user=_build_current_user(plan_code="free"),
    )

    assert result.status == "failed"
    assert result.plan_code == "free"
    assert supabase_service.updated_subscriptions[-1][1]["payment_status"] == "failed"
    assert supabase_service.updated_subscriptions[-1][1]["subscription_status"] == "past_due"
    assert supabase_service.updated_user_plans == []


def _build_settings() -> Settings:
    return Settings(
        supabase_url="https://example.supabase.co",
        supabase_service_role_key=SecretStr("service-key"),
        razorpay_key_id="rzp_test_12345",
        razorpay_key_secret=SecretStr("secret_12345"),
        razorpay_currency="INR",
        razorpay_pro_monthly_amount=99900,
    )


def _build_current_user(*, plan_code: str) -> AuthenticatedUserContext:
    now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
    profile = UserRow(
        id=UUID(TEST_USER_ID),
        email="nik@example.com",
        full_name="Nik Sharma",
        plan_type=plan_code,
        created_at=now,
        updated_at=now,
    )
    return AuthenticatedUserContext(
        id=TEST_USER_ID,
        email=profile.email,
        full_name=profile.full_name,
        plan_code=plan_code,
        profile=profile,
        subscription=None,
    )
