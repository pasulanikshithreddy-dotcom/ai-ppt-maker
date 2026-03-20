from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_presentation_service
from app.schemas.common import ApiResponse
from app.schemas.presentation import (
    GenerateFromNotesRequest,
    GenerateFromPdfRequest,
    GenerateFromTopicRequest,
    GenerationResult,
)
from app.services.presentation_service import PresentationService

router = APIRouter()
PresentationServiceDep = Annotated[PresentationService, Depends(get_presentation_service)]


@router.post(
    "/generate/topic",
    response_model=ApiResponse[GenerationResult],
    summary="Generate presentation from a topic",
)
async def generate_from_topic(
    payload: GenerateFromTopicRequest,
    presentation_service: PresentationServiceDep,
) -> ApiResponse[GenerationResult]:
    return ApiResponse(
        message="Topic generation request accepted.",
        data=presentation_service.generate_from_topic(payload),
    )


@router.post(
    "/generate/notes",
    response_model=ApiResponse[GenerationResult],
    summary="Generate presentation from notes",
)
async def generate_from_notes(
    payload: GenerateFromNotesRequest,
    presentation_service: PresentationServiceDep,
) -> ApiResponse[GenerationResult]:
    return ApiResponse(
        message="Notes generation request accepted.",
        data=presentation_service.generate_from_notes(payload),
    )


@router.post(
    "/generate/pdf",
    response_model=ApiResponse[GenerationResult],
    summary="Generate presentation from a PDF source",
)
async def generate_from_pdf(
    payload: GenerateFromPdfRequest,
    presentation_service: PresentationServiceDep,
) -> ApiResponse[GenerationResult]:
    return ApiResponse(
        message="PDF generation request accepted.",
        data=presentation_service.generate_from_pdf(payload),
    )
