from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.config.settings import Settings, get_settings
from app.schemas.user import AuthenticatedUserContext
from app.services.auth_service import (
    AuthConfigurationError,
    AuthenticationError,
    AuthService,
    AuthStateError,
)
from app.services.content_generation_service import ContentGenerationService
from app.services.health_service import HealthService
from app.services.notes_generation_service import NotesGenerationService
from app.services.openai_service import OpenAIService
from app.services.payment_service import PaymentService
from app.services.pdf_generation_service import PdfGenerationService
from app.services.plan_service import PlanService
from app.services.pptx_service import PptxService
from app.services.presentation_service import PresentationService
from app.services.profile_service import ProfileService
from app.services.supabase_service import SupabaseService
from app.services.template_service import TemplateService
from app.services.topic_generation_service import TopicGenerationService

SettingsDep = Annotated[Settings, Depends(get_settings)]


def _build_plan_service(settings: Settings) -> PlanService:
    return PlanService(
        free_topic_daily_limit=settings.free_topic_daily_limit,
        pro_monthly_price=max(settings.razorpay_pro_monthly_amount // 100, 1),
    )


def get_openai_service(settings: SettingsDep) -> OpenAIService:
    return OpenAIService(settings)


def get_supabase_service(settings: SettingsDep) -> SupabaseService:
    return SupabaseService(settings)


def get_pptx_service(settings: SettingsDep) -> PptxService:
    return PptxService(settings)


def get_health_service(settings: SettingsDep) -> HealthService:
    return HealthService(settings)


def get_plan_service(settings: SettingsDep) -> PlanService:
    return _build_plan_service(settings)


def get_auth_service(settings: SettingsDep) -> AuthService:
    return AuthService(
        supabase_service=SupabaseService(settings),
        plan_service=_build_plan_service(settings),
    )


def get_presentation_service(settings: SettingsDep) -> PresentationService:
    return PresentationService(
        settings=settings,
        openai_service=OpenAIService(settings),
        supabase_service=SupabaseService(settings),
        pptx_service=PptxService(settings),
    )


def get_content_generation_service(settings: SettingsDep) -> ContentGenerationService:
    return ContentGenerationService(OpenAIService(settings))


def get_notes_generation_service(settings: SettingsDep) -> NotesGenerationService:
    return NotesGenerationService(
        content_generation_service=ContentGenerationService(OpenAIService(settings)),
        supabase_service=SupabaseService(settings),
        pptx_service=PptxService(settings),
        plan_service=_build_plan_service(settings),
    )


def get_pdf_generation_service(settings: SettingsDep) -> PdfGenerationService:
    return PdfGenerationService(
        content_generation_service=ContentGenerationService(OpenAIService(settings)),
        supabase_service=SupabaseService(settings),
        pptx_service=PptxService(settings),
        plan_service=_build_plan_service(settings),
    )


def get_topic_generation_service(settings: SettingsDep) -> TopicGenerationService:
    return TopicGenerationService(
        content_generation_service=ContentGenerationService(OpenAIService(settings)),
        supabase_service=SupabaseService(settings),
        pptx_service=PptxService(settings),
        plan_service=_build_plan_service(settings),
    )


def get_template_service(settings: SettingsDep) -> TemplateService:
    return TemplateService(settings)


def get_profile_service(settings: SettingsDep) -> ProfileService:
    return ProfileService(
        supabase_service=SupabaseService(settings),
        plan_service=_build_plan_service(settings),
    )


def get_payment_service(settings: SettingsDep) -> PaymentService:
    return PaymentService(
        settings=settings,
        supabase_service=SupabaseService(settings),
        plan_service=_build_plan_service(settings),
    )


def get_access_token(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=401,
            detail="Authorization header must use a Bearer token.",
        )
    return token.strip()


def get_current_user_context(
    access_token: Annotated[str, Depends(get_access_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthenticatedUserContext:
    try:
        return auth_service.get_authenticated_user(access_token)
    except AuthConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except AuthStateError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
