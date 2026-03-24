from datetime import datetime
from uuid import UUID

import pytest

from app.api.deps import get_current_user_context
from app.main import app
from app.schemas.database import UserRow
from app.schemas.payment import PaymentOrder, VerifyPaymentResult
from app.schemas.user import AuthenticatedUserContext

TEST_USER_ID = "4cb0f7b6-f47b-41c6-9aef-dcc0a4cf550e"


@pytest.fixture()
def auth_override():
    def apply(*, plan_code: str = "pro") -> AuthenticatedUserContext:
        now = datetime.fromisoformat("2026-03-23T12:00:00+00:00")
        profile = UserRow(
            id=UUID(TEST_USER_ID),
            email="nik@example.com",
            full_name="Nik Sharma",
            plan_type=plan_code,
            created_at=now,
            updated_at=now,
        )
        context = AuthenticatedUserContext(
            id=TEST_USER_ID,
            email=profile.email,
            full_name=profile.full_name,
            plan_code=plan_code,
            profile=profile,
            subscription=None,
        )
        app.dependency_overrides[get_current_user_context] = lambda: context
        return context

    yield apply
    app.dependency_overrides.clear()


def test_public_get_routes_return_consistent_envelopes(client) -> None:
    for endpoint in (
        "/api/v1/health",
        "/api/v1/templates",
    ):
        response = client.get(endpoint)
        payload = response.json()

        assert response.status_code == 200
        assert payload["success"] is True
        assert "message" in payload
        assert "data" in payload


def test_authenticated_me_and_plan_routes_return_user_context(
    client,
    auth_override,
) -> None:
    auth_override(plan_code="pro")

    me_response = client.get(
        "/api/v1/me",
        headers={"Authorization": "Bearer test-token"},
    )
    plan_response = client.get(
        "/api/v1/plan",
        headers={"Authorization": "Bearer test-token"},
    )

    assert me_response.status_code == 200
    assert plan_response.status_code == 200

    me_payload = me_response.json()
    plan_payload = plan_response.json()

    assert me_payload["data"]["id"] == TEST_USER_ID
    assert me_payload["data"]["plan_code"] == "pro"
    assert me_payload["data"]["authenticated"] is True
    assert me_payload["data"]["can_use_pro_features"] is True
    assert plan_payload["data"]["current_plan"]["code"] == "pro"
    assert plan_payload["data"]["is_paid"] is True
    assert plan_payload["data"]["daily_topic_limit"] is None
    assert plan_payload["data"]["remaining_topic_generations"] is None
    assert any(
        plan["code"] == "pro" and plan["active"] is True
        for plan in plan_payload["data"]["available_plans"]
    )


def test_templates_route_returns_full_template_catalog(client) -> None:
    response = client.get("/api/v1/templates")

    assert response.status_code == 200

    payload = response.json()
    assert payload["data"]["total"] == 10
    assert payload["data"]["free_count"] > 0
    assert payload["data"]["pro_count"] > 0

    template = payload["data"]["items"][0]
    assert "theme" in template
    assert "layout" in template
    assert "title_font_size" in template["theme"]
    assert "content_columns" in template["layout"]


