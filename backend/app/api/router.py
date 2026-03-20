from fastapi import APIRouter

from app.api.routes.generate import router as generate_router
from app.api.routes.health import router as health_router
from app.api.routes.me import router as me_router
from app.api.routes.payments import router as payments_router
from app.api.routes.plan import router as plan_router
from app.api.routes.presentations import router as presentations_router
from app.api.routes.templates import router as templates_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(templates_router, tags=["templates"])
api_router.include_router(me_router, tags=["profile"])
api_router.include_router(plan_router, tags=["plan"])
api_router.include_router(presentations_router, tags=["presentations"])
api_router.include_router(generate_router, tags=["generation"])
api_router.include_router(payments_router, tags=["payments"])
