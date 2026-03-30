from __future__ import annotations

from typing import TypeVar

from openai import AuthenticationError, OpenAIError, RateLimitError
from pydantic import BaseModel

from app.config.settings import Settings
from app.utils.runtime import is_secret_configured

StructuredResponseT = TypeVar("StructuredResponseT", bound=BaseModel)


class OpenAIServiceError(RuntimeError):
    """Raised when OpenAI cannot complete a request."""


class OpenAIServiceAuthenticationError(OpenAIServiceError):
    """Raised when the configured OpenAI API key is rejected."""


class OpenAIServiceRateLimitError(OpenAIServiceError):
    """Raised when the OpenAI project has no remaining quota or is rate limited."""


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

    def parse_chat_completion(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_format: type[StructuredResponseT],
        temperature: float = 0.7,
    ) -> StructuredResponseT:
        try:
            completion = self.get_client().chat.completions.parse(
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format=response_format,
                temperature=temperature,
            )
        except AuthenticationError as exc:
            raise OpenAIServiceAuthenticationError(
                "OpenAI authentication failed. Check OPENAI_API_KEY."
            ) from exc
        except RateLimitError as exc:
            raise OpenAIServiceRateLimitError(
                "OpenAI quota or rate limit was exceeded. Check billing and usage limits."
            ) from exc
        except OpenAIError as exc:
            raise OpenAIServiceError("OpenAI request failed.") from exc

        message = completion.choices[0].message
        if message.parsed is None:
            raise ValueError("OpenAI did not return a parsed structured response.")

        if isinstance(message.parsed, BaseModel):
            return response_format.model_validate(message.parsed.model_dump())
        return response_format.model_validate(message.parsed)
