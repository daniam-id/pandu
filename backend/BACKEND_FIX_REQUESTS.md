<!--
Purpose      : Backend issues blocking Pandu.ai frontend integration & demo readiness
Audience     : Backend Team (owner), Frontend Integration (reporter)
Dependencies : Backend Cloud Run service, INTEGRATION_STATUS.md contract
Side Effects : None (read-only doc); referenced by PROGRESS.md
-->

# Backend Fix Requests — Pandu.ai Integration

| | |
|---|---|
| **Reporter** | Frontend Integration |
| **Owner** | Backend Team |
| **Date Filed** | 2026-05-16 |
| **Status** | 2 × P0 blockers · 2 × P1 follow-ups · 7 × improvement requests |
| **Backend URL** | `https://pandu-backend-879040945141.asia-southeast2.run.app` |
| **Contract Reference** | `INTEGRATION_STATUS.md` (root of repo) |

---

## Executive Summary

End-to-end integration with both the **Admin Dashboard** and the **Driver Mobile App** is **blocked** by two P0 issues:

1. **`BE-001`** — Firestore is reporting `failing` on `/health`, returning HTTP 503. The entire real-time sync layer (Firestore `onSnapshot`) depends on this service.
2. **`BE-002`** — The API key documented in `INTEGRATION_STATUS.md` (`6c655706…7e13cc`) is rejected by the backend with `INVALID_API_KEY`. Every request to `/api/v1/*` returns HTTP 401 regardless of payload.

Until both are resolved, no order can be dispatched, no status update can flow, and no live courier location can be broadcast.

The frontend code is verified ready: `tsc` clean, production build clean, all unit tests passing. The CORS contract, the error envelope shape, and the Indonesian error messaging are all working correctly and should not be regressed.

---

## Issue Index

| ID | Endpoint / Feature | Current Issue | Required Fix | Priority |
|----|--------------------|---------------|--------------|:--------:|
| **BE-001** | `GET /health` | Aggregate status `degraded`; `services.firestore = "failing"`; HTTP 503 | Restore Firestore client connectivity inside Cloud Run; health must return 200 with `firestore: "ok"` | **High** |
| **BE-002** | All `/api/v1/*` (auth) | Documented API key returns `INVALID_API_KEY` (HTTP 401) for every endpoint | Re-issue active key (or correct the documented one) and update `INTEGRATION_STATUS.md`. Document key rotation procedure. | **High** |
| **BE-003** | `POST /api/v1/orders/dispatch` validation | Cannot verify schema validation while BE-002 is open (every request returns 401 before validation runs) | After BE-002, confirm that malformed payloads (missing `pickupLocation`, lat/lng out of range, missing required fields) return HTTP **400** with `VALIDATION_ERROR` code, not 500 | **High** |
| **BE-004** | `POST /api/v1/orders/:orderId/status` idempotency | Driver app has an offline retry queue that may re-send identical status transitions (e.g. `picked_up → picked_up`) when network recovers. Behaviour with duplicates is currently unverified. | Endpoint must be idempotent for same-state transitions: return 200 (no-op) instead of 4xx/5xx when status is already at the requested value. | **High** |
| **BE-005** | `GET /health` granularity | Health response shape is non-standard; aggregate `status` is `"degraded"` but per-service entries use values like `"ok"`/`"failing"` without a documented vocabulary | Standardise: response body must always include `{status, services: {firestore, gemini, maps, storage}}`, each service one of `"ok" \| "failing" \| "degraded"`. Document in `INTEGRATION_STATUS.md`. | Med |
| **BE-006** | Rate-limit verification | Frontend cannot safely exercise the 100 req/min global cap or 240 req/min `/driver/location` cap against the production URL (would brown out demo) | Provide either a staging environment with relaxed limits, or a documented load-test script the backend team runs internally before demo. Confirm 429 returns `{error:{code:"RATE_LIMIT_EXCEEDED"}}`. | Med |
| **BE-007** | Photo upload on `POST /obstacles/report` | Firebase Storage requires Blaze plan; spec notes Cloudinary as alternative but migration not yet visible in API | Confirm whether text-only obstacle reports succeed (no `photoUrl`) under current Spark plan; provide ETA for Cloudinary swap if photo upload is in demo scope | Med |
| **BE-008** | Missing endpoint cURL examples | `INTEGRATION_STATUS.md` cURL list does not include `POST /orders/:orderId/cancel`, `GET /orders/:orderId`, `POST /driver/location` | Add cURL examples and expected response bodies for the missing endpoints so the frontend can write deterministic tests | Med |
| **BE-009** | Error envelope audit | Sampled errors follow `{error: {code, message}}` correctly, but full coverage across all endpoints not verified | Audit all error handlers; confirm every non-2xx response uses the same shape and an Indonesian message; document the canonical error-code list | Low |
| **BE-010** | CORS `access-control-allow-origin: *` | Permissive wildcard is acceptable for demo but unsafe for production deploys behind Firebase Hosting | Before production cutover, restrict allow-origin to the deployed Firebase Hosting domain(s) (e.g. `https://pandu-ai-2026.web.app`) | Low |
| **BE-011** | Firestore `ai_decision_logs` collection | Frontend no longer renders this collection (panel removed in Cycle 10) but backend may still write to it | Confirm whether collection is still populated for backend traceability; if obsolete, document removal in `INTEGRATION_STATUS.md` | Low |

