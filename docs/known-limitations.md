# Known Limitations

- Local calls are simulated. No real PSTN call is placed unless a provider adapter is configured and enabled.
- Browser voice previews use the local mock TTS path. They are not licensed production voice assets.
- Knowledge retrieval is deterministic demo retrieval, not a production embedding index in the web-only demo.
- Billing is billing-ready usage modeling only; no live charging is enabled.
- Listen/whisper controls are displayed as future/provider-dependent capabilities.
- Docker Compose is intended for local development, not a production cluster.
- The included tests cover critical demo behavior and provider utilities, not every enterprise scenario from the long-form product brief.
