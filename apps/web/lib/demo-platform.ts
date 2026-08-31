import {
  agentConfigSchema,
  buildMockCallSimulation,
  demoAgent,
  demoOrganizationId,
  estimateUsageCents,
  industryTemplates,
  type AgentConfig,
  type CallEvent,
  type Industry,
  voiceProfiles,
} from "@votell/shared-types";

export const demoCredentials = {
  email: "owner@votell.local",
  password: "votell-demo-2026",
};

export const demoOrganizations = [
  {
    id: demoOrganizationId,
    name: "Northstar Hospitality Group",
    plan: "Growth",
    locations: ["Northstar Inn", "Harbor Lodge"],
    role: "Owner",
  },
  {
    id: "org_demo_factory",
    name: "Atlas Components",
    plan: "Business",
    locations: ["Plant 4"],
    role: "Administrator",
  },
];

export const demoKnowledgeDocuments = [
  {
    id: "doc_policy",
    organizationId: demoOrganizationId,
    name: "Front desk policy",
    status: "indexed",
    type: "Markdown",
    chunks: [
      "Check-in starts at 3 PM and late check-in details can be sent by SMS.",
      "The motel offers free Wi-Fi, parking, and coffee in the lobby.",
      "Emergency calls transfer to the front desk immediately.",
    ],
  },
  {
    id: "doc_rates",
    organizationId: demoOrganizationId,
    name: "Approved availability language",
    status: "indexed",
    type: "TXT",
    chunks: [
      "The AI assistant may collect reservation requests but must not guarantee rates or final availability.",
      "Payment-card collection must be handled by an authorized human or PCI-compliant flow.",
    ],
  },
];

export const demoCalls = buildMockCallSimulation({
  organizationId: demoOrganizationId,
  callId: "call_demo_1001",
  industry: "motel",
  voiceName: "Ava",
  businessName: "Northstar Inn",
});

export const demoCallSummary = {
  id: "call_demo_1001",
  caller: "+1 555 010 0133",
  destination: "+1 555 010 0900",
  agent: "Northstar Front Desk",
  direction: "Inbound",
  status: "Completed",
  outcome: "Reservation request created",
  sentiment: "Positive",
  duration: "1m 18s",
  transfer: "No transfer",
  startedAt: "Today, 10:42 AM",
  cost: estimateUsageCents(demoCalls),
};

export const demoUsageByDay = [
  { day: "Mon", calls: 44, transfers: 5, cost: 18.74, latency: 920 },
  { day: "Tue", calls: 51, transfers: 6, cost: 21.1, latency: 880 },
  { day: "Wed", calls: 63, transfers: 7, cost: 26.42, latency: 810 },
  { day: "Thu", calls: 58, transfers: 4, cost: 23.33, latency: 760 },
  { day: "Fri", calls: 79, transfers: 8, cost: 31.85, latency: 840 },
  { day: "Sat", calls: 92, transfers: 11, cost: 38.91, latency: 900 },
  { day: "Sun", calls: 66, transfers: 5, cost: 25.4, latency: 790 },
];

export function validateLogin(email: string, password: string) {
  return (
    email.trim().toLowerCase() === demoCredentials.email &&
    password === demoCredentials.password
  );
}

export function createAgentFromTemplate(
  industry: Industry,
  organizationId = demoOrganizationId,
): AgentConfig {
  const template =
    industryTemplates.find((item) => item.id === industry) ??
    industryTemplates[0]!;
  const voice =
    voiceProfiles.find((item) => item.id === template.voiceRecommendation) ??
    voiceProfiles[0]!;

  return agentConfigSchema.parse({
    ...demoAgent,
    id: `agent_${industry}_draft`,
    organizationId,
    name: template.name,
    businessName: industry === "factory" ? "Atlas Components" : "Northstar Inn",
    industry,
    role: template.name,
    description: `Editable ${template.name} template for local demo mode.`,
    voiceId: voice.id,
    language: voice.language,
    systemPrompt: template.starterPrompt,
    welcomeMessage: `Thanks for calling. This is ${voice.name}, your Votell AI assistant.`,
    knowledgeBaseIds: [`kb_${industry}`],
    enabledTools: template.enabledTools.map((name) => ({
      name,
      description: `Mock implementation for ${name.replaceAll("_", " ")}.`,
      confirmationRequired: ["create", "send", "schedule", "dispatch"].some(
        (prefix) => name.startsWith(prefix),
      ),
      timeoutMs: 5000,
      tenantOwned: true,
      auditBehavior: "always" as const,
    })),
    status: "draft",
    version: 1,
  });
}

export function publishAgent(agent: AgentConfig) {
  return agentConfigSchema.parse({
    ...agent,
    status: "published",
    version: agent.version + 1,
  });
}

export function queryKnowledge(activeOrganizationId: string, query: string) {
  const normalized = query.toLowerCase();
  return demoKnowledgeDocuments
    .filter((doc) => doc.organizationId === activeOrganizationId)
    .filter((doc) =>
      doc.chunks.some((chunk) =>
        chunk.toLowerCase().includes(normalized.split(" ")[0] ?? normalized),
      ),
    )
    .flatMap((doc) =>
      doc.chunks.map((chunk) => ({
        document: doc.name,
        chunk,
        warning: chunk.toLowerCase().includes("must not")
          ? "guardrail"
          : "approved",
      })),
    )
    .slice(0, 3);
}

export function simulateCall(
  industry: Industry,
  voiceId: string,
  businessName: string,
): CallEvent[] {
  const voice =
    voiceProfiles.find((item) => item.id === voiceId) ?? voiceProfiles[0]!;
  return buildMockCallSimulation({
    organizationId: demoOrganizationId,
    callId: `call_${industry}_${voice.id}`,
    industry,
    voiceName: voice.name,
    businessName,
  });
}

export function createMaskedApiKey(label: string) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    id: `key_${suffix.toLowerCase()}`,
    label,
    secretOnce: `votell_live_${suffix}_shown_once`,
    masked: `votell_live_${suffix.slice(0, 2)}...${suffix.slice(-2)}`,
    scopes: ["agents:read", "calls:read", "webhooks:write"],
    lastUsed: "Never",
  };
}
