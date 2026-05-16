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
  "status": "string ('idle', 'delivering')",
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
* **Usage:** Frontend listens to this collection to move courier markers on the map. Backend updates `currentLocation` and `currentRoutePolyline` when the AI determines a new route.

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
  "assignedCourierId": "string (nullable, ID of the courier)",
  "createdAt": "timestamp",
  "completedAt": "timestamp (nullable)"
}
```
* **Usage:** Frontend creates new documents here when the dispatcher inputs an order. Backend listens for `status: 'pending'`, triggers the AI to find the best courier, and updates the status to `assigned`.

---

## 3. Collection: `obstacles` (Multimodal Feature)
Stores obstacle reports uploaded by couriers, triggering the Gemini Vision multimodal analysis.

**Document ID:** Auto-generated string
```json
{
  "courierId": "string",
  "imageUrl": "string (URL from Firebase Storage)",
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
* **Usage:** Courier app/simulator uploads a photo, creating a document here. Backend triggers Gemini 3.1 Flash-Lite to populate `aiAnalysis`. If severity is `high`, Backend recalculates the courier's route.

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

## 5. Basic Security Rules (firebase.rules)
For the hackathon environment, ensure the rules allow read/write access safely. *(Note: Update for production later).*

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow frontend to read everything for the dashboard
    match /{document=**} {
      allow read: if true; 
      allow write: if true; // Temporarily open for hackathon speed (Restrict in production)
    }
  }
}