from __future__ import annotations

import os
from uuid import uuid4

from fastapi import Depends, FastAPI, Form, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .providers import MockTelephonyProvider, TwilioTelephonyProvider, build_mock_call_events
from .readiness import provider_readiness
from .schemas import (
    Agent,
    AgentCreate,
    AgentVersion,
    ApiKeyCreate,
    ApiKeyCreated,
    AuditLog,
    KnowledgeQuery,
    KnowledgeResult,
    LoginRequest,
    OutboundTestCallRequest,
    OutboundTestCallResponse,
    ProviderReadiness,
    RetentionPolicy,
    SimulateCallRequest,
    ToolExecutionRequest,
    ToolExecutionResponse,
    UserSession,
    WebhookCreate,
    WebhookDelivery,
    WebhookEndpoint,
)
from .security import validate_twilio_signature
from .store import DEMO_ORG_ID, DEMO_PASSWORD, store
from .tooling import tool_executor
from .webhooks import create_delivery, ensure_destination_allowed

app = FastAPI(title="Votell API", version="0.1.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id", f"req_{uuid4().hex[:12]}")
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


def active_org(x_organization_id: str = Header(default=DEMO_ORG_ID)) -> str:
    try:
        store.require_org(x_organization_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="organization not found") from exc
    return x_organization_id


def provider() -> MockTelephonyProvider | TwilioTelephonyProvider:
    if os.getenv("TELEPHONY_PROVIDER", "mock") == "twilio":
        return TwilioTelephonyProvider(auth_token=os.getenv("TWILIO_AUTH_TOKEN", ""))
    return MockTelephonyProvider()


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    settings = get_settings()
    missing = settings.missing_required()
    if missing and not settings.demo_mode:
        raise HTTPException(status_code=503, detail={"missing_required": missing})
    return {"status": "ready", "mode": settings.app_env}


@app.get("/config/public")
def public_config() -> dict[str, str | bool | list[str]]:
    return get_settings().public_safe()


@app.get("/metrics")
def metrics() -> Response:
    body = "# HELP votell_demo_calls_total Demo call counter\n# TYPE votell_demo_calls_total counter\nvotell_demo_calls_total 1\n"
    return Response(content=body, media_type="text/plain")


@app.post("/auth/login", response_model=UserSession)
def login(payload: LoginRequest) -> UserSession:
    if payload.email.lower() != "owner@votell.local" or payload.password != DEMO_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    return UserSession(
        user_id="user_demo_owner",
        email="owner@votell.local",
        organization_id=DEMO_ORG_ID,
        role="Owner",
        token=f"local_{uuid4().hex}",
    )


@app.get("/organizations")
def organizations() -> list[dict[str, str]]:
    return [org.model_dump() for org in store.organizations.values()]


@app.get("/industry-templates")
def industry_templates() -> list[dict[str, object]]:
    return [
        {"id": "motel", "name": "Motel Front Desk", "enabled_tools": ["check_availability", "create_reservation_request", "send_sms"]},
        {"id": "restaurant", "name": "Restaurant Host", "enabled_tools": ["create_restaurant_reservation", "order_request", "send_sms"]},
        {"id": "call-center", "name": "Call-Center Support", "enabled_tools": ["create_support_ticket", "schedule_callback"]},
        {"id": "factory", "name": "Factory Operations", "enabled_tools": ["create_maintenance_request", "dispatch_request"]},
    ]


@app.get("/agents", response_model=list[Agent])
def list_agents(organization_id: str = Depends(active_org)) -> list[Agent]:
    return store.list_agents(organization_id)


@app.post("/agents", response_model=Agent)
def create_agent(payload: AgentCreate, organization_id: str = Depends(active_org)) -> Agent:
    agent = Agent(**payload.model_dump(), organization_id=organization_id)
    return store.create_agent(organization_id, agent)


@app.post("/agents/{agent_id}/publish", response_model=Agent)
def publish_agent(agent_id: str, organization_id: str = Depends(active_org)) -> Agent:
    agent = store.agents.get(agent_id)
    if not agent or agent.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="agent not found")
    return store.publish_agent(organization_id, agent)


@app.get("/agents/{agent_id}/versions", response_model=list[AgentVersion])
def agent_versions(agent_id: str, organization_id: str = Depends(active_org)) -> list[AgentVersion]:
    versions = store.agent_versions.get(agent_id, [])
    visible = [version for version in versions if version.organization_id == organization_id]
    if not visible:
        raise HTTPException(status_code=404, detail="agent versions not found")
    return visible


