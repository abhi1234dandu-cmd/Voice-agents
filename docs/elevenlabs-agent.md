# ElevenLabs Hotel Reservation Agent

Votell includes a live ElevenLabs conversational AI page for:

- Agent name: Hotel Reservation Agent
- Agent ID: `agent_1901kxnm7vzwe1xvhrqeq5knzd1n`
- Route: `http://localhost:3000/hotel-reservation-agent`

## Runtime Modes

Public-agent mode:

- Works when the ElevenLabs agent does not require authentication.
- The browser starts the session with `agentId`.
- No API key is required.

Server-token mode:

- Required when the ElevenLabs agent has authentication enabled.
- Add `ELEVENLABS_API_KEY` to `.env.local`.
- The Next.js route `GET /api/elevenlabs/conversation-token` calls ElevenLabs server-side and returns a WebRTC conversation token.
- The API key is never exposed to the browser.

## Environment

```bash
ELEVENLABS_API_KEY=
ELEVENLABS_HOTEL_AGENT_ID=agent_1901kxnm7vzwe1xvhrqeq5knzd1n
NEXT_PUBLIC_ELEVENLABS_HOTEL_AGENT_ID=agent_1901kxnm7vzwe1xvhrqeq5knzd1n
```

## Notes

The UI requests microphone permission before starting a voice session. It also supports typed fallback messages, contextual updates, volume control, mute, feedback, live status, and client tools for reservation summaries.
