from dataclasses import dataclass
from enum import StrEnum


class IntegrationName(StrEnum):
    OPENAI = "openai"
    SUPABASE = "supabase"
    PYTHON_PPTX = "python-pptx"


@dataclass(slots=True, frozen=True)
class IntegrationStatus:
    name: IntegrationName
    configured: bool
    detail: str
