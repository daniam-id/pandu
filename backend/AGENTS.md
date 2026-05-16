# AGENTS.md — Pandu.ai Backend

## Project Context
Pandu.ai is an agentic logistics routing engine. The backend is a Node.js/TypeScript serverless API deployed on Google Cloud Run. It orchestrates Gemini 3.1 Flash-Lite for autonomous courier dispatching, route optimization, and multimodal obstacle analysis.

**Key docs:** [technical_overview.md](./technical_overview.md) · [PRD.MD](./PRD.MD) · [API_CONTRACT.md](./API_CONTRACT.md) · [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) · [AI_PROMPTS_AND_SPECS.md](./AI_PROMPTS_AND_SPECS.md)

## Tech Stack
- **Runtime:** Node.js + TypeScript (strict mode)
- **Hosting:** Google Cloud Run (serverless, auto-scaling)
- **Database:** Firebase Firestore via Admin SDK
- **AI Engine:** Gemini 3.1 Flash-Lite Preview (Google AI Studio SDK)
- **Maps:** Google Maps Routes API
- **Auth:** Static API key (`x-api-key` header) — no JWT during hackathon

## Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run type checking
npx tsc --noEmit
```

## Project Structure (Target)
```
backend/
├── src/
│   ├── index.ts              # Entry point — server init, listener setup
│   ├── routes/               # Express/Fastify route handlers
│   │   ├── orders.ts         # POST /api/v1/orders/dispatch
│   │   ├── obstacles.ts      # POST /api/v1/obstacles/report
│   │   └── simulation.ts     # POST /api/v1/simulation/traffic
│   ├── services/             # Business logic layer
│   │   ├── ai.service.ts     # Gemini orchestration, prompt management
│   │   ├── maps.service.ts   # Google Maps Routes API integration
│   │   └── firestore.service.ts  # Firestore CRUD operations
│   ├── listeners/            # Firestore real-time listeners
│   │   └── orderListener.ts  # Watches pending orders → triggers AI
│   ├── tools/                # AI function-calling tool implementations
│   │   ├── rerouteCourier.ts
│   │   └── batchOrders.ts
│   ├── types/                # TypeScript interfaces & types
│   │   └── index.ts
│   └── config/               # Environment config, Firebase init
│       └── index.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

## Architecture Rules
1. **Service layer pattern** — route handlers must not contain business logic; delegate to `services/`.
2. **Single responsibility** — each file handles one concern. No god modules.
3. **Type everything** — no `any` types. Define interfaces in `types/`.
4. **Structured errors** — always return `{ status, message, code }` format.
5. **AI responses are structured** — never parse free-text from Gemini; always use function calling or structured JSON output.
6. **Firestore is the source of truth** — never cache state in-memory across requests (serverless = stateless).

## Coding Standards
- Use `async/await`, never raw `.then()` chains.
- Validate all incoming payloads before processing.
- Log decisions to `ai_decision_logs` collection for every AI action.
- Use environment variables for all secrets and config — never hardcode.
- Write descriptive commit messages referencing the feature/fix.

## Testing
- Demo scenarios defined in [TEST_CASES_SCENARIOS.md](./TEST_CASES_SCENARIOS.md).
- 4 core scenarios: Initialization, Traffic Response, Multi-Order Batching, Multimodal Vision.
- All endpoints must be testable via `curl` or Postman.

---

## Critical Rules
- ✅ **ALWAYS consult all 3 files before work:** `technical_overview.md`, `AGENTS.md`, `PROGRESS.md`
- ✅ **MUST update PROGRESS.md before commits**
- ✅ **Maintain consistency with patterns** defined in Architecture Rules above
- ✅ **Document significant changes** in both code comments and PROGRESS.md
