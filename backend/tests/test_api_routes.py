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


def test_generation_modes_return_watermark_flag_for_free_exports(client) -> None:
    notes_response = client.post(
        "/api/v1/generate/notes",
        json={
            "notes": "Problem framing\nSolution framing\nWorkflow details\nClosing summary",
            "title": "Notes Draft",
            "slide_count": 4,
            "template_id": "academic_clean",
        },
    )
    pdf_response = client.post(
        "/api/v1/generate/pdf",
        json={
            "pdf_url": "https://example.com/source.pdf",
            "title": "PDF Draft",
            "slide_count": 4,
            "template_id": "modern_minimal",
        },
    )

    assert notes_response.status_code == 200
    assert pdf_response.status_code == 200
    assert notes_response.json()["data"]["presentation"]["watermark_applied"] is True
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
