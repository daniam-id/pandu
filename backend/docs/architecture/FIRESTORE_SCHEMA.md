# Firestore Schema & Data Structure
**Project:** Pandu.ai
**Database:** Firebase Firestore (NoSQL)

## Overview
This document defines the data structure for the Pandu.ai application. Since Firestore is a NoSQL database, data is stored in Collections and Documents. This structure is optimized for real-time listener updates (`onSnapshot`) on the Frontend and rapid read/writes from the Cloud Run Backend.

---

## 1. Collection: `couriers`
Stores the real-time state and location of the delivery personnel.

**Document ID:** Auto-generated string (or specific UID)
```json
{
  "name": "string (e.g., 'Budi')",
  "phone": "string (e.g., '+6281234567890')",
  "status": "string ('idle', 'delivering', 'rerouted', 'offline')",
  "currentLocation": {
    "lat": "number (-7.250445)",
    "lng": "number (112.768845)"
  },
  "assignedOrders": [
    "string (Array of Order IDs for batching)"
  ],
  "currentRoutePolyline": "string (Encoded Google Maps Polyline)",
  "updatedAt": "timestamp"
}
```
* **Usage:** Frontend listens to this collection to move courier markers on the map. Backend updates `currentLocation` and `currentRoutePolyline` when the AI determines a new route. Couriers with no location update for >45 seconds are filtered out during assignment (stale detection).

---

## 2. Collection: `orders`
Stores delivery requests created by the Dispatcher.

**Document ID:** Auto-generated string
```json
{
  "pickupLocation": {
    "lat": "number",
    "lng": "number"
  },
  "dropoffLocation": {
    "lat": "number",
    "lng": "number"
  },
  "status": "string ('pending', 'assigned', 'completed', 'failed')",
  "driverStatus": "string ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed') — nullable",
  "priority": "number (1-5, 1=lowest, 5=highest, default 3)",
  "items": "string (nullable, description of package contents)",
  "failureReason": "string (nullable, set when status = 'failed')",
  "assignedCourierId": "string (nullable, ID of the courier)",
  "createdAt": "timestamp",
  "completedAt": "timestamp (nullable)"
}
```
* **Usage:** Dispatcher creates new documents via `POST /orders/dispatch`. Backend listens for `status: 'pending'`, triggers the AI to find the best courier, and updates the status to `assigned`. Driver updates `driverStatus` through `POST /orders/:id/status`. Cancel via `POST /orders/:orderId/cancel`.

---

## 3. Collection: `obstacles` (Multimodal Feature)
Stores obstacle reports uploaded by couriers, triggering the Gemini Vision multimodal analysis.

**Document ID:** Auto-generated string
```json
{
  "courierId": "string",
  "type": "string ('flood', 'accident', 'road_closure', 'construction', 'damaged_road', 'other')",
  "severity": "number (1-5, client-provided)",
  "description": "string (max 500 chars, user's description of the obstacle)",
  "imageUrl": "string (URL from Firebase Storage, nullable if no photo)",
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "aiAnalysis": {
    "severity": "string ('high', 'medium', 'low')",
    "description": "string (e.g., 'Severe flooding detected, road impassable.')",
    "actionTaken": "string ('rerouted', 'ignored')"
  },
  "status": "string ('pending_analysis', 'analyzed')",
  "createdAt": "timestamp"
}
```
* **Usage:** Courier app/simulator uploads a photo (up to 5MB) via `POST /obstacles/report`, creating a document here. Backend triggers Gemini 3.1 Flash-Lite Vision to populate `aiAnalysis`. If severity is `high`, Backend recalculates the courier's route.

---

## 4. Collection: `ai_decision_logs`
Stores the reasoning and actions taken by the Agentic AI for the Dispatcher Dashboard's log panel.

**Document ID:** Auto-generated string
```json
{
  "type": "string ('route_optimized', 'order_batched', 'obstacle_avoided')",
  "message": "string (e.g., 'Rerouting Budi to avoid flood at HR Muhammad. Added 3 mins to ETA.')",
  "relatedCourierId": "string (nullable)",
  "relatedOrderId": "string (nullable)",
  "timestamp": "timestamp"
}
```
* **Usage:** Backend writes to this collection whenever the AI makes an autonomous decision. Frontend listens to this collection to display a real-time feed in the UI.

---

## 5. Security Rules

See [`firestore.rules`](./firestore.rules) for the canonical rules file.

**Strategy**: Frontend clients (Dispatcher & Driver apps) use Firestore Client SDK for **read-only** real-time updates (`onSnapshot`). All data mutations go through REST API endpoints with `x-api-key` authentication via Firebase Admin SDK, which bypasses these rules.

```
allow read: if true;   // Both frontends can subscribe to changes
allow write: if false; // All writes must go through REST API
```

This eliminates the risk of frontends corrupting each other's data and enforces role boundaries at the REST layer. For production, client auth (Firebase Auth + custom claims) would replace the open reads.