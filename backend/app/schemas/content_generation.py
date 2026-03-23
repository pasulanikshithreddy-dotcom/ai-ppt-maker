from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class TopicToPptRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    subject: str = Field(min_length=2, max_length=120)
    slide_count: int = Field(ge=3, le=20)
    tone: str = Field(min_length=2, max_length=60)


class PresentationSlide(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    bullets: list[str] = Field(min_length=2, max_length=6)
    speaker_notes: str = Field(min_length=20, max_length=1200)

    @field_validator("bullets")
    @classmethod
    def validate_bullets(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if len(cleaned) < 2:
            raise ValueError("Each slide must include at least two bullets.")
        return cleaned


class GeneratedPresentationContent(BaseModel):
    presentation_title: str = Field(min_length=5, max_length=150)
    slides: list[PresentationSlide] = Field(min_length=3, max_length=20)
