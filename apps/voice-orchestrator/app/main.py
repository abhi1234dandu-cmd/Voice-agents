from __future__ import annotations

from dataclasses import dataclass, field
from time import monotonic


@dataclass
class CallState:
    call_id: str
    organization_id: str
    events: list[dict[str, object]] = field(default_factory=list)
    started_at: float = field(default_factory=monotonic)

    def record(self, event_type: str, text: str, stage: str) -> None:
        self.events.append(
            {
                "type": event_type,
                "text": text,
                "stage": stage,
                "elapsed_ms": int((monotonic() - self.started_at) * 1000),
            }
        )


def run_mock_pipeline(call_id: str, organization_id: str) -> CallState:
    state = CallState(call_id=call_id, organization_id=organization_id)
    state.record("call.started", "Call-scoped state initialized.", "telephony")
    state.record("transcript.final", "Caller transcript received.", "stt")
    state.record("agent.thinking", "Retrieval and tool policy evaluated.", "dialogue")
    state.record("tool.completed", "Mock tool completed after confirmation.", "tool")
    state.record("agent.speaking", "TTS audio generated in mock mode.", "tts")
    state.record("call.ended", "Durable call summary ready.", "post-call")
    return state
