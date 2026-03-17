from app.config.settings import Settings
from app.utils.runtime import is_secret_configured


class SupabaseService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return bool(self.settings.supabase_url) and is_secret_configured(
            self.settings.supabase_service_role_key
        )

    def readiness_detail(self) -> str:
        if self.is_configured():
            return "Supabase URL and service role key are configured."
        return "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable persistence."

    def get_client(self):
        if not self.is_configured():
            raise RuntimeError("Supabase is not configured.")

        from supabase import create_client

        return create_client(
            self.settings.supabase_url,
            self.settings.supabase_service_role_key.get_secret_value(),
        )
