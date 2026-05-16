# Backend Testing Guide - Frontend Integration

> Testing the backend endpoints per INTEGRATION_SPEC.md

**Server URL (Local):** `http://localhost:8080`
**API Base:** `http://localhost:8080/api/v1`
**API Key:** Set via `x-api-key` header or environment variable `API_SECRET_KEY`

---

## 1. Health Check (No Auth)

### GET /health
```bash
curl -X GET http://localhost:8080/health
```

**Expected Response (200 OK):**
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

---

## 2. Orders Endpoint

### Dispatch Order
**POST /api/v1/orders/dispatch**

```bash
curl -X POST http://localhost:8080/api/v1/orders/dispatch \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{
    "pickupLocation": {"lat": -7.265112, "lng": 112.742331},
    "dropoffLocation": {"lat": -7.301221, "lng": 112.739110},
    "priority": "normal"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "assignedCourierId": "cour_xyz789",
    "estimatedDeliveryTime": 42
  }
}
```

---

### Update Order Status
**POST /api/v1/orders/:id/status**

```bash
# Transition: assigned → picked_up
curl -X POST http://localhost:8080/api/v1/orders/ord_abc123/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{
    "status": "picked_up",
    "timestamp": "2026-05-05T10:30:00Z"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "newStatus": "picked_up",
    "updatedAt": "2026-05-05T10:30:05Z"
  }
}
```

**Valid Status Transitions:**
```
assigned  → picked_up
picked_up → in_transit
in_transit → delivered (or failed)
```

**Failed Status Transition (400 Bad Request):**
```bash
curl -X POST http://localhost:8080/api/v1/orders/ord_abc123/status \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{
    "status": "delivered",
    "timestamp": "2026-05-05T10:30:00Z"
  }'
```

**Expected Error Response:**
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from assigned to delivered",
    "details": [
      {
        "field": "status",
        "message": "Valid transitions from assigned: picked_up"
      }
    ]
  }
}
```

---

## 3. Obstacle Report Endpoint

### Report Obstacle (with Photo)
**POST /api/v1/obstacles/report**

```bash
curl -X POST http://localhost:8080/api/v1/obstacles/report \
  -H "x-api-key: test-key" \
  -F "courierId=cour_xyz789" \
  -F "type=flood" \
  -F "severity=4" \
  -F "description=Jalan tergenang setinggi 30 cm, tidak bisa dilalui motor" \
  -F "lat=-7.284561" \
  -F "lng=112.733512" \
  -F "photo=@/path/to/photo.jpg"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "reportId": "obs_def456",
    "message": "Laporan berhasil dikirim"
  }
}
```

### Report Obstacle (without Photo)
```bash
curl -X POST http://localhost:8080/api/v1/obstacles/report \
  -H "x-api-key: test-key" \
  -F "courierId=cour_xyz789" \
  -F "type=accident" \
  -F "severity=3" \
  -F "description=Kecelakaan kendaraan di persimpangan" \
  -F "lat=-7.284561" \
  -F "lng=112.733512"
