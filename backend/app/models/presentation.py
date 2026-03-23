from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any

from app.utils.runtime import new_id, utc_now


class PresentationStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class PresentationSource(StrEnum):
    SAMPLE = "sample"
    TOPIC = "topic"
    NOTES = "notes"
    PDF = "pdf"


@dataclass(slots=True)
class PresentationRecord:
    title: str
    source_type: PresentationSource
    slide_count: int
    template_id: str = "starter"
    presentation_id: str = field(default_factory=lambda: new_id("pres"))
    status: PresentationStatus = PresentationStatus.QUEUED
    watermark_applied: bool = True
    created_at: datetime = field(default_factory=utc_now)
    content_preview: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
