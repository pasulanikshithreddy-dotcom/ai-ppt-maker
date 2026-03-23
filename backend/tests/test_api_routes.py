from datetime import datetime


def test_public_get_routes_return_consistent_envelopes(client) -> None:
    for endpoint in (
        "/api/v1/health",
        "/api/v1/templates",
        "/api/v1/me",
        "/api/v1/plan",
        "/api/v1/presentations",
    ):
        response = client.get(endpoint)
        payload = response.json()

        assert response.status_code == 200
        assert payload["success"] is True
        assert "message" in payload
        assert "data" in payload


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


def test_generate_topic_returns_structured_presentation_content(monkeypatch, client) -> None:
    from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide

    def fake_generate_topic_presentation(self, _payload):
        return GeneratedPresentationContent(
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
                    speaker_notes="Walk through the end-to-end user journey in practical terms.",
                ),
                PresentationSlide(
                    title="Next Steps",
                    bullets=["Validate outputs", "Export to PPT"],
                    speaker_notes="Close with operational improvements and rollout priorities.",
                ),
            ],
        )

    monkeypatch.setattr(
        "app.services.content_generation_service.ContentGenerationService.generate_topic_presentation",
        fake_generate_topic_presentation,
    )

    response = client.post(
        "/api/v1/generate/topic",
        json={
            "topic": "AI presentation workflows",
            "subject": "Productivity",
            "tone": "practical",
            "slide_count": 3,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["presentation_title"] == "AI Presentation Workflows"
    assert len(payload["data"]["slides"]) == 3
    assert payload["data"]["slides"][0]["bullets"]


def test_generate_notes_returns_saved_presentation_and_content(monkeypatch, client) -> None:
    from app.models.presentation import PresentationSource, PresentationStatus
    from app.schemas.content_generation import GeneratedPresentationContent, PresentationSlide
    from app.schemas.presentation import GenerationResult, PresentationDetail

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
            "user_id": "user_1",
            "slide_count": 4,
            "template_id": "boardroom_luxe",
        },
    )

    assert notes_response.status_code == 200
    payload = notes_response.json()
    assert payload["data"]["queued"] is False
    assert payload["data"]["presentation"]["watermark_applied"] is False
    assert payload["data"]["presentation"]["file_url"]
    assert payload["data"]["content"]["presentation_title"] == "Customer Research Summary"


def test_generate_pdf_returns_watermark_flag_for_free_exports(client) -> None:
    pdf_response = client.post(
        "/api/v1/generate/pdf",
        json={
            "pdf_url": "https://example.com/source.pdf",
            "title": "PDF Draft",
            "slide_count": 4,
            "template_id": "modern_minimal",
        },
    )

    assert pdf_response.status_code == 200
    assert pdf_response.json()["data"]["presentation"]["watermark_applied"] is True


def test_payment_order_can_be_verified(client) -> None:
    create_response = client.post(
        "/api/v1/payments/create-order",
        json={"plan_code": "pro", "amount": 999, "currency": "INR"},
    )
    create_payload = create_response.json()

    verify_response = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": create_payload["data"]["order_id"],
            "payment_id": "pay_12345",
            "signature": "sig_12345",
        },
    )
    verify_payload = verify_response.json()

    assert create_response.status_code == 200
    assert verify_response.status_code == 200
    assert verify_payload["data"]["status"] == "verified"
