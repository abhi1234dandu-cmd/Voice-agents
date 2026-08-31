import { z } from "zod";

export const roles = [
  "Owner",
  "Administrator",
  "Developer",
  "Manager",
  "Analyst",
  "Agent/Operator"
] as const;

export const industries = ["motel", "restaurant", "call-center", "factory"] as const;
export type Industry = (typeof industries)[number];

export type VoiceProfile = {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  tone: string;
  genderPresentation: string;
  industry: Industry | "all";
  provider: "Mock TTS" | "Configurable TTS";
  sampleScript: string;
  speakingRate: number;
};

export const voiceProfiles: VoiceProfile[] = [
  {
    id: "ava",
    name: "Ava",
    language: "English",
    languageCode: "en-US",
    tone: "Warm",
    genderPresentation: "Feminine",
    industry: "motel",
    provider: "Mock TTS",
    sampleScript:
      "Thanks for calling Northstar Inn. I can help with room availability, arrival details, and front-desk transfers.",
    speakingRate: 0.92
  },
  {
    id: "noah",
    name: "Noah",
    language: "English",
    languageCode: "en-US",
    tone: "Calm",
    genderPresentation: "Masculine",
    industry: "call-center",
    provider: "Mock TTS",
    sampleScript:
      "I can help verify the reason for your call, open a support ticket, or schedule a callback with the right team.",
    speakingRate: 0.88
  },
  {
    id: "maya",
    name: "Maya",
    language: "English",
    languageCode: "en-US",
    tone: "Energetic",
    genderPresentation: "Feminine",
    industry: "restaurant",
    provider: "Mock TTS",
    sampleScript:
      "Welcome to Ember Table. I can check reservation times, answer menu questions, and send directions.",
    speakingRate: 1.05
  },
  {
    id: "liam",
    name: "Liam",
    language: "English",
    languageCode: "en-GB",
    tone: "Professional",
    genderPresentation: "Masculine",
    industry: "call-center",
    provider: "Mock TTS",
    sampleScript:
      "I will capture the caller's intent, confirm key details, and route urgent requests with a concise summary.",
    speakingRate: 0.95
  },
  {
    id: "sofia",
    name: "Sofia",
    language: "English/Spanish",
    languageCode: "es-US",
    tone: "Bilingual",
    genderPresentation: "Feminine",
    industry: "motel",
    provider: "Mock TTS",
    sampleScript:
      "Hola, gracias por llamar. I can help in English or Spanish with reservations and check-in information.",
    speakingRate: 0.93
  },
  {
    id: "arjun",
    name: "Arjun",
    language: "English",
    languageCode: "en-IN",
    tone: "Clear",
    genderPresentation: "Masculine",
    industry: "factory",
    provider: "Mock TTS",
    sampleScript:
      "Operations desk is ready. I can log maintenance issues, supplier arrivals, and shift hotline updates.",
    speakingRate: 0.9
  },
  {
    id: "emma",
    name: "Emma",
    language: "English",
    languageCode: "en-US",
    tone: "Empathetic",
    genderPresentation: "Feminine",
    industry: "all",
    provider: "Mock TTS",
    sampleScript:
      "I can gather appointment details, explain next steps, and transfer sensitive requests to a human specialist.",
    speakingRate: 0.86
  },
  {
    id: "marcus",
    name: "Marcus",
    language: "English",
    languageCode: "en-US",
    tone: "Confident",
    genderPresentation: "Masculine",
    industry: "factory",
    provider: "Mock TTS",
    sampleScript:
      "Dispatch line connected. I can coordinate delivery updates, route escalation calls, and close the loop.",
    speakingRate: 0.98
  }
];

export const toolDefinitionSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(8),
  confirmationRequired: z.boolean(),
  timeoutMs: z.number().int().min(100).max(30000),
  tenantOwned: z.boolean(),
  auditBehavior: z.enum(["always", "on_failure", "none"])
});

export const agentConfigSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(2),
  businessName: z.string().min(2),
  industry: z.enum(industries),
  role: z.string().min(2),
  description: z.string(),
  voiceId: z.string(),
  language: z.string(),
  systemPrompt: z.string().min(20),
  welcomeMessage: z.string().min(4),
  interruptionBehavior: z.enum(["allow", "defer", "disabled"]),
  silenceTimeoutSeconds: z.number().int().min(3).max(60),
  maxCallDurationMinutes: z.number().int().min(1).max(120),
  modelProvider: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(1.5),
  toolPolicy: z.enum(["confirm-consequential", "auto-safe-only", "manual-review"]),
  knowledgeBaseIds: z.array(z.string()),
  assignedNumberIds: z.array(z.string()),
  recordingMode: z.enum(["off", "with-consent", "always-with-consent"]),
  transferDestinations: z.array(z.string()),
  enabledTools: z.array(toolDefinitionSchema),
  postCallWebhookUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  version: z.number().int().min(1)
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export type IndustryTemplate = {
  id: Industry;
  name: string;
  starterPrompt: string;
  voiceRecommendation: string;
  exampleKnowledge: string[];
  enabledTools: string[];
  extractionSchema: string[];
  transferConditions: string[];
  sampleConversations: string[];
};

