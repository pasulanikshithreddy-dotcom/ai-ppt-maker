from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_plan_service
from app.schemas.common import ApiResponse
from app.schemas.plan import PlanOverview
from app.services.plan_service import PlanService

router = APIRouter()
PlanServiceDep = Annotated[PlanService, Depends(get_plan_service)]


@router.get("/plan", response_model=ApiResponse[PlanOverview], summary="Get plan overview")
async def get_plan(plan_service: PlanServiceDep) -> ApiResponse[PlanOverview]:
    return ApiResponse(
        message="Plan overview fetched successfully.",
        data=plan_service.get_plan_overview(),
    )
