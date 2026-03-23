from __future__ import annotations

from app.schemas.plan import PlanFeature, PlanOverview, PlanSummary

PLAN_RANK = {
    "free": 0,
    "pro": 1,
    "team": 2,
}


class PlanAccessError(PermissionError):
    """Raised when a feature requires a higher plan tier."""


class PlanService:
    def get_plan_overview(
        self,
        *,
        current_plan_code: str,
        subscription_status: str | None = None,
    ) -> PlanOverview:
        resolved_plan = self.normalize_plan_code(current_plan_code)
        available_plans = [
            self._build_plan_summary("free", active=resolved_plan == "free"),
            self._build_plan_summary("pro", active=resolved_plan == "pro"),
            self._build_plan_summary("team", active=resolved_plan == "team"),
        ]
        current_plan = next(
            plan for plan in available_plans if plan.code == resolved_plan
        )
        return PlanOverview(
            current_plan=current_plan,
            available_plans=available_plans,
            is_paid=self.is_paid_plan(resolved_plan),
            subscription_status=subscription_status,
        )

    def normalize_plan_code(self, plan_code: str | None) -> str:
        normalized = (plan_code or "free").strip().lower()
        return normalized if normalized in PLAN_RANK else "free"

    def resolve_plan_code(
        self,
        user_plan_code: str | None,
        subscription_plan_code: str | None = None,
    ) -> str:
        resolved_user_plan = self.normalize_plan_code(user_plan_code)
        resolved_subscription_plan = self.normalize_plan_code(subscription_plan_code)
        if PLAN_RANK[resolved_subscription_plan] > PLAN_RANK[resolved_user_plan]:
            return resolved_subscription_plan
        return resolved_user_plan

    def is_paid_plan(self, plan_code: str | None) -> bool:
        return PLAN_RANK[self.normalize_plan_code(plan_code)] >= PLAN_RANK["pro"]

    def has_plan_access(
        self,
        current_plan_code: str | None,
        required_plan_code: str,
    ) -> bool:
        current_rank = PLAN_RANK[self.normalize_plan_code(current_plan_code)]
        required_rank = PLAN_RANK[self.normalize_plan_code(required_plan_code)]
        return current_rank >= required_rank

    def require_plan(
        self,
        current_plan_code: str | None,
        required_plan_code: str,
        *,
        feature_name: str,
    ) -> None:
        if self.has_plan_access(current_plan_code, required_plan_code):
            return

        required_plan = self.normalize_plan_code(required_plan_code).capitalize()
        raise PlanAccessError(f"{feature_name} is available only to {required_plan} users.")

    def _build_plan_summary(self, code: str, *, active: bool) -> PlanSummary:
        if code == "free":
            return PlanSummary(
                code="free",
                name="Free",
                price=0,
                currency="INR",
                billing_cycle="monthly",
                active=active,
                features=[
                    PlanFeature(key="slides", label="Up to 10 slides per deck", included=True),
                    PlanFeature(key="templates", label="Starter templates", included=True),
                    PlanFeature(key="exports", label="Basic PPT export", included=True),
                    PlanFeature(key="notes", label="Notes to PPT", included=False),
                    PlanFeature(key="pdf", label="PDF to PPT", included=False),
                ],
            )

        if code == "pro":
            return PlanSummary(
                code="pro",
                name="Pro",
                price=999,
                currency="INR",
                billing_cycle="monthly",
                active=active,
                features=[
                    PlanFeature(key="slides", label="Up to 30 slides per deck", included=True),
                    PlanFeature(key="templates", label="Premium templates", included=True),
                    PlanFeature(key="exports", label="Priority export queue", included=True),
                    PlanFeature(key="notes", label="Notes to PPT", included=True),
                    PlanFeature(key="pdf", label="PDF to PPT", included=True),
                ],
            )

        return PlanSummary(
            code="team",
            name="Team",
            price=2999,
            currency="INR",
            billing_cycle="monthly",
            active=active,
            features=[
                PlanFeature(key="slides", label="Shared workspace support", included=True),
                PlanFeature(key="templates", label="Brand templates", included=True),
                PlanFeature(key="exports", label="Higher generation quota", included=True),
                PlanFeature(key="notes", label="Notes to PPT", included=True),
                PlanFeature(key="pdf", label="PDF to PPT", included=True),
            ],
        )
