# Provider Integration

Provider boundaries live in `packages/provider-contracts`.

Implemented adapter categories:

- `TelephonyProvider`
- `STTProvider`
- `TTSProvider`
- `LLMProvider`
- `EmbeddingProvider`

The MVP ships mock providers and a Twilio webhook/signature foundation. Add new providers behind these contracts, keep secrets server-side, normalize provider events into the Votell event schema, and add contract tests before enabling tenant traffic.
