# API Contract & Endpoints
**Project:** Pandu.ai
**Base URL:** `https://api-pandu-ai-[hash].a.run.app/api/v1`

## Overview
This document defines the REST API endpoints provided by the Node.js/Cloud Run Backend. These endpoints are used by the Frontend for operations that require synchronous processing, AI reasoning, or hackathon-specific simulations.

**Primary reference:** See `INTEGRATION_SPEC.md` for the authoritative integration contract, including driver app endpoints and Firestore real-time sync patterns.

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { /* endpoint-specific */ }
}
```

### Error
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message (Indonesian)",
    "details": [{ "field": "fieldName", "message": "Specific error" }]
  }
}
```

---

## Authentication
All `/api/v1` endpoints require a static API key:

*   **Header Name:** `x-api-key`
*   **Value:** `API_SECRET_KEY` from `.env` (falls back to `API_KEY`)
*   **Not required for:** `/health`, `/api/v1/health`

---

## Endpoints

### 1. Report Obstacle (Multimodal Trigger)
Triggers the Gemini 3.1 Flash-Lite Vision model to analyze a reported road obstacle.

*   **URL:** `/api/v1/obstacles/report`
*   **Method:** `POST`
*   **Content-Type:** `multipart/form-data`

#### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courierId` | string | Yes | Reporting courier ID |
| `type` | string | Yes | `flood`, `accident`, `road_closure`, `construction`, `damaged_road`, `other` |
| `severity` | number | Yes | `1`–`5` (client-selected) |
| `description` | string | Yes | Max 500 chars |
| `lat` | number | Yes | GPS latitude (-90 to 90) |
| `lng` | number | Yes | GPS longitude (-180 to 180) |
| `photo` | file | No | Image file, max 5 MB, `image/*` MIME type |

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "reportId": "obs_def456",
    "severity": "high",
    "actionTaken": "rerouted",
    "message": "Laporan berhasil dikirim"
  }
}
```

---

### 2. Dispatch New Order
Create and dispatch a new order, triggering AI courier assignment.

*   **URL:** `/api/v1/orders/dispatch`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

#### Request Payload
```json
{
  "pickupLocation": { "lat": -7.265112, "lng": 112.742331 },
  "dropoffLocation": { "lat": -7.301221, "lng": 112.739110 },
  "priority": "normal",
  "items": "Paket elektronik - headphone wireless"
}
```

#### Success Response (201 Created)
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

### 3. Get Orders by Courier
Fetch all active orders assigned to a specific courier.

*   **URL:** `/api/v1/orders?courierId={courierId}`
*   **Method:** `GET`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "ord_abc123",
      "pickupLocation": { "lat": -7.265112, "lng": 112.742331 },
      "dropoffLocation": { "lat": -7.301221, "lng": 112.739110 },
      "status": "assigned",
      "driverStatus": "in_transit",
      "assignedCourierId": "cour_xyz789",
      "priority": "normal",
      "items": "Paket elektronik"
    }
  ]
}
```

---

### 4. Get Order Details
*   **URL:** `/api/v1/orders/:orderId`
*   **Method:** `GET`

---

### 5. Update Order Status (Driver)
Transition order through driver-facing statuses.

*   **URL:** `/api/v1/orders/:orderId/status`
*   **Method:** `POST`

#### Valid Transitions
```
assigned → picked_up → in_transit → delivered
                                   → failed
```

#### Request Payload
```json
{
  "status": "picked_up",
  "timestamp": "2026-05-03T10:30:00Z",
  "failureReason": null
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "newStatus": "picked_up",
    "updatedAt": "2026-05-03T10:30:05Z"
  }
}
```

---

### 5a. Cancel Order (Dispatcher or Driver)
Cancel an order that hasn't been completed yet.

*   **URL:** `/api/v1/orders/:orderId/cancel`
*   **Method:** `POST`

#### Request Payload
```json
{
  "reason": "Pelanggan membatalkan pesanan"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "newStatus": "failed",
    "cancelledAt": "2026-05-16T14:30:00Z"
  }
}
```

#### Error Response (400)
```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Pesanan dengan status completed tidak dapat dibatalkan"
  }
}
```

---

### 6. Broadcast Driver Location
*   **URL:** `/api/v1/driver/location`
*   **Method:** `POST`

```json
{
  "courierId": "cour_xyz789",
  "lat": -7.250445,
  "lng": 112.768845,
  "accuracy": 8.2,
  "timestamp": "2026-05-03T10:30:00Z"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "receivedAt": "2026-05-03T10:30:00Z"
  }
}
```

---

### 7. Fetch Route
*   **URL:** `/api/v1/routes/:orderId`
*   **Method:** `GET`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "polyline": [{ "lat": -6.2088, "lng": 106.8456 }],
    "steps": [{ "instruction": "Lurus ke utara", "distance": 450, "maneuver": "straight" }],
    "totalDistance": 3200,
    "estimatedDuration": 900
  }
}
```

---

### 8. Simulate Traffic Anomaly
*   **URL:** `/api/v1/simulation/traffic`
*   **Method:** `POST`

```json
{
  "targetAreaName": "Jalan HR Muhammad",
  "congestionLevel": "heavy",
  "affectedRadiusKm": 1.5
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "affectedCouriers": ["cour_xyz789", "cour_abc123"]
  }
}
```

---

### 9. Health Check (No Auth)
*   **URL:** `/api/v1/health` or `/health`
*   **Method:** `GET`

#### Response (200 OK)
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
