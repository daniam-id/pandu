# Backend Product Requirements Document (PRD)
**Product:** Pandu.ai - Agentic Routing Engine[cite: 1]
**Platform:** Serverless API

## 1. Backend Objective
Build an event-driven, autonomous backend system that acts as the core reasoning engine[cite: 1]. It will process real-time data, communicate with the Gemini AI model, handle function calling for route optimization, and maintain the single source of truth in the database[cite: 1].

## 2. Tech Stack & Services
*   **Runtime:** Node.js (TypeScript recommended for type safety)
*   **Hosting:** Google Cloud Run (Serverless, auto-scaling)[cite: 1]
*   **Database:** Firebase Admin SDK (Firestore)[cite: 1]
*   **AI Engine:** Google AI Studio (Gemini 3.1 Flash-Lite Preview)[cite: 1]
*   **Maps & Traffic:** Google Maps Platform (Routes API)[cite: 1]

## 3. Core Responsibilities & Features
### A. AI Orchestration & Reasoning
*   **System Prompting:** Maintain the core prompt that dictates the AI's persona as an autonomous logistics dispatcher[cite: 1].
*   **Function Calling:** Enable Gemini to execute backend functions (e.g., `calculateDistance()`, `reassignOrder()`, `updateCourierRoute()`)[cite: 1].

### B. Event-Driven Data Processing
*   **Firestore Listeners/Triggers:** Monitor specific Firestore collections (`orders`, `couriers`) for new entries or status changes[cite: 1].
*   **State Management:** Write the final AI decisions (new routes, order batches) back to Firestore so the Frontend can react immediately[cite: 1].

### C. Multimodal Image Processing
*   **Vision API Integration:** Expose an endpoint or trigger to receive uploaded images (e.g., flooded roads) from the courier app/simulator[cite: 1].
*   **Image Analysis:** Send the image to Gemini 3.1 Flash-Lite to extract contextual information (severity of the obstacle) and trigger an emergency reroute if necessary[cite: 1].

### D. Multi-Order Batching Logic
*   **Proximity Calculation:** Provide data to the AI regarding new orders that are close to each other (e.g., < 1 km radius)[cite: 1].
*   **Batching Execution:** Allow the AI to decide whether to assign a new courier or batch the orders to an existing nearby courier[cite: 1].

## 4. API & Integration Points
*   **Google Maps Routes API:** To fetch real-time traffic data, distances, and travel times for the AI to base its reasoning on[cite: 1].
*   **Frontend Endpoints:** REST APIs or Firebase Callable Functions to handle manual triggers (if any) from the Dispatcher Dashboard[cite: 1].

## 5. Out of Scope (For BE)
*   User Interface (UI) rendering or handling DOM events[cite: 1].
*   Storing highly relational data (stick to NoSQL document structures for speed)[cite: 1].