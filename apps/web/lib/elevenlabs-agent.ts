export const ELEVENLABS_HOTEL_AGENT = {
  name: "Hotel Reservation Agent",
  agentId:
    process.env.NEXT_PUBLIC_ELEVENLABS_HOTEL_AGENT_ID ??
    "agent_1901kxnm7vzwe1xvhrqeq5knzd1n",
  defaultFirstMessage:
    "Thank you for calling Votell reservations. I can help check dates, collect stay details, and prepare a reservation request.",
} as const;

export type AgentEvent = {
  id: string;
  at: string;
  type: "system" | "message" | "error" | "mode" | "tool" | "status";
  text: string;
};

export function formatAgentEvent(
  type: AgentEvent["type"],
  text: string,
): AgentEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    at: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    type,
    text,
  };
}
