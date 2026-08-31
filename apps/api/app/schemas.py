from __future__ import annotations

from decimal import Decimal
from enum import Enum
from typing import Any, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, HttpUrl


class Role(str, Enum):
    owner = "Owner"
    administrator = "Administrator"
    developer = "Developer"
    manager = "Manager"
    analyst = "Analyst"
    operator = "Agent/Operator"


class Industry(str, Enum):
    motel = "motel"
    restaurant = "restaurant"
    call_center = "call-center"
    factory = "factory"


class Organization(BaseModel):
    id: str
    name: str
    plan: str


class UserSession(BaseModel):
    user_id: str
    email: str
    organization_id: str
    role: Role
    token: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ToolDefinition(BaseModel):
    name: str
    description: str
    confirmation_required: bool
    timeout_ms: int = Field(ge=100, le=30000)
    tenant_owned: bool = True
    audit_behavior: Literal["always", "on_failure", "none"] = "always"


class AgentCreate(BaseModel):
    name: str
    business_name: str
    industry: Industry
    voice_id: str
    system_prompt: str = Field(min_length=20)
    welcome_message: str
    enabled_tools: list[ToolDefinition] = Field(default_factory=list)


class Agent(AgentCreate):
    id: str = Field(default_factory=lambda: f"agent_{uuid4().hex[:10]}")
    organization_id: str
    status: Literal["draft", "published", "archived"] = "draft"
    version: int = 1


class AgentVersion(BaseModel):
    id: str
    organization_id: str
    agent_id: str
    version: int
    status: Literal["draft", "published", "archived"]
    config: dict[str, Any]


class KnowledgeBase(BaseModel):
    id: str
    organization_id: str
    name: str
    status: Literal["empty", "indexing", "indexed", "failed"] = "indexed"
    chunks: list[str]


class KnowledgeQuery(BaseModel):
    query: str


class KnowledgeResult(BaseModel):
    document: str
    chunk: str
    score: float
    source: str


class CallEvent(BaseModel):
    id: str
    organization_id: str
    call_id: str
    type: str
    at_ms: int
    actor: Literal["caller", "agent", "system", "tool"]
    text: str
    latency_ms: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SimulateCallRequest(BaseModel):
    agent_id: str
    caller: str = "+15550100133"
    scenario: str = "availability"


class OutboundTestCallRequest(BaseModel):
    agent_id: str
    to: str
    from_number: str
    idempotency_key: str


class OutboundTestCallResponse(BaseModel):
    provider_call_id: str
    status: str
    to: str
    from_number: str
    provider: str


class ToolExecutionRequest(BaseModel):
    agent_id: str
    call_id: str
    tool_name: str
    input: dict[str, Any] = Field(default_factory=dict)
    confirmed: bool = False
    idempotency_key: str


class ToolExecutionResponse(BaseModel):
    execution_id: str
    status: Literal["requires_confirmation", "completed", "failed", "duplicate"]
    tool_name: str
    confirmation_required: bool
    output: dict[str, Any] = Field(default_factory=dict)
    audit_event: str


class ApiKeyCreate(BaseModel):
    label: str
    scopes: list[str] = Field(default_factory=lambda: ["agents:read", "calls:read"])


class ApiKeyCreated(BaseModel):
    id: str
    label: str
    secret_once: str
    masked: str
    scopes: list[str]


class WebhookEndpoint(BaseModel):
    id: str
    organization_id: str
    url: HttpUrl
    events: list[str]
    signing_secret_ref: str
    active: bool = True


class WebhookCreate(BaseModel):
    url: HttpUrl
    events: list[str] = Field(min_length=1)


class WebhookDelivery(BaseModel):
    id: str
    organization_id: str
    webhook_id: str
    event_type: str
    status: Literal["queued", "delivered", "retry_scheduled", "failed"]
    attempts: int = 0
    signed: bool = True


class UsageSummary(BaseModel):
    telephony_minutes: Decimal
    stt_seconds: Decimal
    tts_characters: int
    llm_input_tokens: int
    llm_output_tokens: int
    estimated_total_usd: Decimal


class AuditLog(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    organization_id: str
    actor: str
    action: str
    target: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class RetentionPolicy(BaseModel):
    organization_id: str
    transcript_retention_days: int = Field(default=180, ge=1, le=3650)
    recording_retention_days: int = Field(default=90, ge=1, le=3650)
    delete_after_days: int | None = Field(default=None, ge=1, le=3650)


class ProviderReadiness(BaseModel):
    provider: str
    status: Literal["ready", "mock-ready", "unconfigured", "degraded"]
    message: str
    required_env: list[str] = Field(default_factory=list)
