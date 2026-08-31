import type { CallEvent, CallEventType } from "@votell/shared-types";

export type ProviderHealth = {
  status: "ready" | "degraded" | "unconfigured";
  message: string;
};

export type OutboundCallRequest = {
  organizationId: string;
  agentId: string;
  to: string;
  from: string;
  idempotencyKey: string;
};

export type TelephonyProvider = {
  name: string;
  health(): Promise<ProviderHealth>;
  validateWebhookSignature(input: {
    url: string;
    headers: Record<string, string | undefined>;
    body: Record<string, string>;
  }): Promise<boolean>;
  createOutboundCall(request: OutboundCallRequest): Promise<{ providerCallId: string; status: string }>;
  transferCall(input: { providerCallId: string; destination: string }): Promise<{ status: string }>;
};

export type STTProvider = {
  name: string;
  health(): Promise<ProviderHealth>;
  streamTranscripts(input: AsyncIterable<Uint8Array>): AsyncIterable<{ text: string; final: boolean; atMs: number }>;
};

export type TTSProvider = {
  name: string;
  health(): Promise<ProviderHealth>;
  synthesize(input: { text: string; voiceId: string; language: string }): Promise<Uint8Array>;
};

export type LLMProvider = {
  name: string;
  health(): Promise<ProviderHealth>;
  streamResponse(input: {
    systemPrompt: string;
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    tools: Array<{ name: string; description: string; schema: unknown }>;
  }): AsyncIterable<{ token: string; done: boolean }>;
};

export type EmbeddingProvider = {
  name: string;
  health(): Promise<ProviderHealth>;
  embed(input: { text: string; organizationId: string }): Promise<number[]>;
};

export type VoicePipelineEvent = CallEvent & {
  stage:
    | "telephony"
    | "audio"
    | "stt"
    | "dialogue"
    | "retrieval"
    | "tool"
    | "llm"
    | "tts"
    | "post-call";
  parentType?: CallEventType;
};
