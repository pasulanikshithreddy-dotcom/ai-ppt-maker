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
    template_id: str
    template_name: str | None = None
    topic: str | None = None
    file_url: str | None = None
    watermark_applied: bool
    created_at: datetime
    content_preview: list[str] = Field(default_factory=list)


class PresentationDetail(PresentationSummary):
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


class GenerateFromTopicRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    subject: str = Field(min_length=2, max_length=120)
    slide_count: int = Field(default=10, ge=3, le=20)
    tone: str = Field(min_length=2, max_length=60)
    user_id: str = Field(min_length=3, max_length=120)
    template_id: str = Field(default="academic_clean", max_length=80)


class GenerateFromPdfRequest(BaseModel):
    source_filename: str = Field(min_length=1, max_length=255)
    user_id: str = Field(min_length=3, max_length=120)
    slide_count: int = Field(default=10, ge=3, le=20)
    template_id: str = Field(default="starter", max_length=80)


class GenerationResult(BaseModel):
    queued: bool = True
    presentation: PresentationDetail
    content: GeneratedPresentationContent | None = None
