import pytest

from app.services.plan_service import PlanAccessError, PlanService


def test_plan_service_returns_active_current_plan() -> None:
    service = PlanService()

    overview = service.get_plan_overview(
        current_plan_code="pro",
        subscription_status="active",
    )

    assert overview.current_plan.code == "pro"
    assert overview.current_plan.active is True
    assert overview.is_paid is True
    assert any(plan.code == "free" and plan.active is False for plan in overview.available_plans)


def test_plan_service_rejects_pro_feature_for_free_plan() -> None:
    service = PlanService()

    with pytest.raises(PlanAccessError):
        service.require_plan("free", "pro", feature_name="Notes to PPT")


def test_plan_service_tracks_daily_generation_limits_for_free_users() -> None:
    service = PlanService(free_topic_daily_limit=3)

    assert service.get_topic_daily_limit("free") == 3
    assert service.get_remaining_topic_generations("free", requests_used_today=1) == 2
    assert service.get_remaining_topic_generations("free", requests_used_today=4) == 0
    assert service.get_topic_daily_limit("pro") is None
    assert service.get_remaining_topic_generations("pro", requests_used_today=999) is None


def test_plan_service_rejects_premium_templates_for_free_users() -> None:
    service = PlanService()

    with pytest.raises(PlanAccessError):
        service.require_template_access(
            "free",
            template_is_pro=True,
            template_name="Boardroom Luxe",
        )
