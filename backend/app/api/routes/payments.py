from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user_context, get_payment_service
from app.schemas.common import ApiResponse
from app.schemas.payment import (
    CreateOrderRequest,
    PaymentOrder,
    VerifyPaymentRequest,
    VerifyPaymentResult,
)
from app.schemas.user import AuthenticatedUserContext
from app.services.payment_service import (
    PaymentConfigurationError,
    PaymentNotFoundError,
    PaymentPlanError,
    PaymentService,
    PaymentVerificationError,
)

router = APIRouter()
PaymentServiceDep = Annotated[PaymentService, Depends(get_payment_service)]
AuthenticatedUserContextDep = Annotated[
    AuthenticatedUserContext,
    Depends(get_current_user_context),
]


@router.post(
    "/payments/create-order",
    response_model=ApiResponse[PaymentOrder],
    summary="Create payment order",
)
async def create_order(
    payload: CreateOrderRequest,
    payment_service: PaymentServiceDep,
    current_user: AuthenticatedUserContextDep,
) -> ApiResponse[PaymentOrder]:
    try:
        order = payment_service.create_order(payload, current_user=current_user)
    except PaymentConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaymentPlanError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ApiResponse(
        message="Payment order created successfully.",
        data=order,
    )


@router.post(
    "/payments/verify",
    response_model=ApiResponse[VerifyPaymentResult],
    summary="Verify payment",
)
async def verify_payment(
    payload: VerifyPaymentRequest,
    payment_service: PaymentServiceDep,
    current_user: AuthenticatedUserContextDep,
) -> ApiResponse[VerifyPaymentResult]:
    try:
        result = payment_service.verify_payment(payload, current_user=current_user)
    except PaymentConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PaymentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PaymentVerificationError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    return ApiResponse(
        message="Payment verification completed.",
        data=result,
    )
