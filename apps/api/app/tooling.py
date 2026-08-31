from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from .schemas import ToolExecutionRequest, ToolExecutionResponse


@dataclass(frozen=True)
class ToolSpec:
    name: str
    confirmation_required: bool
    output: dict[str, object]


TOOL_REGISTRY: dict[str, ToolSpec] = {
    "check_availability": ToolSpec(
        name="check_availability",
        confirmation_required=False,
        output={"available": "request_intake_only", "message": "Availability must be confirmed by staff."},
    ),
    "create_reservation_request": ToolSpec(
        name="create_reservation_request",
        confirmation_required=True,
        output={"request_id": "resv_mock_1001", "status": "created", "mode": "mock"},
    ),
    "create_restaurant_reservation": ToolSpec(
        name="create_restaurant_reservation",
        confirmation_required=True,
        output={"request_id": "table_mock_1001", "status": "created", "mode": "mock"},
    ),
    "create_support_ticket": ToolSpec(
        name="create_support_ticket",
        confirmation_required=True,
        output={"ticket_id": "case_mock_1001", "status": "created", "mode": "mock"},
    ),
    "schedule_callback": ToolSpec(
        name="schedule_callback",
        confirmation_required=True,
        output={"callback_id": "cb_mock_1001", "status": "scheduled", "mode": "mock"},
    ),
    "send_sms": ToolSpec(
        name="send_sms",
        confirmation_required=True,
        output={"message_id": "sms_mock_1001", "status": "queued", "mode": "mock"},
    ),
    "create_maintenance_request": ToolSpec(
        name="create_maintenance_request",
        confirmation_required=True,
        output={"work_order_id": "mx_mock_1001", "status": "created", "mode": "mock"},
    ),
    "transfer_to_human": ToolSpec(
        name="transfer_to_human",
        confirmation_required=False,
        output={"transfer_id": "xfer_mock_1001", "status": "started", "mode": "mock"},
    ),
    "end_call": ToolSpec(
        name="end_call",
        confirmation_required=False,
        output={"status": "ending", "mode": "mock"},
    ),
}


class ToolExecutor:
    def __init__(self) -> None:
        self.executed_idempotency_keys: set[str] = set()

    def execute(self, request: ToolExecutionRequest) -> ToolExecutionResponse:
        spec = TOOL_REGISTRY.get(request.tool_name)
        if not spec:
            return ToolExecutionResponse(
                execution_id=f"tool_{uuid4().hex[:10]}",
                status="failed",
                tool_name=request.tool_name,
                confirmation_required=False,
                output={"error": "unknown tool"},
                audit_event="tool.failed",
            )

        if request.idempotency_key in self.executed_idempotency_keys:
            return ToolExecutionResponse(
                execution_id=f"tool_{uuid4().hex[:10]}",
                status="duplicate",
                tool_name=request.tool_name,
                confirmation_required=spec.confirmation_required,
                output={"idempotency_key": request.idempotency_key},
                audit_event="tool.duplicate",
            )

        if spec.confirmation_required and not request.confirmed:
            return ToolExecutionResponse(
                execution_id=f"tool_{uuid4().hex[:10]}",
                status="requires_confirmation",
                tool_name=request.tool_name,
                confirmation_required=True,
                output={"readback_required": True, "input": request.input},
                audit_event="tool.confirmation_required",
            )

        self.executed_idempotency_keys.add(request.idempotency_key)
        return ToolExecutionResponse(
            execution_id=f"tool_{uuid4().hex[:10]}",
            status="completed",
            tool_name=request.tool_name,
            confirmation_required=spec.confirmation_required,
            output=dict(spec.output),
            audit_event="tool.completed",
        )


tool_executor = ToolExecutor()
