"use client";

import { useEffect, useMemo, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import {
  Activity,
  BedDouble,
  CalendarDays,
  CircleStop,
  Hotel,
  Mic,
  MicOff,
  Play,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";
import {
  ELEVENLABS_HOTEL_AGENT,
  formatAgentEvent,
  type AgentEvent,
} from "@/lib/elevenlabs-agent";

type TokenResponse =
  | {
      configured: true;
      agentId: string;
      token: string;
    }
  | {
      configured: false;
      agentId: string;
      message: string;
    }
  | {
      configured: true;
      agentId: string;
      error: string;
      providerStatus?: number;
      providerBody?: string;
    };

const quickPrompts = [
  "I need a king room for two adults tomorrow night.",
  "What is the late check-in policy?",
  "Can you help me create a reservation request?",
  "Please send me the address and check-in details.",
] as const;

function HotelReservationAgentInner() {
  const [events, setEvents] = useState<AgentEvent[]>([
    formatAgentEvent(
      "system",
      "Hotel Reservation Agent is ready. Start a WebRTC session to speak with the ElevenLabs agent.",
    ),
  ]);
  const [textMessage, setTextMessage] = useState("");
  const [contextNote, setContextNote] = useState(
    "Caller is browsing Votell's hotel reservation demo.",
  );
  const [volume, setVolume] = useState(0.72);
  const [authMode, setAuthMode] = useState<
    "server-token" | "public-agent" | "unknown"
  >("unknown");
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const conversation = useConversation({
    volume,
    clientTools: {
      displayReservationSummary: (parameters: Record<string, unknown>) => {
        const summary = JSON.stringify(parameters, null, 2);
        setEvents((current) => [
          formatAgentEvent("tool", `Reservation summary received:\n${summary}`),
          ...current,
        ]);
        return "Reservation summary displayed in the Votell browser console.";
      },
      captureReservationIntent: (parameters: Record<string, unknown>) => {
        setEvents((current) => [
          formatAgentEvent(
            "tool",
            `Captured reservation intent: ${JSON.stringify(parameters)}`,
          ),
          ...current,
        ]);
        return "Reservation intent captured locally.";
      },
    },
    overrides: {
      agent: {
        firstMessage: ELEVENLABS_HOTEL_AGENT.defaultFirstMessage,
        language: "en",
      },
    },
    onConnect: ({ conversationId }) => {
      setEvents((current) => [
        formatAgentEvent(
          "system",
          `Connected. Conversation ID: ${conversationId}`,
        ),
        ...current,
      ]);
    },
    onDisconnect: (details) => {
      setEvents((current) => [
        formatAgentEvent(
          "system",
          `Disconnected${details?.reason ? `: ${details.reason}` : ""}.`,
        ),
        ...current,
      ]);
    },
    onMessage: (message) => {
      setEvents((current) => [
        formatAgentEvent(
          "message",
          `${message.role === "agent" ? "Agent" : "Guest"}: ${message.message}`,
        ),
        ...current,
      ]);
    },
    onError: (message, context) => {
      setEvents((current) => [
        formatAgentEvent(
          "error",
          `${message}${context ? ` ${JSON.stringify(context).slice(0, 180)}` : ""}`,
        ),
        ...current,
      ]);
    },
    onModeChange: ({ mode }) => {
      setEvents((current) => [
        formatAgentEvent("mode", `Agent mode changed to ${mode}.`),
        ...current,
      ]);
    },
    onStatusChange: ({ status }) => {
      setEvents((current) => [
        formatAgentEvent("status", `Connection status: ${status}.`),
        ...current,
      ]);
    },
  });

  const connected = conversation.status === "connected";
  const connecting = conversation.status === "connecting" || isStarting;

  const statusLabel = useMemo(() => {
    if (connected) return "Connected";
    if (connecting) return "Connecting";
    return "Ready";
  }, [connected, connecting]);

  useEffect(() => {
    if (!connected) {
      setInputLevel(0);
      setOutputLevel(0);
      return;
    }
    const timer = window.setInterval(() => {
      setInputLevel(conversation.getInputVolume());
      setOutputLevel(conversation.getOutputVolume());
    }, 180);
    return () => window.clearInterval(timer);
  }, [connected, conversation]);

  async function startConversation() {
    setIsStarting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const response = await fetch(
        `/api/elevenlabs/conversation-token?agentId=${encodeURIComponent(
          ELEVENLABS_HOTEL_AGENT.agentId,
        )}`,
        { cache: "no-store" },
      );
      const tokenPayload = (await response.json()) as TokenResponse;

      if ("token" in tokenPayload && tokenPayload.token) {
        setAuthMode("server-token");
        conversation.startSession({
          conversationToken: tokenPayload.token,
          connectionType: "webrtc",
          userId: "votell-demo-user",
          dynamicVariables: {
            business_name: "Votell Demo Hotel",
            requested_workflow: "hotel_reservation",
          },
        });
      } else {
        setAuthMode("public-agent");
        conversation.startSession({
          agentId: ELEVENLABS_HOTEL_AGENT.agentId,
          connectionType: "webrtc",
          userId: "votell-demo-user",
          dynamicVariables: {
            business_name: "Votell Demo Hotel",
            requested_workflow: "hotel_reservation",
          },
        });
      }

      setEvents((current) => [
        formatAgentEvent(
          "system",
          "Microphone permission granted. Starting ElevenLabs WebRTC conversation.",
        ),
        ...current,
      ]);
    } catch (error) {
      setEvents((current) => [
        formatAgentEvent(
          "error",
          error instanceof Error
            ? error.message
            : "Could not start conversation.",
        ),
        ...current,
      ]);
    } finally {
      setIsStarting(false);
    }
  }

  function stopConversation() {
    conversation.endSession();
  }

  function sendMessage(message = textMessage) {
    const trimmed = message.trim();
    if (!trimmed) return;
    conversation.sendUserMessage(trimmed);
    conversation.sendUserActivity();
    setTextMessage("");
    setEvents((current) => [
      formatAgentEvent("message", `Typed guest message: ${trimmed}`),
      ...current,
    ]);
  }

  function sendContext() {
    const trimmed = contextNote.trim();
    if (!trimmed) return;
    conversation.sendContextualUpdate(trimmed);
    setEvents((current) => [
      formatAgentEvent(
        "system",
        `Context sent without triggering response: ${trimmed}`,
      ),
      ...current,
    ]);
  }

  function updateVolume(next: number) {
    setVolume(next);
    conversation.setVolume({ volume: next });
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <div className="glass-rail rounded-lg p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[linear-gradient(135deg,#19d3c5,#8b5cf6)] text-graphite-950">
              <Hotel aria-hidden="true" size={26} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase text-teal-signal">
                ElevenLabs live deployment
              </p>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                {ELEVENLABS_HOTEL_AGENT.name}
              </h1>
            </div>
          </div>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Talk to the deployed ElevenLabs conversational AI agent using
            WebRTC. The server token route keeps `ELEVENLABS_API_KEY` out of the
            browser; if no key is configured, the UI attempts the public-agent
            flow.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatusTile label="Status" value={statusLabel} />
            <StatusTile
              label="Agent ID"
              value={ELEVENLABS_HOTEL_AGENT.agentId.slice(0, 18) + "..."}
            />
            <StatusTile label="Auth mode" value={authMode.replace("-", " ")} />
          </div>
        </div>

        <div className="surface rounded-lg p-5">
          <div className="flex flex-wrap gap-3">
            {connected ? (
              <button className="btn-secondary" onClick={stopConversation}>
                <CircleStop aria-hidden="true" size={18} />
                Stop
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={startConversation}
                disabled={connecting}
              >
                <Play aria-hidden="true" size={18} />
                {connecting ? "Starting..." : "Start voice session"}
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => conversation.setMuted(!conversation.isMuted)}
              disabled={!connected}
            >
              {conversation.isMuted ? (
                <MicOff aria-hidden="true" size={18} />
              ) : (
                <Mic aria-hidden="true" size={18} />
              )}
              {conversation.isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => conversation.sendFeedback(true)}
              disabled={!conversation.canSendFeedback}
            >
              <ThumbsUp aria-hidden="true" size={18} />
              Good
            </button>
            <button
              className="btn-secondary"
              onClick={() => conversation.sendFeedback(false)}
              disabled={!conversation.canSendFeedback}
            >
              <ThumbsDown aria-hidden="true" size={18} />
              Poor
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-300">
              <span className="mb-2 flex items-center gap-2">
                <Volume2
                  aria-hidden="true"
                  size={17}
                  className="text-teal-signal"
                />
                Agent volume
              </span>
              <input
                className="w-full"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => updateVolume(Number(event.target.value))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <LevelMeter label="Mic" value={inputLevel} />
              <LevelMeter label="Agent" value={outputLevel} />
            </div>
          </div>
        </div>

        <div className="surface rounded-lg p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <CalendarDays
              aria-hidden="true"
              size={20}
              className="text-teal-signal"
            />
            Reservation prompts
          </h2>
          <div className="mt-4 grid gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left text-sm font-semibold text-slate-200 hover:border-teal-signal/50"
                onClick={() => sendMessage(prompt)}
                disabled={!connected}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="surface rounded-lg p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <BedDouble
              aria-hidden="true"
              size={20}
              className="text-teal-signal"
            />
            Typed fallback and context
          </h2>
          <div className="mt-4 flex gap-2">
            <input
              className="field"
              value={textMessage}
              onChange={(event) => {
                setTextMessage(event.target.value);
                if (connected) conversation.sendUserActivity();
              }}
              placeholder="Type a reservation question..."
            />
            <button
              className="btn-primary"
              onClick={() => sendMessage()}
              disabled={!connected}
            >
              <Send aria-hidden="true" size={18} />
            </button>
          </div>
          <label className="mt-4 block text-sm font-semibold text-slate-300">
            <span className="mb-2 block">Contextual update</span>
            <textarea
              className="field min-h-24"
              value={contextNote}
              onChange={(event) => setContextNote(event.target.value)}
            />
          </label>
          <button
            className="btn-secondary mt-3"
            onClick={sendContext}
            disabled={!connected}
          >
            <Sparkles aria-hidden="true" size={18} />
            Send context silently
          </button>
        </div>

        <div className="surface rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Activity
                aria-hidden="true"
                size={20}
                className="text-teal-signal"
              />
              Live conversation events
            </h2>
            <span className="rounded-full border border-teal-signal/30 px-2.5 py-1 text-xs font-bold text-teal-signal">
              {conversation.mode}
            </span>
          </div>
          <div
            className="mt-4 max-h-[34rem] space-y-3 overflow-auto pr-1"
            aria-live="polite"
          >
            {events.map((event) => (
              <article
                key={event.id}
                className="event-enter rounded-lg border border-white/10 bg-white/[0.035] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-teal-signal">
                    {event.type}
                  </span>
                  <span className="text-xs text-slate-500">{event.at}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {event.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function LevelMeter({ label, value }: { label: string; value: number }) {
  const width = `${Math.min(100, Math.max(0, value * 100))}%`;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#19d3c5,#8b5cf6)]"
          style={{ width }}
        />
      </div>
    </div>
  );
}

export function HotelReservationAgentConsole() {
  return (
    <ConversationProvider>
      <HotelReservationAgentInner />
    </ConversationProvider>
  );
}
