from __future__ import annotations

from datetime import UTC, date, datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
from app.schemas.database import PresentationRow, TemplateRow, UsageLogRow, UserRow
from app.schemas.presentation import GenerateFromTopicRequest
from app.services.plan_service import PlanService
from app.services.topic_generation_service import (
    TopicGenerationLimitError,
    TopicGenerationPermissionError,
    TopicGenerationService,
)


class FakeContentGenerationService:
    def __init__(self, response: GeneratedPresentationContent) -> None:
        self.response = response
        self.calls: list[object] = []

    def generate_topic_presentation(self, payload) -> GeneratedPresentationContent:
        self.calls.append(payload)
        return self.response


class FakeSupabaseService:
    def __init__(
        self,
        *,
        plan_type: str = "free",
        template_is_pro: bool = False,
        existing_usage_count: int | None = None,
        configured: bool = True,
    ) -> None:
        self.plan_type = plan_type
        self.template_is_pro = template_is_pro
        self.existing_usage_count = existing_usage_count
        self.configured = configured
        self.upload_calls: list[dict[str, object]] = []
        self.create_presentation_calls: list[object] = []
        self.create_usage_calls: list[object] = []
        self.update_usage_calls: list[tuple[str, dict[str, object]]] = []

    def is_configured(self) -> bool:
        return self.configured

    def get_user_by_id(self, _user_id: str) -> UserRow:
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return UserRow(
            id=UUID("4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"),
            email="user@example.com",
            full_name="Topic User",
            plan_type=self.plan_type,
            created_at=now,
            updated_at=now,
        )

    def get_usage_log_for_day(self, **_kwargs) -> UsageLogRow | None:
        if self.existing_usage_count is None:
            return None
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return UsageLogRow(
            id=UUID("6e340b11-a1d8-4cc1-9d86-f4268402abf1"),
            user_id=UUID("4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"),
            action="generate_topic",
            usage_date=date(2026, 3, 23),
            request_count=self.existing_usage_count,
            free_limit=3,
            metadata={"source": "web"},
            last_used_at=now,
            created_at=now,
            updated_at=now,
        )

    def upload_presentation_file(self, *, local_path: Path, storage_path: str) -> str:
        self.upload_calls.append(
            {"local_path": local_path, "storage_path": storage_path}
        )
        return "https://example.supabase.co/storage/v1/object/public/presentations/topic/deck.pptx"

    def get_template_by_slug(self, slug: str) -> TemplateRow:
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return TemplateRow(
            id=UUID("13b85da7-2264-451f-8f51-d1a4f42ca0df"),
            slug=slug,
            name="Academic Clean" if not self.template_is_pro else "Boardroom Luxe",
            description="Template",
            config={},
            is_pro_only=self.template_is_pro,
            is_active=True,
            preview_image_url=None,
            created_at=now,
            updated_at=now,
        )

    def create_usage_log(self, payload):
        self.create_usage_calls.append(payload)
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        return UsageLogRow(
            id=UUID("6e340b11-a1d8-4cc1-9d86-f4268402abf1"),
            user_id=payload.user_id,
            action=payload.action,
            usage_date=payload.usage_date,
            request_count=payload.request_count,
            free_limit=payload.free_limit,
            metadata=payload.metadata,
            last_used_at=now,
            created_at=now,
            updated_at=now,
        )

    def update_usage_log(self, usage_log_id: str, payload: dict[str, object]):
        self.update_usage_calls.append((usage_log_id, payload))
        now = datetime.now(UTC)
        return UsageLogRow(
            id=UUID(usage_log_id),
            user_id=UUID("4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"),
            action="generate_topic",
            usage_date=date(2026, 3, 23),
            request_count=int(payload["request_count"]),
            free_limit=3,
            metadata=dict(payload["metadata"]),
            last_used_at=now,
            created_at=now,
            updated_at=now,
        )

    def create_presentation(self, payload) -> PresentationRow:
        self.create_presentation_calls.append(payload)
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
            metadata=payload.metadata,
            created_at=now,
            updated_at=now,
        )

    def delete_presentation_file(self, _storage_path: str) -> None:
        return None


