# Architecture

Votell uses a TypeScript-first workspace with a Next.js web app, shared contracts, and a FastAPI backend surface. Local demo mode keeps external provider behavior mocked while preserving provider interfaces for telephony, STT, TTS, LLM, embeddings, webhooks, usage, and post-call work.

```mermaid
flowchart LR
  Browser[Next.js web app] --> API[FastAPI API]
  API --> PG[(PostgreSQL + pgvector)]
  API --> Redis[(Redis queue and ephemeral state)]
  API --> MinIO[(S3-compatible recordings/docs)]
  API --> Worker[Post-call worker]
  API --> Voice[Voice orchestrator]
  Voice --> Tel[Telephony provider interface]
  Voice --> STT[STT provider interface]
  Voice --> LLM[LLM provider interface]
  Voice --> TTS[TTS provider interface]
  Worker --> Webhook[Webhook delivery]
```

```mermaid
sequenceDiagram
  participant Phone
  participant Twilio
  participant API
  participant Voice
  participant Tool
  Phone->>Twilio: Inbound call
  Twilio->>API: Signed voice webhook
  API->>Voice: call.started
  Voice->>Voice: STT, policy, retrieval, LLM, TTS
  Voice->>Tool: Confirmed tool execution
  Tool-->>Voice: result
  Voice-->>Twilio: audio/media events
  Voice->>API: transcript, usage, summary
```

```mermaid
flowchart TB
  User[Authenticated user] --> OrgGuard{Active organization}
  OrgGuard --> Agents[agents.organization_id]
  OrgGuard --> Calls[call_sessions.organization_id]
  OrgGuard --> KB[knowledge_bases.organization_id]
  OrgGuard --> Webhooks[webhook_endpoints.organization_id]
  Agents --> Deny[Deny cross-tenant access]
  Calls --> Deny
  KB --> Deny
```

```mermaid
flowchart LR
  Caller[Caller request] --> Readback[Read details back]
  Readback --> Confirm{Confirmed?}
  Confirm -- no --> Abort[Do not execute]
  Confirm -- yes --> Execute[Execute tenant-owned tool]
  Execute --> Audit[Audit confirmation and result]
```
