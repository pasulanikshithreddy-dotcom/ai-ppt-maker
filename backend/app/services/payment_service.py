from typing import ClassVar

from app.schemas.payment import (
    CreateOrderRequest,
    PaymentOrder,
    VerifyPaymentRequest,
    VerifyPaymentResult,
)
from app.utils.runtime import new_id


class PaymentService:
    _orders: ClassVar[dict[str, PaymentOrder]] = {}

    def create_order(self, payload: CreateOrderRequest) -> PaymentOrder:
        order = PaymentOrder(
            order_id=new_id("order"),
            provider="demo",
            plan_code=payload.plan_code,
            amount=payload.amount,
            currency=payload.currency.upper(),
        )
        self._orders[order.order_id] = order
        return order

    def verify_payment(self, payload: VerifyPaymentRequest) -> VerifyPaymentResult:
        order_exists = payload.order_id in self._orders
        status = "verified" if order_exists and payload.signature else "failed"
        return VerifyPaymentResult(
            order_id=payload.order_id,
            payment_id=payload.payment_id,
            status=status,
        )