export const industryTemplates: IndustryTemplate[] = [
  {
    id: "motel",
    name: "Motel Front Desk",
    starterPrompt:
      "You are a front-desk AI agent. Use approved property knowledge only, collect dates and party size, and transfer urgent or uncertain calls.",
    voiceRecommendation: "ava",
    exampleKnowledge: ["Check-in starts at 3 PM.", "Pets require front-desk confirmation.", "Airport shuttle is not available."],
    enabledTools: ["check_availability", "create_reservation_request", "send_sms", "transfer_to_human", "end_call"],
    extractionSchema: ["arrival_date", "departure_date", "room_type", "guest_name", "callback_number"],
    transferConditions: ["emergency", "payment card request", "angry caller", "policy exception"],
    sampleConversations: ["Caller asks about tonight availability and requests a king room."]
  },
  {
    id: "restaurant",
    name: "Restaurant Host",
    starterPrompt:
      "You are a restaurant host AI. Confirm reservation details before creating requests and transfer allergy or payment issues to staff.",
    voiceRecommendation: "maya",
    exampleKnowledge: ["Dinner service starts at 5 PM.", "Patio seating is weather dependent.", "Nut allergies require staff review."],
    enabledTools: ["create_restaurant_reservation", "send_sms", "order_request", "transfer_to_human", "end_call"],
    extractionSchema: ["party_size", "reservation_time", "guest_name", "dietary_notes", "phone"],
    transferConditions: ["severe allergy", "private event", "same-day large party", "refund request"],
    sampleConversations: ["Caller books a table for four and asks about gluten-free options."]
  },
  {
    id: "call-center",
    name: "Call-Center Support",
    starterPrompt:
      "You are a support triage AI. Verify identity where required, classify intent, resolve FAQs, and create tickets for unresolved work.",
    voiceRecommendation: "noah",
    exampleKnowledge: ["Support hours are 7 AM to 7 PM local time.", "Account changes require verification.", "Callbacks are scheduled in 30-minute windows."],
    enabledTools: ["create_support_ticket", "schedule_callback", "send_sms", "transfer_to_human", "end_call"],
    extractionSchema: ["caller_name", "account_reference", "intent", "urgency", "preferred_callback_time"],
    transferConditions: ["security issue", "billing dispute", "supervisor request", "failed verification"],
    sampleConversations: ["Caller asks to reschedule a callback after verifying their account."]
  },
  {
    id: "factory",
    name: "Factory Operations",
    starterPrompt:
      "You are an operations hotline AI. Log factual details, escalate safety events immediately, and never invent safety procedures.",
    voiceRecommendation: "arjun",
    exampleKnowledge: ["Receiving dock opens at 6 AM.", "Safety incidents transfer to the shift lead.", "Maintenance tickets require location and machine ID."],
    enabledTools: ["create_maintenance_request", "dispatch_request", "send_sms", "transfer_to_human", "end_call"],
    extractionSchema: ["facility", "line", "machine_id", "issue_type", "severity", "reported_by"],
    transferConditions: ["injury", "fire", "chemical spill", "production stoppage"],
    sampleConversations: ["Caller reports a conveyor issue and confirms the maintenance request."]
  }
];

export type CallEventType =
  | "call.started"
  | "call.ringing"
  | "call.answered"
  | "transcript.partial"
  | "transcript.final"
  | "agent.thinking"
  | "agent.speaking"
  | "caller.interrupted"
  | "tool.started"
  | "tool.completed"
  | "tool.failed"
  | "transfer.started"
  | "transfer.completed"
  | "call.ended"
  | "call.failed";

export type CallEvent = {
  id: string;
  organizationId: string;
  callId: string;
  type: CallEventType;
  atMs: number;
  actor: "caller" | "agent" | "system" | "tool";
  text: string;
  latencyMs?: number;
  metadata?: Record<string, string | number | boolean>;
};

