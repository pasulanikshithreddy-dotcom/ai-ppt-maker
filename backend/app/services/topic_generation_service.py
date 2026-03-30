from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from app.models.presentation import (
    PresentationRecord,
    PresentationSource,
    PresentationStatus,
)
from app.schemas.content_generation import TopicToPptRequest
from app.schemas.database import PresentationInsert, UsageLogInsert
from app.schemas.presentation import (
    GenerateFromTopicRequest,
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
from app.utils.runtime import utc_now


class TopicGenerationConfigurationError(RuntimeError):
    """Raised when topic-to-PPT generation is missing required services."""


class TopicGenerationPermissionError(PermissionError):
    """Raised when a user is not allowed to use topic-to-PPT generation."""


class TopicGenerationLimitError(PermissionError):
    """Raised when a free user exceeds the daily topic generation limit."""


class TopicGenerationNotFoundError(LookupError):
    """Raised when a required user or template cannot be found."""


class TopicGenerationError(RuntimeError):
    """Raised when topic-to-PPT generation fails during processing."""


class TopicGenerationService:
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

    def generate_from_topic(self, payload: GenerateFromTopicRequest) -> GenerationResult:
        if not self.supabase_service.is_configured():
            raise TopicGenerationConfigurationError(
                "Supabase is not configured for topic-to-PPT generation."
            )

        user = self.supabase_service.get_user_by_id(payload.user_id)
        if user is None:
            raise TopicGenerationNotFoundError("User not found.")

        template_definition = self.pptx_service.get_template_definition(payload.template_id)
        if template_definition is None:
            raise TopicGenerationNotFoundError("Selected template was not found.")

        try:
            self.plan_service.require_template_access(
                user.plan_type,
                template_is_pro=template_definition.is_pro,
                template_name=template_definition.name,
            )
        except PlanAccessError as exc:
            raise TopicGenerationPermissionError(str(exc)) from exc

        usage_log = self._get_usage_log_for_today(payload.user_id)
        requests_used = usage_log.request_count if usage_log is not None else 0
        remaining_before_generation = self.plan_service.get_remaining_topic_generations(
            user.plan_type,
            requests_used,
        )
        if remaining_before_generation is not None and remaining_before_generation <= 0:
            raise TopicGenerationLimitError(
                "Free users can generate only three topic-based presentations per day."
            )

        try:
            content = self.content_generation_service.generate_topic_presentation(
                TopicToPptRequest(
                    topic=payload.topic,
                    subject=payload.subject,
                    slide_count=payload.slide_count,
                    tone=payload.tone,
                )
            )
        except ContentGenerationConfigurationError as exc:
            raise TopicGenerationConfigurationError(str(exc)) from exc
        except ContentGenerationError as exc:
            raise TopicGenerationError(str(exc)) from exc
        except RuntimeError as exc:
            raise TopicGenerationError(
                "Failed to generate structured presentation content."
            ) from exc

        storage_presentation_id = uuid4()
        watermark_applied = self.pptx_service.should_apply_watermark(user.plan_type)

        try:
            local_path = self.pptx_service.export_presentation(
                content,
                template_id=payload.template_id,
                file_stem=content.presentation_title,
                user_plan=user.plan_type,
            )
        except PptxTemplateNotFoundError as exc:
            raise TopicGenerationNotFoundError("Selected template was not found.") from exc
        except Exception as exc:  # pragma: no cover - defensive export boundary
            raise TopicGenerationError("Failed to generate the PowerPoint file.") from exc

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
            raise TopicGenerationError("Failed to upload the generated PowerPoint file.") from exc

        try:
            template_row = self.supabase_service.get_template_by_slug(payload.template_id)
            updated_usage_log = self._record_usage_log(
                payload.user_id,
                plan_code=user.plan_type,
                existing_usage_log=usage_log,
                template_id=payload.template_id,
            )
            remaining_after_generation = self.plan_service.get_remaining_topic_generations(
                user.plan_type,
                updated_usage_log.request_count if updated_usage_log is not None else requests_used,
            )
            persisted_metadata = {
                "local_file_path": str(local_path),
                "storage_path": storage_path,
                "requested_template_id": payload.template_id,
                "template_name": template_definition.name,
                "subject": payload.subject,
                "tone": payload.tone,
                "remaining_topic_generations": remaining_after_generation,
                "template_linked_in_db": template_row is not None,
            }
            saved_presentation = self.supabase_service.create_presentation(
                PresentationInsert(
                    id=storage_presentation_id,
                    user_id=UUID(str(user.id)),
                    template_id=template_row.id if template_row is not None else None,
                    mode="topic",
                    status="completed",
                    topic=payload.topic,
                    content=content.model_dump(mode="json"),
                    file_url=file_url,
                    watermark_applied=watermark_applied,
                    metadata=persisted_metadata,
                )
            )
        except Exception as exc:  # pragma: no cover - defensive persistence boundary
            self.supabase_service.delete_presentation_file(storage_path)
            raise TopicGenerationError("Failed to save presentation metadata.") from exc

        detail = self._build_presentation_detail(
            presentation_id=str(saved_presentation.id),
            created_at=saved_presentation.created_at,
            title=content.presentation_title,
            topic=payload.topic,
            file_url=file_url,
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

    def _get_usage_log_for_today(self, user_id: str):
        return self.supabase_service.get_usage_log_for_day(
            user_id=user_id,
            action="generate_topic",
            usage_date=datetime.now(UTC).date(),
        )

    def _record_usage_log(
        self,
        user_id: str,
        *,
        plan_code: str,
        existing_usage_log,
        template_id: str,
    ):
        daily_limit = self.plan_service.get_topic_daily_limit(plan_code)
        if daily_limit is None:
            return existing_usage_log

        if existing_usage_log is None:
            return self.supabase_service.create_usage_log(
                UsageLogInsert(
                    user_id=UUID(user_id),
                    action="generate_topic",
                    usage_date=datetime.now(UTC).date(),
                    request_count=1,
                    free_limit=daily_limit,
                    metadata={"last_template_id": template_id},
                )
            )

        merged_metadata = {
            **existing_usage_log.metadata,
            "last_template_id": template_id,
        }
        return self.supabase_service.update_usage_log(
            str(existing_usage_log.id),
            {
                "request_count": existing_usage_log.request_count + 1,
                "metadata": merged_metadata,
                "last_used_at": utc_now().isoformat(),
            },
        )

    @staticmethod
    def _build_storage_path(
        *,
        user_id: str,
        presentation_id: UUID,
        local_path: Path,
    ) -> str:
        return f"{user_id}/topic/{presentation_id}/{local_path.name}"

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
            source_type=PresentationSource.TOPIC,
            status=PresentationStatus.COMPLETED,
            slide_count=slide_count,
            template_id=template_id,
            template_name=template_name,
            watermark_applied=watermark_applied,
            created_at=created_at,
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
