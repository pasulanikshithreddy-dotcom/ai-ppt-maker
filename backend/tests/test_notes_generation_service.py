from __future__ import annotations

from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
from app.schemas.database import PresentationRow, TemplateRow, UserRow
from app.schemas.presentation import GenerateFromNotesRequest
from app.services.notes_generation_service import (
    NotesGenerationConfigurationError,
    NotesGenerationPermissionError,
    NotesGenerationService,
)


class FakeContentGenerationService:
    def __init__(self, response: GeneratedPresentationContent) -> None:
        self.response = response
        self.calls: list[dict[str, object]] = []

    def generate_notes_presentation(self, **kwargs) -> GeneratedPresentationContent:
        self.calls.append(kwargs)
        return self.response


class FakeSupabaseService:
    def __init__(self, *, plan_type: str = "pro", configured: bool = True) -> None:
        self.plan_type = plan_type
        self.configured = configured
        self.upload_calls: list[dict[str, object]] = []
        self.create_calls: list[object] = []
        self.deleted_paths: list[str] = []

    def is_configured(self) -> bool:
        return self.configured

    def get_user_by_id(self, user_id: str) -> UserRow:
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return UserRow(
            id=UUID("4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"),
            email="pro@example.com",
            full_name="Pro User",
            plan_type=self.plan_type,
            created_at=now,
            updated_at=now,
        )

    def get_template_by_slug(self, slug: str) -> TemplateRow:
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return TemplateRow(
            id=UUID("13b85da7-2264-451f-8f51-d1a4f42ca0df"),
            slug=slug,
            name="Boardroom Luxe",
            description="Premium deck style",
            config={},
            is_pro_only=True,
            is_active=True,
            preview_image_url=None,
            created_at=now,
            updated_at=now,
        )

    def upload_presentation_file(self, *, local_path: Path, storage_path: str) -> str:
        self.upload_calls.append(
            {
                "local_path": local_path,
                "storage_path": storage_path,
            }
        )
        return "https://example.supabase.co/storage/v1/object/public/presentations/deck.pptx"

    def create_presentation(self, payload) -> PresentationRow:
        self.create_calls.append(payload)
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return PresentationRow(
            id=payload.id,
            user_id=payload.user_id,
            template_id=payload.template_id,
            mode=payload.mode,
            status=payload.status,
            topic=payload.topic,
            content=payload.content,
            file_url=payload.file_url,
            watermark_applied=payload.watermark_applied,
            created_at=now,
            updated_at=now,
        )

    def delete_presentation_file(self, storage_path: str) -> None:
        self.deleted_paths.append(storage_path)


class FakePptxService:
    def __init__(self, export_path: Path) -> None:
        self.export_path = export_path
        self.export_calls: list[dict[str, object]] = []

    def get_template_definition(self, template_id: str):
        return SimpleNamespace(id=template_id)

    def export_presentation(self, content, **kwargs) -> Path:
        self.export_calls.append({"content": content, **kwargs})
        return self.export_path

    def should_apply_watermark(self, plan_code: str | None) -> bool:
        return (plan_code or "").lower() not in {"pro", "team"}


def test_notes_generation_service_processes_notes_into_saved_presentation(
    tmp_path: Path,
) -> None:
    export_path = tmp_path / "generated-deck.pptx"
    export_path.write_bytes(b"pptx")
    generated_content = GeneratedPresentationContent(
        presentation_title="Customer Research Summary",
        slides=[
            PresentationSlide(
                title="Context",
                bullets=["Interview set complete", "Responses were consistent"],
                speaker_notes="Open with what the notes covered and why the sample is useful.",
            ),
            PresentationSlide(
                title="Insights",
                bullets=["Speed matters most", "Trust depends on polish"],
                speaker_notes="Tie the cleaned notes back to the recurring themes.",
            ),
            PresentationSlide(
                title="Actions",
                bullets=["Improve onboarding", "Polish exported decks"],
                speaker_notes="Close with concrete product actions derived from the notes.",
            ),
        ],
    )
    content_service = FakeContentGenerationService(generated_content)
    supabase_service = FakeSupabaseService(plan_type="pro")
    pptx_service = FakePptxService(export_path)
    service = NotesGenerationService(content_service, supabase_service, pptx_service)

    result = service.generate_from_notes(
        GenerateFromNotesRequest(
            notes=(
                "Research Summary:\n"
                "- Users care about speed.\n"
                "- Users also need polished exports.\n\n"
                "Recommendations:\n"
                "Focus onboarding and output quality."
            ),
            title="Research Summary",
            topic="Customer Research",
            slide_count=3,
            template_id="boardroom_luxe",
            user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
        )
    )

    assert result.queued is False
    assert result.presentation.title == "Customer Research Summary"
    assert result.presentation.file_url is not None
    assert result.presentation.watermark_applied is False
    assert result.content is not None
    assert result.content.presentation_title == "Customer Research Summary"

    normalized_notes = content_service.calls[0]["normalized_notes"]
    sections = content_service.calls[0]["sections"]
    assert "  " not in normalized_notes
    assert len(sections) >= 2
    assert pptx_service.export_calls[0]["user_plan"] == "pro"
    assert supabase_service.upload_calls[0]["local_path"] == export_path
    assert "notes" in supabase_service.upload_calls[0]["storage_path"]
    assert supabase_service.create_calls[0].mode == "notes"
    assert supabase_service.create_calls[0].watermark_applied is False


def test_notes_generation_service_rejects_free_users(tmp_path: Path) -> None:
    export_path = tmp_path / "generated-deck.pptx"
    export_path.write_bytes(b"pptx")
    service = NotesGenerationService(
        FakeContentGenerationService(_build_generated_content()),
        FakeSupabaseService(plan_type="free"),
        FakePptxService(export_path),
    )

    with pytest.raises(NotesGenerationPermissionError):
        service.generate_from_notes(_build_request())


def test_notes_generation_service_requires_supabase_configuration(tmp_path: Path) -> None:
    export_path = tmp_path / "generated-deck.pptx"
    export_path.write_bytes(b"pptx")
    service = NotesGenerationService(
        FakeContentGenerationService(_build_generated_content()),
        FakeSupabaseService(plan_type="pro", configured=False),
        FakePptxService(export_path),
    )

    with pytest.raises(NotesGenerationConfigurationError):
        service.generate_from_notes(_build_request())


def _build_generated_content() -> GeneratedPresentationContent:
    return GeneratedPresentationContent(
        presentation_title="Research Summary",
        slides=[
            PresentationSlide(
                title="Overview",
                bullets=["Point A", "Point B"],
                speaker_notes="Notes long enough to keep this fake structured response valid.",
            ),
            PresentationSlide(
                title="Findings",
                bullets=["Point C", "Point D"],
                speaker_notes="Second notes block that remains valid for the fake response.",
            ),
            PresentationSlide(
                title="Next Steps",
                bullets=["Point E", "Point F"],
                speaker_notes="Final notes block that satisfies the schema requirements here.",
            ),
        ],
    )


def _build_request() -> GenerateFromNotesRequest:
    return GenerateFromNotesRequest(
        notes="Section one\n\nSection two\n\nSection three with enough detail to validate.",
        title="Research Summary",
        topic="Customer Research",
        slide_count=3,
        template_id="boardroom_luxe",
        user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
    )
