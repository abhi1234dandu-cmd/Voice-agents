# Backend Foundation

The FastAPI backend now has service boundaries for configuration, provider readiness, RBAC, tool execution, webhook delivery, retention policy, and audit logging.

Key local endpoints:

- `GET /config/public`
- `GET /providers/readiness`
- `POST /calls/outbound-test`
- `GET /live-calls/{call_id}/events`
- `POST /tools/execute`
- `GET /agents/{agent_id}/versions`
- `POST /webhooks`
- `POST /webhooks/{webhook_id}/replay`
- `GET /webhook-deliveries`
- `GET /audit-logs`
- `GET /retention-policy`
- `PUT /retention-policy`

Consequential tools return `requires_confirmation` until the caller-confirmed payload is submitted with `confirmed=true`. Idempotency keys prevent duplicate outbound test calls and duplicate tool execution.

Provider readiness intentionally reports mock-ready status for local telephony, STT, TTS, and LLM. Real provider credentials can be added through `.env` without changing the browser code.
