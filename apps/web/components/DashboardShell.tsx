"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Cable,
  Check,
  ChevronRight,
  CreditCard,
  FileAudio,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Phone,
  Radio,
  ServerCog,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  TestTube2,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  demoAgent,
  industryTemplates,
  voiceProfiles,
  type AgentConfig,
  type Industry,
} from "@votell/shared-types";
import {
  createAgentFromTemplate,
  createMaskedApiKey,
  demoCallSummary,
  demoCalls,
  demoKnowledgeDocuments,
  demoOrganizations,
  demoUsageByDay,
  publishAgent,
  queryKnowledge,
  simulateCall,
} from "@/lib/demo-platform";
import { VoiceGallery } from "@/components/VoiceGallery";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "phone-numbers", label: "Phone Numbers", icon: Phone },
  { id: "calls", label: "Calls", icon: FileAudio },
  { id: "live-calls", label: "Live Calls", icon: Radio },
  { id: "knowledge-bases", label: "Knowledge Bases", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "integrations", label: "Integrations", icon: Cable },
  { id: "api-webhooks", label: "API & Webhooks", icon: KeyRound },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type SectionId = (typeof navItems)[number]["id"];

const sectionTitles: Record<SectionId, string> = {
  overview: "Overview",
  agents: "Voice-agent builder",
  "phone-numbers": "Phone numbers",
  calls: "Call history",
  "live-calls": "Live calls",
  "knowledge-bases": "Knowledge bases",
  analytics: "Analytics",
  integrations: "Integrations",
  "api-webhooks": "API keys and webhooks",
  billing: "Usage and billing",
  team: "Team and roles",
  settings: "Security and consent",
};

const statusColors = ["#19d3c5", "#8b5cf6", "#f6b84b", "#fb7185"];

const serviceReadiness = [
  ["Telephony", "mock-ready"],
  ["STT", "mock-ready"],
  ["LLM", "mock-ready"],
  ["TTS", "browser-preview"],
] as const;

