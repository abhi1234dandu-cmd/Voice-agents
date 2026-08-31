from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_env: str
    demo_mode: bool
    web_url: str
    api_url: str
    database_url: str
    redis_url: str
    jwt_secret: str
    encryption_key: str
    telephony_provider: str
    twilio_account_sid: str
    twilio_auth_token: str
    stt_provider: str
    tts_provider: str
    llm_provider: str
    elevenlabs_api_key: str
    elevenlabs_hotel_agent_id: str
    webhook_signing_secret: str

    def missing_required(self) -> list[str]:
        required = ["JWT_SECRET", "ENCRYPTION_KEY", "WEBHOOK_SIGNING_SECRET"]
        if self.telephony_provider == "twilio":
            required.extend(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"])
        if self.stt_provider != "mock":
            required.append("STT_API_KEY")
        if self.tts_provider != "mock":
            required.append("TTS_API_KEY")
        if self.llm_provider != "mock":
            required.append("LLM_API_KEY")
        return [name for name in required if not os.getenv(name)]

    def public_safe(self) -> dict[str, str | bool | list[str]]:
        return {
            "app_env": self.app_env,
            "demo_mode": self.demo_mode,
            "web_url": self.web_url,
            "api_url": self.api_url,
            "telephony_provider": self.telephony_provider,
            "stt_provider": self.stt_provider,
            "tts_provider": self.tts_provider,
            "llm_provider": self.llm_provider,
            "elevenlabs_hotel_agent_id": self.elevenlabs_hotel_agent_id,
            "missing_required": self.missing_required(),
        }


def get_settings() -> Settings:
    return Settings(
        app_env=os.getenv("APP_ENV", "local"),
        demo_mode=os.getenv("DEMO_MODE", "true").lower() == "true",
        web_url=os.getenv("WEB_URL", "http://localhost:3000"),
        api_url=os.getenv("API_URL", "http://localhost:8000"),
        database_url=os.getenv("DATABASE_URL", ""),
        redis_url=os.getenv("REDIS_URL", ""),
        jwt_secret=os.getenv("JWT_SECRET", ""),
        encryption_key=os.getenv("ENCRYPTION_KEY", ""),
        telephony_provider=os.getenv("TELEPHONY_PROVIDER", "mock"),
        twilio_account_sid=os.getenv("TWILIO_ACCOUNT_SID", ""),
        twilio_auth_token=os.getenv("TWILIO_AUTH_TOKEN", ""),
        stt_provider=os.getenv("STT_PROVIDER", "mock"),
        tts_provider=os.getenv("TTS_PROVIDER", "mock"),
        llm_provider=os.getenv("LLM_PROVIDER", "mock"),
        elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", ""),
        elevenlabs_hotel_agent_id=os.getenv(
            "ELEVENLABS_HOTEL_AGENT_ID", "agent_1901kxnm7vzwe1xvhrqeq5knzd1n"
        ),
        webhook_signing_secret=os.getenv("WEBHOOK_SIGNING_SECRET", ""),
    )
