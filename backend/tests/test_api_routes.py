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


def test_generate_topic_creates_fetchable_presentation(client) -> None:
    response = client.post(
        "/api/v1/generate/topic",
        json={
            "topic": "AI presentation workflows",
            "audience": "product teams",
            "tone": "practical",
            "slide_count": 7,
            "template_id": "starter",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    presentation_id = payload["data"]["presentation"]["id"]

    follow_up = client.get(f"/api/v1/presentations/{presentation_id}")
    follow_up_payload = follow_up.json()

    assert follow_up.status_code == 200
    assert follow_up_payload["data"]["id"] == presentation_id


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
