# Voice Pipeline

The designed real-time path is:

Phone network -> telephony media stream -> audio normalization -> voice activity detection -> streaming STT -> transcript events -> dialogue policy -> retrieval/tool selection -> LLM response -> sentence streaming -> TTS -> telephony audio output.

The MVP implements the event schema and a mock orchestrator path. It tracks time to first transcript, LLM response latency, time to first audio, tool latency, interruption count, provider failures, and call duration in simulated call events.

Call event types:

- `call.started`
- `call.ringing`
- `call.answered`
- `transcript.partial`
- `transcript.final`
- `agent.thinking`
- `agent.speaking`
- `caller.interrupted`
- `tool.started`
- `tool.completed`
- `tool.failed`
- `transfer.started`
- `transfer.completed`
- `call.ended`
- `call.failed`

Real media streaming should keep call-scoped state in Redis, durable records in PostgreSQL, recordings in object storage, and bounded in-memory buffers only.
