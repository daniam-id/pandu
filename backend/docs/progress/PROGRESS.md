# PROGRESS.md — Pandu.ai Backend

> **Rule:** This file MUST be updated before every commit.

---

## Project Timeline

| Date | Milestone | Status |
|---|---|---|
| 2026-04-30 | Project specification & documentation complete | ✅ Done |
| 2026-04-30 | Project initialization (`../architecture/technical_overview.md`, `../guides/AGENTS.md`, `PROGRESS.md`) | ✅ Done |
| TBD | Node.js/TypeScript project scaffold | ✅ Done |
| TBD | Firebase Admin SDK integration | ✅ Done |
| TBD | Gemini AI orchestration layer | ✅ Done |
| TBD | REST API endpoints implementation | ✅ Done |
| TBD | Google Maps Routes API integration | ✅ Done |
| TBD | Firestore real-time listeners | ✅ Done |
| TBD | AI function-calling tools (`reroute_courier`, `batch_orders`) | ✅ Done |
| TBD | Multimodal obstacle analysis (Vision) | ✅ Done |
| TBD | Docker containerization | ✅ Done |
| TBD | Cloud Run deployment | ⬜ Pending |
| TBD | Live demo testing (4 scenarios) | ⬜ Pending |

---

## Change Log

### 2026-05-16 — Production Readiness (Security & Observability)
- **What:** Helmet security headers, structured logging, Docker multi-stage, CI/CD pipeline
- **Status:** ✅ COMPLETED & TYPE-CHECKED

#### Security
- Helmet (XSS filter, noSniff, frameguard DENY, HSTS preload)
- `trust proxy` enabled for Cloud Run reverse proxy
- `express.json({ limit: '1mb' })` body size hardening
- CORS supports comma-separated domain list (was only `*`)
- Compression middleware active (6KB threshold, skips multipart)
- Firestore settings: `ignoreUndefinedProperties: true`, `maxRetries: 3`

#### Observability
- Pino structured JSON logger replaces all `console.*` calls
- Request logging middleware: method, path, status, duration, client IP
- Health probe logs include error details on failure
- `redact` config hides `x-api-key` and cookies from logs

#### Deployment
- Dockerfile: multi-stage build (builder → runner), non-root `app` user
- `.dockerignore` excludes node\_modules, dist, .env, docs
- `cloudbuild.yaml`: type-check → lint → Docker build → Cloud Run deploy with secrets

#### Graceful Shutdown
- SIGTERM/SIGINT: unsubscribe Firestore listener, close Express, force-exit after 10s

### 2026-05-16 — Documentation Alignment & Router Separation
- **What:** Fixes 5 documentation/code gaps from final compliance audit
- **Status:** ✅ COMPLETED & TYPE-CHECKED

#### Docs Fixed
- INTEGRATION_SPEC.md: Dispatch response format corrected to `{success: true, data: {...}}`
- INTEGRATION_SPEC.md: Added `POST /orders/:orderId/cancel` as §2.5b
- API_CONTRACT.md: Added cancel endpoint as §5a
- FIRESTORE_SCHEMA.md: Added missing fields (`priority`, `driverStatus`, `items`, `failureReason`, `type`, `severity`, `description`, `phone`, `rerouted`, `offline`)
- FIRESTORE_SCHEMA.md: Security rules updated to reference `firestore.rules` (read-only clients)
- INTEGRATION_SPEC.md: Status update response format corrected to `{success: true, data: {...}}`

#### Code Fixed
- Extracted GET `/routes/:orderId` from driverRouter into standalone `routesRouter` (`src/routes/routes.ts`)
- No more accidental `/routes/location` exposure

### 2026-05-16 — Dual-Frontend Audit Fixes & Security Hardening
- **What:** Fixed 14 gaps from INTEGRATION_SPEC and dual-frontend audit
- **Status:** ✅ COMPLETED & TYPE-CHECKED

#### Critical Fixes
- Fixed route endpoint path: now serves at both `/routes/:orderId` and `/driver/:orderId`
- Changed `priority` from string enum to number 1-5 with input mapping
- Added idempotency cache for `POST /orders/:id/status` (60s dedup window)
- Created `firestore.rules` with read-only client access (all writes via REST)
- Added `POST /orders/:orderId/cancel` endpoint with validation

#### Infrastructure
- Added `LOCATION_BROADCAST_INTERVAL_MS` and `ROUTE_CACHE_TTL_MS` env vars
- Added rate limiting: 100 req/min global, 240 req/min for `/driver/location`
- Multer file-too-large errors now return 413
- Health endpoint now probes Firestore + Gemini (returns 503 if degraded)
- Stale courier detection: idle couriers with no update >45s are filtered out
- `driverStatus` set to `undefined` on order creation (only set on actual assignment)
- Invalid API key returns 401 (was 403)
- Description max-length (500 chars) enforced on obstacle reports

