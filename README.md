# Votell

Votell is a production-oriented MVP for multi-tenant AI voice agents. The local build demonstrates marketing, onboarding, dashboard workflows, agent configuration, mock call simulation, knowledge testing, usage analytics, API keys, webhooks, audit logs, and provider boundaries without requiring paid voice or telephony credentials.

## What is real vs mock

- Real: Next.js app, strict TypeScript schemas, tenant-bound data model, FastAPI endpoint surface, Twilio signature verification utility, API key hashing, webhook signing, Docker service topology, PostgreSQL schema, local demo workflows, and focused tests.
- Mock/local: telephony calls, voice preview audio, STT, TTS, LLM responses, embeddings, phone-number purchase, billing, recording playback, and live-call media streaming.
- Future/provider-dependent: real listen/whisper, production call recording storage, Stripe charging, high-volume autoscaling, enterprise compliance attestations.

## Prerequisites

- Node.js 20.11 or newer
- npm 10 or newer
- Python 3.11 or newer
- Docker, only if running the full service topology

## Local web demo

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Demo credentials:

- Email: `owner@votell.local`
- Password: `votell-demo-2026`

The browser demo is intentionally self-contained. It labels simulated calls and mock provider behavior wherever no real provider is connected.

## API demo

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
npm run api:dev
```

Open `http://localhost:8000/docs`.

## Docker development

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Web: `http://localhost:3000`
- ElevenLabs Hotel Agent: `http://localhost:3000/hotel-reservation-agent`
- API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO console: `http://localhost:9001`

## Database

The initial PostgreSQL schema is in `apps/api/migrations/versions/0001_initial.sql`. Docker Compose applies it on first database startup.

Manual seed:

```bash
npm run seed
```

## Free Cloud Deployment

The repository includes `render.yaml` for Render Blueprints. Render can create two free web services from the same GitHub repo:

- `votell-web`: Next.js frontend and ElevenLabs token route
- `votell-api`: FastAPI backend

In Render, choose **New > Blueprint**, connect this repository, and deploy the root `render.yaml`. During setup, Render prompts for `sync: false` values:

- `ELEVENLABS_API_KEY`: optional; leave blank if the ElevenLabs agent is public
- `CORS_ORIGINS`: set to the deployed frontend origin, for example `https://votell-web.onrender.com`

Free Render services spin down after idle time, so the first request after inactivity can take about a minute.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
pytest apps/api/tests
```

Primary manual flow:

1. Sign in with the demo credentials.
2. Complete onboarding with the motel template.
3. Open Dashboard -> Agents and publish the draft.
4. Open Knowledge Bases and run a retrieval test.
5. Open Live Calls and start a simulated call.
6. Open Calls to review transcript, events, summary, usage, and outcome.
7. Open API & Webhooks to create a masked API key and replay a signed webhook delivery.

## Documentation

- [Architecture](docs/architecture.md)
- [Local Development](docs/local-development.md)
- [Voice Pipeline](docs/voice-pipeline.md)
- [Telephony Setup](docs/telephony-setup.md)
- [Provider Integration](docs/provider-integration.md)
- [Security and Privacy](docs/security.md)
- [API Guide](docs/api.md)
- [ElevenLabs Hotel Reservation Agent](docs/elevenlabs-agent.md)
- [Backend Foundation](docs/backend-foundation.md)
- [Production Deployment Checklist](docs/production-deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Known Limitations](docs/known-limitations.md)
