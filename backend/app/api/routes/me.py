from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_context, get_profile_service
from app.schemas.common import ApiResponse
from app.schemas.user import AuthenticatedUserContext, CurrentUser
from app.services.profile_service import ProfileService

router = APIRouter()
ProfileServiceDep = Annotated[ProfileService, Depends(get_profile_service)]
AuthenticatedUserContextDep = Annotated[
    AuthenticatedUserContext,
    Depends(get_current_user_context),
]


@router.get("/me", response_model=ApiResponse[CurrentUser], summary="Get current user")
async def get_me(
    current_user: AuthenticatedUserContextDep,
    profile_service: ProfileServiceDep,
) -> ApiResponse[CurrentUser]:
    return ApiResponse(
        message="Current user fetched successfully.",
        data=profile_service.get_current_user(current_user),
    )
