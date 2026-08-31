from __future__ import annotations

from .config import Settings
from .schemas import ProviderReadiness


def provider_readiness(settings: Settings) -> list[ProviderReadiness]:
    providers = [
        ProviderReadiness(
            provider="telephony",
            status="mock-ready" if settings.telephony_provider == "mock" else ("ready" if settings.twilio_auth_token else "unconfigured"),
            message="Mock calls are available locally." if settings.telephony_provider == "mock" else "Twilio credentials are required for real calls.",
            required_env=[] if settings.telephony_provider == "mock" else ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
        ),
        ProviderReadiness(
            provider="stt",
            status="mock-ready" if settings.stt_provider == "mock" else "unconfigured",
            message="Mock transcripts are available locally.",
            required_env=[] if settings.stt_provider == "mock" else ["STT_API_KEY"],
        ),
        ProviderReadiness(
            provider="tts",
            status="mock-ready" if settings.tts_provider == "mock" else "unconfigured",
            message="Browser/mock voice previews are available locally.",
            required_env=[] if settings.tts_provider == "mock" else ["TTS_API_KEY"],
        ),
        ProviderReadiness(
            provider="llm",
            status="mock-ready" if settings.llm_provider == "mock" else "unconfigured",
            message="Mock responses are available locally.",
            required_env=[] if settings.llm_provider == "mock" else ["LLM_API_KEY"],
        ),
        ProviderReadiness(
            provider="elevenlabs-hotel-agent",
            status="ready" if settings.elevenlabs_api_key else "mock-ready",
            message=(
                "Server-side ElevenLabs token route can authenticate private sessions."
                if settings.elevenlabs_api_key
                else "No API key configured; browser will attempt public-agent startup."
            ),
            required_env=[] if settings.elevenlabs_api_key else ["ELEVENLABS_API_KEY"],
        ),
    ]
    return providers
