from app.schemas.user import CurrentUser


class ProfileService:
    def get_current_user(self) -> CurrentUser:
        return CurrentUser(
            id="user_guest",
            email=None,
            name="Guest User",
            authenticated=False,
            plan_code="free",
            credits_remaining=3,
        )