class FakePptxService:
    def __init__(self, *, export_path: Path, template_is_pro: bool = False) -> None:
        self.export_path = export_path
        self.template_is_pro = template_is_pro
        self.export_calls: list[dict[str, object]] = []

    def get_template_definition(self, template_id: str):
        return SimpleNamespace(
            id=template_id,
            name="Academic Clean" if not self.template_is_pro else "Boardroom Luxe",
            is_pro=self.template_is_pro,
        )

    def export_presentation(self, content, **kwargs) -> Path:
        self.export_calls.append({"content": content, **kwargs})
        return self.export_path

    def should_apply_watermark(self, plan_code: str | None) -> bool:
        return (plan_code or "").lower() not in {"pro", "team"}


def test_topic_generation_service_saves_free_generation_and_tracks_usage(
    tmp_path: Path,
) -> None:
    export_path = tmp_path / "topic-deck.pptx"
    export_path.write_bytes(b"pptx")
    content_service = FakeContentGenerationService(_build_generated_content())
    supabase_service = FakeSupabaseService(plan_type="free")
    pptx_service = FakePptxService(export_path=export_path)
    service = TopicGenerationService(
        content_service,
        supabase_service,
        pptx_service,
        PlanService(free_topic_daily_limit=3),
    )

    result = service.generate_from_topic(
        GenerateFromTopicRequest(
            topic="AI presentation workflows",
            subject="Productivity",
            slide_count=3,
            tone="practical",
            user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
            template_id="academic_clean",
        )
    )

    assert result.queued is False
    assert result.presentation.watermark_applied is True
    assert result.presentation.file_url is not None
    assert result.presentation.template_name == "Academic Clean"
    assert result.presentation.metadata["remaining_topic_generations"] == 2
    assert supabase_service.create_usage_calls[0].request_count == 1
    assert supabase_service.create_presentation_calls[0].mode == "topic"
    assert pptx_service.export_calls[0]["user_plan"] == "free"


def test_topic_generation_service_rejects_locked_premium_template_for_free_user(
    tmp_path: Path,
) -> None:
    export_path = tmp_path / "topic-deck.pptx"
    export_path.write_bytes(b"pptx")
    service = TopicGenerationService(
        FakeContentGenerationService(_build_generated_content()),
        FakeSupabaseService(plan_type="free", template_is_pro=True),
        FakePptxService(export_path=export_path, template_is_pro=True),
        PlanService(),
    )

    with pytest.raises(TopicGenerationPermissionError):
        service.generate_from_topic(_build_request(template_id="boardroom_luxe"))


def test_topic_generation_service_rejects_when_free_daily_limit_is_exhausted(
    tmp_path: Path,
) -> None:
    export_path = tmp_path / "topic-deck.pptx"
    export_path.write_bytes(b"pptx")
    service = TopicGenerationService(
        FakeContentGenerationService(_build_generated_content()),
        FakeSupabaseService(plan_type="free", existing_usage_count=3),
        FakePptxService(export_path=export_path),
        PlanService(free_topic_daily_limit=3),
    )

    with pytest.raises(TopicGenerationLimitError):
        service.generate_from_topic(_build_request())


def _build_generated_content() -> GeneratedPresentationContent:
    return GeneratedPresentationContent(
        presentation_title="AI Presentation Workflows",
        slides=[
            PresentationSlide(
                title="Why AI Presentations Matter",
                bullets=["Faster drafting", "More consistent structure"],
                speaker_notes="Explain why faster drafting matters for students and solo builders.",
            ),
            PresentationSlide(
                title="Core Workflow",
                bullets=["Start with a topic", "Refine slide structure"],
                speaker_notes="Walk through the generation path from topic to polished export.",
            ),
            PresentationSlide(
                title="Next Steps",
                bullets=["Review output", "Download deck"],
                speaker_notes="Close with how users can polish and share the generated deck.",
            ),
        ],
    )


def _build_request(*, template_id: str = "academic_clean") -> GenerateFromTopicRequest:
    return GenerateFromTopicRequest(
        topic="AI presentation workflows",
        subject="Productivity",
        slide_count=3,
        tone="practical",
        user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
        template_id=template_id,
    )
