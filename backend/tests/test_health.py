def test_health_check_returns_service_status(client) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["environment"] == "development"

    integration_names = {item["name"] for item in payload["integrations"]}
    assert integration_names == {"openai", "supabase", "python-pptx"}
