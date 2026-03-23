from pydantic import BaseModel


class PlanFeature(BaseModel):
    key: str
    label: str
    included: bool


class PlanSummary(BaseModel):
    code: str
    name: str
    price: int
    currency: str
    billing_cycle: str
    active: bool = False
    features: list[PlanFeature]


class PlanOverview(BaseModel):
    current_plan: PlanSummary
    available_plans: list[PlanSummary]
    is_paid: bool = False
    subscription_status: str | None = None
