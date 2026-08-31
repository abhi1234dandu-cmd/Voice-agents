from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from uuid import uuid4

from .schemas import (
    Agent,
    AgentVersion,
    ApiKeyCreated,
    AuditLog,
    KnowledgeBase,
    Organization,
    RetentionPolicy,
    ToolDefinition,
    UsageSummary,
    WebhookDelivery,
    WebhookEndpoint,
)
from .security import hash_secret, mask_secret


DEMO_ORG_ID = "org_demo_northstar"
DEMO_PASSWORD = "votell-demo-2026"


@dataclass
class Store:
    organizations: dict[str, Organization] = field(default_factory=dict)
    agents: dict[str, Agent] = field(default_factory=dict)
    knowledge_bases: dict[str, KnowledgeBase] = field(default_factory=dict)
    api_key_hashes: dict[str, str] = field(default_factory=dict)
    webhooks: dict[str, WebhookEndpoint] = field(default_factory=dict)
    webhook_deliveries: dict[str, WebhookDelivery] = field(default_factory=dict)
    agent_versions: dict[str, list[AgentVersion]] = field(default_factory=dict)
    audit_logs: list[AuditLog] = field(default_factory=list)
    retention_policies: dict[str, RetentionPolicy] = field(default_factory=dict)
    idempotency_keys: set[str] = field(default_factory=set)

    def seed(self) -> None:
        self.organizations[DEMO_ORG_ID] = Organization(id=DEMO_ORG_ID, name="Northstar Hospitality Group", plan="Growth")
        agent = Agent(
            id="agent_motel_front_desk",
            organization_id=DEMO_ORG_ID,
            name="Northstar Front Desk",
            business_name="Northstar Inn",
            industry="motel",
            voice_id="ava",
            system_prompt="Use only approved motel knowledge. Disclose AI, confirm consequential actions, and transfer urgent requests.",
            welcome_message="Thanks for calling Northstar Inn. I am Ava, an AI assistant. How can I help today?",
            enabled_tools=[
                ToolDefinition(
                    name="create_reservation_request",
                    description="Create a reservation lead only after caller confirmation.",
                    confirmation_required=True,
                    timeout_ms=5000,
                ),
                ToolDefinition(
                    name="transfer_to_human",
                    description="Transfer to the front desk with a concise summary.",
                    confirmation_required=False,
                    timeout_ms=8000,
                ),
            ],
            status="published",
            version=3,
        )
        self.agents[agent.id] = agent
        self.agent_versions[agent.id] = [
            AgentVersion(
                id="av_motel_front_desk_v3",
                organization_id=DEMO_ORG_ID,
                agent_id=agent.id,
                version=3,
                status="published",
                config=agent.model_dump(),
            )
        ]
        self.knowledge_bases["kb_northstar"] = KnowledgeBase(
            id="kb_northstar",
            organization_id=DEMO_ORG_ID,
            name="Northstar approved knowledge",
            chunks=[
                "Check-in starts at 3 PM and late check-in details can be sent by SMS.",
                "The AI assistant may collect reservation requests but must not guarantee rates or final availability.",
                "Payment-card collection must be handled by an authorized human or PCI-compliant flow.",
            ],
        )
        self.retention_policies[DEMO_ORG_ID] = RetentionPolicy(organization_id=DEMO_ORG_ID)

    def require_org(self, organization_id: str) -> Organization:
        organization = self.organizations.get(organization_id)
        if not organization:
            raise KeyError("organization not found")
        return organization

    def list_agents(self, organization_id: str) -> list[Agent]:
        return [agent for agent in self.agents.values() if agent.organization_id == organization_id]

    def create_agent(self, organization_id: str, agent: Agent) -> Agent:
        if agent.organization_id != organization_id:
            raise PermissionError("tenant boundary violation")
        self.agents[agent.id] = agent
        self.agent_versions[agent.id] = [
            AgentVersion(
                id=f"av_{uuid4().hex[:10]}",
                organization_id=organization_id,
                agent_id=agent.id,
                version=agent.version,
                status=agent.status,
                config=agent.model_dump(),
            )
        ]
        return agent

    def publish_agent(self, organization_id: str, agent: Agent) -> Agent:
        published = agent.model_copy(update={"status": "published", "version": agent.version + 1})
        self.agents[agent.id] = published
        self.agent_versions.setdefault(agent.id, []).append(
            AgentVersion(
                id=f"av_{uuid4().hex[:10]}",
                organization_id=organization_id,
                agent_id=agent.id,
                version=published.version,
                status="published",
                config=published.model_dump(),
            )
        )
        self.audit_logs.append(
            AuditLog(
                organization_id=organization_id,
                actor="user_demo_owner",
                action="agent.published",
                target=agent.id,
                metadata={"version": published.version},
            )
        )
        return published

    def create_api_key(self, label: str, scopes: list[str], pepper: str) -> ApiKeyCreated:
        suffix = uuid4().hex[:16]
        secret = f"votell_live_{suffix}"
        key_id = f"key_{uuid4().hex[:10]}"
        self.api_key_hashes[key_id] = hash_secret(secret, pepper)
        return ApiKeyCreated(id=key_id, label=label, secret_once=secret, masked=mask_secret(secret), scopes=scopes)

    def usage_summary(self) -> UsageSummary:
        return UsageSummary(
            telephony_minutes=Decimal("1219.0"),
            stt_seconds=Decimal("73140.0"),
            tts_characters=942000,
            llm_input_tokens=1450000,
            llm_output_tokens=650000,
            estimated_total_usd=Decimal("185.75"),
        )

    def add_webhook(self, endpoint: WebhookEndpoint) -> WebhookEndpoint:
        self.webhooks[endpoint.id] = endpoint
        self.audit_logs.append(
            AuditLog(
                organization_id=endpoint.organization_id,
                actor="user_demo_owner",
                action="webhook.created",
                target=endpoint.id,
                metadata={"events": endpoint.events},
            )
        )
        return endpoint

    def add_delivery(self, delivery: WebhookDelivery) -> WebhookDelivery:
        self.webhook_deliveries[delivery.id] = delivery
        return delivery


store = Store()
store.seed()
