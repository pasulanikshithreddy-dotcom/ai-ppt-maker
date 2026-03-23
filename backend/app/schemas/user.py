from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.database import SubscriptionRow, UserRow


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    name: str | None = None
    authenticated: bool = True
    plan_code: str
    credits_remaining: int | None = None
    created_at: datetime | None = None


class AuthProviderUser(BaseModel):
    id: str
    email: str | None = None
    full_name: str | None = None
    user_metadata: dict[str, Any] = Field(default_factory=dict)
    app_metadata: dict[str, Any] = Field(default_factory=dict)


class AuthenticatedUserContext(BaseModel):
    id: str
    email: str | None = None
    full_name: str | None = None
    plan_code: str
    profile: UserRow
    subscription: SubscriptionRow | None = None
