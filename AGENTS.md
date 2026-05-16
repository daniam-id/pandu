# AGENTS.md — Pandu.ai

## Project Summary

Pandu.ai is an Agentic AI logistics dispatcher for urban delivery in Surabaya.
Monorepo with two workspaces: `frontend/` (React + Tailwind) and `backend/` (Node.js/TS + Cloud Run).
Database: Firebase Firestore. AI engine: Gemini 3.1 Flash-Lite Preview via Google AI Studio.

## Repository Layout

```
pandu/
├── frontend/          # React.js dispatcher dashboard
├── backend/           # Node.js serverless API (Cloud Run)
├── technical_overview.md
├── AGENTS.md          # ← you are here
├── PROGRESS.md        # track every change before commit
├── PRD.MD             # universal product requirements
└── DEPLOYMENT_CHECKLIST.md
```

## Key Reference Docs

| Doc | Path | Purpose |
|-----|------|---------|
| Technical Overview | `technical_overview.md` | Architecture, data flow, runtime |
| API Contract | `backend/API_CONTRACT.md` | REST endpoints & payloads |
| Firestore Schema | `backend/FIRESTORE_SCHEMA.md` | Collections & document shapes |
| AI Prompts & Tools | `backend/AI_PROMPTS_AND_SPECS.md` | System prompt, vision prompt, function calling |
| Frontend Wireframe | `frontend/USER_FLOW_WIREFRAME.md` | UI layout & user flows |
| Test Scenarios | `backend/TEST_CASES_SCENARIOS.md` | Live demo test cases |
| Backend PRD | `backend/PRD.MD` | Backend-specific requirements |
| Frontend PRD | `frontend/PRD.MD` | Frontend-specific requirements |

## Build & Run

### Frontend

```bash
cd frontend
npm install
npm run dev          # dev server (usually :3000)
npm run build        # production build
```

### Backend

```bash
cd backend
npm install
npm run build        # tsc compile
npm run start        # node dist/index.js
npm run dev          # ts-node or nodemon for local dev
```

### Environment

- Copy `.env.example` → `.env` in both `frontend/` and `backend/`.
- Never commit `.env` files.

## Code Conventions

- **Backend:** TypeScript strict mode, Express-style handlers, Firebase Admin SDK.
- **Frontend:** React functional components, Tailwind CSS utility classes.
- **API auth:** Static `x-api-key` header (hackathon mode).
- **Firestore:** 4 collections — `couriers`, `orders`, `obstacles`, `ai_decision_logs`.
- **AI integration:** All Gemini calls happen server-side only. Frontend never calls Gemini directly.
- **Error responses:** Always use `{ status: "error", message: "...", code: "ERROR_CODE" }`.
- **Gemini responses:** Always handle both function call objects and structured JSON — never plain text.

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Frontend
cd frontend && npm test
```

Manual demo scenarios are documented in `backend/TEST_CASES_SCENARIOS.md`.

## Deployment

- **Frontend →** Firebase Hosting: `firebase deploy --only hosting`
- **Backend →** Google Cloud Run: container build & deploy
- **Database →** Firebase Firestore (rules in `firebase.rules`)

See `DEPLOYMENT_CHECKLIST.md` for the full pre-deploy checklist.

## Critical Rules

- ✅ **ALWAYS consult all 3 files before work:** `AGENTS.md`, `PROGRESS.md`, `technical_overview.md`
- ✅ **MUST update `PROGRESS.md` before commits**
- ✅ **Maintain consistency with established patterns** in existing code
- ✅ **Document significant changes** in `PROGRESS.md` with date and description

## Common Pitfalls

- CORS must allow both Firebase Hosting URL and `localhost:3000`.
- Gemini function calling returns tool-call objects, not plain text — always handle both.
- Firestore `onSnapshot` listeners must be detached on component unmount.
- Cloud Run sets `PORT` automatically; don't hardcode it.
- Base64-decode `FIREBASE_SERVICE_ACCOUNT_BASE64` before passing to `admin.initializeApp()`.
