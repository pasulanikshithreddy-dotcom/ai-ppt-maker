from __future__ import annotations

from datetime import UTC, datetime

from app.schemas.user import AuthenticatedUserContext, CurrentUser
from app.services.plan_service import PlanService
from app.services.supabase_service import SupabaseService


class ProfileService:
    def __init__(
        self,
        supabase_service: SupabaseService,
        plan_service: PlanService,
    ) -> None:
        self.supabase_service = supabase_service
        self.plan_service = plan_service

    def get_current_user(self, user: AuthenticatedUserContext) -> CurrentUser:
        return CurrentUser(
            id=user.id,
            email=user.email,
            name=user.full_name,
            authenticated=True,
            plan_code=user.plan_code,
            credits_remaining=self._get_credits_remaining(user),
            created_at=user.profile.created_at,
        )

    def _get_credits_remaining(self, user: AuthenticatedUserContext) -> int | None:
        if self.plan_service.is_paid_plan(user.plan_code):
            return None

        usage_log = self.supabase_service.get_usage_log_for_day(
            user_id=user.id,
            action="generate_topic",
            usage_date=datetime.now(UTC).date(),
        )
        if usage_log is None:
            return 3
        return max(usage_log.free_limit - usage_log.request_count, 0)
