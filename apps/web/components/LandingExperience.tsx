"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  DatabaseZap,
  Gauge,
  Globe2,
  LockKeyhole,
  MessagesSquare,
  PhoneIncoming,
  Play,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Wrench,
} from "lucide-react";
import { industries, voiceProfiles, type Industry } from "@votell/shared-types";
import { simulateCall } from "@/lib/demo-platform";
import { VoiceGallery } from "@/components/VoiceGallery";
import { SignalConstellation } from "@/components/SignalConstellation";

const industryLabels: Record<Industry, string> = {
  motel: "Motel",
  restaurant: "Restaurant",
  "call-center": "Call center",
  factory: "Factory",
};

const industryCards = [
  {
    title: "Motels",
    copy: "Room availability, late check-in, amenities, urgent transfers",
    Icon: Bot,
  },
  {
    title: "Restaurants",
    copy: "Reservations, menu questions, allergy escalation, directions",
    Icon: CheckCircle2,
  },
  {
    title: "Call centers",
    copy: "Support triage, lead qualification, tickets, callbacks",
    Icon: ShieldCheck,
  },
  {
    title: "Factories",
    copy: "Maintenance intake, dispatch, incident reporting, safety escalation",
    Icon: Wrench,
  },
] as const;

const heroStats = [
  ["820ms", "median mock response"],
  ["84%", "sample containment"],
  ["12", "workflow surfaces"],
  ["0", "paid APIs required"],
] as const;

const architectureLanes = [
  { label: "Phone network", icon: PhoneIncoming, tone: "text-teal-signal" },
  { label: "Streaming STT", icon: AudioLines, tone: "text-violet-200" },
  { label: "Policy + RAG", icon: BrainCircuit, tone: "text-amber-200" },
  { label: "Tool execution", icon: TerminalSquare, tone: "text-rose-200" },
  { label: "TTS response", icon: Route, tone: "text-teal-signal" },
] as const;

const trustControls = [
  "Tenant isolation",
  "Human transfer",
  "Consent prompts",
  "API-key scopes",
  "Webhook signing",
  "Retention policy",
] as const;

const securityCapabilities = [
  { Icon: LockKeyhole, label: "Secrets stay server-side" },
  { Icon: DatabaseZap, label: "Tenant-scoped retrieval" },
  { Icon: Gauge, label: "Latency and cost telemetry" },
  { Icon: MessagesSquare, label: "Human transfer summaries" },
  { Icon: Globe2, label: "Outbound calling windows" },
  { Icon: Radar, label: "Provider health checks" },
  { Icon: Building2, label: "Multi-location operations" },
  { Icon: ShieldCheck, label: "Audit-first actions" },
] as const;