@app.get("/knowledge-bases")
def knowledge_bases(organization_id: str = Depends(active_org)) -> list[dict[str, object]]:
    return [kb.model_dump() for kb in store.knowledge_bases.values() if kb.organization_id == organization_id]


@app.post("/knowledge-bases/{kb_id}/query", response_model=list[KnowledgeResult])
def query_kb(kb_id: str, payload: KnowledgeQuery, organization_id: str = Depends(active_org)) -> list[KnowledgeResult]:
    kb = store.knowledge_bases.get(kb_id)
    if not kb or kb.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="knowledge base not found")
    token = payload.query.lower().split()[0] if payload.query else ""
    results = [
        KnowledgeResult(document=kb.name, chunk=chunk, score=0.88, source=kb.id)
        for chunk in kb.chunks
        if token and token in chunk.lower()
    ]
    return results[:3]


@app.post("/calls/simulate")
def simulate_call(payload: SimulateCallRequest, organization_id: str = Depends(active_org)) -> dict[str, object]:
    agent = store.agents.get(payload.agent_id)
    if not agent or agent.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="agent not found")
    call_id = f"call_{uuid4().hex[:12]}"
    return {"call_id": call_id, "events": [event.model_dump() for event in build_mock_call_events(organization_id, call_id, agent.business_name)]}


@app.post("/calls/outbound-test", response_model=OutboundTestCallResponse)
def outbound_test_call(payload: OutboundTestCallRequest, organization_id: str = Depends(active_org)) -> OutboundTestCallResponse:
    agent = store.agents.get(payload.agent_id)
    if not agent or agent.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="agent not found")
    if payload.idempotency_key in store.idempotency_keys:
        return OutboundTestCallResponse(
            provider_call_id=f"duplicate_{payload.idempotency_key}",
            status="duplicate",
            to=payload.to,
            from_number=payload.from_number,
            provider=provider().name,
        )
    store.idempotency_keys.add(payload.idempotency_key)
    result = provider().outbound_test_call(payload.to, payload.from_number)
    return OutboundTestCallResponse(
        provider_call_id=result["provider_call_id"],
        status=result["status"],
        to=payload.to,
        from_number=payload.from_number,
        provider=provider().name,
    )


@app.get("/live-calls/{call_id}/events")
def live_call_events(call_id: str, organization_id: str = Depends(active_org)) -> dict[str, object]:
    return {
        "organization_id": organization_id,
        "call_id": call_id,
        "events": [event.model_dump() for event in build_mock_call_events(organization_id, call_id, "Northstar Inn")],
    }


@app.get("/calls")
def calls(organization_id: str = Depends(active_org)) -> list[dict[str, object]]:
    return [
        {
            "id": "call_demo_1001",
            "organization_id": organization_id,
            "caller": "+15550100133",
            "status": "completed",
            "outcome": "reservation request created",
            "estimated_cost_cents": 7,
        }
    ]


@app.get("/analytics/summary")
def analytics_summary(organization_id: str = Depends(active_org)) -> dict[str, object]:
    return {
        "organization_id": organization_id,
        "total_calls": 453,
        "answered_calls": 431,
        "containment_rate": 0.84,
        "transfer_rate": 0.1,
        "failure_rate": 0.018,
        "average_response_latency_ms": 820,
    }


@app.post("/tools/execute", response_model=ToolExecutionResponse)
def execute_tool(payload: ToolExecutionRequest, organization_id: str = Depends(active_org)) -> ToolExecutionResponse:
    agent = store.agents.get(payload.agent_id)
    if not agent or agent.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="agent not found")
    enabled = {tool.name for tool in agent.enabled_tools}
    if payload.tool_name not in enabled:
        raise HTTPException(status_code=403, detail="tool is not enabled for this agent")
    result = tool_executor.execute(payload)
    store.audit_logs.append(
        AuditLog(
            organization_id=organization_id,
            actor="voice_orchestrator",
            action=result.audit_event,
            target=payload.tool_name,
            metadata={"call_id": payload.call_id, "status": result.status},
        )
    )
    return result


@app.post("/api-keys", response_model=ApiKeyCreated)
def create_api_key(payload: ApiKeyCreate, organization_id: str = Depends(active_org)) -> ApiKeyCreated:
    _ = organization_id
    return store.create_api_key(payload.label, payload.scopes, os.getenv("ENCRYPTION_KEY", "local-pepper"))


@app.get("/usage/summary")
def usage_summary(organization_id: str = Depends(active_org)) -> dict[str, object]:
    _ = organization_id
    return store.usage_summary().model_dump()