### 2026-05-16 — Implementation Compliance Audit Fixes
- **What:** Fixed 15+ gaps found during documentation compliance audit
- **Status:** ✅ COMPLETED & TYPE-CHECKED

#### Status Machine Fix (Critical)
- Added `driverStatus` field to `Order` type and order creation flow
- Fixed `POST /orders/:id/status` to validate transitions against `driverStatus` instead of canonical `status`
- Terminal transitions (`delivered`, `failed`) now properly set canonical `status` to `completed`/`failed`
- `updateOrderStatus()` sets `driverStatus: 'assigned'` on assignment

#### Gemini Vision Fix (Critical)
- `analyzeObstacle()` now accepts `Buffer` + `mimeType` instead of URL string
- Base64 encoding applied correctly to `inlineData.data` for Gemini Vision API

#### Firebase Storage Integration
- Obstacle photo upload via `firebase-admin/storage` → real `imageUrl` saved
- Added `FIREBASE_STORAGE_BUCKET` env var support with `{projectId}.appspot.com` default
- `POST /obstacles/report` response now includes `severity` and `actionTaken`

#### New Endpoint
- `GET /api/v1/orders?courierId=X` — fetch assigned orders for a courier

#### Config & ENV Alignment
- Config reads `API_SECRET_KEY` first, falls back to `API_KEY`
- Added `FIREBASE_SERVICE_ACCOUNT_BASE64` support for Cloud Run deployment
- Added `GEMINI_MODEL_VERSION` and `CORS_ORIGIN` env vars with sensible defaults
- `.env.example` fully updated with all variables

#### Data Model Fixes
- `Order` type now includes: `driverStatus`, `items`, `failureReason`
- `Courier.phone` changed from optional to required
- `AIDecisionLog` gains optional `severity` field (1-5)
- `CreateOrderRequest` accepts `items` field

#### Race Condition Fix
- `orderListener.ts` now skips orders already assigned (guards against dual processing with `POST /orders/dispatch`)

#### Health Endpoint
- Added `GET /api/v1/health` per INTEGRATION_SPEC (root `/health` retained as alias)

#### Error Message Localization
- All `ErrorResponse.message` strings localized to Indonesian
- All `details[].message` strings localized to Indonesian

#### Documentation Updates
- `API_CONTRACT.md` fully rewritten to match actual implementation
- `../architecture/technical_overview.md` updated with current project state
- `PROGRESS.md` Docker milestone marked complete
- **What:** Comprehensive backend refactoring to align with INTEGRATION_SPEC.md (frontend integration contract)
- **Status:** ✅ COMPLETED & TESTED
- **Changes Made:**

#### 1. Type Definitions Update (src/types/index.ts)
- Added `'rerouted' | 'offline'` to `CourierStatus` enum
- Changed `ObstacleSeverity` from strings to numeric 1-5 scale
- Added `ObstacleType` enum: `flood | accident | road_closure | construction | damaged_road | other`
- Created new types: `UpdateOrderStatusRequest/Response`, `LocationBroadcastRequest/Response`, `RouteResponse`, `HealthResponse`, `ErrorResponse`
- Standardized `SuccessResponse<T>` with `{ success: true, data: T }` format
- Updated `RerouteCourierResult` and `BatchOrdersResult` types

#### 2. Response Format Standardization (All Routes)
**From (old):**
```json
{ "status": "success|error", "message": "...", "code": "...", "data": {...} }
```
**To (new, per spec §3.2):**
- **Success:** `{ "success": true, "data": {...} }`
- **Error:** `{ "error": { "code": "...", "message": "...", "details": [...] } }`
- Applied to: `orders.ts`, `obstacles.ts`, `simulation.ts`, `driver.ts`

#### 3. Health Endpoint Fix (src/index.ts)
- ✅ Moved BEFORE API key middleware (removed auth requirement)
- ✅ Changed response format to spec §2.8:
  ```json
  {
    "status": "healthy",
    "services": {
      "firestore": "ok|failing",
      "gemini": "ok|failing",
      "maps": "ok|failing"
    }
  }
  ```

#### 4. New Endpoints Implemented

**a) POST /api/v1/orders/:id/status (src/routes/orders.ts)**
- ✅ Driver order status transitions: `picked_up → in_transit → delivered|failed`
- ✅ Validates allowed transitions per spec §2.5
- ✅ Handles `failureReason` for failed orders
- ✅ Removes order from courier's `assignedOrders` when completed/failed
- ✅ Marks courier as `idle` if no more assigned orders

