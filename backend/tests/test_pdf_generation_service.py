from __future__ import annotations

from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
from app.schemas.database import PresentationRow, TemplateRow, UserRow
from app.schemas.presentation import GenerateFromPdfRequest
from app.services.pdf_generation_service import (
    PdfGenerationConfigurationError,
    PdfGenerationPermissionError,
    PdfGenerationService,
)
from app.services.plan_service import PlanService


class FakeContentGenerationService:
    def __init__(self, response: GeneratedPresentationContent) -> None:
        self.response = response
        self.calls: list[dict[str, object]] = []

    def generate_pdf_presentation(self, **kwargs) -> GeneratedPresentationContent:
        self.calls.append(kwargs)
        return self.response


class FakeSupabaseService:
    def __init__(self, *, plan_type: str = "pro", configured: bool = True) -> None:
        self.plan_type = plan_type
        self.configured = configured
        self.upload_bytes_calls: list[dict[str, object]] = []
        self.upload_pptx_calls: list[dict[str, object]] = []
        self.create_calls: list[object] = []
        self.deleted_paths: list[str] = []

    def is_configured(self) -> bool:
        return self.configured

    def get_user_by_id(self, _user_id: str) -> UserRow:
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

    def upload_file_bytes(self, *, file_bytes: bytes, storage_path: str, content_type: str) -> str:
        self.upload_bytes_calls.append(
            {
                "file_bytes": file_bytes,
                "storage_path": storage_path,
                "content_type": content_type,
            }
        )
        return "https://example.supabase.co/storage/v1/object/public/presentations/source/report.pdf"

    def upload_presentation_file(self, *, local_path: Path, storage_path: str) -> str:
        self.upload_pptx_calls.append(
            {"local_path": local_path, "storage_path": storage_path}
        )
        return "https://example.supabase.co/storage/v1/object/public/presentations/generated/report.pptx"

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
            metadata=payload.metadata,
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
        return SimpleNamespace(id=template_id, name="Boardroom Luxe", is_pro=True)

    def export_presentation(self, content, **kwargs) -> Path:
        self.export_calls.append({"content": content, **kwargs})
        return self.export_path

    def should_apply_watermark(self, plan_code: str | None) -> bool:
        return (plan_code or "").lower() not in {"pro", "team"}


def test_pdf_generation_service_processes_uploaded_pdf_into_saved_presentation(
    tmp_path: Path,
    monkeypatch,
) -> None:
    export_path = tmp_path / "generated-deck.pptx"
    export_path.write_bytes(b"pptx")
    generated_content = GeneratedPresentationContent(
        presentation_title="Quarterly Report Summary",
        slides=[
            PresentationSlide(
                title="Overview",
                bullets=["The report was summarized", "Key trends were extracted"],
                speaker_notes="Introduce the source report and the overall narrative of the deck.",
            ),
            PresentationSlide(
                title="Findings",
                bullets=["Revenue improved", "Risk remained manageable"],
                speaker_notes=(
                    "Explain the most important findings that were preserved "
                    "from the PDF."
                ),
            ),
            PresentationSlide(
                title="Actions",
                bullets=["Double down on wins", "Address known constraints"],
                speaker_notes=(
                    "Close with practical actions that follow from the "
                    "summarized report."
                ),
            ),
        ],
    )
    content_service = FakeContentGenerationService(generated_content)
    supabase_service = FakeSupabaseService(plan_type="pro")
    pptx_service = FakePptxService(export_path)
    service = PdfGenerationService(
        content_service,
        supabase_service,
        pptx_service,
        PlanService(),
    )
    monkeypatch.setattr(
        service,
        "extract_text_from_pdf",
        lambda _pdf_bytes: "Readable PDF text from several pages.",
    )

    result = service.generate_from_pdf(
        GenerateFromPdfRequest(
            source_filename="quarterly-report.pdf",
            user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
            slide_count=3,
            template_id="boardroom_luxe",
        ),
        pdf_bytes=b"%PDF-1.4 fake",
    )

    assert result.queued is False
    assert result.presentation.title == "Quarterly Report Summary"
    assert result.presentation.file_url is not None
    assert result.presentation.metadata["source_pdf_url"]
    assert result.content is not None
    assert result.content.presentation_title == "Quarterly Report Summary"
    assert supabase_service.upload_bytes_calls[0]["content_type"] == "application/pdf"
    assert "source" in supabase_service.upload_bytes_calls[0]["storage_path"]
    assert "generated" in supabase_service.upload_pptx_calls[0]["storage_path"]
    assert content_service.calls[0]["source_name"] == "quarterly-report.pdf"
    assert pptx_service.export_calls[0]["user_plan"] == "pro"
    assert supabase_service.create_calls[0].metadata["source_pdf_url"]


def test_pdf_generation_service_rejects_free_users(tmp_path: Path) -> None:
    export_path = tmp_path / "generated-deck.pptx"
    export_path.write_bytes(b"pptx")
    service = PdfGenerationService(
        FakeContentGenerationService(_build_generated_content()),
        FakeSupabaseService(plan_type="free"),
        FakePptxService(export_path),
        PlanService(),
    )

    with pytest.raises(PdfGenerationPermissionError):
        service.generate_from_pdf(
            _build_request(),
            pdf_bytes=b"%PDF-1.4 fake",
        )


def test_pdf_generation_service_requires_supabase_configuration(tmp_path: Path) -> None:
    export_path = tmp_path / "generated-deck.pptx"
    export_path.write_bytes(b"pptx")
    service = PdfGenerationService(
        FakeContentGenerationService(_build_generated_content()),
        FakeSupabaseService(plan_type="pro", configured=False),
        FakePptxService(export_path),
        PlanService(),
    )

    with pytest.raises(PdfGenerationConfigurationError):
        service.generate_from_pdf(
            _build_request(),
            pdf_bytes=b"%PDF-1.4 fake",
        )


def _build_generated_content() -> GeneratedPresentationContent:
    return GeneratedPresentationContent(
        presentation_title="Report Summary",
        slides=[
            PresentationSlide(
                title="Overview",
                bullets=["Point A", "Point B"],
                speaker_notes="Notes long enough to satisfy the structured response schema.",
            ),
            PresentationSlide(
                title="Findings",
                bullets=["Point C", "Point D"],
                speaker_notes="Second notes block that remains valid for the fake response.",
            ),
            PresentationSlide(
                title="Recommendations",
                bullets=["Point E", "Point F"],
                speaker_notes="Final notes block that keeps the fake response valid.",
            ),
        ],
    )


def _build_request() -> GenerateFromPdfRequest:
    return GenerateFromPdfRequest(
        source_filename="report.pdf",
        user_id="4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e",
        slide_count=3,
        template_id="boardroom_luxe",
    )
