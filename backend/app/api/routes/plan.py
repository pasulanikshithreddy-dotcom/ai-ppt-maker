from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_context, get_plan_service, get_profile_service
from app.schemas.common import ApiResponse
from app.schemas.plan import PlanOverview
from app.schemas.user import AuthenticatedUserContext
from app.services.plan_service import PlanService
from app.services.profile_service import ProfileService

router = APIRouter()
PlanServiceDep = Annotated[PlanService, Depends(get_plan_service)]
ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
AuthenticatedUserContextDep = Annotated[
    AuthenticatedUserContext,
    Depends(get_current_user_context),
]


@router.get("/plan", response_model=ApiResponse[PlanOverview], summary="Get plan overview")
async def get_plan(
    current_user: AuthenticatedUserContextDep,
    plan_service: PlanServiceDep,
    profile_service: ProfileServiceDep,
) -> ApiResponse[PlanOverview]:
    current_profile = profile_service.get_current_user(current_user)
    return ApiResponse(
        message="Plan overview fetched successfully.",
        data=plan_service.get_plan_overview(
            current_plan_code=current_user.plan_code,
            remaining_topic_generations=current_profile.credits_remaining,
            subscription_status=(
                current_user.subscription.subscription_status
                if current_user.subscription is not None
                else None
            ),
        ),
    )