export function LandingExperience() {
  const [industry, setIndustry] = useState<Industry>("motel");
  const [voiceId, setVoiceId] = useState("ava");
  const [businessName, setBusinessName] = useState("Northstar Inn");
  const [started, setStarted] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState(3);

  const events = useMemo(
    () => simulateCall(industry, voiceId, businessName),
    [industry, voiceId, businessName],
  );

  useEffect(() => {
    if (!started) {
      setVisibleEvents(3);
      return;
    }
    setVisibleEvents(1);
    const timer = window.setInterval(() => {
      setVisibleEvents((current) => {
        if (current >= events.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 820);
    return () => window.clearInterval(timer);
  }, [events.length, started]);

  return (
    <main className="overflow-hidden">
      <section
        id="product"
        className="relative min-h-[calc(100svh-80px)] border-b border-white/10"
      >
        <div className="signal-grid absolute inset-0" aria-hidden="true" />
        <SignalConstellation />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,24,0.24)_0%,rgba(7,16,24,0.58)_62%,#071018_100%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-80px)] max-w-7xl flex-col justify-between px-4 pb-8 pt-16 sm:px-6 lg:pt-20">
          <div className="max-w-5xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-signal/30 bg-teal-signal/10 px-3 py-1 text-sm font-bold text-teal-signal">
              <span className="status-dot" aria-hidden="true" />
              Live local demo · production provider architecture
            </div>
            <h1 className="max-w-5xl text-6xl font-black tracking-normal text-white sm:text-7xl lg:text-8xl">
              Votell
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-200 sm:text-2xl">
              AI voice agents built for businesses that never stop answering.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
              Design, deploy, monitor, and govern phone agents for motels,
              restaurants, call centers, and factory operations from one
              polished command center.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                className="btn-primary"
                onClick={() =>
                  document
                    .getElementById("voice-gallery")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Play aria-hidden="true" size={18} />
                Hear Votell
              </button>
              <Link href="/onboarding" className="btn-secondary">
                Build first agent
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link href="/hotel-reservation-agent" className="btn-secondary">
                Open hotel agent
                <Hotel aria-hidden="true" size={18} />
              </Link>
            </div>
          </div>

          <div className="glass-rail mt-10 grid gap-4 rounded-lg p-3 md:grid-cols-[1.1fr_0.9fr] lg:p-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {heroStats.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className="signal-sweep rounded-lg border border-white/10 bg-[#061018]/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">
                    Northstar Front Desk
                  </p>
                  <p className="text-xs text-slate-400">
                    Inbound call · Ava · reservation workflow
                  </p>
                </div>
                <span className="rounded-full bg-teal-signal px-2.5 py-1 text-xs font-black text-graphite-950">
                  ACTIVE
                </span>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {architectureLanes.map(({ label, icon: Icon, tone }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-center"
                  >
                    <Icon
                      aria-hidden="true"
                      size={17}
                      className={`mx-auto ${tone}`}
                    />
                    <p className="mt-2 text-[0.68rem] font-bold uppercase leading-4 text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#08131d] px-4 py-16 sm:px-6">
        <div
          className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start"
          aria-label="Interactive simulated call demo"
        >
          <div>
            <p className="text-sm font-bold uppercase text-teal-signal">
              Voice lab
            </p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Build a caller-ready agent in the browser.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Pick an industry, assign a voice, and watch the agent route the
              caller through transcript, policy, tool confirmation, and
              post-call accounting.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trustControls.map((control) => (
                <div
                  key={control}
                  className="panel premium-card rounded-lg p-4"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    size={18}
                    className="text-teal-signal"
                  />
                  <p className="mt-3 text-sm font-bold text-white">{control}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-lg p-4 shadow-glow lg:p-6">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Industry</span>
                <select
                  className="field"
                  value={industry}
                  onChange={(event) =>
                    setIndustry(event.target.value as Industry)
                  }
                >
                  {industries.map((item) => (
                    <option key={item} value={item}>
                      {industryLabels[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Voice</span>
                <select
                  className="field"
                  value={voiceId}
                  onChange={(event) => setVoiceId(event.target.value)}
                >
                  {voiceProfiles.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Business</span>
                <input
                  className="field"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-[#061018] p-4">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-violet-signal/20 text-violet-200">
                    <PhoneIncoming aria-hidden="true" size={22} />
                  </span>
                  <div>
                    <p className="font-black text-white">
                      Incoming call simulation
                    </p>
                    <p className="text-sm text-slate-400">
                      Mock telephony · visible transcript and tool events
                    </p>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setStarted(true)}
                >
                  <Sparkles aria-hidden="true" size={18} />
                  Start simulated call
                </button>
              </div>

              <div
                className="mt-5 max-h-[28rem] space-y-3 overflow-auto pr-1"
                aria-live="polite"
              >
                {events.slice(0, visibleEvents).map((event) => (
                  <div
                    key={event.id}
                    className="event-enter grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[8rem_1fr]"
                  >
                    <div className="text-xs font-bold uppercase text-slate-500">
                      {event.type}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{event.text}</p>
                      {event.latencyMs ? (
                        <p className="mt-1 text-xs text-teal-signal">
                          {event.latencyMs}ms stage latency
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <VoiceGallery />

      <section className="border-y border-white/10 bg-[#091620] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-teal-signal">
                Voice pipeline
              </p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">
                A real architecture under the glossy surface.
              </h2>
            </div>
            <Link href="/dashboard/integrations" className="btn-secondary">
              Inspect integrations
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            {architectureLanes.map(({ label, icon: Icon, tone }, index) => (
              <article
                key={label}
                className="surface premium-card rounded-lg p-5"
              >
                <div className="flex items-center justify-between">
                  <Icon aria-hidden="true" size={24} className={tone} />
                  <span className="text-xs font-black text-slate-500">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-black text-white">{label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {
                    [
                      "Signed webhooks, status callbacks, media stream boundary.",
                      "Partial/final transcript events with interruption support.",
                      "Tenant-scoped retrieval, guardrails, fallback policy.",
                      "Validated tools, confirmation gates, audit records.",
                      "Sentence-level response streaming and voice output.",
                    ][index]
                  }
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="industries" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-teal-signal">
              Industries
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">
              Templates for businesses where every missed call costs money.
            </h2>
          </div>
          <Link href="/dashboard/agents" className="btn-secondary">
            Open builder
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {industryCards.map(({ title, copy, Icon }) => (
            <article
              key={title}
              className="surface premium-card rounded-lg p-5"
            >
              <Icon aria-hidden="true" className="text-teal-signal" size={24} />
              <h3 className="mt-5 text-lg font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="security"
        className="border-t border-white/10 bg-[#08131d] px-4 py-16 sm:px-6"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase text-teal-signal">
              Security posture
            </p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Built for controlled automation, not runaway phone bots.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Votell keeps consequential actions behind confirmation, isolates
              tenant data server-side, and records the operational trail needed
              by high-call-volume teams.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {securityCapabilities.map(({ Icon, label }) => (
              <div key={label} className="panel premium-card rounded-lg p-4">
                <Icon
                  aria-hidden="true"
                  size={20}
                  className="text-teal-signal"
                />
                <p className="mt-3 text-sm font-bold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
