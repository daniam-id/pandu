# Pandu.ai Frontend — Technical Overview

**Project:** Mini Hackathon Antigravity 2026 (GDG Surabaya)  
**Scope:** Dispatcher Dashboard (Web Frontend)  
**Date:** April 2026  
**Status:** Documentation/Specification Phase — No application code exists yet.

---

## 1. Core Components

### A. Application Shell

| Aspect | Detail |
|--------|--------|
| **Framework** | React.js (Create React App or Vite) |
| **Styling** | Tailwind CSS |
| **Maps** | Google Maps Platform (Routes API) via `@react-google-maps/api` |
| **Real-time DB** | Firebase Client SDK v9+ (`onSnapshot` listeners) |
| **Language** | JavaScript / TypeScript |

### B. Major UI Components

#### 1. Top Navigation Bar (`<Navbar />`)
- **Left:** "Pandu.ai" logo/brand.
- **Right:** System health indicators — AI engine status, Firestore connection state.
- Sticky, full-width, minimal height.

#### 2. Control & Overview Panel (`<ControlPanel />`) — Left Sidebar (~25% width)
- **Order Input Form (`<OrderForm />`):** Fields for Pickup Lat/Lng, Dropoff Lat/Lng, and a "Dispatch" button. Submits `POST /api/v1/orders/dispatch` to the backend.
- **Active Couriers List (`<CourierList />`):** Real-time cards showing courier name, status (idle/delivering), and assigned orders. Data sourced from Firestore `couriers` collection via `onSnapshot`.

#### 3. Live Map View (`<MapView />`) — Center Panel (~50% width)
- **Map Container:** Google Maps rendered via `@react-google-maps/api` or equivalent React wrapper.
- **Courier Markers (`<CourierMarker />`):** Live GPS positions, updated in real-time from Firestore.
- **Order Markers (`<OrderMarker />`):** Pickup (green) and dropoff (red) pins.
- **Route Polylines (`<RoutePolyline />`):** Decoded polyline strings drawn on the map, representing the current optimal route for each courier.
- **Courier Simulator Trigger:** A floating button at the bottom center opens the simulator modal.

#### 4. AI Decision Log Panel (`<AILogPanel />`) — Right Sidebar (~25% width)
- **Title:** "Agent Activity Feed".
- **Feed Items (`<LogEntry />`):** Scrollable, timestamped list of AI reasoning and actions.
- **Alerts:** High-severity events (e.g., obstacle-triggered reroutes) use `bg-red-100 border-red-500` styling to flash red.
- Data sourced from Firestore `ai_decision_logs` collection via `onSnapshot`.

#### 5. Courier Simulator (`<CourierSimulator />`) — Floating Modal/Drawer
- **Courier Select:** Dropdown to choose which courier is "reporting".
- **Image Upload:** File input for obstacle photos (sent to `POST /api/v1/obstacles/report`).
- **Submit Button:** "Report to AI Dispatcher".
- Purpose: hackathon demo tool — not a production courier app.

### C. Planned File Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.jsx               # Root component, layout orchestration
│   ├── index.js               # React entry point
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ControlPanel.jsx
│   │   ├── OrderForm.jsx
│   │   ├── CourierList.jsx
│   │   ├── CourierCard.jsx
│   │   ├── MapView.jsx
│   │   ├── CourierMarker.jsx
│   │   ├── OrderMarker.jsx
│   │   ├── RoutePolyline.jsx
│   │   ├── AILogPanel.jsx
│   │   ├── LogEntry.jsx
│   │   └── CourierSimulator.jsx
│   ├── hooks/
│   │   ├── useFirestoreCollection.js   # Generic onSnapshot hook
│   │   ├── useCouriers.js              # Couriers-specific listener
│   │   ├── useOrders.js                # Orders-specific listener
│   │   └── useAILogs.js                # AI decision logs listener
│   ├── services/
│   │   ├── firebase.js                 # Firebase Client SDK init
│   │   └── api.js                      # REST API client (axios/fetch)
│   ├── utils/
│   │   └── polyline.js                 # Polyline decoding utility
│   └── styles/
│       └── index.css                   # Tailwind directives + custom overrides
├── .env                                # Environment variables (gitignored)
├── .env.example                        # Template with placeholder keys
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 2. Component Interactions

### Data & Control Flow

```
┌──────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                        │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ ControlPanel │   │   MapView    │   │   AILogPanel     │ │
│  │ (OrderForm,  │   │ (Markers,    │   │ (LogEntry feed)  │ │
│  │  CourierList) │   │  Polylines)  │   │                  │ │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
│         │                  │                     │            │
│         ▼                  ▼                     ▼            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React State (useState / Context)           │ │
│  └───────────────────────────┬─────────────────────────────┘ │
│                              │                                │
│              ┌───────────────┴───────────────┐               │
│              ▼                               ▼               │
│  ┌───────────────────┐          ┌──────────────────────┐    │
│  │ Firestore Hooks   │          │ REST API Client      │    │
│  │ (onSnapshot)      │          │ (axios/fetch)        │    │
│  └────────┬──────────┘          └──────────┬───────────┘    │
└───────────┼────────────────────────────────┼────────────────┘
            │                                │
            ▼                                ▼
   ┌─────────────────┐            ┌──────────────────────┐
   │ Firebase         │            │ Backend (Cloud Run)  │
   │ Firestore        │            │ POST /orders/dispatch│
   │ (4 collections)  │            │ POST /obstacles/report│
   │                  │            │ POST /simulation/traffic│
   └─────────────────┘            └──────────────────────┘
```

