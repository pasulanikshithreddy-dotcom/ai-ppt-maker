from __future__ import annotations

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
    GenerateFromPdfRequest,
    GenerationResult,
    PresentationDetail,
)
from app.services.content_generation_service import (
    ContentGenerationConfigurationError,
    ContentGenerationError,
    ContentGenerationService,
)
from app.services.plan_service import PlanAccessError, PlanService
from app.services.pptx_service import PptxService, PptxTemplateNotFoundError
from app.services.presentation_service import PresentationService
from app.services.supabase_service import SupabaseService

MAX_MODEL_SOURCE_CHARACTERS = 18000
FILENAME_SAFE_PATTERN = re.compile(r"[^a-zA-Z0-9]+")
WHITESPACE_PATTERN = re.compile(r"[ \t]+")


class PdfGenerationConfigurationError(RuntimeError):
    """Raised when PDF-to-PPT generation is missing required services."""


class PdfGenerationPermissionError(PermissionError):
    """Raised when a user is not allowed to use PDF-to-PPT generation."""


class PdfGenerationNotFoundError(LookupError):
    """Raised when a required user or template cannot be found."""


class PdfGenerationError(RuntimeError):
    """Raised when PDF-to-PPT generation fails during processing."""


class PdfGenerationService:
    def __init__(
        self,
        content_generation_service: ContentGenerationService,
        supabase_service: SupabaseService,
        pptx_service: PptxService,
        plan_service: PlanService,
    ) -> None:
        self.content_generation_service = content_generation_service
        self.supabase_service = supabase_service
        self.pptx_service = pptx_service
        self.plan_service = plan_service

    def generate_from_pdf(
        self,
        payload: GenerateFromPdfRequest,
        *,
        pdf_bytes: bytes,
    ) -> GenerationResult:
        if not self.supabase_service.is_configured():
            raise PdfGenerationConfigurationError(
                "Supabase is not configured for PDF-to-PPT generation."
            )

        if not pdf_bytes:
            raise PdfGenerationError("Uploaded PDF was empty.")

        user = self.supabase_service.get_user_by_id(payload.user_id)
        if user is None:
            raise PdfGenerationNotFoundError("User not found.")

        try:
            self.plan_service.require_plan(
                user.plan_type,
                "pro",
                feature_name="PDF to PPT",
            )
        except PlanAccessError as exc:
            raise PdfGenerationPermissionError(str(exc)) from exc

        template_definition = self.pptx_service.get_template_definition(payload.template_id)
        if template_definition is None:
            raise PdfGenerationNotFoundError("Selected template was not found.")

        presentation_id = uuid4()
        source_filename = payload.source_filename or "uploaded.pdf"
        source_pdf_path = self._build_storage_path(
            user_id=payload.user_id,
            presentation_id=presentation_id,
            folder="source",
            file_name=source_filename,
        )
        generated_ppt_storage_path: str | None = None

        try:
            source_pdf_url = self.supabase_service.upload_file_bytes(
                file_bytes=pdf_bytes,
                storage_path=source_pdf_path,
                content_type="application/pdf",
            )
            extracted_text = self.extract_text_from_pdf(pdf_bytes)
            prepared_text = self._prepare_text_for_model(extracted_text)
            content = self.content_generation_service.generate_pdf_presentation(
                extracted_text=prepared_text,
                slide_count=payload.slide_count,
                source_name=source_filename,
            )
            watermark_applied = self.pptx_service.should_apply_watermark(user.plan_type)
            local_pptx_path = self.pptx_service.export_presentation(
                content,
                template_id=payload.template_id,
                file_stem=content.presentation_title,
                user_plan=user.plan_type,
            )
            generated_ppt_storage_path = self._build_storage_path(
                user_id=payload.user_id,
                presentation_id=presentation_id,
                folder="generated",
                file_name=local_pptx_path.name,
            )
            generated_ppt_url = self.supabase_service.upload_presentation_file(
                local_path=local_pptx_path,
                storage_path=generated_ppt_storage_path,
            )
            template_row = self.supabase_service.get_template_by_slug(payload.template_id)
            persisted_metadata = {
                "source_pdf_url": source_pdf_url,
                "source_pdf_path": source_pdf_path,
                "source_filename": source_filename,
                "generated_pptx_path": generated_ppt_storage_path,
                "local_pptx_path": str(local_pptx_path),
                "extracted_text_length": len(extracted_text),
                "requested_template_id": payload.template_id,
                "template_name": template_definition.name,
                "template_linked_in_db": template_row is not None,
            }
            saved_presentation = self.supabase_service.create_presentation(
                PresentationInsert(
                    id=presentation_id,
                    user_id=UUID(str(user.id)),
                    template_id=template_row.id if template_row is not None else None,
                    mode="pdf",
                    status="completed",
                    topic=self._derive_topic_from_filename(source_filename),
                    content=content.model_dump(mode="json"),
                    file_url=generated_ppt_url,
                    watermark_applied=watermark_applied,
                    metadata=persisted_metadata,
                )
            )
        except ContentGenerationConfigurationError as exc:
            self.supabase_service.delete_presentation_file(source_pdf_path)
            raise PdfGenerationConfigurationError(str(exc)) from exc
        except (ContentGenerationError, PptxTemplateNotFoundError) as exc:
            self._cleanup_storage(source_pdf_path, generated_ppt_storage_path)
            raise PdfGenerationError(str(exc)) from exc
        except PdfGenerationConfigurationError:
            self._cleanup_storage(source_pdf_path, generated_ppt_storage_path)
            raise
        except Exception as exc:  # pragma: no cover - defensive workflow boundary
            self._cleanup_storage(source_pdf_path, generated_ppt_storage_path)
            raise PdfGenerationError("PDF to PPT generation failed.") from exc

        detail = self._build_presentation_detail(
            presentation_id=str(saved_presentation.id),
            created_at=saved_presentation.created_at,
            title=content.presentation_title,
            topic=self._derive_topic_from_filename(source_filename),
            file_url=generated_ppt_url,
            slide_count=len(content.slides),
            template_id=payload.template_id,
            template_name=template_definition.name,
            watermark_applied=watermark_applied,
            content_preview=[slide.title for slide in content.slides[:4]],
            metadata=persisted_metadata,
        )
        self._register_presentation(detail)

        return GenerationResult(
            queued=False,
            presentation=detail,
            content=content,
        )

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        try:
            import fitz
        except ImportError as exc:  # pragma: no cover - depends on local env
            raise PdfGenerationConfigurationError(
                "PyMuPDF is not installed for PDF processing."
            ) from exc

        try:
            document = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as exc:
            raise PdfGenerationError("Failed to read the uploaded PDF.") from exc

        try:
            page_texts: list[str] = []
            for page in document:
                text = page.get_text("text").strip()
                if text:
                    page_texts.append(text)
        finally:
            document.close()

        extracted_text = "\n\n".join(page_texts)
        normalized = self._normalize_extracted_text(extracted_text)
        if len(normalized) < 40:
            raise PdfGenerationError("Could not extract enough readable text from the PDF.")
        return normalized

    @staticmethod
    def _normalize_extracted_text(text: str) -> str:
        normalized_lines: list[str] = []
        for raw_line in unicodedata.normalize("NFKC", text).splitlines():
            line = WHITESPACE_PATTERN.sub(" ", raw_line).strip()
            if not line:
                if normalized_lines and normalized_lines[-1] != "":
                    normalized_lines.append("")
                continue
            normalized_lines.append(line)
        return "\n".join(normalized_lines).strip()

    @staticmethod
    def _prepare_text_for_model(text: str) -> str:
        if len(text) <= MAX_MODEL_SOURCE_CHARACTERS:
            return text
        return text[:MAX_MODEL_SOURCE_CHARACTERS].rstrip()

    @staticmethod
    def _sanitize_filename(file_name: str) -> str:
        original = Path(file_name)
        stem = FILENAME_SAFE_PATTERN.sub("-", original.stem.lower()).strip("-")
        safe_stem = stem[:60] or "uploaded-document"
        suffix = original.suffix.lower() if original.suffix else ""
        return f"{safe_stem}{suffix}" if suffix else safe_stem

    def _build_storage_path(
        self,
        *,
        user_id: str,
        presentation_id: UUID,
        folder: str,
        file_name: str,
    ) -> str:
        return (
            f"{user_id}/pdf/{presentation_id}/{folder}/"
            f"{self._sanitize_filename(file_name)}"
        )

    @staticmethod
    def _derive_topic_from_filename(file_name: str) -> str:
        stem = Path(file_name).stem.replace("-", " ").replace("_", " ").strip()
        return stem or "Uploaded PDF"

    def _cleanup_storage(
        self,
        source_pdf_path: str | None,
        generated_ppt_storage_path: str | None,
    ) -> None:
        for storage_path in (generated_ppt_storage_path, source_pdf_path):
            if not storage_path:
                continue
            try:
                self.supabase_service.delete_presentation_file(storage_path)
            except Exception:  # pragma: no cover - best effort cleanup
                continue

    @staticmethod
    def _build_presentation_detail(
        *,
        presentation_id: str,
        created_at,
        title: str,
        topic: str,
        file_url: str,
        slide_count: int,
        template_id: str,
        template_name: str,
        watermark_applied: bool,
        content_preview: list[str],
        metadata: dict[str, object],
    ) -> PresentationDetail:
        return PresentationDetail(
            id=presentation_id,
            title=title,
            topic=topic,
            file_url=file_url,
            source_type=PresentationSource.PDF,
            status=PresentationStatus.COMPLETED,
            slide_count=slide_count,
            watermark_applied=watermark_applied,
            created_at=created_at,
            template_id=template_id,
            template_name=template_name,
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