def test_generate_topic_returns_saved_presentation_and_content(
    monkeypatch,
    client,
    auth_override,
) -> None:
    from app.models.presentation import PresentationSource, PresentationStatus
    from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
    from app.schemas.presentation import GenerationResult, PresentationDetail

    auth_override(plan_code="free")

    def fake_generate_from_topic(self, _payload):
        return GenerationResult(
            queued=False,
            presentation=PresentationDetail(
                id="b3d25f3e-64f7-4c8c-b7cd-412a6b3a8880",
                title="AI Presentation Workflows",
                topic="AI presentation workflows",
                file_url="https://example.supabase.co/storage/v1/object/public/presentations/topic/file.pptx",
                source_type=PresentationSource.TOPIC,
                status=PresentationStatus.COMPLETED,
                slide_count=3,
                watermark_applied=True,
                created_at=datetime.fromisoformat("2026-03-23T12:00:00+00:00"),
                template_id="academic_clean",
                template_name="Academic Clean",
                content_preview=[
                    "Why AI Presentations Matter",
                    "Core Workflow",
                    "Next Steps",
                ],
                metadata={"remaining_topic_generations": 2},
            ),
            content=GeneratedPresentationContent(
                presentation_title="AI Presentation Workflows",
                slides=[
                    PresentationSlide(
                        title="Why AI Presentations Matter",
                        bullets=["Faster drafting", "More consistent structure"],
                        speaker_notes="Explain how automation reduces blank-page friction.",
                    ),
                    PresentationSlide(
                        title="Core Workflow",
                        bullets=["Start with a topic", "Generate slide-by-slide content"],
                        speaker_notes=(
                            "Walk through the end-to-end user journey in practical terms."
                        ),
                    ),
                    PresentationSlide(
                        title="Next Steps",
                        bullets=["Validate outputs", "Export to PPT"],
                        speaker_notes=(
                            "Close with operational improvements and rollout priorities."
                        ),
                    ),
                ],
            ),
        )

    monkeypatch.setattr(
        "app.services.topic_generation_service.TopicGenerationService.generate_from_topic",
        fake_generate_from_topic,
    )

    response = client.post(
        "/api/v1/generate/topic",
        json={
            "topic": "AI presentation workflows",
            "subject": "Productivity",
            "tone": "practical",
            "slide_count": 3,
            "user_id": TEST_USER_ID,
            "template_id": "academic_clean",
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["presentation"]["title"] == "AI Presentation Workflows"
    assert payload["data"]["presentation"]["watermark_applied"] is True
    assert payload["data"]["presentation"]["file_url"]
    assert payload["data"]["content"]["presentation_title"] == "AI Presentation Workflows"
    assert len(payload["data"]["content"]["slides"]) == 3


def test_generate_notes_returns_saved_presentation_and_content(
    monkeypatch,
    client,
    auth_override,
) -> None:
    from app.models.presentation import PresentationSource, PresentationStatus
    from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
    from app.schemas.presentation import GenerationResult, PresentationDetail

    auth_override(plan_code="pro")

    def fake_generate_from_notes(self, _payload):
        return GenerationResult(
            queued=False,
            presentation=PresentationDetail(
                id="d3d25f3e-64f7-4c8c-b7cd-412a6b3a9990",
                title="Customer Research Summary",
                topic="Customer Research",
                file_url="https://example.supabase.co/storage/v1/object/public/presentations/file.pptx",
                source_type=PresentationSource.NOTES,
                status=PresentationStatus.COMPLETED,
                slide_count=3,
                watermark_applied=False,
                created_at=datetime.fromisoformat("2026-03-23T12:00:00+00:00"),
                template_id="boardroom_luxe",
                content_preview=["Context", "Insights", "Actions"],
                metadata={"storage_path": "user_1/notes/file.pptx"},
            ),
            content=GeneratedPresentationContent(
                presentation_title="Customer Research Summary",
                slides=[
                    PresentationSlide(
                        title="Context",
                        bullets=["Interviews completed", "Themes were consistent"],
                        speaker_notes="Open with the overall scope and reliability of the notes.",
                    ),
                    PresentationSlide(
                        title="Insights",
                        bullets=["Users value speed", "Clarity improves adoption"],
                        speaker_notes="Tie the evidence back to product opportunities.",
                    ),
                    PresentationSlide(
                        title="Actions",
                        bullets=["Prioritize onboarding", "Refine export polish"],
                        speaker_notes="Close with practical product follow-up actions.",
                    ),
                ],
            ),
        )

    monkeypatch.setattr(
        "app.services.notes_generation_service.NotesGenerationService.generate_from_notes",
        fake_generate_from_notes,
    )

    notes_response = client.post(
        "/api/v1/generate/notes",
        json={
            "notes": "Problem framing\nSolution framing\nWorkflow details\nClosing summary",
            "title": "Notes Draft",
            "topic": "Customer Research",
            "user_id": TEST_USER_ID,
            "slide_count": 4,
            "template_id": "boardroom_luxe",
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert notes_response.status_code == 200
    payload = notes_response.json()
    assert payload["data"]["queued"] is False
    assert payload["data"]["presentation"]["watermark_applied"] is False
    assert payload["data"]["presentation"]["file_url"]
    assert payload["data"]["content"]["presentation_title"] == "Customer Research Summary"


def test_generate_pdf_returns_preview_and_download_url(
    monkeypatch,
    client,
    auth_override,
) -> None:
    from app.models.presentation import PresentationSource, PresentationStatus
    from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
    from app.schemas.presentation import GenerationResult, PresentationDetail

    auth_override(plan_code="pro")

    def fake_generate_from_pdf(self, _payload, *, pdf_bytes):
        assert pdf_bytes.startswith(b"%PDF")
        return GenerationResult(
            queued=False,
            presentation=PresentationDetail(
                id="cc7bfc6f-64f7-4c8c-b7cd-412a6b3a9990",
                title="Uploaded Report Summary",
                topic="uploaded report",
                file_url=(
                    "https://example.supabase.co/storage/v1/object/public/"
                    "presentations/generated/report.pptx"
                ),
                source_type=PresentationSource.PDF,
                status=PresentationStatus.COMPLETED,
                slide_count=3,
                watermark_applied=False,
                created_at=datetime.fromisoformat("2026-03-23T12:00:00+00:00"),
                template_id="boardroom_luxe",
                content_preview=["Overview", "Findings", "Recommendations"],
                metadata={
                    "source_pdf_url": (
                        "https://example.supabase.co/storage/v1/object/public/"
                        "presentations/source/report.pdf"
                    )
                },
            ),
            content=GeneratedPresentationContent(
                presentation_title="Uploaded Report Summary",
                slides=[
                    PresentationSlide(
                        title="Overview",
                        bullets=["The document was summarized", "Key sections were extracted"],
                        speaker_notes="Introduce the report and the core scope covered by the PDF.",
                    ),
                    PresentationSlide(
                        title="Findings",
                        bullets=["Main finding one", "Main finding two"],
                        speaker_notes=(
                            "Explain the strongest findings preserved from the "
                            "source PDF."
                        ),
                    ),
                    PresentationSlide(
                        title="Recommendations",
                        bullets=["Action one", "Action two"],
                        speaker_notes="Close with the most actionable takeaways from the source.",
                    ),
                ],
            ),
        )

    monkeypatch.setattr(
        "app.services.pdf_generation_service.PdfGenerationService.generate_from_pdf",
        fake_generate_from_pdf,
    )

    pdf_response = client.post(
        "/api/v1/generate/pdf",
        data={
            "template_id": "boardroom_luxe",
            "user_id": TEST_USER_ID,
            "slide_count": 3,
        },
        files={"pdf": ("report.pdf", b"%PDF-1.4 fake pdf content", "application/pdf")},
        headers={"Authorization": "Bearer test-token"},
    )

    assert pdf_response.status_code == 200
    payload = pdf_response.json()
    assert payload["data"]["presentation"]["watermark_applied"] is False
    assert payload["data"]["presentation"]["file_url"]
    assert payload["data"]["presentation"]["metadata"]["source_pdf_url"]
    assert payload["data"]["content"]["presentation_title"] == "Uploaded Report Summary"


def test_presentations_route_returns_current_user_history(
    monkeypatch,
    client,
    auth_override,
) -> None:
    from app.models.presentation import PresentationSource, PresentationStatus
    from app.schemas.presentation import (
        PresentationDetail,
        PresentationListData,
        PresentationSummary,
    )

    auth_override(plan_code="pro")

    def fake_list_presentations(self, *, user_id):
        assert user_id == TEST_USER_ID
        return PresentationListData(
            items=[
                PresentationSummary(
                    id="cc7bfc6f-64f7-4c8c-b7cd-412a6b3a9990",
                    title="Uploaded Report Summary",
                    topic="uploaded report",
                    source_type=PresentationSource.PDF,
                    status=PresentationStatus.COMPLETED,
                    slide_count=3,
                    template_id="boardroom_luxe",
                    template_name="Boardroom Luxe",
                    file_url=(
                        "https://example.supabase.co/storage/v1/object/public/"
                        "presentations/generated/report.pptx"
                    ),
                    watermark_applied=False,
                    created_at=datetime.fromisoformat("2026-03-23T12:00:00+00:00"),
                    content_preview=["Overview", "Findings", "Recommendations"],
                )
            ],
            total=1,
        )

    def fake_get_presentation(self, presentation_id: str, *, user_id):
        assert presentation_id == "cc7bfc6f-64f7-4c8c-b7cd-412a6b3a9990"
        assert user_id == TEST_USER_ID
        return PresentationDetail(
            id=presentation_id,
            title="Uploaded Report Summary",
            topic="uploaded report",
            source_type=PresentationSource.PDF,
            status=PresentationStatus.COMPLETED,
            slide_count=3,
            template_id="boardroom_luxe",
            template_name="Boardroom Luxe",
            file_url=(
                "https://example.supabase.co/storage/v1/object/public/"
                "presentations/generated/report.pptx"
            ),
            watermark_applied=False,
            created_at=datetime.fromisoformat("2026-03-23T12:00:00+00:00"),
            content_preview=["Overview", "Findings", "Recommendations"],
            metadata={"source_pdf_url": "https://example.com/source/report.pdf"},
        )

    monkeypatch.setattr(
        "app.services.presentation_service.PresentationService.list_presentations",
        fake_list_presentations,
    )
    monkeypatch.setattr(
        "app.services.presentation_service.PresentationService.get_presentation",
        fake_get_presentation,
    )

    list_response = client.get(
        "/api/v1/presentations",
        headers={"Authorization": "Bearer test-token"},
    )
    detail_response = client.get(
        "/api/v1/presentations/cc7bfc6f-64f7-4c8c-b7cd-412a6b3a9990",
        headers={"Authorization": "Bearer test-token"},
    )

    assert list_response.status_code == 200
    assert detail_response.status_code == 200
    assert list_response.json()["data"]["total"] == 1
    assert detail_response.json()["data"]["metadata"]["source_pdf_url"]


def test_payment_order_can_be_verified(
    monkeypatch,
    client,
    auth_override,
) -> None:
    auth_override(plan_code="free")

    def fake_create_order(self, payload, *, current_user):
        assert payload.plan_code == "pro"
        assert current_user.id == TEST_USER_ID
        return PaymentOrder(
            order_id="order_12345",
            provider="razorpay",
            plan_code="pro",
            amount=99900,
            currency="INR",
            key_id="rzp_test_12345",
        )

    def fake_verify_payment(self, payload, *, current_user):
        assert payload.order_id == "order_12345"
        assert current_user.id == TEST_USER_ID
        return VerifyPaymentResult(
            order_id=payload.order_id,
            payment_id=payload.payment_id,
            status="verified",
            plan_code="pro",
        )

    monkeypatch.setattr(
        "app.services.payment_service.PaymentService.create_order",
        fake_create_order,
    )
    monkeypatch.setattr(
        "app.services.payment_service.PaymentService.verify_payment",
        fake_verify_payment,
    )

    create_response = client.post(
        "/api/v1/payments/create-order",
        json={"plan_code": "pro"},
        headers={"Authorization": "Bearer test-token"},
    )
    create_payload = create_response.json()

    verify_response = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": create_payload["data"]["order_id"],
            "payment_id": "pay_12345",
            "signature": "sig_12345",
        },
        headers={"Authorization": "Bearer test-token"},
    )
    verify_payload = verify_response.json()

    assert create_response.status_code == 200
    assert verify_response.status_code == 200
    assert verify_payload["data"]["status"] == "verified"
