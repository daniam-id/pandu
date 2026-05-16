# Pandu.ai Backend Integration Specification

**Version**: 1.0.0
**Date**: 2026-05-03
**Scope**: Dispatcher Dashboard ↔ Driver App ↔ Cloud Run Backend
**Target Audience**: Backend engineering team

---

## Table of Contents

1. [Integration Overview & Architecture](#1-integration-overview--architecture)
2. [API Contract / Endpoints](#2-api-contract--endpoints)
3. [Data Models & Payloads](#3-data-models--payloads)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Real-time & Event Synchronization](#5-real-time--event-synchronization)
6. [Error Handling & HTTP Status Codes](#6-error-handling--http-status-codes)
7. [Environment & Configuration](#7-environment--configuration)
8. [Testing & Mocking Guidelines](#8-testing--mocking-guidelines)

---

## 1. Integration Overview & Architecture

### 1.1 System Topology

```
┌─────────────────────────────┐      REST (HTTPS)       ┌──────────────────────────────┐
│   Dispatcher Dashboard      │  ◄────────────────────►  │                              │
│   (Vite + React 18, :3000)  │                         │     Cloud Run API Server     │
│                             │                         │     (Node.js / Express)      │
│  • Firestore onSnapshot     │                         │                              │
│  • REST writes (dispatch,   │                         │  • REST endpoint handlers    │
│    simulate)                │                         │  • Gemini AI orchestration     │
│                             │                         │  • Firestore Admin writes    │
└──────────┬──────────────────┘                         │  • Google Maps Routes API    │
           │                                             └────────────┬─────────────────┘
           │ onSnapshot                                        │
           ▼                                                   │ Firebase Admin SDK
┌───────────────────────────────────────────────────────────────┴───────────────────────┐
│                           Firestore Database                                            │
│   couriers │ orders │ obstacles │ ai_decision_logs                                    │
└──────┬────────────────────────────────────────────────────────────────────────────────┘
       │ onSnapshot
       ▼
┌─────────────────────────────┐      REST (HTTPS)       ┌──────────────────────────────┐
│   Driver Mobile Web App     │  ◄────────────────────►  │                              │
│   (Vite + React 18, :3001)  │                         │     Cloud Run API Server     │
│                             │                         │     (shared instance)        │
│  • Firestore onSnapshot     │                         │                              │
│    (orders, courier doc)    │                         │                              │
│  • REST writes (status,     │                         │                              │
│    location, obstacles)    │                         │                              │
│  • REST reads (routes)       │                         │                              │
└─────────────────────────────┘                         └──────────────────────────────┘
```

### 1.2 Communication Direction Matrix

| Direction | Protocol | Data | Trigger |
|-----------|----------|------|---------|
| Dispatcher → Backend | `POST /api/v1/orders/dispatch` | New order payload | User clicks "Dispatch" |
| Dispatcher → Backend | `POST /api/v1/simulation/traffic` | Traffic anomaly config | User triggers demo scenario |
| Backend → Firestore | Admin SDK write | `orders` doc (status=`assigned`), `couriers` doc update | AI assignment / reroute decision |
| Firestore → Dispatcher | Client `onSnapshot` | Real-time courier positions, order statuses, AI logs | Firestore document change |
| Driver → Backend | `POST /api/v1/orders/:id/status` | Status transition | Courier taps action button |
| Driver → Backend | `POST /api/v1/obstacles/report` | Multipart form (photo + metadata) | Courier submits report |
| Driver → Backend | `POST /api/v1/driver/location` | GPS coordinates | 15-second interval (when active) |
| Driver → Backend | `GET /api/v1/routes/:orderId` | Route polyline + turn-by-turn | Courier navigates to Route page |
| Firestore → Driver | Client `onSnapshot` | Orders list, courier profile | Firestore document change |
| Backend → Firestore | Admin SDK write | `obstacles` doc, `couriers.currentRoutePolyline`, `ai_decision_logs` | AI analysis / reroute execution |

### 1.3 State Sync Strategy

| Source of Truth | Collection | Writes By | Reads By |
|-----------------|------------|-----------|----------|
| Backend (REST) | `orders` (status transitions) | Driver app (`POST /orders/:id/status`) | Both apps via `onSnapshot` |
| Backend (AI) | `couriers` (route, location, status) | Backend AI + Driver location endpoint | Dispatcher map markers |
| Backend (REST) | `obstacles` | Driver app (`POST /obstacles/report`) | Dispatcher (future: obstacle map layer) |
| Backend (AI) | `ai_decision_logs` | Backend AI orchestration | Dispatcher (log panel) |
| Dispatcher UI | `orders` (initial creation) | Dispatcher (`POST /orders/dispatch`) | Both apps via `onSnapshot` |

### 1.4 Critical Integration Path: Order Lifecycle

```
Dispatcher ──POST /orders/dispatch──► Backend ──Firestore write──► orders.status = "pending"
                                        │                              │
                                        ▼                              ▼
                                 AI assignment pipeline          Firestore trigger
                                 (Gemini function call)           Backend listener
                                        │                              │
                                        ▼                              ▼
                                 Firestore write ───────────►  orders.status = "assigned"
                                 orders.assignedCourierId           │
                                 couriers.assignedOrders[]         ▼
                                                                    Driver onSnapshot
                                                                    (orders query)
                                                                        │
                                                                        ▼
                            ┌─────────────────────────────────────────────────────────┐
                            │  Driver App: Status Transitions (via REST)              │
                            │                                                         │
                            │  assigned ──POST /orders/:id/status──► picked_up      │
                            │  picked_up ──POST /orders/:id/status──► in_transit   │
                            │  in_transit ──POST /orders/:id/status──► delivered     │
                            │  in_transit ──POST /orders/:id/status──► failed        │
                            └─────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                                 Backend updates Firestore:
                                 orders.status, orders.completedAt, couriers.status
```

---

## 2. API Contract / Endpoints

**Base URL**: `https://{CLOUD_RUN_URL}/api/v1`
**Current Version**: `v1` (path-prefixed)
**Content-Type**: `application/json` (all endpoints except obstacle report)
**Timeout**: 8 seconds (client-side Axios default)

### 2.1 Endpoint Registry

| # | Method | Path | Auth | Consumer | Purpose |
|---|--------|------|------|----------|---------|
| 1 | `POST` | `/orders/dispatch` | `x-api-key` | Dispatcher | Create new order, trigger AI assignment |
| 2 | `POST` | `/obstacles/report` | `x-api-key` | Driver | Report road obstacle with optional photo |
| 3 | `POST` | `/simulation/traffic` | `x-api-key` | Dispatcher | Inject fake traffic for demo |
| 4 | `GET` | `/orders` | `x-api-key` | Driver | [TODO: Confirm] Fetch assigned orders for courier |
| 5 | `POST` | `/orders/:id/status` | `x-api-key` | Driver | Transition order status |
| 6 | `POST` | `/driver/location` | `x-api-key` | Driver | Broadcast GPS position |
| 7 | `GET` | `/routes/:orderId` | `x-api-key` | Driver | Fetch computed route polyline + steps |
| 8 | `GET` | `/health` | None | Both | Health check for AI engine status indicator |

> **Rate Limiting**: [TODO: Confirm] Currently unspecified. Suggest `100 req/min` per API key for hackathon; `driver/location` endpoint may need a higher bucket (`240 req/min` = 15s intervals).

### 2.2 Endpoint: Dispatch Order

```
POST /api/v1/orders/dispatch
```

**Request Body**:

```json
{
  "pickupLocation": {
    "lat": -7.265112,
    "lng": 112.742331
  },
  "dropoffLocation": {
    "lat": -7.301221,
    "lng": 112.739110
  },
  "priority": "normal"
}
```

**Response (201 Created)**:

```json
{
  "status": "success",
  "message": "Order dispatched and processed by AI",
  "data": {
    "orderId": "ord_abc123",
    "assignedCourierId": "cour_xyz789",
    "estimatedDeliveryTime": 42
  }
}
```

**Backend Actions on Success**:
1. Write `orders` document with `status: "pending"`, `pickupLocation`, `dropoffLocation`.
2. Trigger AI assignment pipeline.
3. AI selects courier → update `orders.assignedCourierId`, `orders.status = "assigned"`.
4. Append `orderId` to `couriers/{id}.assignedOrders` array.
5. Compute route via Google Maps Routes API → write `couriers.currentRoutePolyline`.
6. Write `ai_decision_logs` entry: `type: "order_batched"` or `"route_optimized"`.

### 2.3 Endpoint: Report Obstacle

```
POST /api/v1/obstacles/report
```

**Content-Type**: `multipart/form-data` (Driver app sends File blob)

**Driver → Backend FormData Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courierId` | string | Yes | Reporting courier ID |
| `type` | string | Yes | `flood`, `accident`, `road_closure`, `construction`, `damaged_road`, `other` |
| `severity` | number | Yes | `1`–`5` (client-selected; backend may override after AI analysis) |
| `description` | string | Yes | Free-text description, max 500 chars |
| `photo` | File | No | Image file, max 5 MB, MIME `image/*` |
| `lat` | number | Yes | GPS latitude |
| `lng` | number | Yes | GPS longitude |

**Backend Processing**:
1. Upload photo to Firebase Storage (if present) → generate public `imageUrl`.
2. Send `imageUrl` + vision prompt to Gemini 3.1 Flash-Lite multimodal endpoint.
3. Parse structured response: `severity`, `description`, `actionTaken` (`rerouted` or `ignored`).
4. If AI `severity === "high"` → trigger `reroute_courier` function call:
   - Query Google Maps Routes API for alternate path avoiding obstacle location.
   - Update `couriers/{courierId}.currentRoutePolyline`.
   - Update `couriers/{courierId}.status = "rerouted"`.
5. Write `obstacles` document (see §3 Firestore schema).
6. Write `ai_decision_logs` entry: `type: "obstacle_avoided"`.

**Response (201 Created)**:

```json
{
  "success": true,
  "reportId": "obs_def456",
  "message": "Laporan berhasil dikirim"
}
```

> **⚠️ Known Contract Mismatch**: Backend `API_CONTRACT.md` expects `imageUrl` (string) in the request. Driver app uploads a raw `File` object as multipart. **Resolution**: Backend must accept `multipart/form-data`, stream-upload the `File` to Firebase Storage, then pass the resulting `imageUrl` to Gemini. Update backend contract to match multipart intake.

### 2.4 Endpoint: Simulate Traffic

```
POST /api/v1/simulation/traffic
```

**Request Body**:

```json
{
  "targetAreaName": "Jalan HR Muhammad",
  "congestionLevel": "heavy",
  "affectedRadiusKm": 1.5
}
```

**Response (200 OK)**:

```json
{
  "status": "success",
  "message": "Traffic anomaly simulated. Agent is recalculating routes.",
  "data": {
    "affectedCouriers": ["cour_xyz789", "cour_abc123"]
  }
}
```

**Backend Actions on Success**:
1. Query `couriers` collection for active couriers whose `currentRoutePolyline` passes through the affected area.
2. Send traffic context to Gemini AI.
3. Execute `reroute_courier` for each affected courier.
4. Write `ai_decision_logs` entries for each reroute decision.

### 2.5 Endpoint: Update Order Status

```
POST /api/v1/orders/:id/status
```

**Path Parameter**: `id` — Order document ID (Firestore ID)

**Request Body**:

```json
{
  "status": "picked_up",
  "timestamp": "2026-05-03T10:30:00Z",
  "failureReason": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Target status value |
| `timestamp` | string (ISO 8601) | Yes | Client-side action timestamp |
| `failureReason` | string | No | Required only when `status === "failed"` |

**Valid Status Transitions** (enforced server-side):

| From | To | Action Label | Backend Side Effects |
|------|-----|-------------|---------------------|
| `assigned` | `picked_up` | Ambil Paket | — |
| `picked_up` | `in_transit` | Mulai Antar | — |
| `in_transit` | `delivered` | Selesai | Update `orders.completedAt`; remove from `couriers.assignedOrders`; if `assignedOrders` empty, set `couriers.status = "idle"` |
| `in_transit` | `failed` | Gagal | Update `orders.completedAt`; remove from `couriers.assignedOrders`; write `failureReason` to order doc |

> **⚠️ Status Vocabulary Mapping**: The driver app uses courier-facing values (`assigned`, `picked_up`, `in_transit`, `delivered`, `failed`). The backend Firestore `orders.status` stores canonical values that may differ (`pending`, `assigned`, `completed`, `failed`). **Backend MUST implement a bidirectional mapping layer**:
> - Driver `assigned` ↔ Backend `assigned`
> - Driver `picked_up` ↔ Backend `assigned` (with sub-state metadata) [TODO: Confirm]
> - Driver `in_transit` ↔ Backend `assigned` (with sub-state metadata) [TODO: Confirm]
> - Driver `delivered` ↔ Backend `completed`
> - Driver `failed` ↔ Backend `failed`
>
> Suggestion: Add `driverStatus` field to `orders` collection for driver-facing state, or store a unified state machine with a `displayStatus` computed property.

**Response (200 OK)**:

```json
{
  "success": true,
  "orderId": "ord_abc123",
  "newStatus": "picked_up",
  "updatedAt": "2026-05-03T10:30:05Z"
}
```

**Client Offline Behavior**: Driver app queues `updateOrderStatus` calls in memory when `navigator.onLine === false`. Auto-retries on `online` event. After 3 failed retries, prompts manual retry. Backend must be **idempotent** — receiving the same `(orderId, status, timestamp)` tuple multiple times should not corrupt state.

### 2.6 Endpoint: Broadcast Driver Location

```
POST /api/v1/driver/location
```

**Request Body**:

```json
{
  "courierId": "cour_xyz789",
  "lat": -6.2088,
  "lng": 106.8456,
  "accuracy": 12.5,
  "timestamp": "2026-05-03T10:30:00Z"
}
```

**Backend Actions**:
1. Validate coordinates (`lat` ∈ [-90, 90], `lng` ∈ [-180, 180]).
2. Write to `couriers/{courierId}.currentLocation` with server timestamp.
3. Optionally: update `couriers.updatedAt`.

**Response (200 OK)**:

```json
{
  "success": true,
  "receivedAt": "2026-05-03T10:30:00Z"
}
```

> **Rate Limiting Note**: Driver app broadcasts at 15-second intervals (~4 req/min per courier when active). Backend should tolerate bursty reconnections (driver toggles location sharing on/off) without rate-limit thrashing.

### 2.7 Endpoint: Fetch Route

```
GET /api/v1/routes/:orderId
```

**Path Parameter**: `orderId` — Order document ID

**Response (200 OK)**:

```json
{
  "orderId": "ord_abc123",
  "polyline": [
    { "lat": -6.2088, "lng": 106.8456 },
    { "lat": -6.2090, "lng": 106.8460 },
    { "lat": -6.2100, "lng": 106.8480 }
  ],
  "steps": [
    {
      "instruction": "Lurus ke arah utara menuju Jl. Sudirman",
      "distance": 450,
      "maneuver": "straight"
    },
    {
      "instruction": "Belok kanan ke Jl. Thamrin",
      "distance": 1200,
      "maneuver": "turn-right"
    }
  ],
  "totalDistance": 3200,
  "estimatedDuration": 900
}
```

| Field | Type | Description |
|-------|------|-------------|
| `polyline` | `LatLng[]` | Ordered geographic points for the route line |
| `steps` | `RouteStep[]` | Turn-by-turn instructions |
| `totalDistance` | number | Total route distance in meters |
| `estimatedDuration` | number | Estimated travel time in seconds |

**Backend Implementation**: Query Google Maps Routes API (or Directions API) using `orders.pickupLocation` → `orders.dropoffLocation`. Cache result for [TODO: Specify TTL, suggest 60 seconds] to reduce API quota consumption.

### 2.8 Endpoint: Health Check

```
GET /api/v1/health
```

**Auth**: None (or `x-api-key` if desired)

**Response (200 OK)**:

```json
{
  "status": "healthy",
  "services": {
    "firestore": "ok",
    "gemini": "ok",
    "maps": "ok"
  }
}
```

> **Usage**: Dispatcher dashboard polls this endpoint every 30 seconds (`AIEngineStatus` component) to show a green/red status badge.

---

## 3. Data Models & Payloads

### 3.1 Firestore Collections (Source of Truth)

#### Collection: `orders`

```json
{
  "id": "ord_abc123",
  "pickupLocation": {
    "lat": -7.265112,
    "lng": 112.742331
  },
  "dropoffLocation": {
    "lat": -7.301221,
    "lng": 112.739110
  },
  "status": "assigned",
  "assignedCourierId": "cour_xyz789",
  "priority": 3,
  "items": "Paket elektronik - headphone wireless",
  "createdAt": "timestamp",
  "completedAt": "timestamp (nullable)",
  "failureReason": "string (nullable)"
}
```

**Field Specifications**:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore auto-generated document ID |
| `pickupLocation` | GeoPoint | Yes | `{ lat: number, lng: number }`; both WGS84 |
| `dropoffLocation` | GeoPoint | Yes | `{ lat: number, lng: number }`; both WGS84 |
| `status` | string | Yes | Enum: `pending`, `assigned`, `completed`, `failed` |
| `assignedCourierId` | string | No | Firestore courier doc ID; null when unassigned |
| `priority` | number | Yes | Integer `1`–`5` (`1` = lowest) |
| `items` | string | No | Human-readable package description |
| `createdAt` | timestamp | Yes | Server timestamp on creation |
| `completedAt` | timestamp | No | Server timestamp on terminal status (`completed` or `failed`) |
| `failureReason` | string | No | Required only when `status === "failed"` |

> **[TODO: Confirm]** Should `orders` store driver-facing sub-statuses (`picked_up`, `in_transit`) as a separate field (e.g., `driverStatus`), or should the backend map from `status` + timeline metadata?

#### Collection: `couriers`

```json
{
  "id": "cour_xyz789",
  "name": "Budi Santoso",
  "phone": "+6281234567890",
  "status": "delivering",
  "currentLocation": {
    "lat": -7.250445,
    "lng": 112.768845
  },
  "assignedOrders": ["ord_abc123", "ord_def456"],
  "currentRoutePolyline": "string (Encoded Google Maps Polyline)",
  "updatedAt": "timestamp"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore doc ID (matches `REACT_APP_COURIER_ID` env var on driver device) |
| `name` | string | Yes | Display name |
| `phone` | string | Yes | E.164 or local Indonesian format |
| `status` | string | Yes | Enum: `idle`, `delivering`, `rerouted`, `offline` |
| `currentLocation` | GeoPoint | No | Last known GPS position |
| `assignedOrders` | string[] | Yes | Array of order doc IDs (batching support) |
| `currentRoutePolyline` | string | No | Encoded Google Maps polyline string |
| `updatedAt` | timestamp | Yes | Server timestamp on last write |

#### Collection: `obstacles`

```json
{
  "id": "obs_def456",
  "courierId": "cour_xyz789",
  "imageUrl": "https://firebasestorage.googleapis.com/...",
  "location": {
    "lat": -7.284561,
    "lng": 112.733512
  },
  "type": "flood",
  "severity": 4,
  "description": "Jalan tergenang setinggi 30 cm, tidak bisa dilalui motor",
  "aiAnalysis": {
    "severity": "high",
    "description": "Severe flooding detected, road impassable.",
    "actionTaken": "rerouted"
  },
  "status": "analyzed",
  "createdAt": "timestamp"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | Yes | Firestore auto-generated doc ID |
| `courierId` | string | Yes | Reporting courier doc ID |
| `imageUrl` | string | No | Firebase Storage public URL |
| `location` | GeoPoint | Yes | `{ lat, lng }` of obstacle |
| `type` | string | Yes | Enum: `flood`, `accident`, `road_closure`, `construction`, `damaged_road`, `other` |
| `severity` | number | Yes | `1`–`5` (client-selected; may differ from AI analysis) |
| `description` | string | Yes | Max 500 characters |
| `aiAnalysis` | object | No | `{ severity: string, description: string, actionTaken: string }` |
| `status` | string | Yes | `pending_analysis` → `analyzed` |
| `createdAt` | timestamp | Yes | Server timestamp |

#### Collection: `ai_decision_logs`

```json
{
  "id": "log_ghi789",
  "type": "route_optimized",
  "message": "Rerouting Budi to avoid flood at HR Muhammad. Added 3 mins to ETA.",
  "severity": 3,
  "relatedCourierId": "cour_xyz789",
  "relatedOrderId": "ord_abc123",
  "timestamp": "timestamp"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | string | Yes | Enum: `route_optimized`, `order_batched`, `obstacle_avoided` |
| `message` | string | Yes | Human-readable description |
| `severity` | number | No | `1`–`5`; `3`+ triggers alert styling on dispatcher |
| `relatedCourierId` | string | No | Nullable foreign key to `couriers` |
| `relatedOrderId` | string | No | Nullable foreign key to `orders` |
| `timestamp` | timestamp | Yes | Server timestamp |

### 3.2 API Request/Response Schemas

#### Generic Success Response Wrapper

```json
{
  "success": true,
  "data": { /* endpoint-specific */ }
}
```

#### Generic Error Response Wrapper

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message in Indonesian",
    "details": [
      { "field": "status", "message": "Invalid status transition" }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error.code` | string | Yes | Machine-readable error identifier |
| `error.message` | string | Yes | Pre-localized user-friendly message (Indonesian) |
| `error.details` | array | No | Per-field validation errors; safe for UI form rendering |

> **Rule**: Client apps (Dispatcher & Driver) **MUST NOT** display `error.code` or `error.details` directly to end users. Only `error.message` is UI-safe. Debug information is logged to `console.error`.

### 3.3 Pagination

No pagination is currently required for any endpoint in the MVP scope:
- `GET /orders` returns all active orders for a single courier (typically ≤10).
- `GET /routes/:orderId` returns a single route object.
- Firestore `onSnapshot` queries are filtered by `courierId` or use `limit(100)` for log feeds.

> **[TODO: Confirm]** If dispatcher dashboard scales to 100+ couriers, `couriers` collection reads may need server-side pagination or GeoQuery filtering.

### 3.4 Idempotency

| Endpoint | Idempotency Strategy |
|----------|---------------------|
| `POST /orders/dispatch` | Not idempotent (creates new resources). Client may retry on network timeout; backend should detect duplicate payloads via `clientRequestId` [TODO: Add `clientRequestId` field?]. |
| `POST /orders/:id/status` | **Idempotent by `(orderId, status, timestamp)` tuple**. Receiving the same transition twice must not corrupt state. Suggest storing `(orderId, status, timestamp)` in a transient deduplication window (e.g., 60-second Redis key or Firestore sub-collection). |
| `POST /obstacles/report` | Not idempotent (creates new reports). Acceptable — duplicate reports from driver retries are tolerable. |
| `POST /driver/location` | Idempotent by nature (overwrite latest position). No deduplication needed. |
| `GET /routes/:orderId` | Safe (read-only). Caching encouraged. |

---

## 4. Authentication & Authorization

### 4.1 Current Hackathon Model

| Mechanism | Value | Scope |
|-----------|-------|-------|
| Static API Key | `x-api-key` header | All REST endpoints |
| API Key Value | Defined in `.env` (`API_SECRET_KEY`) | Shared across all clients |
| Firestore Client SDK | Anonymous auth or open rules | Real-time reads from both apps |

**Header Format**:

```http
x-api-key: <API_SECRET_KEY>
```

### 4.2 Role Mapping (Future / Production)

> **[TODO: Confirm] Currently not implemented.** For production, replace static key with JWT-based auth:

| Role | Claims | Firestore Write Permissions |
|------|--------|----------------------------|
| `dispatcher` | `role: "dispatcher"`, `orgId: "..."` | Write to `orders` (create only), read all `couriers` |
| `courier` | `role: "courier"`, `courierId: "..."` | Write to `orders/{id}/status` (own orders only), write `obstacles`, write `driver/location` (own ID only) |
| `backend` | `role: "service"` (Firebase Admin SDK) | Full read/write on all collections |

### 4.3 Session / Expiry Rules

| Environment | Session Strategy |
|-------------|-----------------|
| Hackathon | No session expiry; static key valid indefinitely. |
| Production | JWT with `exp` claim (suggest 24-hour sliding window). Refresh token stored in `httpOnly` cookie or secure storage. |

### 4.4 Firestore Security Rules (Current)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

> **[TODO: Confirm] Production rules must restrict writes**:
> - `couriers/{courierId}`: write allowed only if `request.auth.token.courierId == courierId`.
> - `orders/{orderId}`: status update allowed only if `request.auth.token.courierId == resource.data.assignedCourierId`.
> - `orders` creation: allowed only for `dispatcher` role or backend service account.

---

## 5. Real-time & Event Synchronization

### 5.1 Firestore as Event Bus

Both frontend applications (Dispatcher and Driver) listen to Firestore via client SDK `onSnapshot` listeners. The backend writes to Firestore via Firebase Admin SDK. This provides a **serverless pub/sub** mechanism with no need for WebSockets or Webhooks.

### 5.2 Frontend Listener Subscriptions

| App | Collection / Query | Trigger Condition | UI Effect |
|-----|---------------------|-------------------|-----------|
| Dispatcher | `couriers` (all docs) | Any `currentLocation` or `status` change | Map marker moves, status badge updates |
| Dispatcher | `orders` (all docs, `status != "completed"`) | New order, assignment, completion | Order list updates, map markers appear |
| Dispatcher | `ai_decision_logs` (`orderBy(timestamp, desc)`, `limit(100)`) | New AI decision | Log panel appends entry, auto-scroll |
| Driver | `orders` (`where courierId == currentCourierId`) | Status change, new assignment | Orders list refreshes, detail page updates |
| Driver | `couriers/{currentCourierId}` | Profile update, route change | Profile card updates, route polyline updates |

### 5.3 Backend Firestore Listeners (Server-Side)

| Collection | Filter | Trigger Action |
|------------|--------|----------------|
| `orders` | `status == "pending"` | Trigger AI assignment pipeline |
| `couriers` | `status == "rerouted"` | Monitor reroute completion; clear status after new route accepted |
| `obstacles` | `status == "pending_analysis"` | Trigger Gemini Vision analysis |

### 5.4 Event Delivery Guarantees

| Property | Behavior |
|----------|----------|
| Ordering | Firestore `onSnapshot` delivers events in document mutation order per client. |
| Latency | Typically <500 ms from server write to client callback (dependent on network). |
| Offline | Client SDK queues listeners locally; replays missed events on reconnection. |
| Deduplication | Firestore handles duplicate suppression for the same document revision. |

> **No WebSockets or Webhooks are used.** All real-time sync is via Firestore's built-in streaming protocol (gRPC over HTTPS). This is intentional — it eliminates socket connection management and scales automatically.

---

## 6. Error Handling & HTTP Status Codes

### 6.1 Standard Response Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200 OK` | Success (read or non-creating write) | `GET /routes/:orderId`, `POST /driver/location`, `POST /obstacles/report` |
| `201 Created` | Resource created | `POST /orders/dispatch`, `POST /obstacles/report` |
| `400 Bad Request` | Client payload invalid | Missing required field, invalid status transition, malformed JSON |
| `401 Unauthorized` | Missing or invalid `x-api-key` | Any endpoint without valid key [TODO: Currently not enforced?] |
| `403 Forbidden` | Valid auth, but action not permitted | Courier updating order not assigned to them |
| `404 Not Found` | Resource does not exist | `GET /routes/:orderId` with unknown ID, `POST /orders/:id/status` with unknown ID |
| `409 Conflict` | Concurrent modification | Another client updated the order status between read and write |
| `413 Payload Too Large` | File exceeds limit | `POST /obstacles/report` with photo > 5 MB |
| `429 Too Many Requests` | Rate limit exceeded | `POST /driver/location` > 15-second interval bursts |
| `500 Internal Server Error` | Server-side failure | Gemini API failure, Firestore write timeout, Maps API error |
| `503 Service Unavailable` | Temporary outage | Backend overloaded, Gemini rate limit |

### 6.2 Error Response Format (All Endpoints)

```json
{
  "error": {
    "code": "IMAGE_PROCESSING_FAILED",
    "message": "Gagal menganalisis foto. Coba lagi.",
    "details": []
  }
}
```

### 6.3 Retry Rules (Client-Side)

| Endpoint | Retry Strategy | Max Retries | Backoff |
|----------|---------------|-------------|---------|
| `POST /orders/:id/status` | Queue + auto-retry on `online` event | 3 (then manual prompt) | Immediate on reconnect |
| `POST /driver/location` | Silently drop; next tick retries | ∞ (no limit) | 15-second interval |
| `POST /obstacles/report` | Block with warning; no auto-retry | 0 | N/A |
| `GET /routes/:orderId` | Show cached or error state | 0 | N/A |

### 6.4 Fallback Behavior

| Failure Mode | Dispatcher Behavior | Driver Behavior |
|--------------|---------------------|-----------------|
| Backend unreachable | Map markers stale; order list reads from Firestore cache | Orders list reads from Firestore cache; status updates queued |
| Firestore listener disconnect | Show offline banner; retry on reconnect | Show offline banner; retry on reconnect |
| Gemini API down | AI log stops; obstacle analysis deferred to manual review | Obstacle report stores without AI analysis; backend retries later |
| Google Maps API down | Map renders without route polylines; couriers still visible | Route page shows "Rute tidak tersedia" placeholder |

---

## 7. Environment & Configuration

### 7.1 Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `8080` | HTTP server port (Cloud Run overrides) |
| `API_SECRET_KEY` | Yes | — | Static API key for `x-api-key` header validation |
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key |
| `GEMINI_MODEL_VERSION` | Yes | `gemini-3.1-flash-lite-preview` | Gemini model identifier |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Yes | — | Base64-encoded Firebase Admin SDK service account JSON |
| `GOOGLE_MAPS_API_KEY` | Yes | — | Google Maps Platform API key (Routes API) |
| `FIREBASE_STORAGE_BUCKET` | [TODO: Confirm] | — | Firebase Storage bucket for obstacle photos |
| `LOCATION_BROADCAST_INTERVAL_MS` | No | `15000` | Expected driver location broadcast interval (used for stale-courier detection) |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin(s); set to dispatcher + driver origins in production |

### 7.2 Frontend Environment Variables (Reference)

| Variable | Consumer | Value Example |
|----------|----------|---------------|
| `REACT_APP_API_BASE_URL` | Both | `https://api-pandu-ai-[hash].a.run.app` |
| `REACT_APP_FIREBASE_API_KEY` | Both | Firebase Web API key |
| `REACT_APP_FIREBASE_PROJECT_ID` | Both | `pandu-ai-2026` |
| `REACT_APP_FIREBASE_APP_ID` | Both | Firebase App ID |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Both | Firebase Messaging sender ID |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Both | Google Maps JS API key |
| `REACT_APP_COURIER_ID` | Driver only | `cour_xyz789` (hardcoded per-device) |

### 7.3 Base URLs

| Environment | Dispatcher URL | Driver URL | Backend URL |
|-------------|----------------|------------|-------------|
| Local Dev | `http://localhost:3000` | `http://localhost:3001` | `http://localhost:8080` |
| Production | `https://dispatcher.pandu-ai-2026.web.app` | `https://driver.pandu-ai-2026.web.app` [TODO: Confirm] | `https://api-pandu-ai-[hash].a.run.app` |

### 7.4 Feature Flags

| Flag | Default | Description | Consumers |
|------|---------|-------------|-----------|
| `ENABLE_AI_OBSTACLE_ANALYSIS` | `true` | Send obstacle photos to Gemini for severity analysis | Backend |
| `ENABLE_ROUTE_CACHING` | `true` | Cache Google Maps route responses for 60 seconds | Backend |
| `ENABLE_OFFLINE_QUEUE` | `true` | Allow driver app to queue status updates when offline | Driver |
| `ENABLE_SIMULATION` | `true` | Expose `/simulation/traffic` endpoint | Backend |

---

## 8. Testing & Mocking Guidelines

### 8.1 cURL Examples

#### 8.1.1 Dispatch Order

```bash
curl -X POST https://$BACKEND_URL/api/v1/orders/dispatch \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET_KEY" \
  -d '{
    "pickupLocation": {"lat": -7.265112, "lng": 112.742331},
    "dropoffLocation": {"lat": -7.301221, "lng": 112.739110},
    "priority": "normal"
  }'
```

#### 8.1.2 Update Order Status (Driver)

```bash
curl -X POST https://$BACKEND_URL/api/v1/orders/ord_abc123/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET_KEY" \
  -d '{
    "status": "picked_up",
    "timestamp": "2026-05-03T10:30:00Z"
  }'
```

#### 8.1.3 Report Obstacle (with Photo)

```bash
curl -X POST https://$BACKEND_URL/api/v1/obstacles/report \
  -H "x-api-key: $API_SECRET_KEY" \
  -F "courierId=cour_xyz789" \
  -F "type=flood" \
  -F "severity=4" \
  -F "description=Jalan tergenang setinggi 30cm" \
  -F "lat=-7.284561" \
  -F "lng=112.733512" \
  -F "photo=@/path/to/photo.jpg"
```

#### 8.1.4 Broadcast Location

```bash
curl -X POST https://$BACKEND_URL/api/v1/driver/location \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET_KEY" \
  -d '{
    "courierId": "cour_xyz789",
    "lat": -7.250445,
    "lng": 112.768845,
    "accuracy": 8.2,
    "timestamp": "2026-05-03T10:30:00Z"
  }'
```

#### 8.1.5 Health Check

```bash
curl https://$BACKEND_URL/api/v1/health
```

### 8.2 Mock Data Templates

#### 8.2.1 Mock Courier Document

```json
{
  "id": "cour_mock_001",
  "name": "Ahmad Mock",
  "phone": "+6281234567890",
  "status": "delivering",
  "currentLocation": { "lat": -7.2575, "lng": 112.7521 },
  "assignedOrders": ["ord_mock_001"],
  "currentRoutePolyline": "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  "updatedAt": "2026-05-03T10:00:00Z"
}
```

#### 8.2.2 Mock Order Document

```json
{
  "id": "ord_mock_001",
  "pickupLocation": { "lat": -7.265, "lng": 112.742 },
  "dropoffLocation": { "lat": -7.301, "lng": 112.739 },
  "status": "assigned",
  "assignedCourierId": "cour_mock_001",
  "priority": 3,
  "items": "Mock paket - buku teks",
  "createdAt": "2026-05-03T09:00:00Z",
  "completedAt": null,
  "failureReason": null
}
```

### 8.3 Edge-Case Simulation Scenarios

| Scenario | How to Simulate | Expected Backend Behavior |
|----------|-----------------|--------------------------|
| Offline driver status update | Block network on driver device, tap "Ambil Paket" | Queue in memory; on reconnect, auto-retry `POST /orders/:id/status` |
| Concurrent status update | Two driver devices share same `REACT_APP_COURIER_ID`; both tap simultaneously | Second request returns `409 Conflict`; client refreshes Firestore data |
| Invalid status transition | Send `POST /orders/:id/status` with `status: "delivered"` when current is `assigned` | Return `400 Bad Request` with code `INVALID_STATUS_TRANSITION` |
| Missing photo in obstacle report | Send multipart without `photo` field | Accept report; `imageUrl` remains null; skip Gemini Vision analysis |
| Photo > 5 MB | Attach 6 MB image to `/obstacles/report` | Return `413 Payload Too Large` |
| Invalid coordinates | Send `lat: 95` to `/driver/location` | Return `400 Bad Request`; silently discard (driver app ignores error) |
| Gemini Vision timeout | Mock Gemini API to delay >30s | Return `503 Service Unavailable` or `500 Internal Server Error` with `AI_PROCESSING_TIMEOUT` |
| Courier without active orders | Query `GET /routes/:orderId` for `ord` with `assignedCourierId: null` | Return `404 Not Found` |
| Stale location data | Stop sending `/driver/location` for >5 minutes | Backend may mark `couriers.status = "offline"` [TODO: Confirm stale threshold] |

### 8.4 Postman Collection Structure

```
Pandu.ai Backend API
├── 🔐 Auth
│   └── x-api-key (collection-level header)
├── 📦 Orders
│   ├── Dispatch Order
│   ├── Update Status
│   └── [TODO: Confirm] Get Orders by Courier
├── 🚧 Obstacles
│   └── Report Obstacle (multipart)
├── 📍 Driver
│   ├── Broadcast Location
│   └── Fetch Route
├── 🧪 Simulation
│   └── Inject Traffic Anomaly
└── ❤️ Health
    └── Check Status
```

---

## Appendix A: Status Vocabulary Translation

| Driver App Value | Backend Canonical Value | UI Label (Driver) | UI Label (Dispatcher) |
|------------------|------------------------|-------------------|----------------------|
| `assigned` | `assigned` | Diterima | Assigned |
| `picked_up` | `assigned` [TODO: sub-state?] | Diambil | — |
| `in_transit` | `assigned` [TODO: sub-state?] | Dalam Perjalanan | Delivering |
| `delivered` | `completed` | Selesai | Completed |
| `failed` | `failed` | Gagal | Failed |

**Recommendation**: Add a `driverStatus` field (string) to the `orders` Firestore document. The backend updates `driverStatus` on every `POST /orders/:id/status` call, while `status` remains the canonical lifecycle state for dispatcher aggregation. This avoids ambiguity and simplifies queries on both sides.

---

## Appendix B: Open Questions / TODOs

| ID | Question | Priority | Suggested Resolution |
|----|----------|----------|---------------------|
| T1 | Should `/orders` (GET by courier) exist as a REST endpoint, or is Firestore `onSnapshot` sufficient for the driver app? | Medium | Implement REST endpoint for initial hydration; Firestore handles real-time updates. |
| T2 | How should backend store `picked_up` and `in_transit` sub-states? Separate field `driverStatus`, or unified enum? | High | Add `driverStatus` field to `orders` collection (see Appendix A). |
| T3 | What is the Firebase Storage bucket name for obstacle photo uploads? | High | Add `FIREBASE_STORAGE_BUCKET` env var. |
| T4 | Should backend enforce rate limiting on `/driver/location`? If so, what threshold? | Medium | Suggest 240 req/min per courier ID (15s interval + bursts). |
| T5 | What is the stale-courier threshold? (How long without location update before marking `offline`?) | Low | Suggest 5 minutes (`300000` ms). |
| T6 | Should `POST /orders/dispatch` accept a `clientRequestId` for deduplication? | Medium | Add optional `clientRequestId` (UUID) field; backend stores transient dedup cache (60s TTL). |
| T7 | Is `CORS` origin whitelisting required for hackathon, or is `*` acceptable? | Low | `*` is acceptable for hackathon; restrict to known origins in production. |
| T8 | Should `GET /routes/:orderId` cache results? If so, for how long? | Low | Suggest 60-second in-memory cache per `orderId`. |
| T9 | Should the driver app have its own API key, or share the dispatcher key? | Low | Share single `API_SECRET_KEY` for hackathon; separate keys in production. |

---

*Document maintained by the Pandu.ai engineering team. Update this file whenever API contracts, Firestore schemas, or auth mechanisms change.*
