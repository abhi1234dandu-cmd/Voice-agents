# Production Deployment Checklist

- Replace mock providers with configured production providers.
- Use managed PostgreSQL with pgvector, Redis, and S3-compatible object storage.
- Rotate `JWT_SECRET`, `ENCRYPTION_KEY`, provider secrets, and webhook signing secrets.
- Restrict CORS and webhook destinations.
- Put API and web behind TLS.
- Add WAF/rate limiting at the edge.
- Configure OpenTelemetry export and log retention.
- Enable background workers and dead-letter queues.
- Set tenant concurrency limits and outbound calling windows.
- Validate recording-consent, AI disclosure, opt-out, and do-not-call policy with counsel.
- Run load tests for the target call concurrency tier.
