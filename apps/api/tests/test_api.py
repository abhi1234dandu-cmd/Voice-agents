from __future__ import annotations

import base64
import hashlib
import hmac

from fastapi.testclient import TestClient

from app.main import app
from app.security import validate_twilio_signature

client = TestClient(app)


def test_login_and_agent_list() -> None:
    response = client.post("/auth/login", json={"email": "owner@votell.local", "password": "votell-demo-2026"})
    assert response.status_code == 200
    assert response.json()["organization_id"] == "org_demo_northstar"

    agents = client.get("/agents", headers={"x-organization-id": "org_demo_northstar"})
    assert agents.status_code == 200
    assert agents.json()[0]["organization_id"] == "org_demo_northstar"


def test_tenant_isolation_for_unknown_org() -> None:
    response = client.get("/agents", headers={"x-organization-id": "org_missing"})
    assert response.status_code == 404


def test_publish_agent_increments_version() -> None:
    before = client.get("/agents").json()[0]
    response = client.post(f"/agents/{before['id']}/publish")
    assert response.status_code == 200
    assert response.json()["version"] == before["version"] + 1
    assert response.json()["status"] == "published"

    versions = client.get(f"/agents/{before['id']}/versions")
    assert versions.status_code == 200
    assert versions.json()[-1]["status"] == "published"


def test_knowledge_query_is_tenant_scoped() -> None:
    response = client.post("/knowledge-bases/kb_northstar/query", json={"query": "check-in"})
    assert response.status_code == 200
    assert response.json()[0]["source"] == "kb_northstar"

    missing = client.post(
        "/knowledge-bases/kb_northstar/query",
        json={"query": "check-in"},
        headers={"x-organization-id": "org_missing"},
    )
    assert missing.status_code == 404


def test_simulated_call_contains_confirmation_tool_event() -> None:
    response = client.post("/calls/simulate", json={"agent_id": "agent_motel_front_desk"})
    assert response.status_code == 200
    events = response.json()["events"]
    assert events[0]["type"] == "call.started"
    assert any(event["type"] == "tool.started" and event["metadata"]["confirmation_required"] for event in events)
    assert events[-1]["type"] == "call.ended"


def test_api_key_is_masked() -> None:
    response = client.post("/api-keys", json={"label": "CI", "scopes": ["calls:read"]})
    assert response.status_code == 200
    body = response.json()
    assert body["secret_once"].startswith("votell_live_")
    assert body["masked"] != body["secret_once"]


def test_tool_execution_requires_confirmation_before_consequential_action() -> None:
    response = client.post(
        "/tools/execute",
        json={
            "agent_id": "agent_motel_front_desk",
            "call_id": "call_demo_1001",
            "tool_name": "create_reservation_request",
            "input": {"arrival_date": "2026-07-20"},
            "confirmed": False,
            "idempotency_key": "tool-confirmation-test-1",
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "requires_confirmation"

    confirmed = client.post(
        "/tools/execute",
        json={
            "agent_id": "agent_motel_front_desk",
            "call_id": "call_demo_1001",
            "tool_name": "create_reservation_request",
            "input": {"arrival_date": "2026-07-20"},
            "confirmed": True,
            "idempotency_key": "tool-confirmation-test-1",
        },
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "completed"


def test_outbound_test_call_is_idempotent() -> None:
    payload = {
        "agent_id": "agent_motel_front_desk",
        "to": "+15550100222",
        "from_number": "+15550100900",
        "idempotency_key": "outbound-test-1",
    }
    first = client.post("/calls/outbound-test", json=payload)
    assert first.status_code == 200
    assert first.json()["status"] == "queued"

    duplicate = client.post("/calls/outbound-test", json=payload)
    assert duplicate.status_code == 200
    assert duplicate.json()["status"] == "duplicate"


def test_webhook_creation_rejects_private_destinations_and_replay_signs() -> None:
    rejected = client.post("/webhooks", json={"url": "http://localhost/webhook", "events": ["call.ended"]})
    assert rejected.status_code == 422

    created = client.post("/webhooks", json={"url": "https://example.com/votell", "events": ["call.ended"]})
    assert created.status_code == 200
    webhook_id = created.json()["id"]

    replay = client.post(f"/webhooks/{webhook_id}/replay")
    assert replay.status_code == 200
    assert replay.json()["signature"].startswith("sha256=")


def test_retention_policy_and_provider_readiness() -> None:
    retention = client.get("/retention-policy")
    assert retention.status_code == 200
    assert retention.json()["transcript_retention_days"] == 180

    readiness = client.get("/providers/readiness")
    assert readiness.status_code == 200
    assert {item["provider"] for item in readiness.json()} == {
        "telephony",
        "stt",
        "tts",
        "llm",
        "elevenlabs-hotel-agent",
    }


def test_twilio_signature_validation() -> None:
    url = "https://api.example.com/telephony/twilio/inbound"
    params = {"CallSid": "CA123", "From": "+15550100", "To": "+15550900"}
    auth_token = "secret"
    payload = url + "".join(f"{key}{value}" for key, value in sorted(params.items()))
    signature = base64.b64encode(hmac.new(auth_token.encode(), payload.encode(), hashlib.sha1).digest()).decode()

    assert validate_twilio_signature(url, params, signature, auth_token)
    assert not validate_twilio_signature(url, params, "bad", auth_token)
