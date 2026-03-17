from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_health_service
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService

router = APIRouter()
HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]


@router.get("/health", response_model=HealthResponse, summary="Service health check")
async def health_check(
    health_service: HealthServiceDep,
) -> HealthResponse:
    return health_service.get_health()
