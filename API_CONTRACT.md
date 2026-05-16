# API Contract & Endpoints
**Project:** Pandu.ai
**Base URL:** `https://api-pandu-ai-[hash].a.run.app/api/v1` (Update with actual Cloud Run URL)

## Overview
This document defines the REST API endpoints provided by the Node.js/Cloud Run Backend. These endpoints are used by the Frontend for operations that require synchronous processing, AI reasoning, or hackathon-specific simulations, which cannot be handled purely by Firestore listeners.

---

## 1. Report Obstacle (Multimodal Trigger)
Triggers the Gemini 3.1 Flash-Lite Vision model to analyze a reported road obstacle and determine if a reroute is necessary.

*   **URL:** `/obstacles/report`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

### Request Payload
```json
{
  "courierId": "string",
  "imageUrl": "string (Valid URL from Firebase Storage)",
  "location": {
    "lat": -7.284561,
    "lng": 112.733512
  },
  "timestamp": "ISO 8601 Date String"
}
```

### Success Response
*   **Code:** `200 OK`
```json
{
  "status": "success",
  "message": "Obstacle analyzed successfully",
  "data": {
    "obstacleId": "string (Document ID in Firestore)",
    "severity": "high",
    "actionTaken": "rerouted"
  }
}
```

### Error Response
*   **Code:** `400 Bad Request` or `500 Internal Server Error`
```json
{
  "status": "error",
  "message": "Invalid image URL or AI processing failed",
  "code": "IMAGE_PROCESSING_FAILED"
}
```

---

## 2. Dispatch New Order
While orders can be written directly to Firestore, sending them via this API allows the backend to synchronously trigger the AI for immediate courier assignment (Multi-Order Batching logic).

*   **URL:** `/orders/dispatch`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

### Request Payload
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

### Success Response
*   **Code:** `201 Created`
```json
{
  "status": "success",
  "message": "Order dispatched and processed by AI",
  "data": {
    "orderId": "string",
    "assignedCourierId": "string (Assigned by AI)",
    "estimatedDeliveryTime": "number (minutes)"
  }
}
```

---

## 3. Simulate Traffic Anomaly (Hackathon Demo)
A dedicated endpoint to inject fake traffic data to demonstrate the Agentic AI's dynamic rerouting capabilities during the live presentation.

*   **URL:** `/simulation/traffic`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

### Request Payload
```json
{
  "targetAreaName": "Jalan HR Muhammad",
  "congestionLevel": "heavy",
  "affectedRadiusKm": 1.5
}
```

### Success Response
*   **Code:** `200 OK`
```json
{
  "status": "success",
  "message": "Traffic anomaly simulated. Agent is recalculating routes.",
  "data": {
    "affectedCouriers": ["courier_id_1", "courier_id_2"]
  }
}
```

---

## Authentication (Hackathon Environment)
For the purpose of the Antigravity 2026 Hackathon, strict JWT authentication is bypassed to prioritize development speed. However, all requests must include a static API Key in the headers.

*   **Header Name:** `x-api-key`
*   **Value:** `(Define in .env)`