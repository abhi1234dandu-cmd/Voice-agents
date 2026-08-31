from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class UsageEvent:
    provider: str
    unit: str
    quantity: Decimal
    unit_cost_cents: Decimal


def aggregate_usage(events: list[UsageEvent]) -> Decimal:
    return sum((event.quantity * event.unit_cost_cents for event in events), Decimal("0"))


def sign_delivery_payload(payload: bytes, secret: str) -> str:
    import hashlib
    import hmac

    return "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
