from __future__ import annotations

from collections.abc import Mapping
from typing import Any
from uuid import UUID

from app.schemas.database import UserProfileInsert
from app.schemas.user import AuthenticatedUserContext, AuthProviderUser
from app.services.plan_service import PlanService
from app.services.supabase_service import SupabaseService


class AuthConfigurationError(RuntimeError):
    """Raised when authenticated requests cannot be processed safely."""


class AuthenticationError(PermissionError):
    """Raised when a request cannot be associated with a valid Supabase user."""


class AuthStateError(RuntimeError):
    """Raised when user profile state cannot be synchronized."""


class AuthService:
    def __init__(
        self,
        supabase_service: SupabaseService,
        plan_service: PlanService,
    ) -> None:
        self.supabase_service = supabase_service
        self.plan_service = plan_service

    def get_authenticated_user(self, access_token: str) -> AuthenticatedUserContext:
        if not self.supabase_service.is_configured():
            raise AuthConfigurationError(
                "Supabase is not configured for authenticated user requests."
            )

        auth_user = self._get_supabase_auth_user(access_token)
        profile = self._ensure_user_profile(auth_user)
        subscription = self.supabase_service.get_active_subscription(user_id=auth_user.id)
        plan_code = self.plan_service.resolve_plan_code(
            profile.plan_type,
            subscription.plan_type if subscription is not None else None,
        )

        return AuthenticatedUserContext(
            id=str(profile.id),
            email=profile.email or auth_user.email,
            full_name=profile.full_name or auth_user.full_name,
            plan_code=plan_code,
            profile=profile,
            subscription=subscription,
        )

    def _get_supabase_auth_user(self, access_token: str) -> AuthProviderUser:
        if not access_token.strip():
            raise AuthenticationError("Missing Supabase access token.")

        try:
            response = self.supabase_service.get_auth_client().get_user(jwt=access_token)
        except Exception as exc:
            raise AuthenticationError("Invalid or expired Supabase access token.") from exc

        user_payload = getattr(response, "user", None) or response
        if user_payload is None:
            raise AuthenticationError("Supabase did not return an authenticated user.")

        data = self._to_mapping(user_payload)
        user_metadata = self._to_mapping(
            data.get("user_metadata") or data.get("raw_user_meta_data") or {}
        )

        try:
            return AuthProviderUser(
                id=str(data["id"]),
                email=data.get("email"),
                full_name=self._extract_name(data, user_metadata),
                user_metadata=user_metadata,
                app_metadata=self._to_mapping(data.get("app_metadata") or {}),
            )
        except KeyError as exc:
            raise AuthenticationError("Supabase returned an incomplete user payload.") from exc

    def _ensure_user_profile(self, auth_user: AuthProviderUser):
        existing_profile = self.supabase_service.get_user_by_id(auth_user.id)
        if existing_profile is not None:
            return existing_profile

        try:
            user_id = UUID(auth_user.id)
        except ValueError as exc:
            raise AuthenticationError("Supabase returned an invalid user identifier.") from exc

        try:
            return self.supabase_service.create_user_profile(
                UserProfileInsert(
                    id=user_id,
                    email=auth_user.email,
                    full_name=auth_user.full_name,
                    plan_type="free",
                )
            )
        except Exception as exc:
            existing_profile = self.supabase_service.get_user_by_id(auth_user.id)
            if existing_profile is not None:
                return existing_profile
            raise AuthStateError("Failed to prepare the user profile for this account.") from exc

    @staticmethod
    def _extract_name(
        user_payload: Mapping[str, Any],
        user_metadata: Mapping[str, Any],
    ) -> str | None:
        for candidate in (
            user_payload.get("full_name"),
            user_metadata.get("full_name"),
            user_metadata.get("name"),
            user_payload.get("name"),
        ):
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()
        return None

    @staticmethod
    def _to_mapping(value: Any) -> dict[str, Any]:
        if value is None:
            return {}
        if isinstance(value, Mapping):
            return dict(value)
        if hasattr(value, "model_dump"):
            return dict(value.model_dump())
        if hasattr(value, "dict"):
            return dict(value.dict())
        if hasattr(value, "__dict__"):
            return {
                key: item
                for key, item in vars(value).items()
                if not key.startswith("_")
            }
        raise AuthenticationError("Unsupported Supabase user payload received.")
