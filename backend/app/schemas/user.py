from pydantic import BaseModel


class CurrentUser(BaseModel):
    id: str
    email: str | None = None
    name: str
    authenticated: bool
    plan_code: str
    credits_remaining: int
