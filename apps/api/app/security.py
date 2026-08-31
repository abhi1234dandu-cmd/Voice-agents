from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from urllib.parse import urlparse


def hash_password(password: str, salt: str) -> str:
    derived = hashlib.scrypt(password.encode(), salt=salt.encode(), n=2**14, r=8, p=1, dklen=32)
    return base64.b64encode(derived).decode()


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    return secrets.compare_digest(hash_password(password, salt), expected_hash)


def hash_secret(secret: str, pepper: str) -> str:
    return hmac.new(pepper.encode(), secret.encode(), hashlib.sha256).hexdigest()


def mask_secret(secret: str) -> str:
    if len(secret) < 10:
        return "***"
    return f"{secret[:8]}...{secret[-4:]}"


def sign_webhook(payload: bytes, secret: str) -> str:
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    return secrets.compare_digest(sign_webhook(payload, secret), signature)


def validate_twilio_signature(url: str, params: dict[str, str], signature: str, auth_token: str) -> bool:
    # Twilio signs the full URL followed by sorted POST params.
    payload = url + "".join(f"{key}{value}" for key, value in sorted(params.items()))
    digest = hmac.new(auth_token.encode(), payload.encode(), hashlib.sha1).digest()
    expected = base64.b64encode(digest).decode()
    return secrets.compare_digest(expected, signature)


def validate_webhook_destination(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False
    hostname = parsed.hostname or ""
    blocked = ("localhost", "127.", "10.", "172.16.", "192.168.", "169.254.")
    return not hostname.startswith(blocked)
