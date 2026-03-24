from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import (
    get_current_user_context,
    get_notes_generation_service,
    get_pdf_generation_service,
    get_topic_generation_service,
)
from app.schemas.common import ApiResponse
from app.schemas.presentation import (
    GenerateFromNotesRequest,
    GenerateFromPdfRequest,
    GenerateFromTopicRequest,
    GenerationResult,
)
from app.schemas.user import AuthenticatedUserContext
from app.services.notes_generation_service import (
    NotesGenerationConfigurationError,
    NotesGenerationError,
    NotesGenerationNotFoundError,
    NotesGenerationPermissionError,
    NotesGenerationService,
)
from app.services.pdf_generation_service import (
    PdfGenerationConfigurationError,
    PdfGenerationError,
    PdfGenerationNotFoundError,
    PdfGenerationPermissionError,
    PdfGenerationService,
)
from app.services.topic_generation_service import (
    TopicGenerationConfigurationError,
    TopicGenerationError,
    TopicGenerationLimitError,
    TopicGenerationNotFoundError,
    TopicGenerationPermissionError,
    TopicGenerationService,
)

router = APIRouter()
NotesGenerationServiceDep = Annotated[
    NotesGenerationService,
    Depends(get_notes_generation_service),
]
PdfGenerationServiceDep = Annotated[
    PdfGenerationService,
    Depends(get_pdf_generation_service),
]
TopicGenerationServiceDep = Annotated[
    TopicGenerationService,
    Depends(get_topic_generation_service),
]
AuthenticatedUserContextDep = Annotated[
    AuthenticatedUserContext,
    Depends(get_current_user_context),
]


@router.post(
    "/generate/topic",
    response_model=ApiResponse[GenerationResult],
    summary="Generate a presentation from a topic",
)
async def generate_from_topic(
    payload: GenerateFromTopicRequest,
    topic_generation_service: TopicGenerationServiceDep,
    current_user: AuthenticatedUserContextDep,
) -> ApiResponse[GenerationResult]:
    if payload.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Authenticated user does not match the requested user_id.",
        )

    try:
        result = topic_generation_service.generate_from_topic(payload)
    except TopicGenerationConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except TopicGenerationPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except TopicGenerationLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except TopicGenerationNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except TopicGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ApiResponse(
        message="Topic presentation generated successfully.",
        data=result,
    )


@router.post(
    "/generate/notes",
    response_model=ApiResponse[GenerationResult],
    summary="Generate presentation from notes",
)
async def generate_from_notes(
    payload: GenerateFromNotesRequest,
    notes_generation_service: NotesGenerationServiceDep,
    current_user: AuthenticatedUserContextDep,
) -> ApiResponse[GenerationResult]:
    if payload.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Authenticated user does not match the requested user_id.",
        )

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
    pdf: Annotated[UploadFile, File(...)],
    template_id: Annotated[str, Form(...)],
    user_id: Annotated[str, Form(...)],
    pdf_generation_service: PdfGenerationServiceDep,
    current_user: AuthenticatedUserContextDep,
    slide_count: Annotated[int, Form()] = 10,
) -> ApiResponse[GenerationResult]:
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Authenticated user does not match the requested user_id.",
        )

    filename = pdf.filename or "uploaded.pdf"
    is_pdf_content_type = pdf.content_type in {"application/pdf", "application/x-pdf"}
    if not is_pdf_content_type and not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="A PDF file is required.")

    pdf_bytes = await pdf.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded PDF was empty.")

    payload = GenerateFromPdfRequest(
        source_filename=filename,
        template_id=template_id,
        user_id=user_id,
        slide_count=slide_count,
    )

    try:
        result = pdf_generation_service.generate_from_pdf(
            payload,
            pdf_bytes=pdf_bytes,
        )
    except PdfGenerationConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PdfGenerationPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except PdfGenerationNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PdfGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ApiResponse(
        message="PDF presentation generated successfully.",
        data=result,
    )