---

## Detailed Issues

### BE-001 — Firestore Service Failing in `/health`

**Priority:** High · **Type:** Service outage

**Reproduction:**

```bash
curl -s https://pandu-backend-879040945141.asia-southeast2.run.app/health | jq
```

**Actual response (HTTP 503):**

```json
{
  "status": "degraded",
  "services": {
    "firestore": "failing",
    "gemini": "ok",
    "maps": "ok"
  }
}
```

**Expected response (HTTP 200):**

```json
{
  "status": "ok",
  "services": {
    "firestore": "ok",
    "gemini": "ok",
    "maps": "ok"
  }
}
```

**Impact:**
- All writes to Firestore from backend handlers will fail.
- Frontend `onSnapshot` listeners (`useCouriers`, `useOrders`, `useDriverOrders`) will receive no real-time updates.
- The Admin `AIEngineStatus` badge polls `/health` every 30 s and will display the system as offline.
- Demo scenarios 1, 2, and 3 (order dispatch → driver receive, AI reroute, traffic simulation) are impossible.

**Suspected Causes:**
- Cloud Run service account lacks `roles/datastore.user` or `roles/firebase.admin` permission.
- `FIRESTORE_PROJECT_ID` env var in Cloud Run does not match the Firebase project (expected `pandu-ai-2026`).
- `GOOGLE_APPLICATION_CREDENTIALS` not mounted, or key file expired.
- Firestore database not initialised in target region (`asia-southeast2`).

**Acceptance Criteria:**
- `curl …/health` returns HTTP 200 for at least three consecutive checks over 5 minutes.
- `services.firestore` is `"ok"`.
- A test write (`POST /api/v1/orders/dispatch` once `BE-002` is fixed) persists a document in the `orders` collection and is visible in Firebase Console.

---

### BE-002 — Documented API Key is Rejected with `INVALID_API_KEY`

**Priority:** High · **Type:** Auth / Credentials

**Reproduction:**

```bash
KEY="6c655706235a2f587c77512948ab45642ab18f9573e430542b767f12157e13cc"
curl -s -w "\nHTTP=%{http_code}\n" \
  -H "x-api-key: $KEY" \
  "https://pandu-backend-879040945141.asia-southeast2.run.app/api/v1/orders?courierId=test"
```

