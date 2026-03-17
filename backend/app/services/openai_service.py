from app.config.settings import Settings
from app.utils.runtime import is_secret_configured


class OpenAIService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return is_secret_configured(self.settings.openai_api_key)

    def readiness_detail(self) -> str:
        if self.is_configured():
            return f"Configured for model {self.settings.openai_model}."
        return "Set OPENAI_API_KEY to enable AI slide generation."

    def get_client(self):
        if not self.is_configured():
            raise RuntimeError("OpenAI is not configured.")

        from openai import OpenAI

        return OpenAI(api_key=self.settings.openai_api_key.get_secret_value())
