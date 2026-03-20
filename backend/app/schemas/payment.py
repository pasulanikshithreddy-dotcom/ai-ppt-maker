from typing import Literal

from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    plan_code: str = Field(min_length=2, max_length=40)
    amount: int = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)


class PaymentOrder(BaseModel):
    order_id: str
    provider: str
    plan_code: str
    amount: int
    currency: str
    status: Literal["created"] = "created"


class VerifyPaymentRequest(BaseModel):
    order_id: str = Field(min_length=4, max_length=80)
    payment_id: str = Field(min_length=4, max_length=80)
    signature: str = Field(min_length=4, max_length=255)


class VerifyPaymentResult(BaseModel):
    order_id: str
    payment_id: str
    status: Literal["verified", "failed"]
