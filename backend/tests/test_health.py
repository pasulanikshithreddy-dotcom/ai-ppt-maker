def test_health_check_returns_service_status(client) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "ok"
    assert payload["data"]["environment"] == "development"

    integration_names = {item["name"] for item in payload["data"]["integrations"]}
    assert integration_names == {"openai", "supabase", "python-pptx"}
