from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class IntegrationStatusResponse(BaseModel):
    name: str
    configured: bool = Field(
        description="Whether this integration has enough configuration to start."
    )
    detail: str


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    environment: str
    version: str
    timestamp: datetime
    integrations: list[IntegrationStatusResponse]
