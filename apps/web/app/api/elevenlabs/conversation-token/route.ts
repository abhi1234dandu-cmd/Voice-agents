import { NextRequest, NextResponse } from "next/server";
import { ELEVENLABS_HOTEL_AGENT } from "@/lib/elevenlabs-agent";

const ELEVENLABS_TOKEN_URL =
  "https://api.elevenlabs.io/v1/convai/conversation/token";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId =
    request.nextUrl.searchParams.get("agentId") ??
    process.env.ELEVENLABS_HOTEL_AGENT_ID ??
    ELEVENLABS_HOTEL_AGENT.agentId;

  if (!apiKey) {
    return NextResponse.json(
      {
        configured: false,
        agentId,
        message:
          "ELEVENLABS_API_KEY is not configured. The client will attempt public-agent connection with agentId.",
      },
      { status: 200 },
    );
  }

  const url = new URL(ELEVENLABS_TOKEN_URL);
  url.searchParams.set("agent_id", agentId);

  const response = await fetch(url, {
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      {
        configured: true,
        agentId,
        error: "Failed to create ElevenLabs conversation token.",
        providerStatus: response.status,
        providerBody: body.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    return NextResponse.json(
      {
        configured: true,
        agentId,
        error: "ElevenLabs token response did not include a token.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    configured: true,
    agentId,
    token: payload.token,
  });
}
