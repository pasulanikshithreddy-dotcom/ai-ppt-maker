from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.presentation import PresentationSource, PresentationStatus


class PresentationSummary(BaseModel):
    id: str
    title: str
    source_type: PresentationSource
    status: PresentationStatus
    slide_count: int
    created_at: datetime


class PresentationDetail(PresentationSummary):
    template_id: str
    content_preview: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class PresentationListData(BaseModel):
    items: list[PresentationSummary]
    total: int


class GenerateFromNotesRequest(BaseModel):
    notes: str = Field(min_length=20, max_length=10000)
    title: str | None = Field(default=None, max_length=120)
    slide_count: int = Field(default=10, ge=3, le=30)
    template_id: str = Field(default="starter", max_length=80)


class GenerateFromPdfRequest(BaseModel):
    pdf_url: str = Field(min_length=5, max_length=2048)
    title: str | None = Field(default=None, max_length=120)
    slide_count: int = Field(default=10, ge=3, le=30)
    template_id: str = Field(default="starter", max_length=80)


class GenerationResult(BaseModel):
    queued: bool = True
    presentation: PresentationDetail
