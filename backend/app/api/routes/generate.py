from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import (
    get_content_generation_service,
    get_notes_generation_service,
    get_presentation_service,
)
from app.schemas.common import ApiResponse
from app.schemas.content_generation import (
    GeneratedPresentationContent,
    TopicToPptRequest,
)
from app.schemas.presentation import (
    GenerateFromNotesRequest,
    GenerateFromPdfRequest,
    GenerationResult,
)
from app.services.content_generation_service import (
    ContentGenerationConfigurationError,
    ContentGenerationError,
    ContentGenerationService,
)
from app.services.notes_generation_service import (
    NotesGenerationConfigurationError,
    NotesGenerationError,
    NotesGenerationNotFoundError,
    NotesGenerationPermissionError,
    NotesGenerationService,
)
from app.services.presentation_service import PresentationService

router = APIRouter()
PresentationServiceDep = Annotated[PresentationService, Depends(get_presentation_service)]
ContentGenerationServiceDep = Annotated[
    ContentGenerationService,
    Depends(get_content_generation_service),
]
NotesGenerationServiceDep = Annotated[
    NotesGenerationService,
    Depends(get_notes_generation_service),
]


@router.post(
    "/generate/topic",
    response_model=ApiResponse[GeneratedPresentationContent],
    summary="Generate presentation content from a topic",
)
async def generate_from_topic(
    payload: TopicToPptRequest,
    content_generation_service: ContentGenerationServiceDep,
) -> ApiResponse[GeneratedPresentationContent]:
    try:
        content = content_generation_service.generate_topic_presentation(payload)
    except ContentGenerationConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ContentGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail="OpenAI content generation failed.") from exc

    return ApiResponse(
        message="Topic presentation content generated successfully.",
        data=content,
    )


@router.post(
    "/generate/notes",
    response_model=ApiResponse[GenerationResult],
    summary="Generate presentation from notes",
)
async def generate_from_notes(
    payload: GenerateFromNotesRequest,
    notes_generation_service: NotesGenerationServiceDep,
) -> ApiResponse[GenerationResult]:
    try:
        result = notes_generation_service.generate_from_notes(payload)
    except NotesGenerationConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NotesGenerationPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except NotesGenerationNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except NotesGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ApiResponse(
        message="Notes presentation generated successfully.",
        data=result,
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