### Communication Methods

1. **Real-time reads (Firestore → Frontend):** `onSnapshot` listeners on `couriers`, `orders`, `obstacles`, and `ai_decision_logs` collections push live data into React state. No polling.
2. **Write operations (Frontend → Backend):** REST API calls via `fetch`/`axios` to the Cloud Run backend. The frontend never writes directly to Firestore.
3. **Intra-component:** React props drilling or Context API for shared state (courier list, order list, AI logs). No Redux or external state library planned.

### APIs Consumed

| Method | Endpoint | Trigger |
|--------|----------|---------|
| `POST` | `/api/v1/orders/dispatch` | OrderForm submit |
| `POST` | `/api/v1/obstacles/report` | CourierSimulator photo upload |
| `POST` | `/api/v1/simulation/traffic` | Traffic simulation button |

### Design System Integration

The frontend follows the design tokens defined in `DESIGN.md`:
- **Primary color:** `#085427` (dark green) — CTAs, active states.
- **Accent color:** `#8CE363` (light green) — highlights, progress indicators.
- **Typography:** Inter font from Google Fonts, scale from 12px (xs) to 32px (hero).
- **Border radius:** 8px–9999px (pill), using Tailwind config overrides.
- **Spacing:** 8px base unit.

---

## 3. Deployment Architecture

### Build & Deploy

| Step | Command | Output |
|------|---------|--------|
| Install | `npm install` | `node_modules/` |
| Dev | `npm start` | Local server at `localhost:3000` |
| Build | `npm run build` | `build/` (static assets) |
| Deploy | `firebase deploy --only hosting` | `pandu-ai-2026.web.app` |

### Environment Variables (Client-Side)

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_BASE_URL` | Backend Cloud Run URL |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps rendering |
| `REACT_APP_FIREBASE_API_KEY` | Firebase client auth |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firestore project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `REACT_APP_FIREBASE_APP_ID` | Firebase app identifier |

### External Dependencies

- **Google Maps Platform** — Map tiles, markers, polyline rendering.
- **Firebase Client SDK** — Firestore real-time listeners, client config.
- **Backend API** — Cloud Run endpoints (no direct AI or routing logic on the client).

### Infrastructure Notes

- Hosted on **Firebase Hosting** (CDN-backed static hosting).
- All environment variables prefixed with `REACT_APP_` are embedded at build time.
- CORS is handled by the backend (whitelist `pandu-ai-2026.web.app` and `localhost:3000`).

---

## 4. Runtime Behavior

### Application Initialization

1. React entry point (`index.js`) renders `<App />`.
2. Firebase Client SDK initializes with config from environment variables.
3. Custom hooks (`useCouriers`, `useOrders`, `useAILogs`) establish `onSnapshot` listeners.
4. Google Maps loads asynchronously via the Maps JavaScript API.
5. Initial data from Firestore populates the map, sidebar, and log panel.

### User Interaction Flows

#### Flow A: Dispatch a New Order
1. Dispatcher fills in pickup/dropoff coordinates in `<OrderForm />`.
2. Form submits `POST /api/v1/orders/dispatch` to the backend.
3. Backend processes → writes to Firestore.
4. `onSnapshot` on `orders` collection fires → React state updates → map renders new order markers.
5. `onSnapshot` on `ai_decision_logs` fires → AI log panel shows the assignment decision.
6. `onSnapshot` on `couriers` fires → courier card updates with new assignment + route polyline redraws.

#### Flow B: Report an Obstacle (Courier Simulator)
1. User opens `<CourierSimulator />` modal.
2. Selects a courier + uploads obstacle photo.
3. Form submits `POST /api/v1/obstacles/report` with image as `multipart/form-data`.
4. Backend → Gemini Vision → reroute decision → Firestore writes.
5. `onSnapshot` listeners update the map (new polyline), AI log (reroute reason), and courier card (updated status).

#### Flow C: Simulate Traffic
1. User clicks "Simulate Traffic/Obstacle" button.
2. Triggers `POST /api/v1/simulation/traffic` with a predefined traffic anomaly payload.
3. Backend injects anomaly → AI reroutes affected couriers → Firestore writes.
4. Real-time updates propagate to map and log panel.

### Error Handling (Frontend)

- API call failures display toast notifications or inline error messages.
- Firestore listener disconnections show a status indicator in the Navbar ("⚠️ Disconnected").
- Google Maps load failures display a fallback placeholder.
- Form validation prevents invalid lat/lng submissions.

### Performance Considerations

- Firestore listeners are attached once on mount, detached on unmount (cleanup in `useEffect`).
- Google Maps markers use clustering if courier/order count grows beyond demo scale.
- Polyline decoding runs client-side via a lightweight utility (no external library needed).
- Image uploads for obstacle reports are limited to ~5 MB to keep request times low.
