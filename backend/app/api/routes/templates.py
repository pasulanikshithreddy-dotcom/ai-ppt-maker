from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_template_service
from app.schemas.common import ApiResponse
from app.schemas.template import TemplateListData
from app.services.template_service import TemplateService

router = APIRouter()
TemplateServiceDep = Annotated[TemplateService, Depends(get_template_service)]


@router.get("/templates", response_model=ApiResponse[TemplateListData], summary="List templates")
async def list_templates(
    template_service: TemplateServiceDep,
) -> ApiResponse[TemplateListData]:
    return ApiResponse(
        message="Templates fetched successfully.",
        data=template_service.list_templates(),
    )
