# API Guide

Local API docs are available at `http://localhost:8000/docs` when the FastAPI app is running.

Important endpoint groups:

- `POST /auth/login`
- `GET /organizations`
- `GET /industry-templates`
- `GET /agents`
- `POST /agents`
- `POST /agents/{agent_id}/publish`
- `GET /knowledge-bases`
- `POST /knowledge-bases/{kb_id}/query`
- `POST /calls/simulate`
- `GET /calls`
- `GET /analytics/summary`
- `POST /api-keys`
- `POST /webhooks/{webhook_id}/replay`
- `POST /telephony/twilio/inbound`
- `POST /telephony/twilio/status`

API keys are shown once and stored hashed. Use scopes to limit access to agents, calls, knowledge bases, webhooks, and analytics.
