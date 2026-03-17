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


@dataclass(slots=True)
class PresentationJob:
    prompt: str
    title: str | None = None
    slide_count: int = 10
    job_id: str = field(default_factory=lambda: new_id("deck"))
    status: PresentationStatus = PresentationStatus.QUEUED
    created_at: datetime = field(default_factory=utc_now)
    metadata: dict[str, Any] = field(default_factory=dict)
