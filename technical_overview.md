# Pandu.ai — Technical Overview

**Project:** Mini Hackathon Antigravity 2026 (GDG Surabaya)  
**Team:** Adam Dani Apta Mahendra & Nadif Fijri Fajar Arifin  
**Date:** April 2026  
**Status:** Documentation/Specification Phase — No application code exists yet.

---

## 1. Core Components

### A. Frontend — Dispatcher Dashboard

| Aspect | Detail |
|--------|--------|
| **Framework** | React.js |
| **Styling** | Tailwind CSS |
| **Maps** | Google Maps Platform (Routes API) |
| **Real-time DB** | Firebase Client SDK (`onSnapshot` listeners) |

**Major UI Components:**

- **Live Map View** — Full-screen Google Maps canvas rendering courier markers, order pickup/dropoff pins, and route polylines in real-time.
- **Control & Overview Panel (Left Sidebar, ~25%)** — Order input form (pickup/dropoff lat/lng, priority) and active couriers list with status cards.
- **AI Decision Log Panel (Right Sidebar, ~25%)** — Scrollable real-time feed of agent reasoning and actions; high-severity events flash red.
- **Courier Simulator (Floating Modal)** — Hackathon demo tool: select a courier, upload an obstacle photo, and submit to trigger multimodal vision analysis.
- **Top Navigation Bar** — Logo + system health indicators (AI engine status, Firestore connection).

**State Management Pattern:** Firestore `onSnapshot` listeners → React state updates → automatic re-renders. No client-side routing logic or AI calls.

### B. Backend — Agentic Routing Engine

| Aspect | Detail |
|--------|--------|
| **Runtime** | Node.js (TypeScript) |
| **Hosting** | Google Cloud Run (serverless, auto-scaling) |
| **Database** | Firebase Admin SDK (Firestore) |
| **AI Engine** | Google AI Studio — Gemini 3.1 Flash-Lite Preview |
| **Maps & Traffic** | Google Maps Platform (Routes API) |

**Major Modules:**

- **AI Orchestration** — Manages the Gemini model connection with a strict ReAct (Reason-Act) system prompt. The AI operates as an autonomous logistics dispatcher that responds only with function calls or structured JSON.
- **Function Calling (Tools)** — Two registered tools the AI can invoke:
  - `reroute_courier(courierId, avoidLocation, reason)` — Calculates and assigns a new route avoiding a specific area.
  - `batch_orders(courierId, newOrderId, estimatedDistanceSavedKm?)` — Batches a nearby order to an already-active courier.
- **Event-Driven Processing** — Firestore listeners/triggers monitor `orders` and `couriers` collections for state changes and new entries.
- **Multimodal Image Processing** — Receives courier-uploaded obstacle photos, sends them to Gemini 3.1 Flash-Lite Vision with a structured analysis prompt, and triggers emergency reroutes when severity is `high`.

**Planned Backend Module Structure:**

```
backend/
├── src/
│   ├── index.ts              # Entry point: Express app + Firestore listeners
│   ├── config/
│   │   └── firebase.ts       # Firebase Admin SDK initialization
│   ├── middleware/
│   │   ├── auth.ts           # x-api-key validation
│   │   └── errorHandler.ts   # Global error handler
│   ├── routes/
│   │   ├── obstacles.ts      # POST /api/v1/obstacles/report
│   │   ├── orders.ts         # POST /api/v1/orders/dispatch
│   │   └── simulation.ts     # POST /api/v1/simulation/traffic
│   ├── services/
│   │   ├── gemini.ts         # Gemini AI client + system prompt + function calling
│   │   ├── routing.ts        # Google Maps Routes API integration
│   │   └── firestore.ts      # Firestore CRUD operations
│   ├── tools/
│   │   ├── rerouteCourier.ts  # reroute_courier function implementation
│   │   └── batchOrders.ts     # batch_orders function implementation
│   └── types/
│       └── index.ts           # TypeScript interfaces & types
├── dist/                      # Compiled JS output
├── package.json
├── tsconfig.json
└── .env
```

### C. Database — Firebase Firestore

Four collections optimized for real-time sync:

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `couriers` | Real-time courier state & location | `name`, `status` (idle/delivering), `currentLocation`, `assignedOrders[]`, `currentRoutePolyline` |
| `orders` | Delivery requests | `pickupLocation`, `dropoffLocation`, `status` (pending/assigned/completed/failed), `assignedCourierId` |
| `obstacles` | Multimodal obstacle reports | `courierId`, `imageUrl`, `location`, `aiAnalysis` (severity, description, actionTaken), `status` |
| `ai_decision_logs` | Agent reasoning audit trail | `type` (route_optimized/order_batched/obstacle_avoided), `message`, `relatedCourierId`, `relatedOrderId` |

---

## 2. Component Interactions

### Data & Control Flow

```
┌─────────────────┐     REST API      ┌──────────────────────┐
│   Frontend      │ ───────────────►  │   Backend (Cloud Run)│
│   (React.js)    │                   │   (Node.js/TS)       │
│                 │                   │                      │
│  onSnapshot ◄───┼──── Firestore ───┼── Admin SDK writes   │
│  listeners      │     (real-time)   │                      │
│                 │                   │   Gemini 3.1 ◄──►    │
│                 │                   │   Function Calling   │
└─────────────────┘                   └──────────────────────┘
```

