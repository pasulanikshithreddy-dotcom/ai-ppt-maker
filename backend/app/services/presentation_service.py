from typing import ClassVar

from app.config.settings import Settings
from app.models.presentation import PresentationRecord, PresentationSource, PresentationStatus
from app.schemas.presentation import (
    GenerateFromNotesRequest,
    GenerateFromPdfRequest,
    GenerationResult,
    PresentationDetail,
    PresentationListData,
    PresentationSummary,
)
from app.services.openai_service import OpenAIService
from app.services.pptx_service import PptxService
from app.services.supabase_service import SupabaseService


class PresentationService:
    _presentations: ClassVar[dict[str, PresentationRecord]] = {}
    _seeded: ClassVar[bool] = False

    def __init__(
        self,
        settings: Settings,
        openai_service: OpenAIService,
        supabase_service: SupabaseService,
        pptx_service: PptxService,
    ) -> None:
        self.settings = settings
        self.openai_service = openai_service
        self.supabase_service = supabase_service
        self.pptx_service = pptx_service
        self._seed_presentations()

    def list_presentations(self) -> PresentationListData:
        items = [self._to_summary(record) for record in self._sorted_presentations()]
        return PresentationListData(items=items, total=len(items))

    def get_presentation(self, presentation_id: str) -> PresentationDetail | None:
        record = self._presentations.get(presentation_id)
        if record is None:
            return None
        return self._to_detail(record)

    def generate_from_notes(self, payload: GenerateFromNotesRequest) -> GenerationResult:
        note_lines = [line.strip() for line in payload.notes.splitlines() if line.strip()]
        preview = note_lines[:4] if note_lines else ["Imported notes", "Auto-generated structure"]
        record = self._create_presentation(
            title=payload.title or "Notes to Slides",
            source_type=PresentationSource.NOTES,
            slide_count=payload.slide_count,
            template_id=payload.template_id,
            content_preview=preview,
            metadata={
                "notes_length": len(payload.notes),
                "openai_configured": self.openai_service.is_configured(),
            },
        )
        return GenerationResult(presentation=self._to_detail(record))

    def generate_from_pdf(self, payload: GenerateFromPdfRequest) -> GenerationResult:
        record = self._create_presentation(
            title=payload.title or "PDF to Deck",
            source_type=PresentationSource.PDF,
            slide_count=payload.slide_count,
            template_id=payload.template_id,
            content_preview=[
                "PDF overview",
                "Key takeaways",
                "Supporting insights",
                "Summary and recommendations",
            ],
            metadata={
                "pdf_url": payload.pdf_url,
                "pptx_ready": self.pptx_service.is_configured(),
            },
        )
        return GenerationResult(presentation=self._to_detail(record))

    def _create_presentation(
        self,
        *,
        title: str,
        source_type: PresentationSource,
        slide_count: int,
        template_id: str,
        content_preview: list[str],
        metadata: dict[str, object],
        status: PresentationStatus = PresentationStatus.QUEUED,
        plan_code: str = "free",
        watermark_applied: bool | None = None,
    ) -> PresentationRecord:
        resolved_watermark_applied = (
            watermark_applied
            if watermark_applied is not None
            else self.pptx_service.should_apply_watermark(plan_code)
        )
        record = PresentationRecord(
            title=title,
            source_type=source_type,
            slide_count=slide_count,
            template_id=template_id,
            status=status,
            watermark_applied=resolved_watermark_applied,
            content_preview=content_preview,
            metadata={
                **metadata,
                "supabase_configured": self.supabase_service.is_configured(),
                "output_dir": str(self.settings.generated_ppt_dir),
                "watermark_applied": resolved_watermark_applied,
            },
        )
        self._presentations[record.presentation_id] = record
        return record

    def _seed_presentations(self) -> None:
        if self._seeded:
            return

        self._create_presentation(
            title="AI PPT Maker Launch Plan",
            source_type=PresentationSource.SAMPLE,
            slide_count=12,
            template_id="starter",
            status=PresentationStatus.COMPLETED,
            content_preview=[
                "Problem and market context",
                "Product flow overview",
                "Launch milestones",
                "Success metrics",
            ],
            metadata={"seeded": True},
            watermark_applied=False,
        )
        self._create_presentation(
            title="Investor Update",
            source_type=PresentationSource.SAMPLE,
            slide_count=8,
            template_id="pitch",
            status=PresentationStatus.COMPLETED,
            content_preview=[
                "Revenue snapshot",
                "Product roadmap",
                "Team highlights",
                "Funding use of proceeds",
            ],
            metadata={"seeded": True},
            watermark_applied=False,
        )
        self.__class__._seeded = True

    @classmethod
    def _sorted_presentations(cls) -> list[PresentationRecord]:
        return sorted(
            cls._presentations.values(),
            key=lambda record: record.created_at,
            reverse=True,
        )

    @classmethod
    def register_record(cls, record: PresentationRecord) -> None:
        cls._presentations[record.presentation_id] = record

    @staticmethod
    def _to_summary(record: PresentationRecord) -> PresentationSummary:
        return PresentationSummary(
            id=record.presentation_id,
            title=record.title,
            source_type=record.source_type,
            status=record.status,
            slide_count=record.slide_count,
            watermark_applied=record.watermark_applied,
            created_at=record.created_at,
        )

    @staticmethod
    def _to_detail(record: PresentationRecord) -> PresentationDetail:
        return PresentationDetail(
            id=record.presentation_id,
            title=record.title,
            topic=record.topic,
            file_url=record.file_url,
            source_type=record.source_type,
            status=record.status,
            slide_count=record.slide_count,
            watermark_applied=record.watermark_applied,
            created_at=record.created_at,
            template_id=record.template_id,
            content_preview=record.content_preview,
            metadata=record.metadata,
        )
