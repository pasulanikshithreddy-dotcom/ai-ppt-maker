from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_presentation_service
from app.schemas.common import ApiResponse
from app.schemas.presentation import PresentationDetail, PresentationListData
from app.services.presentation_service import PresentationService

router = APIRouter()
PresentationServiceDep = Annotated[PresentationService, Depends(get_presentation_service)]


@router.get(
    "/presentations",
    response_model=ApiResponse[PresentationListData],
    summary="List presentations",
)
async def list_presentations(
    presentation_service: PresentationServiceDep,
) -> ApiResponse[PresentationListData]:
    return ApiResponse(
        message="Presentations fetched successfully.",
        data=presentation_service.list_presentations(),
    )


@router.get(
    "/presentations/{presentation_id}",
    response_model=ApiResponse[PresentationDetail],
    summary="Get presentation by id",
)
async def get_presentation(
    presentation_id: str,
    presentation_service: PresentationServiceDep,
) -> ApiResponse[PresentationDetail]:
    presentation = presentation_service.get_presentation(presentation_id)
    if presentation is None:
        raise HTTPException(status_code=404, detail="Presentation not found.")

    return ApiResponse(
        message="Presentation fetched successfully.",
        data=presentation,
    )
