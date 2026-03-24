from __future__ import annotations

from datetime import timedelta
from typing import Any
from uuid import UUID

from app.config.settings import Settings
from app.schemas.database import SubscriptionInsert
from app.schemas.payment import (
    CreateOrderRequest,
    PaymentOrder,
    VerifyPaymentRequest,
    VerifyPaymentResult,
)
from app.schemas.user import AuthenticatedUserContext
from app.services.plan_service import PlanService
from app.services.supabase_service import SupabaseService
from app.utils.runtime import is_secret_configured, utc_now


class PaymentConfigurationError(RuntimeError):
    """Raised when Razorpay or Supabase are not configured."""


class PaymentPlanError(ValueError):
    """Raised when the requested payment action is invalid for the current plan."""


class PaymentNotFoundError(LookupError):
    """Raised when a stored payment order cannot be found."""


class PaymentVerificationError(RuntimeError):
    """Raised when payment verification cannot be completed safely."""


class PaymentService:
    def __init__(
        self,
        settings: Settings,
        supabase_service: SupabaseService,
        plan_service: PlanService,
    ) -> None:
        self.settings = settings
        self.supabase_service = supabase_service
        self.plan_service = plan_service

    def is_configured(self) -> bool:
        return bool(self.settings.razorpay_key_id) and is_secret_configured(
            self.settings.razorpay_key_secret
        )

    def create_order(
        self,
        payload: CreateOrderRequest,
        *,
        current_user: AuthenticatedUserContext,
    ) -> PaymentOrder:
        self._ensure_ready()

        normalized_plan = self.plan_service.normalize_plan_code(payload.plan_code)
        if normalized_plan != "pro":
            raise PaymentPlanError("Only the Pro plan is available for Razorpay checkout.")

        if self.plan_service.is_paid_plan(current_user.plan_code):
            raise PaymentPlanError("Your account already has access to paid features.")

        order_payload = {
            "amount": self.settings.razorpay_pro_monthly_amount,
            "currency": self.settings.razorpay_currency,
            "receipt": f"pro-{current_user.id[:8]}-{utc_now().strftime('%Y%m%d%H%M%S')}",
            "notes": {
                "user_id": current_user.id,
                "plan_code": normalized_plan,
            },
        }
        try:
            order = self.get_client().order.create(data=order_payload)
        except Exception as exc:  # pragma: no cover - third-party SDK boundary
            raise PaymentVerificationError("Failed to create a Razorpay order.") from exc

        order_id = self._read_order_value(order, "id")
        self.supabase_service.create_subscription(
            SubscriptionInsert(
                user_id=UUID(current_user.id),
                plan_type="pro",
                provider="razorpay",
                provider_order_id=order_id,
                payment_status="pending",
                subscription_status="past_due",
                amount=self.settings.razorpay_pro_monthly_amount,
                currency=self.settings.razorpay_currency,
            )
        )

        return PaymentOrder(
            order_id=order_id,
            provider="razorpay",
            plan_code="pro",
            amount=self.settings.razorpay_pro_monthly_amount,
            currency=self.settings.razorpay_currency,
            key_id=self.settings.razorpay_key_id or "",
        )

    def verify_payment(
        self,
        payload: VerifyPaymentRequest,
        *,
        current_user: AuthenticatedUserContext,
    ) -> VerifyPaymentResult:
        self._ensure_ready()

        subscription = self.supabase_service.get_subscription_by_order_id(
            provider="razorpay",
            provider_order_id=payload.order_id,
        )
        if subscription is None:
            raise PaymentNotFoundError("Payment order not found.")

        if str(subscription.user_id) != current_user.id:
            raise PaymentVerificationError("Payment order does not belong to the current user.")

        if not self._verify_signature(payload):
            self.supabase_service.update_subscription(
                str(subscription.id),
                {
                    "payment_status": "failed",
                    "subscription_status": "past_due",
                    "provider_payment_id": payload.payment_id,
                },
            )
            return VerifyPaymentResult(
                order_id=payload.order_id,
                payment_id=payload.payment_id,
                status="failed",
                plan_code=current_user.plan_code,
            )

        now = utc_now()
        self.supabase_service.update_subscription(
            str(subscription.id),
            {
                "payment_status": "paid",
                "subscription_status": "active",
                "provider_payment_id": payload.payment_id,
                "current_period_start": now.isoformat(),
                "current_period_end": (now + timedelta(days=30)).isoformat(),
            },
        )
        self.supabase_service.update_user_plan(current_user.id, plan_type="pro")

        return VerifyPaymentResult(
            order_id=payload.order_id,
            payment_id=payload.payment_id,
            status="verified",
            plan_code="pro",
        )

    def get_client(self):
        self._ensure_razorpay_configured()
        import razorpay

        return razorpay.Client(
            auth=(
                self.settings.razorpay_key_id,
                self.settings.razorpay_key_secret.get_secret_value(),
            )
        )

    def _verify_signature(self, payload: VerifyPaymentRequest) -> bool:
        try:
            self.get_client().utility.verify_payment_signature(
                {
                    "razorpay_order_id": payload.order_id,
                    "razorpay_payment_id": payload.payment_id,
                    "razorpay_signature": payload.signature,
                }
            )
        except Exception:
            return False
        return True

    def _ensure_ready(self) -> None:
        self._ensure_razorpay_configured()
        if not self.supabase_service.is_configured():
            raise PaymentConfigurationError("Supabase is not configured for payment upgrades.")

    def _ensure_razorpay_configured(self) -> None:
        if not self.is_configured():
            raise PaymentConfigurationError("Razorpay is not configured for payment checkout.")

    @staticmethod
    def _read_order_value(order: dict[str, Any] | Any, key: str) -> str:
        if isinstance(order, dict):
            value = order.get(key)
        else:
            value = getattr(order, key, None)

        if not isinstance(value, str) or not value.strip():
            raise PaymentVerificationError("Razorpay order response was incomplete.")
        return value
