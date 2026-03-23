from __future__ import annotations

import math
import re
import unicodedata
from pathlib import Path
from uuid import UUID, uuid4

from app.models.presentation import (
    PresentationRecord,
    PresentationSource,
    PresentationStatus,
)
from app.schemas.database import PresentationInsert
from app.schemas.presentation import (
    GenerateFromNotesRequest,
    GenerationResult,
    PresentationDetail,
)
from app.services.content_generation_service import (
    ContentGenerationConfigurationError,
    ContentGenerationError,
    ContentGenerationService,
)
from app.services.pptx_service import PptxService, PptxTemplateNotFoundError
from app.services.presentation_service import PresentationService
from app.services.supabase_service import SupabaseService

PRO_PLAN_CODES = {"pro", "team"}
BULLET_PREFIX_PATTERN = re.compile(r"^(?:[-*\u2022\u25AA\u25E6\u25CF]+|\d+[.)])\s*")
WHITESPACE_PATTERN = re.compile(r"[ \t]+")
SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?])\s+")


class NotesGenerationConfigurationError(RuntimeError):
    """Raised when notes-to-PPT generation is missing required services."""


class NotesGenerationPermissionError(PermissionError):
    """Raised when a user is not allowed to use notes-to-PPT generation."""


class NotesGenerationNotFoundError(LookupError):
    """Raised when a required user or template cannot be found."""


class NotesGenerationError(RuntimeError):
    """Raised when notes-to-PPT generation fails during processing."""