export function DashboardShell({ activeSection }: { activeSection: string }) {
  const active = navItems.some((item) => item.id === activeSection)
    ? (activeSection as SectionId)
    : "overview";
  const [agent, setAgent] = useState<AgentConfig>(demoAgent);
  const [activeOrgId, setActiveOrgId] = useState(
    demoOrganizations[0]?.id ?? "org_demo_northstar",
  );
  const [knowledgeQuery, setKnowledgeQuery] = useState("check-in");
  const [apiKeys, setApiKeys] = useState<
    Array<ReturnType<typeof createMaskedApiKey>>
  >([
    {
      id: "key_seeded",
      label: "Read-only analytics",
      secretOnce: "",
      masked: "votell_live_ro...01",
      scopes: ["analytics:read"],
      lastUsed: "2 hours ago",
    },
  ]);
  const [webhookDeliveries, setWebhookDeliveries] = useState([
    {
      id: "wh_1001",
      event: "call.ended",
      status: "delivered",
      attempts: 1,
      signed: true,
    },
    {
      id: "wh_1002",
      event: "tool.completed",
      status: "retry scheduled",
      attempts: 2,
      signed: true,
    },
  ]);
  const [liveStarted, setLiveStarted] = useState(false);
  const [visibleLiveEvents, setVisibleLiveEvents] = useState(3);
  const [selectedTemplate, setSelectedTemplate] = useState<Industry>("motel");

  const liveEvents = useMemo(
    () => simulateCall(agent.industry, agent.voiceId, agent.businessName),
    [agent.businessName, agent.industry, agent.voiceId],
  );
  const results = useMemo(
    () => queryKnowledge(activeOrgId, knowledgeQuery),
    [activeOrgId, knowledgeQuery],
  );

  useEffect(() => {
    if (!liveStarted) {
      setVisibleLiveEvents(3);
      return;
    }
    setVisibleLiveEvents(1);
    const timer = window.setInterval(() => {
      setVisibleLiveEvents((current) => {
        if (current >= liveEvents.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [liveEvents.length, liveStarted]);

  function updateAgent<K extends keyof AgentConfig>(
    key: K,
    value: AgentConfig[K],
  ) {
    setAgent((current) => ({ ...current, [key]: value }));
  }

  function applyTemplate(industry: Industry) {
    setSelectedTemplate(industry);
    setAgent(createAgentFromTemplate(industry, activeOrgId));
  }

  return (
    <main className="min-h-screen bg-[#071018]">
      <div className="grid min-h-screen lg:grid-cols-[18rem_1fr]">
        <aside className="border-r border-white/10 bg-[#0a1420]/92 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen">
          <Link href="/" className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-signal text-graphite-950">
              <Activity aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block text-lg font-black text-white">
                Votell
              </span>
              <span className="text-xs text-slate-400">Demo workspace</span>
            </span>
          </Link>

          <label className="mb-4 block text-xs font-bold uppercase text-slate-500">
            Organization
            <select
              className="field mt-2 text-sm normal-case"
              value={activeOrgId}
              onChange={(event) => setActiveOrgId(event.target.value)}
            >
              {demoOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>

          <nav className="space-y-1" aria-label="Dashboard navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={
                    item.id === "overview"
                      ? "/dashboard"
                      : `/dashboard/${item.id}`
                  }
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold ${
                    selected
                      ? "bg-teal-signal text-graphite-950"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="glass-rail mb-6 rounded-lg p-4">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <p className="text-sm font-bold uppercase text-teal-signal">
                  Mock provider mode
                </p>
                <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">
                  {sectionTitles[active]}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/onboarding" className="btn-secondary">
                  Onboarding
                </Link>
                <button
                  className="btn-primary"
                  onClick={() => setLiveStarted(true)}
                >
                  <TestTube2 aria-hidden="true" size={18} />
                  Start simulated call
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {serviceReadiness.map(([service, status]) => (
                <div
                  key={service}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-slate-500">
                      {service}
                    </span>
                    <ServerCog
                      aria-hidden="true"
                      size={15}
                      className="text-teal-signal"
                    />
                  </div>
                  <p className="mt-1 text-sm font-bold text-white">{status}</p>
                </div>
              ))}
            </div>
          </div>

          {active === "overview" ? <OverviewSection agent={agent} /> : null}
          {active === "agents" ? (
            <AgentsSection
              agent={agent}
              selectedTemplate={selectedTemplate}
              updateAgent={updateAgent}
              applyTemplate={applyTemplate}
              publish={() => setAgent((current) => publishAgent(current))}
            />
          ) : null}
          {active === "phone-numbers" ? (
            <PhoneNumbersSection agent={agent} />
          ) : null}
          {active === "calls" ? <CallsSection /> : null}
          {active === "live-calls" ? (
            <LiveCallsSection
              liveStarted={liveStarted}
              start={() => setLiveStarted(true)}
              events={liveEvents.slice(0, visibleLiveEvents)}
            />
          ) : null}
          {active === "knowledge-bases" ? (
            <KnowledgeSection
              query={knowledgeQuery}
              setQuery={setKnowledgeQuery}
              results={results}
            />
          ) : null}
          {active === "analytics" ? <AnalyticsSection /> : null}
          {active === "integrations" ? <IntegrationsSection /> : null}
          {active === "api-webhooks" ? (
            <ApiWebhooksSection
              apiKeys={apiKeys}
              createKey={() =>
                setApiKeys((current) => [
                  createMaskedApiKey("Operations console"),
                  ...current,
                ])
              }
              deliveries={webhookDeliveries}
              replayWebhook={(id) =>
                setWebhookDeliveries((current) =>
                  current.map((delivery) =>
                    delivery.id === id
                      ? {
                          ...delivery,
                          status: "delivered",
                          attempts: delivery.attempts + 1,
                        }
                      : delivery,
                  ),
                )
              }
            />
          ) : null}
          {active === "billing" ? <BillingSection /> : null}
          {active === "team" ? <TeamSection /> : null}
          {active === "settings" ? <SettingsSection /> : null}
        </section>
      </div>
    </main>
  );
}

function OverviewSection({ agent }: { agent: AgentConfig }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total calls" value="453" detail="+18% vs last week" />
        <Metric
          label="Containment"
          value="84%"
          detail="Resolved without transfer"
        />
        <Metric
          label="Avg latency"
          value="820ms"
          detail="Mock pipeline event median"
        />
        <Metric
          label="Estimated cost"
          value="$185.75"
          detail="Billing-ready sample data"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="surface premium-card rounded-lg p-5">
          <SectionHeader
            title="Calls by day"
            description="Seeded sample data for the active organization."
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoUsageByDay}>
                <CartesianGrid stroke="rgba(148,163,184,.16)" />
                <XAxis dataKey="day" stroke="#9fb0c3" />
                <YAxis stroke="#9fb0c3" />
                <Tooltip
                  contentStyle={{
                    background: "#0c1722",
                    border: "1px solid rgba(148,163,184,.24)",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#19d3c5"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="transfers"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface premium-card rounded-lg p-5">
          <SectionHeader
            title="Published agent"
            description={agent.businessName}
          />
          <div className="space-y-4">
            <Detail label="Name" value={agent.name} />
            <Detail
              label="Status"
              value={`${agent.status} v${agent.version}`}
            />
            <Detail
              label="Voice"
              value={
                voiceProfiles.find((voice) => voice.id === agent.voiceId)
                  ?.name ?? agent.voiceId
              }
            />
            <Detail
              label="Tools"
              value={`${agent.enabledTools.length} enabled`}
            />
            <div className="rounded-lg border border-teal-signal/20 bg-teal-signal/10 p-3">
              <p className="text-xs font-black uppercase text-teal-signal">
                Next best action
              </p>
              <p className="mt-1 text-sm text-slate-200">
                Attach a live provider when Twilio and AI credentials are ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentsSection({
  agent,
  selectedTemplate,
  updateAgent,
  applyTemplate,
  publish,
}: {
  agent: AgentConfig;
  selectedTemplate: Industry;
  updateAgent: <K extends keyof AgentConfig>(
    key: K,
    value: AgentConfig[K],
  ) => void;
  applyTemplate: (industry: Industry) => void;
  publish: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <div className="surface rounded-lg p-5">
          <SectionHeader
            title="Industry templates"
            description="Editable after creation."
          />
          <div className="grid gap-3 md:grid-cols-4">
            {industryTemplates.map((template) => (
              <button
                key={template.id}
                className={`premium-card rounded-lg border p-4 text-left ${
                  selectedTemplate === template.id
                    ? "border-teal-signal bg-teal-signal/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
                onClick={() => applyTemplate(template.id)}
              >
                <p className="font-black text-white">{template.name}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {template.transferConditions.slice(0, 2).join(", ")}
                </p>
              </button>
            ))}
          </div>
        </div>

        <BuilderSection title="Identity">
          <Field
            label="Agent name"
            value={agent.name}
            onChange={(value) => updateAgent("name", value)}
          />
          <Field
            label="Business name"
            value={agent.businessName}
            onChange={(value) => updateAgent("businessName", value)}
          />
          <Field
            label="Agent role"
            value={agent.role}
            onChange={(value) => updateAgent("role", value)}
          />
          <label className="md:col-span-2 text-sm font-semibold text-slate-300">
            <span className="mb-2 block">Description</span>
            <textarea
              className="field min-h-28"
              value={agent.description}
              onChange={(event) =>
                updateAgent("description", event.target.value)
              }
            />
          </label>
        </BuilderSection>

        <BuilderSection title="Voice">
          <label className="text-sm font-semibold text-slate-300">
            <span className="mb-2 block">Provider and voice</span>
            <select
              className="field"
              value={agent.voiceId}
              onChange={(event) => updateAgent("voiceId", event.target.value)}
            >
              {voiceProfiles.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.provider} - {voice.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Language"
            value={agent.language}
            onChange={(value) => updateAgent("language", value)}
          />
          <VoiceGallery compact />
        </BuilderSection>

        <BuilderSection title="Conversation and AI">
          <label className="md:col-span-2 text-sm font-semibold text-slate-300">
            <span className="mb-2 block">System prompt</span>
            <textarea
              className="field min-h-36"
              value={agent.systemPrompt}
              onChange={(event) =>
                updateAgent("systemPrompt", event.target.value)
              }
            />
          </label>
          <Field
            label="Welcome message"
            value={agent.welcomeMessage}
            onChange={(value) => updateAgent("welcomeMessage", value)}
          />
          <label className="text-sm font-semibold text-slate-300">
            <span className="mb-2 block">Interruption behavior</span>
            <select
              className="field"
              value={agent.interruptionBehavior}
              onChange={(event) =>
                updateAgent(
                  "interruptionBehavior",
                  event.target.value as AgentConfig["interruptionBehavior"],
                )
              }
            >
              <option value="allow">Allow barge-in</option>
              <option value="defer">Defer until sentence boundary</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <Field
            label="Model"
            value={agent.model}
            onChange={(value) => updateAgent("model", value)}
          />
          <label className="text-sm font-semibold text-slate-300">
            <span className="mb-2 block">Temperature</span>
            <input
              className="field"
              type="number"
              step="0.1"
              min="0"
              max="1.5"
              value={agent.temperature}
              onChange={(event) =>
                updateAgent("temperature", Number(event.target.value))
              }
            />
          </label>
        </BuilderSection>

        <BuilderSection title="Knowledge, telephony, tools, post-call">
          <DetailBlock title="Knowledge bases" items={agent.knowledgeBaseIds} />
          <DetailBlock
            title="Assigned numbers"
            items={agent.assignedNumberIds}
          />
          <DetailBlock
            title="Transfer destinations"
            items={agent.transferDestinations}
          />
          <DetailBlock
            title="Enabled tools"
            items={agent.enabledTools.map(
              (tool) =>
                `${tool.name}${tool.confirmationRequired ? " · confirm" : ""}`,
            )}
          />
        </BuilderSection>
      </div>

      <aside className="surface h-fit rounded-lg p-5">
        <SectionHeader
          title="Versions"
          description="Draft, publish, archive, rollback foundation."
        />
        <div className="space-y-3">
          <Detail
            label="Current status"
            value={`${agent.status} v${agent.version}`}
          />
          <Detail label="Recording" value={agent.recordingMode} />
          <Detail label="Tool policy" value={agent.toolPolicy} />
          <button className="btn-primary w-full" onClick={publish}>
            <Save aria-hidden="true" size={18} />
            Test and publish
          </button>
          <button className="btn-secondary w-full">
            <RotateCcw aria-hidden="true" size={18} />
            Roll back to v{Math.max(1, agent.version - 1)}
          </button>
        </div>
      </aside>
    </div>
  );
}

function PhoneNumbersSection({ agent }: { agent: AgentConfig }) {
  const numbers = [
    {
      id: "num_mock_main",
      number: "+1 555 010 0900",
      capability: "Voice, SMS, transfer",
      status: "Assigned",
      provider: "Mock",
    },
    {
      id: "num_twilio_pending",
      number: "+1 555 010 0901",
      capability: "Voice",
      status: "Connect credentials",
      provider: "Twilio",
    },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Numbers"
          description="Connect existing numbers or assign mock numbers locally."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-3">Number</th>
                <th>Provider</th>
                <th>Capabilities</th>
                <th>Status</th>
                <th>Assigned agent</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map((number) => (
                <tr key={number.id} className="border-t border-white/10">
                  <td className="py-4 font-bold text-white">{number.number}</td>
                  <td>{number.provider}</td>
                  <td>{number.capability}</td>
                  <td>
                    <Badge>{number.status}</Badge>
                  </td>
                  <td>
                    {number.id === "num_mock_main" ? agent.name : "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Release confirmation"
          description="Number release requires explicit confirmation in production."
        />
        <button className="btn-secondary w-full">
          Connect existing number
        </button>
        <button className="btn-secondary mt-3 w-full">
          Purchase-number placeholder
        </button>
      </div>
    </div>
  );
}

function CallsSection() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Stored calls"
          description="Search, filters, pagination, CSV export, and retention-aware deletion foundation."
        />
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Detail label="Caller" value={demoCallSummary.caller} />
            <Detail label="Agent" value={demoCallSummary.agent} />
            <Detail label="Outcome" value={demoCallSummary.outcome} />
            <Detail
              label="Cost"
              value={`$${(demoCallSummary.cost.totalCents / 100).toFixed(2)}`}
            />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {demoCalls.map((event) => (
            <div
              key={event.id}
              className="grid gap-3 rounded-lg border border-white/10 p-3 text-sm md:grid-cols-[8.5rem_1fr_5rem]"
            >
              <span className="font-bold text-teal-signal">{event.type}</span>
              <span className="text-slate-300">{event.text}</span>
              <span className="text-right text-slate-500">{event.atMs}ms</span>
            </div>
          ))}
        </div>
      </div>
      <aside className="surface rounded-lg p-5">
        <SectionHeader
          title="Call detail"
          description="Transcript, tool timeline, summary, outcome, latency, webhooks."
        />
        <div className="space-y-3">
          <Detail label="Duration" value={demoCallSummary.duration} />
          <Detail label="Sentiment" value={demoCallSummary.sentiment} />
          <Detail label="Transfer" value={demoCallSummary.transfer} />
          <Detail label="Recording" value="Mock recording placeholder" />
          <Detail label="Latency" value="TTFT 340ms · TTS 420ms" />
        </div>
      </aside>
    </div>
  );
}

function LiveCallsSection({
  liveStarted,
  start,
  events,
}: {
  liveStarted: boolean;
  start: () => void;
  events: typeof demoCalls;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Active call monitor"
          description="Mock stream with transcript, state, tools, and supervisor transfer action."
        />
        <button className="btn-primary mb-5" onClick={start}>
          <Radio aria-hidden="true" size={18} />
          {liveStarted ? "Restart simulation" : "Start simulation"}
        </button>
        <div className="space-y-3" aria-live="polite">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge>{event.type}</Badge>
                {event.latencyMs ? (
                  <span className="text-xs text-slate-500">
                    {event.latencyMs}ms
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-slate-300">{event.text}</p>
            </div>
          ))}
        </div>
      </div>
      <aside className="surface h-fit rounded-lg p-5">
        <SectionHeader
          title="Supervisor controls"
          description="Listen and whisper are provider-dependent future controls."
        />
        <button className="btn-primary w-full">
          <LifeBuoy aria-hidden="true" size={18} />
          Transfer to human
        </button>
        <button className="btn-secondary mt-3 w-full" disabled>
          Listen unavailable locally
        </button>
        <button className="btn-secondary mt-3 w-full" disabled>
          Whisper unavailable locally
        </button>
      </aside>
    </div>
  );
}

function KnowledgeSection({
  query,
  setQuery,
  results,
}: {
  query: string;
  setQuery: (value: string) => void;
  results: Array<{ document: string; chunk: string; warning: string }>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Knowledge-base management"
          description="CRUD, upload, chunking, embeddings, source display, and retrieval test console."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {demoKnowledgeDocuments.map((doc) => (
            <article
              key={doc.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-white">{doc.name}</p>
                <Badge>{doc.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {doc.type} · {doc.chunks.length} chunks · tenant scoped
              </p>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
          Uploaded documents are treated as untrusted content. The agent must
          not follow instructions embedded inside uploaded files.
        </div>
      </div>
      <aside className="surface rounded-lg p-5">
        <SectionHeader
          title="Retrieval test"
          description="Results are constrained to the active organization."
        />
        <label className="text-sm font-semibold text-slate-300">
          <span className="mb-2 block">Query</span>
          <input
            className="field"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="mt-4 space-y-3">
          {results.map((result) => (
            <div
              key={`${result.document}-${result.chunk}`}
              className="rounded-lg border border-white/10 p-3"
            >
              <p className="text-xs font-bold uppercase text-teal-signal">
                {result.document} · {result.warning}
              </p>
              <p className="mt-2 text-sm text-slate-300">{result.chunk}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function AnalyticsSection() {
  const pieData = [
    { name: "Contained", value: 84 },
    { name: "Transferred", value: 10 },
    { name: "Failed", value: 6 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Answered" value="431" detail="95.1%" />
        <Metric label="Avg duration" value="2m 42s" detail="Inbound median" />
        <Metric label="Transfer rate" value="10%" detail="Human escalation" />
        <Metric label="Failure rate" value="1.8%" detail="Provider + tool" />
        <Metric label="Tool success" value="97%" detail="Mock tools" />
        <Metric label="Provider errors" value="3" detail="Seeded sample" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Calls and transfers">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoUsageByDay}>
              <CartesianGrid stroke="rgba(148,163,184,.16)" />
              <XAxis dataKey="day" stroke="#9fb0c3" />
              <YAxis stroke="#9fb0c3" />
              <Tooltip
                contentStyle={{
                  background: "#0c1722",
                  border: "1px solid rgba(148,163,184,.24)",
                  color: "#fff",
                }}
              />
              <Bar dataKey="calls" fill="#19d3c5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="transfers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Outcomes">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={100}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={statusColors[index % statusColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0c1722",
                  border: "1px solid rgba(148,163,184,.24)",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}

function IntegrationsSection() {
  const integrations = [
    ["Telephony", "Mock active, Twilio adapter available", "ready"],
    ["STT", "Mock transcript provider", "ready"],
    ["TTS", "Browser/mock voice previews", "ready"],
    [
      "LLM",
      "OpenAI-compatible interface, mock local responses",
      "unconfigured",
    ],
    [
      "Embeddings",
      "pgvector schema, mock deterministic retrieval",
      "unconfigured",
    ],
    ["Object storage", "MinIO in Docker topology", "unconfigured"],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {integrations.map(([name, detail, status]) => (
        <article key={name} className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white">{name}</h2>
            <Badge>{status}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
        </article>
      ))}
    </div>
  );
}

function ApiWebhooksSection({
  apiKeys,
  createKey,
  deliveries,
  replayWebhook,
}: {
  apiKeys: Array<ReturnType<typeof createMaskedApiKey>>;
  createKey: () => void;
  deliveries: Array<{
    id: string;
    event: string;
    status: string;
    attempts: number;
    signed: boolean;
  }>;
  replayWebhook: (id: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="API keys"
          description="Keys are shown once and stored hashed server-side."
        />
        <button className="btn-primary mb-4" onClick={createKey}>
          <KeyRound aria-hidden="true" size={18} />
          Create scoped key
        </button>
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-black text-white">{key.label}</p>
                <code className="rounded bg-black/30 px-2 py-1 text-xs text-teal-signal">
                  {key.masked}
                </code>
              </div>
              {key.secretOnce ? (
                <p className="mt-2 text-sm text-amber-100">
                  Shown once: {key.secretOnce}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">
                {key.scopes.join(", ")} · Last used: {key.lastUsed}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Webhook deliveries"
          description="Signed event delivery with retry and replay foundation."
        />
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="rounded-lg border border-white/10 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-bold text-white">{delivery.event}</p>
                <Badge>{delivery.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {delivery.attempts} attempts · signed: {String(delivery.signed)}
              </p>
              <button
                className="btn-secondary mt-3"
                onClick={() => replayWebhook(delivery.id)}
              >
                Replay delivery
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingSection() {
  const total = demoUsageByDay.reduce((sum, day) => sum + day.cost, 0);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Usage meter"
          description="Decimal-safe values in API models; display is estimated sample data."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Telephony minutes"
            value="1,219"
            detail="$0.02/min sample"
          />
          <Metric
            label="TTS characters"
            value="942k"
            detail="$0.001/1k sample"
          />
          <Metric label="LLM tokens" value="2.1M" detail="$0.003/1k sample" />
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={demoUsageByDay}>
              <CartesianGrid stroke="rgba(148,163,184,.16)" />
              <XAxis dataKey="day" stroke="#9fb0c3" />
              <YAxis stroke="#9fb0c3" />
              <Tooltip
                contentStyle={{
                  background: "#0c1722",
                  border: "1px solid rgba(148,163,184,.24)",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#f6b84b"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <aside className="surface rounded-lg p-5">
        <SectionHeader
          title="Plans"
          description="No live charging in local mode."
        />
        {["Starter", "Growth", "Business", "Enterprise"].map((plan) => (
          <div
            key={plan}
            className="mb-3 flex items-center justify-between rounded-lg border border-white/10 p-3"
          >
            <span className="font-bold text-white">{plan}</span>
            <ChevronRight
              aria-hidden="true"
              size={18}
              className="text-slate-500"
            />
          </div>
        ))}
        <Detail label="Estimated total" value={`$${total.toFixed(2)}`} />
        <Detail label="Monthly limit" value="$500.00" />
        <Detail label="Alert threshold" value="80%" />
      </aside>
    </div>
  );
}

function TeamSection() {
  const team = [
    ["Sana Patel", "Owner", "Active"],
    ["Jordan Lee", "Developer", "Active"],
    ["Mika Romero", "Analyst", "Invited"],
    ["Riley Chen", "Manager", "Active"],
  ];
  return (
    <div className="surface rounded-lg p-5">
      <SectionHeader
        title="Members and invitations"
        description="RBAC roles apply server-side to tenant-owned records."
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-3">Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map(([name, role, status]) => (
              <tr key={name} className="border-t border-white/10">
                <td className="py-4 font-bold text-white">{name}</td>
                <td>{role}</td>
                <td>
                  <Badge>{status}</Badge>
                </td>
                <td>
                  <button className="btn-secondary">Edit role</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsSection() {
  const audit = [
    "agent.published by owner@votell.local",
    "api_key.created by owner@votell.local",
    "tool.confirmed create_reservation_request",
    "retention.updated transcripts 180 days",
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Consent and safety"
          description="Deployment requires legal review and jurisdiction-specific configuration."
        />
        {[
          "AI-agent disclosure enabled",
          "Recording consent announcement enabled",
          "Do-not-call suppression model configured",
          "Outbound calling windows timezone-aware",
          "Emergency escalation transfers to authorized human",
          "No payment-card collection in AI flow",
        ].map((item) => (
          <div
            key={item}
            className="mb-3 flex items-center gap-3 rounded-lg border border-white/10 p-3"
          >
            <Check aria-hidden="true" size={18} className="text-teal-signal" />
            <span className="text-sm text-slate-300">{item}</span>
          </div>
        ))}
      </div>
      <div className="surface rounded-lg p-5">
        <SectionHeader
          title="Audit log"
          description="Security-relevant changes and confirmations are recorded."
        />
        <div className="space-y-3">
          {audit.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-white/10 p-3 text-sm text-slate-300"
            >
              <ShieldCheck
                aria-hidden="true"
                size={16}
                className="mr-2 inline text-teal-signal"
              />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="surface rounded-lg p-5">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-teal-signal">{detail}</p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-300">
      <span className="mb-2 block">{label}</span>
      <input
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function BuilderSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface rounded-lg p-5">
      <SectionHeader
        title={title}
        description="Validated structured configuration, not an uncontrolled prompt blob."
      />
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <p className="font-black text-white">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-teal-signal/30 px-2.5 py-1 text-xs font-bold text-teal-signal">
      {children}
    </span>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface rounded-lg p-5">
      <SectionHeader
        title={title}
        description="Filters support date range, organization, location, agent, number, direction, and outcome."
      />
      <div className="h-80">{children}</div>
    </div>
  );
}