**Actual response (HTTP 401):**

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API key tidak valid"
  }
}
```

**Expected response (HTTP 200) — example payload:**

```json
{
  "success": true,
  "data": {
    "orders": []
  }
}
```

**Verification matrix (all return the same INVALID_API_KEY error):**

| Header variant | Result |
|----------------|--------|
| `x-api-key: <docs key>` | 401 INVALID_API_KEY |
| `X-API-Key: <docs key>` | 401 INVALID_API_KEY (case-insensitive header confirmed) |
| `Authorization: Bearer <docs key>` | 401 MISSING_API_KEY (Bearer not accepted, only `x-api-key`) |
| `?api_key=<docs key>` as query string | 401 MISSING_API_KEY |
| No header | 401 MISSING_API_KEY (correct — confirms auth middleware works) |

**Impact:** Total auth lockout for the frontend. No write or authenticated read against `/api/v1/*` is possible.

**Required Actions:**
1. Verify the active key by inspecting the backend's key store (Secret Manager / env var) and either:
   - Update `INTEGRATION_STATUS.md` with the correct active key, or
   - Issue a new key and replace the documented value.
2. Document the key rotation procedure (who rotates, how often, where the new key is published).
3. **Recommended:** Move the API key out of `INTEGRATION_STATUS.md` and into a secure channel (Slack DM, password manager, Secret Manager). The doc currently leaks the key into git history.

**Acceptance Criteria:**
- A fresh `curl -H "x-api-key: <new_key>" …/api/v1/orders?courierId=test` returns HTTP 200 with a `success: true` envelope.
- The new key is communicated to the frontend lead through a secure channel.
- `INTEGRATION_STATUS.md` updated.

---

### BE-003 — Validate `dispatchOrder` Payload Rejection

**Priority:** High · **Type:** Defensive validation · **Blocked-by:** BE-002

**Test cases to verify (run after BE-002 is fixed):**

| Case | Payload | Expected HTTP | Expected Body |
|------|---------|---------------|---------------|
| Missing `pickupLocation` | `{"dropoffLocation":{"lat":-7.30,"lng":112.73}}` | 400 | `{"error":{"code":"VALIDATION_ERROR","message":"…","details":{"field":"pickupLocation"}}}` |
| Missing `dropoffLocation` | `{"pickupLocation":{"lat":-7.26,"lng":112.74}}` | 400 | same shape, field `dropoffLocation` |
| `lat` out of range | `{"pickupLocation":{"lat":999,"lng":112.74},"dropoffLocation":{…}}` | 400 | field `pickupLocation.lat` |
| `lng` out of range | `lng: 999` | 400 | field `pickupLocation.lng` |
| Invalid `priority` enum | `"priority":"super-urgent"` | 400 | field `priority` |
| Wrong content-type | text body, `Content-Type: text/plain` | 415 or 400 | code `INVALID_CONTENT_TYPE` |
| Empty body | `{}` | 400 | code `VALIDATION_ERROR` |

**Why this matters:** the frontend already does client-side `zod` validation, but defensive server validation is required for security and for clean error toasts when a frontend bug allows bad data through.

**Acceptance Criteria:**
- Each row above returns the expected HTTP code and the error envelope contains a `details` field naming the failed field.
- Indonesian `message` strings exist for every code.

---

### BE-004 — Idempotent Status Updates

**Priority:** High · **Type:** Reliability · **Blocked-by:** BE-002

**Context:** The driver app at `@driver/src/services/api.ts:54-91` maintains an offline retry queue that re-dispatches `updateOrderStatus` calls when the network returns. Without idempotency, a poorly-timed reconnection can cause the same status transition to be applied twice or rejected on the second attempt, surfacing as confusing error toasts to the courier.

**Required behaviour:**

| Scenario | Expected |
|----------|----------|
| Status transition `assigned → picked_up` (first time) | HTTP 200, Firestore document updated |
| Repeat `picked_up → picked_up` (second call, same state) | HTTP 200 no-op, response body indicates `{success: true, data: {orderId, status: "picked_up", noChange: true}}` or equivalent |
| Backward transition `picked_up → assigned` (illegal) | HTTP 409 `INVALID_TRANSITION` with Indonesian message |
| Final state `delivered` then any further write | HTTP 409 `ALREADY_FINAL` |

**Acceptance Criteria:** All four scenarios behave as specified; offline retry queue produces no error toast for duplicate calls.

---

### BE-005 — Standardise Health Endpoint Schema

**Priority:** Med · **Type:** Contract clarification

The frontend `checkHealth()` function and `AIEngineStatus` component currently treat any non-2xx as "offline". When Firestore is failing but Gemini and Maps are fine, the UI flips to offline despite Gemini being healthy.

**Recommended contract:**

```http
GET /health  -> 200 always (even when degraded)

{
  "status": "ok" | "degraded" | "down",
  "services": {
    "firestore": "ok" | "failing" | "degraded",
    "gemini":    "ok" | "failing" | "degraded",
    "maps":      "ok" | "failing" | "degraded",
    "storage":   "ok" | "failing" | "degraded"  // optional
  },
  "version": "<git sha or semver>",   // optional but useful
  "uptime_seconds": <number>           // optional
}
```

Returning 200 on a "degraded" status lets the frontend differentiate "AI engine offline" vs "Firestore down" without misleading the operator. Reserve 503 strictly for the case where the backend cannot even introspect its own services.

---

### BE-006 — Rate-Limit Testing

**Priority:** Med · **Type:** Operations

The contract documents two limits:
- 100 req/min global per IP
- 240 req/min per courier on `/driver/location`

The frontend cannot safely exercise these against production without risking demo brown-out. Request a documented procedure (e.g. a small `k6` or `hey` script the backend team runs internally) and confirmation that responses follow:

```json
HTTP 429
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Terlalu banyak permintaan. Coba lagi dalam 60 detik.",
    "details": { "retry_after_seconds": 60 }
  }
}
```

The frontend has Indonesian fallback messages for 429 ready in `src/services/api.ts` and `driver/src/services/api.ts`; just confirm the contract matches.

---

### BE-007 — Photo Upload Path on Obstacle Report

**Priority:** Med · **Type:** Feature scope

`POST /obstacles/report` accepts multipart with optional `photo` field. The Firebase Storage path requires the Blaze (paid) plan, currently not active.

**Asks:**
1. Confirm `POST /obstacles/report` accepts text-only (no `photo` field) and persists the report regardless.
2. If Cloudinary migration is planned (mentioned in backend notes), provide ETA and any frontend changes needed (e.g. upload signature endpoint, max file size).
3. Document max file size and accepted MIME types so the driver app can validate client-side.

---

### BE-008 — Missing cURL Examples in `INTEGRATION_STATUS.md`

**Priority:** Med · **Type:** Documentation

The cURL verification list omits the following endpoints currently consumed by the frontend code:

| Endpoint | Used by |
|----------|---------|
| `POST /api/v1/orders/:orderId/cancel` | Admin (exposed in `src/services/api.ts`, future cancel-order feature) |
| `GET /api/v1/orders/:orderId` | Admin (`fetchOrderDetail`) |
| `POST /api/v1/driver/location` | Driver (`updateLocation` broadcast every 15 s) |
| `GET /api/v1/routes/:orderId` | Driver (`fetchRoute` for turn-by-turn) |

**Ask:** Add a working cURL example, request body, and expected response body for each.

---

### BE-009 — Error Envelope Audit

**Priority:** Low · **Type:** Contract hygiene

Sampled errors (`MISSING_API_KEY`, `INVALID_API_KEY`, `NOT_FOUND`) all follow the contract:

```json
{
  "error": {
    "code": "ERROR_CODE_HERE",
    "message": "Pesan dalam Bahasa Indonesia"
  }
}
```

Full coverage across all error paths has not been verified. **Ask:** Audit all `throw`/`res.status(4xx|5xx)` paths in backend code, ensure they all use the same envelope, and publish the canonical error-code list (e.g. `MISSING_API_KEY`, `INVALID_API_KEY`, `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `INVALID_TRANSITION`, `ALREADY_FINAL`, `INTERNAL_ERROR`) in `INTEGRATION_STATUS.md`.

---

### BE-010 — Tighten CORS for Production

**Priority:** Low · **Type:** Security · **Demo-blocking:** No

Currently `access-control-allow-origin: *`. Acceptable for hackathon demo. Before production cutover, restrict to:

```
access-control-allow-origin: https://pandu-ai-2026.web.app
```

(plus any additional Firebase Hosting preview channel domains if used).

---

### BE-011 — Confirm `ai_decision_logs` Collection Status

**Priority:** Low · **Type:** Cleanup

The frontend removed the AI Decision Log panel in Cycle 10 (see `PROGRESS.md`). The backend may still write to the `ai_decision_logs` Firestore collection for traceability. **Ask:** Confirm whether the collection is still maintained for back-office debugging, or whether writes have been removed. Document the decision in `INTEGRATION_STATUS.md`.

---

## What Is Working Correctly (Do Not Regress)

The following items are confirmed working and should not be broken in the course of fixing the above:

| Item | Verification |
|------|-------------|
| `MISSING_API_KEY` error code returned on missing header | ✅ HTTP 401, Indonesian message |
| `INVALID_API_KEY` error code returned on wrong header value | ✅ HTTP 401, Indonesian message |
| `NOT_FOUND` error code on unknown route (`GET /`) | ✅ HTTP 404, Indonesian message |
| Error envelope shape `{error: {code, message}}` | ✅ Consistent across sampled errors |
| Indonesian error messaging | ✅ User-friendly, ready for direct render |
| CORS preflight `OPTIONS /api/v1/orders/dispatch` | ✅ Returns 204 with `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET,POST`, `Access-Control-Allow-Headers: Content-Type,x-api-key` |
| Security headers | ✅ HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy all present on preflight |
| Header name `x-api-key` is case-insensitive | ✅ `X-API-Key` accepted equivalently |

---

## Recommended Backend-Side Verification Script

After BE-001 and BE-002 are addressed, the backend team should run the following before signalling "ready":

```bash
#!/usr/bin/env bash
URL="https://pandu-backend-879040945141.asia-southeast2.run.app"
KEY="<new_api_key_here>"

echo "1. Health"
curl -s "$URL/health" | jq

echo "2. Dispatch order"
ORD=$(curl -s -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"pickupLocation":{"lat":-7.26,"lng":112.74},"dropoffLocation":{"lat":-7.30,"lng":112.73},"priority":"normal"}' \
  "$URL/api/v1/orders/dispatch" | jq -r '.data.orderId')
echo "Created: $ORD"

echo "3. Fetch detail"
curl -s -H "x-api-key: $KEY" "$URL/api/v1/orders/$ORD" | jq

echo "4. Update status"
curl -s -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d "{\"status\":\"picked_up\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  "$URL/api/v1/orders/$ORD/status" | jq

echo "5. Cancel (cleanup)"
curl -s -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"reason":"smoke test cleanup"}' \
  "$URL/api/v1/orders/$ORD/cancel" | jq

echo "6. Validation negative case"
curl -s -w "\nHTTP=%{http_code}\n" -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{}' "$URL/api/v1/orders/dispatch"
```

All six steps should succeed with the expected HTTP codes and Indonesian error messages where applicable.

---

## Communication & Sign-Off

**Channel:** Please report fix progress on each issue ID in the team Slack channel, or by updating this file in-place with a `Resolved` column (date + commit SHA).

**Frontend Contact:** see PR author / `PROGRESS.md` reporter line.

**Re-verification:** Once BE-001 and BE-002 are marked resolved, the frontend team will re-run the automated test script (`/tmp/backend-tests.sh` from the original test session) and update this document with results.

**Target ETA for P0 resolution:** as soon as feasible — these block all integration testing.

---

## Appendix A — Test Session Log Snippet

Original test run on 2026-05-16 22:37 UTC+07:00 produced the following key signals (full results were shared in chat):

```
✅ T2  Missing API key returns 401
✅ T3  Invalid API key returns 401
✅ T14 CORS preflight returns Access-Control-Allow-Origin
❌ T1  /health  HTTP 503  firestore: failing       (BE-001)
❌ T4  /orders/dispatch  HTTP 401 INVALID_API_KEY  (BE-002)
❌ T5  /orders/dispatch validation  HTTP 401       (blocked by BE-002)
❌ T6  /orders/dispatch lat=999     HTTP 401       (blocked by BE-002)
❌ T7  /orders?courierId=…          HTTP 401       (blocked by BE-002)
❌ T9  /orders/nonexistent          HTTP 401       (blocked by BE-002)
❌ T11 /driver/location             HTTP 401       (blocked by BE-002)
❌ T13 /simulation/traffic          HTTP 401       (blocked by BE-002)
```

Score: 3 pass / 8 fail / 5 skipped (5 of the 8 failures cascade from BE-002 — fixing BE-002 will likely turn them green).