class NotesGenerationService:
    def __init__(
        self,
        content_generation_service: ContentGenerationService,
        supabase_service: SupabaseService,
        pptx_service: PptxService,
    ) -> None:
        self.content_generation_service = content_generation_service
        self.supabase_service = supabase_service
        self.pptx_service = pptx_service

    def generate_from_notes(self, payload: GenerateFromNotesRequest) -> GenerationResult:
        if not self.supabase_service.is_configured():
            raise NotesGenerationConfigurationError(
                "Supabase is not configured for notes-to-PPT generation."
            )

        user = self.supabase_service.get_user_by_id(payload.user_id)
        if user is None:
            raise NotesGenerationNotFoundError("User not found.")

        if user.plan_type.strip().lower() not in PRO_PLAN_CODES:
            raise NotesGenerationPermissionError(
                "Notes to PPT is available only to Pro users."
            )

        if self.pptx_service.get_template_definition(payload.template_id) is None:
            raise NotesGenerationNotFoundError("Selected template was not found.")

        normalized_notes = self.normalize_notes(payload.notes)
        sections = self.split_notes_into_sections(
            normalized_notes,
            target_section_count=payload.slide_count,
        )

        try:
            content = self.content_generation_service.generate_notes_presentation(
                normalized_notes=normalized_notes,
                sections=sections,
                slide_count=payload.slide_count,
                topic=payload.topic,
                title=payload.title,
            )
        except ContentGenerationConfigurationError as exc:
            raise NotesGenerationConfigurationError(str(exc)) from exc
        except (ContentGenerationError, RuntimeError) as exc:
            raise NotesGenerationError(
                "Failed to generate structured presentation content."
            ) from exc

        storage_presentation_id = uuid4()
        topic = payload.topic or payload.title or content.presentation_title
        watermark_applied = self.pptx_service.should_apply_watermark(user.plan_type)

        try:
            local_path = self.pptx_service.export_presentation(
                content,
                template_id=payload.template_id,
                file_stem=content.presentation_title,
                user_plan=user.plan_type,
            )
        except PptxTemplateNotFoundError as exc:
            raise NotesGenerationNotFoundError("Selected template was not found.") from exc
        except Exception as exc:  # pragma: no cover - defensive export boundary
            raise NotesGenerationError("Failed to generate the PowerPoint file.") from exc

        storage_path = self._build_storage_path(
            user_id=payload.user_id,
            presentation_id=storage_presentation_id,
            local_path=local_path,
        )

        try:
            file_url = self.supabase_service.upload_presentation_file(
                local_path=local_path,
                storage_path=storage_path,
            )
        except Exception as exc:  # pragma: no cover - defensive storage boundary
            raise NotesGenerationError("Failed to upload the generated PowerPoint file.") from exc

        try:
            template_row = self.supabase_service.get_template_by_slug(payload.template_id)
            saved_presentation = self.supabase_service.create_presentation(
                PresentationInsert(
                    id=storage_presentation_id,
                    user_id=UUID(str(user.id)),
                    template_id=template_row.id if template_row is not None else None,
                    mode="notes",
                    status="completed",
                    topic=topic,
                    content=content.model_dump(mode="json"),
                    file_url=file_url,
                    watermark_applied=watermark_applied,
                )
            )
        except Exception as exc:  # pragma: no cover - defensive persistence boundary
            self.supabase_service.delete_presentation_file(storage_path)
            raise NotesGenerationError("Failed to save presentation metadata.") from exc

        detail = self._build_presentation_detail(
            presentation_id=str(saved_presentation.id),
            created_at=saved_presentation.created_at,
            title=content.presentation_title,
            topic=topic,
            file_url=file_url,
            slide_count=len(content.slides),
            template_id=payload.template_id,
            watermark_applied=watermark_applied,
            content_preview=[slide.title for slide in content.slides[:4]],
            metadata={
                "local_file_path": str(local_path),
                "storage_path": storage_path,
                "sections_count": len(sections),
                "normalized_notes_length": len(normalized_notes),
                "template_linked_in_db": template_row is not None,
            },
        )
        self._register_presentation(detail)

        return GenerationResult(
            queued=False,
            presentation=detail,
            content=content,
        )

    def normalize_notes(self, notes: str) -> str:
        normalized_lines: list[str] = []
        for raw_line in unicodedata.normalize("NFKC", notes).splitlines():
            line = raw_line.strip()
            if not line:
                if normalized_lines and normalized_lines[-1] != "":
                    normalized_lines.append("")
                continue

            bullet_line = BULLET_PREFIX_PATTERN.sub("- ", line)
            compact_line = WHITESPACE_PATTERN.sub(" ", bullet_line).strip()
            normalized_lines.append(compact_line)

        return "\n".join(normalized_lines).strip()

    def split_notes_into_sections(
        self,
        normalized_notes: str,
        *,
        target_section_count: int,
    ) -> list[str]:
        blocks = [block.strip() for block in normalized_notes.split("\n\n") if block.strip()]
        sections: list[str] = []
        for block in blocks:
            lines = [line.strip() for line in block.splitlines() if line.strip()]
            if not lines:
                continue

            current_lines: list[str] = []
            for line in lines:
                is_heading = (
                    line.endswith(":")
                    and not line.startswith("- ")
                    and len(line) <= 90
                )
                if is_heading and current_lines:
                    sections.append("\n".join(current_lines))
                    current_lines = [line]
                    continue
                current_lines.append(line)

            if current_lines:
                sections.append("\n".join(current_lines))

        minimum_sections = min(target_section_count, 3)
        if len(sections) >= minimum_sections:
            return sections

        flat_text = normalized_notes.replace("\n", " ")
        sentences = [
            item.strip()
            for item in SENTENCE_SPLIT_PATTERN.split(flat_text)
            if item.strip()
        ]
        if not sentences:
            return [normalized_notes]

        chunk_size = max(1, math.ceil(len(sentences) / max(target_section_count, 1)))
        fallback_sections = [
            " ".join(sentences[index : index + chunk_size]).strip()
            for index in range(0, len(sentences), chunk_size)
        ]
        return fallback_sections or [normalized_notes]

    @staticmethod
    def _build_storage_path(
        *,
        user_id: str,
        presentation_id: UUID,
        local_path: Path,
    ) -> str:
        return f"{user_id}/notes/{presentation_id}/{local_path.name}"

    @staticmethod
    def _build_presentation_detail(
        *,
        presentation_id: str,
        created_at,
        title: str,
        topic: str | None,
        file_url: str,
        slide_count: int,
        template_id: str,
        watermark_applied: bool,
        content_preview: list[str],
        metadata: dict[str, object],
    ) -> PresentationDetail:
        return PresentationDetail(
            id=presentation_id,
            title=title,
            topic=topic,
            file_url=file_url,
            source_type=PresentationSource.NOTES,
            status=PresentationStatus.COMPLETED,
            slide_count=slide_count,
            watermark_applied=watermark_applied,
            created_at=created_at,
            template_id=template_id,
            content_preview=content_preview,
            metadata=metadata,
        )

    @staticmethod
    def _register_presentation(detail: PresentationDetail) -> None:
        PresentationService.register_record(
            PresentationRecord(
                title=detail.title,
                topic=detail.topic,
                file_url=detail.file_url,
                source_type=detail.source_type,
                slide_count=detail.slide_count,
                template_id=detail.template_id,
                presentation_id=detail.id,
                status=detail.status,
                watermark_applied=detail.watermark_applied,
                created_at=detail.created_at,
                content_preview=detail.content_preview,
                metadata=detail.metadata,
            )
        )
