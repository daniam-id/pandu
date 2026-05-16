# Frontend Product Requirements Document (PRD)
**Product:** Pandu.ai - Dispatcher Dashboard[cite: 1]
**Platform:** Web Application

## 1. Frontend Objective
Build a responsive, real-time web dashboard that visualizes courier movements, order statuses, and AI routing decisions. The UI must react instantly to database changes without manual refreshing.

## 2. Tech Stack & Libraries
*   **Framework:** React.js[cite: 1]
*   **Styling:** Tailwind CSS[cite: 1]
*   **Maps:** Google Maps Platform (Routes API)[cite: 1]
*   **Real-time DB:** Firebase SDK (Firestore listeners)[cite: 1]

## 3. Key UI Components
### A. Live Map View (Main Container)
*   **Courier Markers:** Display live GPS positions of couriers[cite: 1].
*   **Order Markers:** Show pickup and drop-off points.
*   **Route Polylines:** Draw the current optimal route for each courier[cite: 1].

### B. Order & Dispatch Panel (Sidebar)
*   Form to input new delivery orders into the system.
*   "Simulate Traffic/Obstacle" button for testing dynamic responses.

### C. AI Decision Log (Notification Panel)
*   Real-time feed showing AI reasoning and actions (e.g., "Rerouting: Heavy traffic detected on Jalan HR Muhammad")[cite: 1].
*   Alerts triggered by backend AI updates.

### D. Courier Interface Simulator (Modal/Floating UI)
*   A simplified interface simulating the courier's view for the hackathon demonstration[cite: 1].
*   "Upload Photo" feature allowing the courier to send pictures of road obstacles (e.g., floods) to trigger the AI's multimodal vision analysis[cite: 1].

## 4. Data Flow & State Management
*   **Listen:** Use `onSnapshot` from Firestore to continuously listen for changes in the active routes and courier locations[cite: 1].
*   **Update:** When Firestore data changes, update the React state to immediately trigger a map re-render[cite: 1].
*   **Send:** Form submissions and obstacle photos are sent to backend API endpoints (Google Cloud Run) or written directly to specific Firestore collections[cite: 1].

## 5. Out of Scope (For FE)
*   No complex routing logic or multi-order batching calculations on the client side (rely strictly on backend coordinates)[cite: 1].
*   No direct API calls to Gemini AI (all cognitive reasoning and function calling must be handled by the backend)[cite: 1].