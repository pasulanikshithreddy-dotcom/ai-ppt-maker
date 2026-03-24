from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.router import api_router
from app.config.settings import Settings, get_settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    settings.generated_ppt_dir.mkdir(parents=True, exist_ok=True)
    settings.ppt_template_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Starting %s in %s mode", settings.app_name, settings.app_env)
    yield
    logger.info("Stopping %s", settings.app_name)


def create_application() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.app_debug)

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        debug=settings.app_debug,
        docs_url="/docs" if settings.docs_enabled else None,
        redoc_url="/redoc" if settings.docs_enabled else None,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        lifespan=lifespan,
    )

    configure_middleware(app, settings)
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "environment": settings.app_env,
            "version": __version__,
        }

    return app


def configure_middleware(app: FastAPI, settings: Settings) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
