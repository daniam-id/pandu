# Technical Overview — Pandu.ai Backend
**Project:** Pandu.ai — Agentic Routing Engine  
**Runtime:** Node.js (TypeScript)  
**Hosting:** Google Cloud Run (Serverless)  
**Status:** Pre-implementation (specification & planning phase)

---

## 1. Core Components

### A. API Gateway (Express/Fastify Server)
The HTTP entry point running on Cloud Run. Exposes three REST endpoints under `/api/v1`:

| Endpoint | Method | Responsibility |
|---|---|---|
| `/obstacles/report` | POST | Accepts obstacle image reports, triggers Gemini Vision analysis |
| `/orders/dispatch` | POST | Receives new delivery orders, triggers AI assignment pipeline |
| `/simulation/traffic` | POST | Injects simulated traffic anomalies for demo purposes |

Authentication is handled via a static `x-api-key` header (`API_SECRET_KEY`) — JWT is bypassed for hackathon velocity.

### B. AI Orchestration Layer (Gemini Integration)
Connects to **Gemini 3.1 Flash-Lite Preview** via the Google AI Studio Node.js SDK. Operates under the **ReAct (Reason-Act)** autonomous agent pattern.

**Key responsibilities:**
- Maintains a persistent System Prompt defining the dispatcher persona (no conversational output, structured JSON/function-call responses only).
- Processes multimodal inputs (text + image) for obstacle severity analysis via the Vision prompt.
- Exposes two function-calling tools to the model:
  - `reroute_courier(courierId, avoidLocation, reason)` — recalculates a courier's route to avoid a hazard.
  - `batch_orders(courierId, newOrderId, estimatedDistanceSavedKm?)` — assigns a proximate order to an already-active courier.

### C. Firestore Data Layer (Firebase Admin SDK)
The single source of truth for all runtime state. Uses the Firebase Admin SDK for privileged server-side access.

**Collections:**

| Collection | Purpose |
|---|---|
| `couriers` | Real-time courier positions, status (`idle`/`delivering`), assigned orders, route polylines |
| `orders` | Delivery requests with pickup/dropoff coordinates, status lifecycle (`pending` → `assigned` → `completed`/`failed`) |
| `obstacles` | Obstacle reports with image URLs, AI severity analysis, and action taken |
| `ai_decision_logs` | Immutable audit trail of every AI decision for the dispatcher dashboard feed |

### D. Google Maps Integration
Uses the **Google Maps Routes API** to:
- Fetch real-time traffic data and travel times.
- Calculate optimized route polylines.
- Provide distance matrices for batching proximity checks (< 1 km radius).

---

## 2. Component Interactions

### Data & Control Flow

```
┌─────────────────┐     REST API      ┌──────────────────────────┐
│   Frontend       │ ──────────────▶  │  Cloud Run API Server    │
│   (Dashboard)    │                   │  (Express/Fastify)       │
└────────┬────────┘                   └──────────┬───────────────┘
         │                                        │
         │  onSnapshot                            │  Firebase Admin SDK
         │  (real-time)                           │  (read/write)
         ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firestore Database                       │
│  couriers │ orders │ obstacles │ ai_decision_logs            │
└─────────────────────────────────────────────────────────────┘
                                        ▲
                                        │  Triggers / Listeners
                                        │
                              ┌─────────┴─────────┐
                              │  AI Orchestration  │
                              │  (Gemini 3.1 FL)   │
                              └─────────┬─────────┘
                                        │
                                        │  Routes API
                                        ▼
                              ┌───────────────────┐
                              │ Google Maps Platform│
                              └───────────────────┘
```

**Flow summary:**
1. **Inbound:** Frontend sends REST requests (new orders, obstacle reports, simulation triggers) → API Server.
2. **Processing:** API Server forwards context to the Gemini AI layer for reasoning.
3. **Decision:** Gemini responds with function calls (`reroute_courier`, `batch_orders`) or structured JSON.
4. **Execution:** Backend executes the function calls — queries Google Maps Routes API for new polylines, writes results to Firestore.
5. **Outbound:** Frontend receives real-time updates via Firestore `onSnapshot` listeners — no polling required.

### Communication Methods
- **Frontend ↔ Backend:** REST over HTTPS (JSON payloads).
- **Backend ↔ Firestore:** Firebase Admin SDK (server-side, no auth rules applied).
- **Backend ↔ Gemini:** Google AI Studio SDK (streaming or unary calls).
- **Backend ↔ Maps:** Google Maps Routes API (HTTP REST).
- **Frontend ↔ Firestore:** Client SDK with `onSnapshot` real-time listeners.

