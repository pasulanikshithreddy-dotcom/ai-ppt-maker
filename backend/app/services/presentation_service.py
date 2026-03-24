from __future__ import annotations

from typing import Any, ClassVar

from app.config.settings import Settings
from app.models.presentation import PresentationRecord, PresentationSource, PresentationStatus
from app.schemas.database import PresentationRow
from app.schemas.presentation import PresentationDetail, PresentationListData, PresentationSummary
from app.services.openai_service import OpenAIService
from app.services.pptx_service import PptxService
from app.services.supabase_service import SupabaseService


class PresentationService:
    _presentations: ClassVar[dict[str, PresentationRecord]] = {}

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

    def list_presentations(self, *, user_id: str) -> PresentationListData:
        if self.supabase_service.is_configured():
            rows = self.supabase_service.list_presentations(user_id=user_id)
            items = [self._row_to_summary(row) for row in rows]
            return PresentationListData(items=items, total=len(items))

        items = [
            self._record_to_summary(record)
            for record in self._sorted_presentations()
        ]
        return PresentationListData(items=items, total=len(items))

    def get_presentation(
        self,
        presentation_id: str,
        *,
        user_id: str,
    ) -> PresentationDetail | None:
        if self.supabase_service.is_configured():
            row = self.supabase_service.get_presentation_by_id(
                presentation_id,
                user_id=user_id,
            )
            if row is None:
                return None
            return self._row_to_detail(row)

        record = self._presentations.get(presentation_id)
        if record is None:
            return None
        return self._record_to_detail(record)

    @classmethod
    def register_record(cls, record: PresentationRecord) -> None:
        cls._presentations[record.presentation_id] = record

    @classmethod
    def _sorted_presentations(cls) -> list[PresentationRecord]:
        return sorted(
            cls._presentations.values(),
            key=lambda record: record.created_at,
            reverse=True,
        )

    def _row_to_summary(self, row: PresentationRow) -> PresentationSummary:
        preview = self._extract_content_preview(row.content)
        template_id = self._resolve_requested_template_id(row.metadata)
        return PresentationSummary(
            id=str(row.id),
            title=self._resolve_title(row),
            topic=row.topic,
            source_type=PresentationSource(row.mode),
            status=PresentationStatus(row.status),
            slide_count=self._extract_slide_count(row.content),
            template_id=template_id,
            template_name=self._resolve_template_name(row.metadata, template_id),
            file_url=row.file_url,
            watermark_applied=row.watermark_applied,
            created_at=row.created_at,
            content_preview=preview,
        )

    def _row_to_detail(self, row: PresentationRow) -> PresentationDetail:
        summary = self._row_to_summary(row)
        return PresentationDetail(
            **summary.model_dump(),
            metadata=row.metadata,
        )

    def _record_to_summary(self, record: PresentationRecord) -> PresentationSummary:
        template_id = record.template_id
        return PresentationSummary(
            id=record.presentation_id,
            title=record.title,
            topic=record.topic,
            source_type=record.source_type,
            status=record.status,
            slide_count=record.slide_count,
            template_id=template_id,
            template_name=self._resolve_template_name(record.metadata, template_id),
            file_url=record.file_url,
            watermark_applied=record.watermark_applied,
            created_at=record.created_at,
            content_preview=record.content_preview,
        )

    def _record_to_detail(self, record: PresentationRecord) -> PresentationDetail:
        summary = self._record_to_summary(record)
        return PresentationDetail(
            **summary.model_dump(),
            metadata=record.metadata,
        )

    @staticmethod
    def _extract_content_preview(content: dict[str, Any] | list[Any]) -> list[str]:
        if not isinstance(content, dict):
            return []
        slides = content.get("slides")
        if not isinstance(slides, list):
            return []
        titles: list[str] = []
        for item in slides[:4]:
            if isinstance(item, dict):
                title = item.get("title")
                if isinstance(title, str) and title.strip():
                    titles.append(title.strip())
        return titles

    @staticmethod
    def _extract_slide_count(content: dict[str, Any] | list[Any]) -> int:
        if isinstance(content, dict):
            slides = content.get("slides")
            if isinstance(slides, list):
                return len(slides)
        if isinstance(content, list):
            return len(content)
        return 0

    @staticmethod
    def _resolve_requested_template_id(metadata: dict[str, Any]) -> str:
        requested_template = metadata.get("requested_template_id")
        if isinstance(requested_template, str) and requested_template.strip():
            return requested_template
        return "unknown"

    @staticmethod
    def _resolve_template_name(metadata: dict[str, Any], fallback_template_id: str) -> str:
        template_name = metadata.get("template_name")
        if isinstance(template_name, str) and template_name.strip():
            return template_name
        return fallback_template_id.replace("_", " ").title()

    @staticmethod
    def _resolve_title(row: PresentationRow) -> str:
        if isinstance(row.content, dict):
            title = row.content.get("presentation_title")
            if isinstance(title, str) and title.strip():
                return title
        if row.topic:
            return row.topic
        return "Generated Presentation"
