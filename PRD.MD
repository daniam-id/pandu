# Universal Product Requirements Document (PRD)
**Product Name:** Pandu.ai
**Project:** Mini Hackathon Antigravity 2026 (GDG Surabaya)
**Team:** Adam Dani Apta Mahendra & Nadif Fijri Fajar Arifin
**Date:** April 2026

## 1. Product Overview
**Problem:** Urban logistics face "operational drag" due to unpredictable traffic and sudden obstacles (e.g., floods in Surabaya), causing delays and reactive manual routing.
**Solution:** Pandu.ai is an Agentic AI assistant powered by Gemini 3.1 Flash-Lite Preview. It autonomously optimizes delivery routes and instantly adapts to road conditions using multimodal image analysis.

## 2. Target Users
* **Dispatcher (Admin):** Uses the web dashboard to monitor couriers, view active orders, and oversee the AI's routing decisions.
* **Courier (Field Worker):** Follows the generated route and reports on-ground issues (like flooded roads) by uploading photos.

## 3. Core Features
### A. Dispatcher Dashboard (Frontend Focus)
* **Live Map View:** Display couriers' current locations, active orders, and plotted routes.
* **Order Management:** Interface to input new delivery orders into the system.
* **AI Decision Log:** A panel showing the reasoning behind the AI's route changes.

### B. Agentic Routing Engine (Backend Focus)
* **Function Calling:** AI acts as an autonomous agent that can call backend functions to calculate distances and re-order delivery points.
* **Dynamic Re-routing:** Automatically updates the route in the database when new variables (new orders, traffic) occur.

### C. Multimodal Obstacle Reporting (Integration Focus)
* **Image Upload:** Interface for couriers to upload photos of road obstacles.
* **Vision Analysis:** Gemini 3.1 Flash-Lite analyzes the photo, identifies the severity of the obstacle (e.g., deep flood), and instantly triggers the routing engine to avoid the area.

## 4. High-Level Architecture
* **Frontend (FE):** React.js (Web dashboard & map interface).
* **Backend (BE):** Node.js deployed on Google Cloud Run (Serverless API).
* **Database:** Firebase Firestore (Real-time data sync for FE and BE).
* **AI Integration:** Google AI Studio (Gemini 3.1 Flash-Lite Preview).

## 5. System Data Flow
1.  **Order Creation:** Dispatcher adds an order → Firestore updates → Backend triggers AI.
2.  **Routing:** AI processes coordinates → calls routing function → saves optimal route to Firestore → Frontend map updates.
3.  **Obstacle Event:** Courier uploads a photo → Backend sends photo to Gemini Vision → AI detects a blocked road → AI generates a new route → Firestore updates → Frontend map updates in real-time.

## 6. Hackathon Success Metrics (Deliverables)
* Smooth integration between the separate Frontend and Backend repositories.
* Zero errors during the live multimodal demonstration (uploading a flood photo and watching the map reroute automatically).
* System response time (latency) for AI rerouting is under 15 seconds.