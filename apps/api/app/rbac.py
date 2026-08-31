from __future__ import annotations

from .schemas import Role


ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.owner: {"*"},
    Role.administrator: {"agents:*", "calls:*", "knowledge:*", "webhooks:*", "billing:read", "team:*"},
    Role.developer: {"agents:*", "calls:read", "knowledge:*", "webhooks:*", "api_keys:*"},
    Role.manager: {"agents:read", "calls:*", "knowledge:read", "analytics:read"},
    Role.analyst: {"calls:read", "analytics:read", "billing:read"},
    Role.operator: {"calls:read", "live_calls:*"},
}


def can(role: Role, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS[role]
    if "*" in permissions or permission in permissions:
        return True
    prefix = permission.split(":", 1)[0]
    return f"{prefix}:*" in permissions