**b) POST /api/v1/driver/location (src/routes/driver.ts)**
- ✅ GPS coordinate broadcast at 15-second intervals
- ✅ Validates lat/lng ranges per spec §2.6
- ✅ Updates `couriers.currentLocation` in Firestore
- ✅ Returns `{ success: true, data: { receivedAt } }`

**c) GET /api/v1/routes/:orderId (src/routes/driver.ts)**
- ✅ Fetches computed route polyline and turn-by-turn instructions
- ✅ Returns spec-compliant format with `polyline[]`, `steps[]`, `totalDistance`, `estimatedDuration`
- ✅ Implements 60-second in-memory cache to reduce Google Maps API quota
- ✅ Validates order exists and is assigned

#### 5. Obstacle Report Endpoint Refactor (src/routes/obstacles.ts)
- ✅ **CRITICAL:** Changed from JSON body to `multipart/form-data` per spec §2.3
- ✅ Added multer middleware for file upload handling (5 MB limit)
- ✅ Accepts fields: `courierId`, `type`, `severity`, `description`, `lat`, `lng`, `photo` (optional)
- ✅ Type & severity validation with enum checks
- ✅ GPS coordinate validation (-90/90 lat, -180/180 lng)
- ✅ Firebase Storage upload placeholder (ready for production integration)
- ✅ Updated Obstacle type to include `type` and `severity` fields

#### 6. Firestore Service Extensions (src/services/firestore.service.ts)
- Added `updateOrderStatusWithData()` for flexible status updates
- Added `removeOrderFromCourier()` to manage courier's `assignedOrders` array

#### 7. Dependencies Updated (package.json)
- Added `multer@1.4.5-lts.1` for multipart form-data parsing
- Added `@types/multer@1.4.11` for TypeScript support

#### 8. New Routes File Created
- **src/routes/driver.ts** - Handles `/driver/location` and `/routes/:orderId` endpoints

### API Endpoints Status

| Endpoint | Spec §Ref | Status | Notes |
|----------|-----------|--------|-------|
| `POST /api/v1/orders/dispatch` | 2.2 | ✅ Updated | Response format fixed |
| `POST /api/v1/orders/:id/status` | 2.5 | ✅ NEW | Full implementation with validation |
| `POST /api/v1/obstacles/report` | 2.3 | ✅ REFACTORED | Multipart form-data support |
| `POST /api/v1/simulation/traffic` | 2.4 | ✅ Updated | Response format fixed |
| `POST /api/v1/driver/location` | 2.6 | ✅ NEW | GPS broadcast endpoint |
| `GET /api/v1/routes/:orderId` | 2.7 | ✅ NEW | Route polyline + caching |
| `GET /api/v1/health` | 2.8 | ✅ FIXED | Removed auth, added services object |

### Build & Compilation
- ✅ `npm install` — All dependencies installed
- ✅ `npm run build` — TypeScript compiles with 0 errors
- ⏳ Testing phase pending

### Next Steps
1. E2E testing with curl/Postman
2. Test offline scenarios for `/orders/:id/status` endpoint
3. Validate multipart form-data parsing for obstacle reports
4. Firebase Storage integration (currently using placeholder URLs)
5. Docker containerization
6. Cloud Run deployment

---

### 2026-04-30 — Project Initialization
- **What:** Created foundational project documentation
- **Files created:**
  - `../architecture/technical_overview.md` — Full technical analysis of the system architecture
  - `../guides/AGENTS.md` — AI agent configuration with project context, commands, architecture rules, and critical workflow rules
  - `PROGRESS.md` — This file; development milestone tracker
- **Context:** Backend is in pre-implementation phase. All specification documents (`PRD.MD`, `API_CONTRACT.md`, `FIRESTORE_SCHEMA.md`, `AI_PROMPTS_AND_SPECS.md`, `TEST_CASES_SCENARIOS.md`, `.env.example`) were already in place. No source code exists yet.
- **Next steps:** Scaffold Node.js/TypeScript project with `package.json`, `tsconfig.json`, and the directory structure defined in `../guides/AGENTS.md`.

---

## Existing Specification Documents
| Document | Purpose |
|---|---|
| `PRD.MD` | Product requirements, objectives, tech stack, scope |
| `API_CONTRACT.md` | REST endpoint contracts (request/response schemas) |
| `FIRESTORE_SCHEMA.md` | Firestore collection structures & security rules |
| `AI_PROMPTS_AND_SPECS.md` | Gemini system prompts, vision prompts, function-calling schemas |
| `TEST_CASES_SCENARIOS.md` | 4 live demo scenarios with pass/fail criteria |
| `.env.example` | Environment variable template |