```

**Valid Types:** `flood | accident | road_closure | construction | damaged_road | other`
**Valid Severity:** `1-5` (1=lowest, 5=highest)

---

## 4. Driver Location Endpoint

### Broadcast GPS Location
**POST /api/v1/driver/location**

```bash
curl -X POST http://localhost:8080/api/v1/driver/location \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{
    "courierId": "cour_xyz789",
    "lat": -7.250445,
    "lng": 112.768845,
    "accuracy": 8.2,
    "timestamp": "2026-05-05T10:30:00Z"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "receivedAt": "2026-05-05T10:30:00Z"
  }
}
```

**Validation Errors:**
- Invalid lat (outside -90 to 90) → 400 Bad Request
- Invalid lng (outside -180 to 180) → 400 Bad Request
- Missing required fields → 400 Bad Request

---

## 5. Routes Endpoint

### Fetch Route Polyline
**GET /api/v1/routes/:orderId**

```bash
curl -X GET http://localhost:8080/api/v1/routes/ord_abc123 \
  -H "x-api-key: test-key"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "polyline": [
      {"lat": -7.265112, "lng": 112.742331},
      {"lat": -7.283112, "lng": 112.740331},
      {"lat": -7.301221, "lng": 112.739110}
    ],
    "steps": [
      {
        "instruction": "Head towards destination",
        "distance": 4200,
        "maneuver": "straight"
      }
    ],
    "totalDistance": 4200,
    "estimatedDuration": 900
  }
}
```

**Cached for 60 seconds** — Subsequent requests within 60s return cached result.

**Error Cases:**
- Order not found → 404 Not Found
- Order not assigned → 400 Bad Request
- Route calculation failed → 400 Bad Request

---

## 6. Simulation Endpoint

### Inject Traffic Anomaly
**POST /api/v1/simulation/traffic**

```bash
curl -X POST http://localhost:8080/api/v1/simulation/traffic \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{
    "targetAreaName": "Jalan HR Muhammad",
    "congestionLevel": "heavy",
    "affectedRadiusKm": 1.5
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "affectedCouriers": ["cour_xyz789", "cour_abc123"]
  }
}
```

**Valid Congestion Levels:** `light | moderate | heavy`

---

## Error Response Format

All error responses follow this format (per INTEGRATION_SPEC §6.2):

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message (in Indonesian)",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific field error"
      }
    ]
  }
}
```

---

## Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success (GET, non-creating POST) | GET /routes, POST /driver/location |
| `201` | Created (resource created) | POST /orders/dispatch, POST /obstacles/report |
| `400` | Bad Request (validation error) | Missing fields, invalid status transition |
| `401` | Unauthorized (missing x-api-key) | No x-api-key header |
| `403` | Forbidden (invalid x-api-key) | Wrong API key |
| `404` | Not Found | Order/obstacle doesn't exist |
| `500` | Server Error | Gemini/Firebase/Maps API failure |

---

## Testing Checklist

- [ ] `/health` returns services status
- [ ] `/orders/dispatch` creates order and returns success response
- [ ] `/orders/:id/status` validates transitions correctly
- [ ] `/orders/:id/status` rejects invalid transitions with 400
- [ ] `/obstacles/report` accepts multipart/form-data
- [ ] `/obstacles/report` accepts optional photo field
- [ ] `/obstacles/report` validates severity 1-5
- [ ] `/obstacles/report` validates type enum
- [ ] `/driver/location` validates lat/lng ranges
- [ ] `/driver/location` accepts all required fields
- [ ] `/routes/:orderId` returns polyline and steps
- [ ] `/routes/:orderId` caches results (60s)
- [ ] Error responses include `error.code` and `error.message`
- [ ] All protected endpoints require `x-api-key` header
- [ ] `/health` does NOT require `x-api-key`

---

## Postman Collection Setup

1. **Create Environment Variable:**
   - `baseUrl`: `http://localhost:8080`
   - `apiKey`: `test-key` (or your `API_SECRET_KEY`)

2. **Add x-api-key Header to All Requests:**
   - In Postman, go to collection settings
   - Add header: `x-api-key: {{apiKey}}`
   - Apply to all requests

3. **Folder Structure:**
   ```
   Pandu.ai Backend API
   ├── Health
   │   └── GET /health
   ├── Orders
   │   ├── POST /dispatch
   │   └── POST /:id/status
   ├── Driver
   │   ├── POST /location
   │   └── GET /routes/:orderId
   ├── Obstacles
   │   └── POST /report
   └── Simulation
       └── POST /traffic
   ```

---

## Notes

- **Idempotency:** `/orders/:id/status` should be idempotent within 60 seconds
- **Caching:** `/routes/:orderId` caches for 60 seconds to reduce Google Maps quota
- **Rate Limiting:** `/driver/location` expects ~4 req/min per courier (15s intervals)
- **Offline Support:** Driver app queues `/orders/:id/status` calls when offline, auto-retries on reconnect
- **Firebase Storage:** Obstacle photo URLs are currently placeholders; replace with actual Firebase Storage URLs in production
