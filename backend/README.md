# Pandu.ai — Agentic Routing Engine

Autonomous logistics dispatch backend for urban delivery in Surabaya.  
Built for Mini Hackathon Antigravity 2026.

**Stack:** Express 4 + TypeScript | Firestore | Gemini Flash-Lite | Google Cloud Run

## Quick Start

```bash
cp .env.example .env   # Fill in API keys
npm install
npm run dev            # http://localhost:8080
```

## Documentation

All technical docs live in [`/docs`](./docs/README.md):

- **API Reference** → [`docs/api/INTEGRATION_SPEC.md`](./docs/api/INTEGRATION_SPEC.md)
- **Architecture** → [`docs/architecture/technical_overview.md`](./docs/architecture/technical_overview.md)
- **Deploy Guide** → [`docs/guides/DEPLOY.md`](./docs/guides/DEPLOY.md)
- **Integration Status** → [`docs/progress/INTEGRATION_STATUS.md`](./docs/progress/INTEGRATION_STATUS.md)

## Production

```
URL:  https://pandu-backend-879040945141.asia-southeast2.run.app
Auth: x-api-key header
```

See [`DEPLOY.md`](./docs/guides/DEPLOY.md) for setup and rollback procedures.
