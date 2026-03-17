from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.presentation import PresentationStatus


class PresentationCreateRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=2000)
    title: str | None = Field(default=None, max_length=120)
    slide_count: int = Field(default=10, ge=1, le=50)


class PresentationJobResponse(BaseModel):
    job_id: str
    status: PresentationStatus
    created_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)
