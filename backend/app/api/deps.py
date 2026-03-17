from typing import Annotated

from fastapi import Depends

from app.config.settings import Settings, get_settings
from app.services.health_service import HealthService
from app.services.openai_service import OpenAIService
from app.services.pptx_service import PptxService
from app.services.presentation_service import PresentationService
from app.services.supabase_service import SupabaseService

SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_openai_service(settings: SettingsDep) -> OpenAIService:
    return OpenAIService(settings)


def get_supabase_service(settings: SettingsDep) -> SupabaseService:
    return SupabaseService(settings)


def get_pptx_service(settings: SettingsDep) -> PptxService:
    return PptxService(settings)


def get_health_service(settings: SettingsDep) -> HealthService:
    return HealthService(settings)


def get_presentation_service(settings: SettingsDep) -> PresentationService:
    return PresentationService(
        settings=settings,
        openai_service=OpenAIService(settings),
        supabase_service=SupabaseService(settings),
        pptx_service=PptxService(settings),
    )
