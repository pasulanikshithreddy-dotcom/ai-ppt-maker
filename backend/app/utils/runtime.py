from datetime import UTC, datetime
from uuid import uuid4

from pydantic import SecretStr


def utc_now() -> datetime:
    return datetime.now(UTC)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def is_secret_configured(secret: SecretStr | None) -> bool:
    return secret is not None and bool(secret.get_secret_value().strip())