1. **Frontend → Backend:** REST API calls to Cloud Run endpoints (`POST /obstacles/report`, `POST /orders/dispatch`, `POST /simulation/traffic`).
2. **Backend → Firestore:** Admin SDK writes updated routes, courier states, order assignments, obstacle analyses, and decision logs.
3. **Firestore → Frontend:** `onSnapshot` listeners push real-time updates to React state, triggering map re-renders without page refreshes.
4. **Backend → Gemini AI:** Sends context (courier positions, new orders, traffic anomalies, images) and receives function call responses or structured JSON analysis.

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/obstacles/report` | Multimodal obstacle report → Gemini Vision analysis → reroute |
| `POST` | `/api/v1/orders/dispatch` | New order → AI courier assignment with batching logic |
| `POST` | `/api/v1/simulation/traffic` | Inject fake traffic anomaly for demo rerouting |

### Middleware Pipeline

```
Request → CORS check → x-api-key auth → Route handler → Error handler → Response
```

### Authentication

Hackathon-simplified: static API key via `x-api-key` header (value defined in `.env` as `API_SECRET_KEY`). No JWT or OAuth.

---

## 3. Deployment Architecture

### Build & Deploy Pipeline

| Component | Build | Deploy Target | URL Pattern |
|-----------|-------|---------------|-------------|
| Frontend | `npm run build` (React) | Firebase Hosting | `pandu-ai-2026.web.app` |
| Backend | `tsc` → `node dist/index.js` | Google Cloud Run | `https://api-pandu-ai-[hash].a.run.app` |
| Database | N/A (managed) | Firebase Firestore | Console: `pandu-ai-2026` |

### Environment Variables

**Backend (Cloud Run):**
- `PORT` — Server port (8080, auto-set by Cloud Run)
- `GEMINI_API_KEY` — Google AI Studio key
- `GEMINI_MODEL_VERSION` — `gemini-3.1-flash-lite-preview`
- `FIREBASE_SERVICE_ACCOUNT_BASE64` — Base64-encoded service account JSON
- `API_SECRET_KEY` — Static hackathon auth key

**Frontend (Firebase Hosting):**
- `REACT_APP_API_BASE_URL` — Cloud Run backend URL
- `REACT_APP_GOOGLE_MAPS_API_KEY` — Maps API key
- `REACT_APP_FIREBASE_*` — Firebase client SDK config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

### External Dependencies

- Google AI Studio (Gemini 3.1 Flash-Lite Preview)
- Google Maps Platform (Routes API)
- Firebase (Firestore, Hosting, Storage)
- Google Cloud Run

### Infrastructure

- **Serverless:** Cloud Run handles auto-scaling; no server provisioning needed.
- **Containerization:** Cloud Run deploys from a container image (Dockerfile or buildpack).
- **CORS:** Backend must whitelist Firebase Hosting URL and `localhost:3000`.

---

## 4. Runtime Behavior

### Application Initialization

1. **Backend boot:** Node.js process starts → loads env vars → initializes Firebase Admin SDK → connects to Gemini AI with the system prompt → attaches Firestore listeners on `orders` and `couriers` collections → starts Express/HTTP server on configured port.
2. **Frontend boot:** React app loads → initializes Firebase Client SDK → establishes `onSnapshot` listeners on all four collections → renders Google Maps with initial courier/order data.

### Request Handling

- **Order Dispatch:** `POST /orders/dispatch` → validate payload → write to `orders` collection as `pending` → trigger AI reasoning → AI calls `batch_orders` or assigns new courier → update `orders.status` to `assigned` + update `couriers.assignedOrders` and `currentRoutePolyline` → write to `ai_decision_logs` → return response with `orderId`, `assignedCourierId`, `estimatedDeliveryTime`.
- **Obstacle Report:** `POST /obstacles/report` → validate payload → create document in `obstacles` as `pending_analysis` → send image + vision prompt to Gemini → parse structured JSON response → if severity is `high`, call `reroute_courier` function → update `obstacles.aiAnalysis` and `status` → update affected courier's route → log decision → return analysis result.
- **Traffic Simulation:** `POST /simulation/traffic` → inject traffic anomaly context into AI session → AI evaluates affected couriers → calls `reroute_courier` for each → update Firestore → return list of affected couriers.

### Gemini Function Calling Flow

```
1. Backend builds context (courier positions, order data, traffic info)
2. Sends to Gemini with system prompt + tools definitions
3. Gemini responds with functionCall object (not plain text)
4. Backend extracts function name + args from response
5. Backend executes the corresponding tool (reroute_courier or batch_orders)
6. Backend writes results to Firestore
7. Backend logs decision to ai_decision_logs collection
```

### Business Workflows

- **Multi-Order Batching:** When a new order arrives, the AI checks all active couriers' positions. If any courier is within ~1 km of the new pickup, the AI calls `batch_orders` instead of assigning a fresh courier, saving distance and fuel.
- **Dynamic Rerouting:** Traffic anomalies or obstacle reports trigger the AI to recalculate affected routes via `reroute_courier`, avoiding blocked areas and updating polylines in Firestore.
- **Multimodal Vision Pipeline:** Courier uploads photo → Gemini Vision analyzes severity (high/medium/low) → high severity triggers emergency reroute → decision logged for dispatcher visibility.

### Error Handling

- API endpoints return structured error responses: `{ status: "error", message: "...", code: "ERROR_CODE" }`.
- Expected error codes: `IMAGE_PROCESSING_FAILED` (400/500), standard validation errors (400).
- Firestore operations use Admin SDK with automatic retries.
- Gemini API failures surface via Cloud Run logs for debugging (quota limits, invalid keys).
- Global error handler middleware catches unhandled exceptions and returns 500 responses.

### Background Tasks

- Firestore listeners run continuously as long as the backend process is alive.
- AI reasoning is synchronous per request (no queuing system for hackathon scope).
- No scheduled/cron jobs; all processing is event-driven.

---

## 5. Pre-Loaded Demo Data

For the hackathon presentation, 5 mock couriers must be seeded into the `couriers` collection before the live demo begins. Orders, obstacles, and logs are generated dynamically during the demonstration.
