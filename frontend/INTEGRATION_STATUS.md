# Integration Progress Report

**Updated:** 2026-05-16  
**Project:** Pandu.ai — Backend ↔ Frontend Integration  
**Deployed URL:** https://pandu-backend-879040945141.asia-southeast2.run.app

---

## ✅ Completed

### Backend Core (14 gaps fixed as of May 16)

| Feature | Endpoint | Status |
|---------|----------|--------|
| Order dispatch (AI courier assignment) | `POST /api/v1/orders/dispatch` | ✅ Deployed |
| Order status update (idempotent) | `POST /api/v1/orders/:orderId/status` | ✅ Deployed |
| Order cancellation | `POST /api/v1/orders/:orderId/cancel` | ✅ Deployed |
| Obstacle report (multipart + Gemini Vision) | `POST /api/v1/obstacles/report` | ✅ Deployed |
| Order list by courier | `GET /api/v1/orders?courierId=X` | ✅ Deployed |
| Order detail | `GET /api/v1/orders/:orderId` | ✅ Deployed |
| Driver location broadcast | `POST /api/v1/driver/location` | ✅ Deployed |
| Route polyline (cached) | `GET /api/v1/routes/:orderId` | ✅ Deployed |
| Traffic simulation | `POST /api/v1/simulation/traffic` | ✅ Deployed |
| Health check (probes Firestore + Gemini) | `GET /health` | ✅ Deployed (no auth) |

### Infrastructure

| Item | Status |
|------|--------|
| Firestore security rules (read-only clients) | ✅ Deployed |
| Rate limiting (100/min global, 240/min location) | ✅ Active |
| Helmet security headers | ✅ Active |
| Structured JSON logging (Pino) | ✅ Active |
| CORS (configurable domain list) | ✅ Active |
| Compression (gzip) | ✅ Active |
| Docker multi-stage build | ✅ Ready |
| Cloud Build CI/CD config | ✅ Ready |
| Graceful shutdown (SIGTERM drain) | ✅ Active |

---

## ⚠️ In Progress / Known Limitations

| Item | Details | Priority |
|------|---------|----------|
| **Photo upload (Storage)** | Firebase Storage requires Blaze (paid) plan. Migration path to Cloudinary documented in `docs/guides/CLOUDINARY_MIGRATION.md`. Currently photos are optional — obstacle reports work text-only. | Medium |
| **Cloud Build trigger** | `cloudbuild.yaml` is ready but GitHub trigger not registered (needs repo URL). Manual deploy via `bash deploy.sh` works. | Low |
| **Real-time Firestore sync** | Backend writes to Firestore; frontends use `onSnapshot` for real-time reads. No WebSocket or polling needed. Firestore latency is <1s. | Normal |

---

## ❌ Missing / Blocked

| Item | Blocker | Resolution |
|------|---------|------------|
| Firebase Storage photo upload | Blaze plan required | Use Cloudinary (free 25GB/mo) — migration doc ready |
| API key rotation | Manual process only | Add key rotation script post-hackathon |
| Multi-region deployment | Single region (asia-southeast2) | Not needed for hackathon demo |
| Firestore backup | Not configured | Add `gcloud firestore export` cron post-hackathon |

---

## 🔜 Priority Next Steps (Frontend-Backend Integration)

### 1. Frontend Setup
- [ ] Get deployed URL from backend team: `https://pandu-backend-879040945141.asia-southeast2.run.app`
- [ ] Get API key from backend team (stored in Secret Manager)
- [ ] Configure CORS origin: set `CORS_ORIGIN` to frontend domain(s)

### 2. Endpoints to Integrate First
- [ ] `POST /orders/dispatch` — Dispatcher creates orders
- [ ] `GET /orders?courierId=X` — Driver fetches assigned orders
- [ ] `POST /orders/:orderId/status` — Driver updates status (pickup → transit → delivered)
- [ ] `POST /driver/location` — Driver broadcasts GPS every 15s

### 3. Real-time Layer (Firestore `onSnapshot`)
- [ ] Subscribe to `couriers/{id}` — track driver positions on map
- [ ] Subscribe to `orders` — watch order status changes
- [ ] Subscribe to `ai_decision_logs` — display AI decisions in log panel

### 4. Error Handling
- [ ] All responses use `{success: true, data}` or `{error: {code, message, details}}`
- [ ] `error.message` is in Indonesian — display to users directly
- [ ] `error.code` is machine-readable — use for conditional UI logic
- [ ] 401 = invalid/missing API key → prompt re-auth
- [ ] 404 = resource not found → show "tidak ditemukan" message
- [ ] 429 = rate limit → show "terlalu banyak permintaan" and retry after 60s

---

## Verification Checklist (Frontend Team)

| # | Test | Expected | cURL Command |
|---|------|----------|-------------|
| 1 | Health endpoint | `200 OK`, `{"status":"healthy",...}` | `curl URL/health` |
| 2 | Invalid API key | `401` with Indonesian message | `curl -H "x-api-key: wrong" URL/api/v1/orders?courierId=test` |
| 3 | Missing API key | `401` with Indonesian message | `curl URL/api/v1/orders?courierId=test` |
| 4 | Order dispatch | `200` with `{orderId, assignedCourierId, estimatedDeliveryTime}` | `curl -H "x-api-key: KEY" -H "Content-Type: application/json" -d '{"pickupLocation":{"lat":-7.26,"lng":112.74},"dropoffLocation":{"lat":-7.30,"lng":112.73},"priority":"normal"}' URL/api/v1/orders/dispatch` |
| 5 | Rate limit | 101st request in 60s → `429` | Loop 101x `curl URL/api/v1/orders?courierId=x -H "x-api-key: KEY"` |
| 6 | Route fetch | `200` with polyline array | `curl -H "x-api-key: KEY" URL/api/v1/routes/ord_xxx` |
| 7 | CORS headers | `Access-Control-Allow-Origin` present | `curl -I -H "Origin: test" URL/api/v1/health` |

---

## API Key

```
6c655706235a2f587c77512948ab45642ab18f9573e430542b767f12157e13cc
```

Pass as `x-api-key` header on all `/api/v1/*` requests. Health endpoint requires no auth.
