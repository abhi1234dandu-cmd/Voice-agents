from __future__ import annotations

from uuid import uuid4

from .schemas import WebhookDelivery, WebhookEndpoint
from .security import sign_webhook, validate_webhook_destination


def create_delivery(endpoint: WebhookEndpoint, event_type: str, payload: bytes, secret: str) -> tuple[WebhookDelivery, str]:
    signature = sign_webhook(payload, secret)
    delivery = WebhookDelivery(
        id=f"whd_{uuid4().hex[:10]}",
        organization_id=endpoint.organization_id,
        webhook_id=endpoint.id,
        event_type=event_type,
        status="queued",
        attempts=0,
        signed=True,
    )
    return delivery, signature


def ensure_destination_allowed(url: str) -> None:
    if not validate_webhook_destination(url):
        raise ValueError("webhook destination must be public https")
