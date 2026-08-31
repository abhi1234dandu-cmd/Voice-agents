from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol
from uuid import uuid4

from .schemas import CallEvent
from .security import validate_twilio_signature


class TelephonyProvider(Protocol):
    name: str

    def health(self) -> dict[str, str]:
        ...

    def validate_signature(self, url: str, params: dict[str, str], signature: str) -> bool:
        ...

    def outbound_test_call(self, to_number: str, from_number: str) -> dict[str, str]:
        ...


@dataclass
class MockTelephonyProvider:
    name: str = "mock"

    def health(self) -> dict[str, str]:
        return {"status": "ready", "message": "Mock telephony simulates calls locally."}

    def validate_signature(self, url: str, params: dict[str, str], signature: str) -> bool:
        return signature == "mock-signature"

    def outbound_test_call(self, to_number: str, from_number: str) -> dict[str, str]:
        return {"provider_call_id": f"mock_{uuid4().hex[:12]}", "to": to_number, "from": from_number, "status": "queued"}


@dataclass
class TwilioTelephonyProvider:
    auth_token: str
    name: str = "twilio"

    def health(self) -> dict[str, str]:
        if not self.auth_token:
            return {"status": "unconfigured", "message": "TWILIO_AUTH_TOKEN is required."}
        return {"status": "ready", "message": "Twilio signature validation is configured."}

    def validate_signature(self, url: str, params: dict[str, str], signature: str) -> bool:
        if not self.auth_token:
            return False
        return validate_twilio_signature(url, params, signature, self.auth_token)

    def outbound_test_call(self, to_number: str, from_number: str) -> dict[str, str]:
        if not self.auth_token:
            return {"provider_call_id": "", "to": to_number, "from": from_number, "status": "unconfigured"}
        return {"provider_call_id": f"twilio_pending_{uuid4().hex[:12]}", "to": to_number, "from": from_number, "status": "queued"}


def build_mock_call_events(organization_id: str, call_id: str, business_name: str) -> list[CallEvent]:
    return [
        CallEvent(id=f"{call_id}_1", organization_id=organization_id, call_id=call_id, type="call.started", at_ms=0, actor="system", text="Demo mode call started."),
        CallEvent(
            id=f"{call_id}_2",
            organization_id=organization_id,
            call_id=call_id,
            type="agent.speaking",
            at_ms=500,
            actor="agent",
            text=f"Thanks for calling {business_name}. I am a Votell AI assistant.",
            latency_ms=410,
        ),
        CallEvent(
            id=f"{call_id}_3",
            organization_id=organization_id,
            call_id=call_id,
            type="transcript.final",
            at_ms=1600,
            actor="caller",
            text="Do you have a queen room available tomorrow?",
            latency_ms=330,
        ),
        CallEvent(
            id=f"{call_id}_4",
            organization_id=organization_id,
            call_id=call_id,
            type="tool.started",
            at_ms=2300,
            actor="tool",
            text="create_reservation_request requires confirmation.",
            metadata={"confirmation_required": True},
        ),
        CallEvent(
            id=f"{call_id}_5",
            organization_id=organization_id,
            call_id=call_id,
            type="tool.completed",
            at_ms=3300,
            actor="tool",
            text="Reservation request created in mock mode.",
            latency_ms=640,
        ),
        CallEvent(id=f"{call_id}_6", organization_id=organization_id, call_id=call_id, type="call.ended", at_ms=4800, actor="system", text="Call ended."),
    ]
