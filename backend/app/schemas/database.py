from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class UserRow(BaseModel):
    id: UUID
    email: str | None = None
    full_name: str | None = None
    plan_type: str
    created_at: datetime
    updated_at: datetime


class TemplateRow(BaseModel):
    id: UUID
    slug: str
    name: str
    description: str | None = None
    config: dict[str, Any] = Field(default_factory=dict)
    is_pro_only: bool = False
    is_active: bool = True
    preview_image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class PresentationRow(BaseModel):
    id: UUID
    user_id: UUID
    template_id: UUID | None = None
    mode: str
    status: str
    topic: str | None = None
    content: dict[str, Any] | list[Any] = Field(default_factory=dict)
    file_url: str | None = None
    has_watermark: bool = False
    created_at: datetime
    updated_at: datetime


class UsageLogRow(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    usage_date: date
    request_count: int
    free_limit: int
    metadata: dict[str, Any] = Field(default_factory=dict)
    last_used_at: datetime
    created_at: datetime
    updated_at: datetime


class SubscriptionRow(BaseModel):
    id: UUID
    user_id: UUID
    plan_type: str
    provider: str
    provider_customer_id: str | None = None
    provider_subscription_id: str | None = None
    provider_order_id: str | None = None
    payment_status: str
    subscription_status: str
    amount: int
    currency: str
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    created_at: datetime
    updated_at: datetime
