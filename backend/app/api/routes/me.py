from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_profile_service
from app.schemas.common import ApiResponse
from app.schemas.user import CurrentUser
from app.services.profile_service import ProfileService

router = APIRouter()
ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]


@router.get("/me", response_model=ApiResponse[CurrentUser], summary="Get current user")
async def get_me(profile_service: ProfileServiceDep) -> ApiResponse[CurrentUser]:
    return ApiResponse(
        message="Current user fetched successfully.",
        data=profile_service.get_current_user(),
    )
