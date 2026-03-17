from app import __version__
from app.config.settings import Settings
from app.models.integrations import IntegrationName, IntegrationStatus
from app.schemas.health import HealthResponse, IntegrationStatusResponse
from app.services.openai_service import OpenAIService
from app.services.pptx_service import PptxService
from app.services.supabase_service import SupabaseService
from app.utils.runtime import utc_now


class HealthService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.openai_service = OpenAIService(settings)
        self.supabase_service = SupabaseService(settings)
        self.pptx_service = PptxService(settings)

    def get_health(self) -> HealthResponse:
        integrations = [
            self._build_integration_status(
                IntegrationName.OPENAI,
                self.openai_service.is_configured(),
                self.openai_service.readiness_detail(),
            ),
            self._build_integration_status(
                IntegrationName.SUPABASE,
                self.supabase_service.is_configured(),
                self.supabase_service.readiness_detail(),
            ),
            self._build_integration_status(
                IntegrationName.PYTHON_PPTX,
                self.pptx_service.is_configured(),
                self.pptx_service.readiness_detail(),
            ),
        ]

        return HealthResponse(
            environment=self.settings.app_env,
            version=__version__,
            timestamp=utc_now(),
            integrations=[
                IntegrationStatusResponse(
                    name=status.name.value,
                    configured=status.configured,
                    detail=status.detail,
                )
                for status in integrations
            ],
        )

    @staticmethod
    def _build_integration_status(
        name: IntegrationName,
        configured: bool,
        detail: str,
    ) -> IntegrationStatus:
        return IntegrationStatus(name=name, configured=configured, detail=detail)
