from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.presentation import PresentationSource, PresentationStatus
from app.schemas.content_generation import GeneratedPresentationContent


class PresentationSummary(BaseModel):
    id: str
    title: str
    source_type: PresentationSource
    status: PresentationStatus
    slide_count: int
    watermark_applied: bool
    created_at: datetime


class PresentationDetail(PresentationSummary):
    template_id: str
    topic: str | None = None
    file_url: str | None = None
    content_preview: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class PresentationListData(BaseModel):
    items: list[PresentationSummary]
    total: int


class GenerateFromNotesRequest(BaseModel):
    notes: str = Field(min_length=20, max_length=10000)
    title: str | None = Field(default=None, max_length=120)
    topic: str | None = Field(default=None, max_length=120)
    user_id: str = Field(min_length=3, max_length=120)
    slide_count: int = Field(default=10, ge=3, le=20)
    template_id: str = Field(default="starter", max_length=80)


class GenerateFromPdfRequest(BaseModel):
    source_filename: str = Field(min_length=1, max_length=255)
    user_id: str = Field(min_length=3, max_length=120)
    slide_count: int = Field(default=10, ge=3, le=20)
    template_id: str = Field(default="starter", max_length=80)


class GenerationResult(BaseModel):
    queued: bool = True
    presentation: PresentationDetail
    content: GeneratedPresentationContent | None = None