@app.get("/webhooks", response_model=list[WebhookEndpoint])
def list_webhooks(organization_id: str = Depends(active_org)) -> list[WebhookEndpoint]:
    return [endpoint for endpoint in store.webhooks.values() if endpoint.organization_id == organization_id]


@app.post("/webhooks", response_model=WebhookEndpoint)
def create_webhook(payload: WebhookCreate, organization_id: str = Depends(active_org)) -> WebhookEndpoint:
    try:
        ensure_destination_allowed(str(payload.url))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    endpoint = WebhookEndpoint(
        id=f"whe_{uuid4().hex[:10]}",
        organization_id=organization_id,
        url=payload.url,
        events=payload.events,
        signing_secret_ref="local-webhook-secret",
    )
    return store.add_webhook(endpoint)


@app.post("/webhooks/{webhook_id}/replay")
def replay_webhook(webhook_id: str, organization_id: str = Depends(active_org)) -> dict[str, object]:
    endpoint = store.webhooks.get(webhook_id)
    if endpoint and endpoint.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="webhook not found")
    if not endpoint:
        endpoint = WebhookEndpoint(
            id=webhook_id,
            organization_id=organization_id,
            url="https://example.com/votell/webhook",
            events=["call.ended"],
            signing_secret_ref="local-webhook-secret",
        )
    delivery, signature = create_delivery(
        endpoint,
        "call.ended",
        b'{"event":"call.ended"}',
        os.getenv("WEBHOOK_SIGNING_SECRET", "local-webhook-secret"),
    )
    store.add_delivery(delivery)
    return {
        "organization_id": organization_id,
        "webhook_id": webhook_id,
        "delivery_id": delivery.id,
        "status": "queued",
        "signature": signature,
        "idempotency_key": f"replay_{uuid4().hex[:12]}",
    }


@app.get("/webhook-deliveries", response_model=list[WebhookDelivery])
def webhook_deliveries(organization_id: str = Depends(active_org)) -> list[WebhookDelivery]:
    return [delivery for delivery in store.webhook_deliveries.values() if delivery.organization_id == organization_id]


@app.get("/audit-logs", response_model=list[AuditLog])
def audit_logs(organization_id: str = Depends(active_org)) -> list[AuditLog]:
    return [entry for entry in store.audit_logs if entry.organization_id == organization_id]


@app.get("/retention-policy", response_model=RetentionPolicy)
def retention_policy(organization_id: str = Depends(active_org)) -> RetentionPolicy:
    return store.retention_policies.setdefault(organization_id, RetentionPolicy(organization_id=organization_id))


@app.put("/retention-policy", response_model=RetentionPolicy)
def update_retention_policy(payload: RetentionPolicy, organization_id: str = Depends(active_org)) -> RetentionPolicy:
    if payload.organization_id != organization_id:
        raise HTTPException(status_code=403, detail="tenant boundary violation")
    store.retention_policies[organization_id] = payload
    store.audit_logs.append(
        AuditLog(
            organization_id=organization_id,
            actor="user_demo_owner",
            action="retention.updated",
            target=organization_id,
            metadata=payload.model_dump(),
        )
    )
    return payload


@app.post("/telephony/twilio/inbound")
async def twilio_inbound(
    request: Request,
    call_sid: str = Form(alias="CallSid"),
    from_number: str = Form(alias="From"),
    to_number: str = Form(alias="To"),
    x_twilio_signature: str = Header(default=""),
) -> Response:
    form = await request.form()
    params = {key: str(value) for key, value in form.items()}
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    public_url = str(request.url)
    if auth_token and not validate_twilio_signature(public_url, params, x_twilio_signature, auth_token):
        raise HTTPException(status_code=403, detail="invalid Twilio signature")
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This is Votell demo mode. Your call is being connected to the AI agent.</Say>
  <Pause length="1"/>
  <Say>Call {call_sid} from {from_number} to {to_number} was received.</Say>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@app.post("/telephony/twilio/status")
async def twilio_status(request: Request, x_idempotency_key: str = Header(default="")) -> dict[str, object]:
    if x_idempotency_key:
        if x_idempotency_key in store.idempotency_keys:
            return {"status": "duplicate_ignored"}
        store.idempotency_keys.add(x_idempotency_key)
    form = await request.form()
    return {"status": "accepted", "payload": dict(form)}


@app.get("/providers/telephony/health")
def telephony_health() -> dict[str, str]:
    return provider().health()


@app.get("/providers/readiness", response_model=list[ProviderReadiness])
def providers_readiness() -> list[ProviderReadiness]:
    return provider_readiness(get_settings())
