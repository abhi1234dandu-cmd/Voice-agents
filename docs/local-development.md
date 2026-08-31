# Local Development

The fastest local loop is the web demo:

```bash
npm install
npm run dev
```

Run the API separately when working on backend endpoints:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
npm run api:dev
```

Use `.env.example` as the starting point. Local demo mode does not require Twilio, STT, TTS, LLM, embedding, Stripe, or object-storage credentials.

Run checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
pytest apps/api/tests
```
