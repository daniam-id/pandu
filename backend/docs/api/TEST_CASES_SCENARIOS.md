# Live Demonstration Test Cases & Scenarios
**Project:** Pandu.ai
**Event:** Mini Hackathon Antigravity 2026[cite: 1]

## Overview
This document outlines the step-by-step test cases for the live demonstration. It covers the four core scenarios presented in the proposal to showcase the Agentic AI's capabilities[cite: 1]. 

## Prerequisites for Live Demo
*   **Frontend:** React dashboard is running and connected to the production Firestore database[cite: 1].
*   **Backend:** Cloud Run API is active, and Firebase listeners are attached[cite: 1].
*   **AI Engine:** Gemini 3.1 Flash-Lite API key is valid and loaded in the `.env` file[cite: 1].
*   **Data:** 5 mock couriers are initialized in the `couriers` Firestore collection[cite: 1].

---

## Scenario 1: Initialization & Normal Distribution
**Objective:** Prove that the AI can automatically map and distribute routes without human intervention[cite: 1].

*   **Step 1:** Open the Dispatcher Dashboard UI.
*   **Step 2:** Observe the map and the active couriers list.
*   **Step 3:** Inject 5 new standard orders via the "Add Order" form or a quick mock data script.
*   **Expected Result:** 
    *   The map instantly populates with 5 couriers and order pins[cite: 1].
    *   Polylines (routes) are automatically drawn connecting couriers to their respective destinations.
    *   The "AI Decision Log" panel shows logs of successful assignments.
*   **Status:** [ ] Pass / [ ] Fail

---

## Scenario 2: Dynamic Response to Traffic
**Objective:** Demonstrate the AI's low-latency reasoning and automatic rerouting when a sudden anomaly occurs[cite: 1].

*   **Step 1:** While couriers are moving (simulated), click the "Simulate Traffic" button on the UI or use the `/simulation/traffic` API endpoint.
*   **Step 2:** Set the target area to "Jalan HR Muhammad" with "heavy" congestion[cite: 1].
*   **Expected Result:**
    *   Within 30 seconds, the AI detects the anomaly[cite: 1].
    *   The route for the courier heading towards Jalan HR Muhammad automatically changes on the map to an alternative street.
    *   The "AI Decision Log" outputs: *"Rerouting [Courier Name] to avoid heavy traffic on Jalan HR Muhammad."*
*   **Status:** [ ] Pass / [ ] Fail

---

## Scenario 3: Multi-Order Batching (Fleet Optimization)
**Objective:** Show the AI's logical reasoning to combine nearby orders to save distance and fuel[cite: 1].

*   **Step 1:** Ensure Courier A is active and moving towards a specific zone.
*   **Step 2:** Input three new orders with pickup locations within a <1 km radius of each other[cite: 1].
*   **Expected Result:**
    *   The AI does *not* assign three separate idle couriers.
    *   Instead, the AI batches all three orders to Courier A or the nearest single courier[cite: 1].
    *   The map updates Courier A's route to include all three pickup points.
    *   The "AI Decision Log" explicitly states the batching action and the estimated distance saved.
*   **Status:** [ ] Pass / [ ] Fail

---

## Scenario 4: Multimodal Intervention in the Field
**Objective:** Highlight the Gemini 3.1 Flash-Lite Vision capability to handle real-world visual data[cite: 1].

*   **Step 1:** Open the "Courier Simulator" modal on the dashboard[cite: 1].
*   **Step 2:** Select an active courier and upload a pre-prepared photo of a severely flooded street.
*   **Step 3:** Click "Report to AI Dispatcher".
*   **Expected Result:**
    *   The backend sends the image to Gemini Vision for analysis[cite: 1].
    *   The AI evaluates the severity as "high" (impassable)[cite: 1].
    *   The dashboard map immediately recalculates and draws a new route away from the flooded area[cite: 1].
    *   A red alert appears in the "AI Decision Log": *"High severity obstacle (Flood) reported by [Courier Name]. Rerouting immediately."*
*   **Status:** [ ] Pass / [ ] Fail