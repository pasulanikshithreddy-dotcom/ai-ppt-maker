from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_payment_service
from app.schemas.common import ApiResponse
from app.schemas.payment import (
    CreateOrderRequest,
    PaymentOrder,
    VerifyPaymentRequest,
    VerifyPaymentResult,
)
from app.services.payment_service import PaymentService

router = APIRouter()
PaymentServiceDep = Annotated[PaymentService, Depends(get_payment_service)]


@router.post(
    "/payments/create-order",
    response_model=ApiResponse[PaymentOrder],
    summary="Create payment order",
)
async def create_order(
    payload: CreateOrderRequest,
    payment_service: PaymentServiceDep,
) -> ApiResponse[PaymentOrder]:
    return ApiResponse(
        message="Payment order created successfully.",
        data=payment_service.create_order(payload),
    )


@router.post(
    "/payments/verify",
    response_model=ApiResponse[VerifyPaymentResult],
    summary="Verify payment",
)
async def verify_payment(
    payload: VerifyPaymentRequest,
    payment_service: PaymentServiceDep,
) -> ApiResponse[VerifyPaymentResult]:
    return ApiResponse(
        message="Payment verification completed.",
        data=payment_service.verify_payment(payload),
    )