export function buildMockCallSimulation(input: {
  organizationId: string;
  callId: string;
  industry: Industry;
  voiceName: string;
  businessName: string;
}): CallEvent[] {
  const industryLine: Record<Industry, string> = {
    motel: "Do you have a queen room available tomorrow night?",
    restaurant: "Can I book a table for four tomorrow at seven?",
    "call-center": "I need help scheduling a callback about my account.",
    factory: "I need to report a maintenance issue on line three."
  };
  const toolName: Record<Industry, string> = {
    motel: "create_reservation_request",
    restaurant: "create_restaurant_reservation",
    "call-center": "schedule_callback",
    factory: "create_maintenance_request"
  };

  return [
    {
      id: `${input.callId}-1`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "call.started",
      atMs: 0,
      actor: "system",
      text: "Simulated inbound call started. This is demo mode."
    },
    {
      id: `${input.callId}-2`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "agent.speaking",
      atMs: 600,
      actor: "agent",
      text: `Hi, this is ${input.voiceName} from ${input.businessName}. I am an AI voice assistant. How can I help?`,
      latencyMs: 420
    },
    {
      id: `${input.callId}-3`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "transcript.final",
      atMs: 2100,
      actor: "caller",
      text: industryLine[input.industry],
      latencyMs: 340
    },
    {
      id: `${input.callId}-4`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "agent.thinking",
      atMs: 2600,
      actor: "system",
      text: "Retrieving approved knowledge and preparing a safe tool action.",
      latencyMs: 180
    },
    {
      id: `${input.callId}-5`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "tool.started",
      atMs: 3200,
      actor: "tool",
      text: `${toolName[input.industry]} awaiting caller confirmation.`,
      metadata: { confirmationRequired: true }
    },
    {
      id: `${input.callId}-6`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "transcript.final",
      atMs: 4600,
      actor: "caller",
      text: "Yes, please go ahead and create that request."
    },
    {
      id: `${input.callId}-7`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "tool.completed",
      atMs: 5400,
      actor: "tool",
      text: `${toolName[input.industry]} completed in mock mode.`,
      latencyMs: 760
    },
    {
      id: `${input.callId}-8`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "agent.speaking",
      atMs: 6200,
      actor: "agent",
      text: "I created the request and sent the details to the team. Is there anything else I can help with?"
    },
    {
      id: `${input.callId}-9`,
      organizationId: input.organizationId,
      callId: input.callId,
      type: "call.ended",
      atMs: 7800,
      actor: "system",
      text: "Call ended with contained outcome and mock usage recorded."
    }
  ];
}

export function assertTenantBoundary(activeOrganizationId: string, recordOrganizationId: string) {
  if (activeOrganizationId !== recordOrganizationId) {
    throw new Error("Tenant boundary violation");
  }
}

export function estimateUsageCents(events: CallEvent[]) {
  const durationMs = Math.max(...events.map((event) => event.atMs));
  const minutes = Math.max(1, Math.ceil(durationMs / 60000));
  const transcriptChars = events.reduce((sum, event) => sum + event.text.length, 0);
  const telephonyCents = minutes * 2;
  const ttsCents = Math.ceil(transcriptChars / 1000);
  const llmCents = 3;
  return {
    telephonyCents,
    ttsCents,
    llmCents,
    totalCents: telephonyCents + ttsCents + llmCents
  };
}

export const demoOrganizationId = "org_demo_northstar";

export const demoAgent: AgentConfig = {
  id: "agent_motel_front_desk",
  organizationId: demoOrganizationId,
  name: "Northstar Front Desk",
  businessName: "Northstar Inn",
  industry: "motel",
  role: "Front desk reservation assistant",
  description: "Answers availability questions, gathers reservation requests, and transfers urgent calls.",
  voiceId: "ava",
  language: "English",
  systemPrompt:
    "Use only approved Northstar Inn knowledge. Disclose that you are an AI assistant, confirm consequential actions, and transfer urgent or uncertain requests.",
  welcomeMessage: "Thanks for calling Northstar Inn. I am Ava, an AI assistant. How can I help today?",
  interruptionBehavior: "allow",
  silenceTimeoutSeconds: 8,
  maxCallDurationMinutes: 18,
  modelProvider: "OpenAI-compatible",
  model: "gpt-4.1-mini",
  temperature: 0.3,
  toolPolicy: "confirm-consequential",
  knowledgeBaseIds: ["kb_northstar"],
  assignedNumberIds: ["num_mock_main"],
  recordingMode: "with-consent",
  transferDestinations: ["+15550101999"],
  enabledTools: [
    {
      name: "create_reservation_request",
      description: "Creates a reservation lead after the caller confirms details.",
      confirmationRequired: true,
      timeoutMs: 5000,
      tenantOwned: true,
      auditBehavior: "always"
    },
    {
      name: "send_sms",
      description: "Sends a confirmation or directions text message in mock mode.",
      confirmationRequired: true,
      timeoutMs: 5000,
      tenantOwned: true,
      auditBehavior: "always"
    },
    {
      name: "transfer_to_human",
      description: "Transfers a call to an approved front-desk number.",
      confirmationRequired: false,
      timeoutMs: 8000,
      tenantOwned: true,
      auditBehavior: "always"
    }
  ],
  postCallWebhookUrl: "",
  status: "published",
  version: 3
};
