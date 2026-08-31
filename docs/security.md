# Security and Privacy

Implemented foundations:

- Tenant-scoped records and server-side organization checks
- Role model covering Owner, Administrator, Developer, Manager, Analyst, and Agent/Operator
- Password-hashing utility for local auth
- API key hashing and one-time secret display
- Webhook signing and replay logs
- Twilio signature validation
- Audit log model and UI
- Recording-consent and AI-disclosure settings
- Prompt-injection warnings for knowledge ingestion
- SSRF and destination validation notes for URL ingestion and HTTP tools

Votell is not automatically HIPAA, PCI-DSS, SOC 2, TCPA, GDPR, or state wiretap compliant. Production deployment requires legal review, consent-policy configuration, vendor contracts, logging and retention policies, security monitoring, and jurisdiction-specific compliance controls.
