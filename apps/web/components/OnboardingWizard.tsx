"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import {
  industries,
  industryTemplates,
  voiceProfiles,
  type Industry,
} from "@votell/shared-types";
import { createAgentFromTemplate, simulateCall } from "@/lib/demo-platform";

const steps = [
  "Organization",
  "Industry",
  "Location",
  "Use case",
  "Voice",
  "Language",
  "Hours",
  "Knowledge",
  "Transfer",
  "Agent",
  "Simulation",
  "Number",
];

type WizardState = {
  organization: string;
  industry: Industry;
  businessName: string;
  location: string;
  useCase: "inbound" | "outbound";
  voiceId: string;
  language: string;
  timezone: string;
  transferNumber: string;
  knowledge: string;
};

const defaultState: WizardState = {
  organization: "Northstar Hospitality Group",
  industry: "motel",
  businessName: "Northstar Inn",
  location: "Boise, ID",
  useCase: "inbound",
  voiceId: "ava",
  language: "English",
  timezone: "America/New_York",
  transferNumber: "+1 555 010 1999",
  knowledge:
    "Check-in starts at 3 PM. Late check-in instructions can be sent by SMS.",
};

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(defaultState);
  const [simulating, setSimulating] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem("votell-onboarding");
    if (stored) {
      const parsed = JSON.parse(stored) as { step: number; state: WizardState };
      setStep(parsed.step);
      setState(parsed.state);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "votell-onboarding",
      JSON.stringify({ step, state }),
    );
  }, [state, step]);

  const template =
    industryTemplates.find((item) => item.id === state.industry) ??
    industryTemplates[0]!;
  const agent = useMemo(
    () => createAgentFromTemplate(state.industry),
    [state.industry],
  );
  const events = useMemo(
    () => simulateCall(state.industry, state.voiceId, state.businessName),
    [state.businessName, state.industry, state.voiceId],
  );

  useEffect(() => {
    if (!simulating) {
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
    }, 620);
    return () => window.clearInterval(timer);
  }, [events.length, simulating]);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" className="btn-ghost">
          <ArrowLeft aria-hidden="true" size={18} />
          Votell
        </Link>
        <div className="rounded-full border border-teal-signal/30 px-3 py-1 text-sm font-bold text-teal-signal">
          Onboarding progress saved locally
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <aside className="surface rounded-lg p-4">
          <ol className="space-y-2">
            {steps.map((label, index) => (
              <li key={label}>
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold ${
                    index === step
                      ? "bg-teal-signal text-graphite-950"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                  onClick={() => setStep(index)}
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="surface rounded-lg p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase text-teal-signal">
              Step {step + 1} of 12
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              {steps[step]}
            </h1>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {step === 0 ? (
              <Field
                label="Organization"
                value={state.organization}
                onChange={(value) => update("organization", value)}
              />
            ) : null}
            {step === 1 ? (
              <label className="text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Industry template</span>
                <select
                  className="field"
                  value={state.industry}
                  onChange={(event) =>
                    update("industry", event.target.value as Industry)
                  }
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {
                        industryTemplates.find((item) => item.id === industry)
                          ?.name
                      }
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {step === 2 ? (
              <>
                <Field
                  label="Business name"
                  value={state.businessName}
                  onChange={(value) => update("businessName", value)}
                />
                <Field
                  label="Location"
                  value={state.location}
                  onChange={(value) => update("location", value)}
                />
              </>
            ) : null}
            {step === 3 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(["inbound", "outbound"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`rounded-lg border p-4 text-left font-bold ${
                      state.useCase === mode
                        ? "border-teal-signal bg-teal-signal/10 text-white"
                        : "border-white/10 text-slate-300"
                    }`}
                    onClick={() => update("useCase", mode)}
                  >
                    {mode === "inbound"
                      ? "Inbound answering"
                      : "Outbound test calls"}
                  </button>
                ))}
              </div>
            ) : null}
            {step === 4 ? (
              <label className="text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Voice</span>
                <select
                  className="field"
                  value={state.voiceId}
                  onChange={(event) => update("voiceId", event.target.value)}
                >
                  {voiceProfiles.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} - {voice.tone}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {step === 5 ? (
              <Field
                label="Language"
                value={state.language}
                onChange={(value) => update("language", value)}
              />
            ) : null}
            {step === 6 ? (
              <Field
                label="Business hours and timezone"
                value={`8 AM - 8 PM, ${state.timezone}`}
                onChange={(value) => update("timezone", value)}
              />
            ) : null}
            {step === 7 ? (
              <label className="md:col-span-2 text-sm font-semibold text-slate-300">
                <span className="mb-2 block">Approved knowledge</span>
                <textarea
                  className="field min-h-40"
                  value={state.knowledge}
                  onChange={(event) => update("knowledge", event.target.value)}
                />
              </label>
            ) : null}
            {step === 8 ? (
              <Field
                label="Transfer number"
                value={state.transferNumber}
                onChange={(value) => update("transferNumber", value)}
              />
            ) : null}
            {step === 9 ? (
              <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="font-black text-white">{agent.name}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {agent.systemPrompt}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.enabledTools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-teal-signal/30 px-2.5 py-1 text-xs font-bold text-teal-signal"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {step === 10 ? (
              <div className="md:col-span-2">
                <button
                  className="btn-primary"
                  onClick={() => setSimulating(true)}
                >
                  <PlayCircle aria-hidden="true" size={18} />
                  Run browser simulation
                </button>
                <div className="mt-4 space-y-3" aria-live="polite">
                  {events.slice(0, visibleEvents).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300"
                    >
                      <span className="font-bold text-teal-signal">
                        {event.type}
                      </span>{" "}
                      {event.text}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {step === 11 ? (
              <div className="md:col-span-2 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="font-black text-white">Mock number ready</p>
                <p className="mt-2 text-sm text-slate-300">
                  +1 555 010 0900 can be assigned in demo mode. Real purchase is
                  behind the telephony provider interface.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
            <button
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ArrowLeft aria-hidden="true" size={18} />
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                className="btn-primary"
                onClick={() =>
                  setStep((current) => Math.min(steps.length - 1, current + 1))
                }
              >
                Continue
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            ) : (
              <Link href="/dashboard/agents" className="btn-primary">
                <CheckCircle2 aria-hidden="true" size={18} />
                Open agent builder
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
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