---

## 3. Deployment Architecture

### Build & Run

| Environment | Method |
|---|---|
| **Local Dev** | `npm run dev` on `PORT=8080`, `.env` for secrets |
| **Production** | Google Cloud Run (auto-scaling, serverless containers) |

### External Dependencies
- **Google AI Studio** — Gemini 3.1 Flash-Lite Preview (API key: `GEMINI_API_KEY`)
- **Firebase/Firestore** — Admin SDK via service account (`FIREBASE_SERVICE_ACCOUNT_BASE64`)
- **Google Maps Platform** — Routes API (API key managed separately)

### Environment Variables
Defined in `.env` (see `.env.example`):

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `8080`, auto-set by Cloud Run) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL_VERSION` | Model identifier (`gemini-3.1-flash-lite-preview`) |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64-encoded Firebase service account JSON |
| `API_SECRET_KEY` | Static API key for hackathon auth bypass |

### Containerization
Cloud Run expects a Docker container. Standard Node.js Dockerfile pattern:
1. Install dependencies (`npm ci`)
2. Compile TypeScript (`npm run build`)
3. Start server (`npm start`)

---

## 4. Runtime Behavior

### Initialization
1. Load environment variables from `.env` (or Cloud Run runtime injection).
2. Initialize Firebase Admin SDK with the decoded service account.
3. Connect to Gemini 3.1 Flash-Lite with the system prompt (dispatcher persona).
4. Attach Firestore listeners on `orders` (filter: `status == 'pending'`) and `couriers` collections.
5. Start HTTP server on configured `PORT`.

### Request Handling

**POST `/api/v1/orders/dispatch`:**
1. Validate payload (pickup/dropoff coordinates, priority).
2. Write order to Firestore with `status: 'pending'`.
3. Query active couriers and their positions.
4. Send context to Gemini → AI decides: assign to nearest idle courier, or batch with nearby active courier.
5. Execute AI's function call → update `orders` (status → `assigned`), update `couriers` (add to `assignedOrders`, recalculate route via Maps API).
6. Write decision to `ai_decision_logs`.
7. Return `201` with assignment details.

**POST `/api/v1/obstacles/report`:**
1. Validate payload (courier ID, image URL, location).
2. Send image + vision prompt to Gemini multimodal endpoint.
3. Parse structured JSON response (severity, description, requiresReroute).
4. If `severity === 'high'` → call `reroute_courier` via Maps API → update courier's `currentRoutePolyline`.
5. Write obstacle analysis to `obstacles` collection.
6. Write decision to `ai_decision_logs`.
7. Return `200` with analysis results.

**POST `/api/v1/simulation/traffic`:**
1. Validate payload (target area, congestion level, radius).
2. Query couriers with routes passing through the affected area.
3. Send traffic context to Gemini → AI determines which couriers need rerouting.
4. Execute reroute function calls for affected couriers.
5. Write decisions to `ai_decision_logs`.
6. Return `200` with list of affected couriers.

### Error Handling
- Invalid payloads → `400 Bad Request` with structured error (`{ status, message, code }`).
- AI processing failures → `500 Internal Server Error` with `IMAGE_PROCESSING_FAILED` or equivalent code.
- Firestore write failures → retry with exponential backoff (Firebase Admin SDK default behavior).

### Background Tasks
- **Firestore Listeners:** Continuously monitor `orders` for new `pending` entries — trigger AI assignment pipeline automatically (event-driven, no polling).
- **Route Simulation:** Courier position updates can be simulated via scheduled writes to `couriers.currentLocation` for demo purposes.

---

## 5. Current Project State

The backend is in **pre-implementation phase**. The following specification documents exist:

| Document | Content |
|---|---|
| `PRD.MD` | Product requirements — objectives, tech stack, core features, scope |
| `API_CONTRACT.md` | REST endpoint definitions with request/response schemas |
| `FIRESTORE_SCHEMA.md` | NoSQL collection structures and security rules |
| `AI_PROMPTS_AND_SPECS.md` | System prompts, vision prompts, and function-calling tool schemas |
| `TEST_CASES_SCENARIOS.md` | 4 live demo scenarios with pass/fail criteria |
| `.env.example` | Environment variable template |

**No source code has been written yet.** The next step is to scaffold the Node.js/TypeScript project and implement the components described above.
