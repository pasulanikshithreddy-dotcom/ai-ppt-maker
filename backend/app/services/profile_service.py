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
        credits_remaining = self._get_credits_remaining(user)
        return CurrentUser(
            id=user.id,
            email=user.email,
            name=user.full_name,
            authenticated=True,
            plan_code=user.plan_code,
            can_use_pro_features=self.plan_service.is_paid_plan(user.plan_code),
            credits_remaining=credits_remaining,
            daily_topic_limit=self.plan_service.get_topic_daily_limit(user.plan_code),
            created_at=user.profile.created_at,
        )

    def _get_credits_remaining(self, user: AuthenticatedUserContext) -> int | None:
        if self.plan_service.is_paid_plan(user.plan_code):
            return None

        daily_limit = self.plan_service.get_topic_daily_limit(user.plan_code)
        if daily_limit is None:
            return None
        if not self.supabase_service.is_configured():
            return daily_limit

        usage_log = self.supabase_service.get_usage_log_for_day(
            user_id=user.id,
            action="generate_topic",
            usage_date=datetime.now(UTC).date(),
        )
        if usage_log is None:
            return daily_limit
        return max(usage_log.free_limit - usage_log.request_count, 0)
