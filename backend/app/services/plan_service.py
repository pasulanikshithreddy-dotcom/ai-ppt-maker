from app.schemas.plan import PlanFeature, PlanOverview, PlanSummary


class PlanService:
    def get_plan_overview(self) -> PlanOverview:
        free_plan = PlanSummary(
            code="free",
            name="Free",
            price=0,
            currency="INR",
            billing_cycle="monthly",
            active=True,
            features=[
                PlanFeature(key="slides", label="Up to 10 slides per deck", included=True),
                PlanFeature(key="templates", label="Starter templates", included=True),
                PlanFeature(key="exports", label="Basic PPT export", included=True),
            ],
        )
        pro_plan = PlanSummary(
            code="pro",
            name="Pro",
            price=999,
            currency="INR",
            billing_cycle="monthly",
            features=[
                PlanFeature(key="slides", label="Up to 30 slides per deck", included=True),
                PlanFeature(key="templates", label="Premium templates", included=True),
                PlanFeature(key="exports", label="Priority export queue", included=True),
            ],
        )
        team_plan = PlanSummary(
            code="team",
            name="Team",
            price=2999,
            currency="INR",
            billing_cycle="monthly",
            features=[
                PlanFeature(key="slides", label="Shared workspace support", included=True),
                PlanFeature(key="templates", label="Brand templates", included=True),
                PlanFeature(key="exports", label="Higher generation quota", included=True),
            ],
        )

        return PlanOverview(
            current_plan=free_plan,
            available_plans=[free_plan, pro_plan, team_plan],
        )
