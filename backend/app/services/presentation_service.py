from app.config.settings import Settings
from app.models.presentation import PresentationJob
from app.schemas.presentation import PresentationCreateRequest, PresentationJobResponse
from app.services.openai_service import OpenAIService
from app.services.pptx_service import PptxService
from app.services.supabase_service import SupabaseService


class PresentationService:
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

    def prepare_generation_job(
        self,
        payload: PresentationCreateRequest,
    ) -> PresentationJobResponse:
        job = PresentationJob(
            prompt=payload.prompt,
            title=payload.title,
            slide_count=payload.slide_count,
            metadata={
                "openai_configured": self.openai_service.is_configured(),
                "supabase_configured": self.supabase_service.is_configured(),
                "output_dir": str(self.settings.generated_ppt_dir),
            },
        )

        return self._to_response(job)

    @staticmethod
    def _to_response(job: PresentationJob) -> PresentationJobResponse:
        return PresentationJobResponse(
            job_id=job.job_id,
            status=job.status,
            created_at=job.created_at,
            metadata=job.metadata,
        )
