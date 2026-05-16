# Pandu.ai Frontend — Technical Overview

**Project:** Mini Hackathon Antigravity 2026 (GDG Surabaya)  
**Scope:** Dispatcher Dashboard (Web Frontend)  
**Date:** April 2026  
**Status:** Production-ready — 10 build cycles complete + driver app fully implemented. Dual-frontend architecture: Admin Dashboard (`src/`) + Driver Mobile App (`driver/`).

---

## 1. Core Components

### A. Application Shell

| Aspect | Detail |
|--------|--------|
| **Framework** | React.js (Create React App or Vite) |
| **Styling** | Tailwind CSS |
| **Maps** | Google Maps Platform (Routes API) via `@react-google-maps/api` |
| **Real-time DB** | Firebase Client SDK v9+ (`onSnapshot` listeners) |
| **Language** | TypeScript (strict) |

### B. Major UI Components

#### 1. Top Navigation Bar (`<Navbar />`)
- **Left:** "Pandu.ai" logo/brand, Dashboard + Simulator nav links, mobile hamburger menu.
- **Right:** Connection status badge, AI engine health indicator, traffic simulation trigger.
- Sticky, full-width, height 56px.

#### 2. Control & Overview Panel (`<ControlPanel />`) — Left Sidebar (320px)
- **Order Input Form (`<OrderForm />`):** Fields for Pickup Lat/Lng, Dropoff Lat/Lng, and a "Dispatch" button. Submits `POST /orders/dispatch` to the backend.
- **Active Couriers List (`<CourierList />`):** Real-time cards showing courier name, status (idle/delivering/rerouted), and assigned orders. Data sourced from Firestore `couriers` collection via `onSnapshot`.

#### 3. Live Map View (`<MapView />`) — Main Panel (flex-1)
- **Map Container:** Google Maps rendered via `@react-google-maps/api`.
- **Courier Markers (`<CourierMarker />`):** Live GPS positions, updated in real-time from Firestore.
- **Order Markers (`<OrderMarker />`):** Pickup (green) and dropoff (red) pins.
- **Route Polylines (`<RoutePolyline />`):** Decoded polyline strings representing the current optimal route for each courier.
- **Courier Simulator Trigger:** Floating action button opens obstacle report modal on desktop, navigates to `/simulator` on mobile.

#### 5. Courier Simulator (`<CourierSimulator />`) — Floating Modal/Drawer
- **Courier Select:** Dropdown to choose which courier is "reporting".
- **Image Upload:** File input for obstacle photos (sent to `POST /api/v1/obstacles/report`).
- **Submit Button:** "Report to AI Dispatcher".
- Purpose: hackathon demo tool — not a production courier app.

### C. Actual File Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.svg
├── src/
│   ├── App.tsx                # Root with ErrorBoundary + QueryClientProvider + Toaster
│   ├── main.tsx               # React entry point (createRoot)
│   ├── routes.tsx             # React Router: /, /simulator, *
│   ├── components/
│   │   ├── AppShell.tsx       # Navbar + <Outlet/> wrapper
│   │   ├── Navbar.tsx         # Top nav: logo, links, status badges, traffic sim
│   │   ├── ControlPanel.tsx   # Left sidebar: OrderForm + CourierList
│   │   ├── OrderForm.tsx      # Zod-validated dispatch form (react-hook-form)
│   │   ├── CourierList.tsx    # Real-time courier cards
│   │   ├── CourierListEmpty.tsx  # Empty state: no couriers online
│   │   ├── CourierListSkeleton.tsx # Loading skeleton for courier list
│   │   ├── CourierCard.tsx    # Individual courier: avatar, name, status badge
│   │   ├── MapView.tsx        # Google Maps: markers + polylines + InfoWindows
│   │   ├── CourierMarker.tsx  # SVG status-colored courier pin
│   │   ├── OrderMarker.tsx    # Pickup (green) / dropoff (red) pins
│   │   ├── RoutePolyline.tsx  # Decoded polyline rendering
│   │   ├── MarkerInfoCard.tsx # InfoWindow content for courier markers
│   │   ├── CourierSimulatorButton.tsx  # Floating FAB → dialog (desktop) / link (mobile)
│   │   ├── CourierSimulator.tsx        # Obstacle report dialog with photo upload
│   │   ├── CourierSelect.tsx  # Couriers dropdown for simulator
│   │   ├── ObstaclePhotoUpload.tsx     # Drag-and-drop photo input
│   │   ├── TrafficSimButton.tsx        # Navbar traffic injection trigger
│   │   ├── ConnectionStatus.tsx        # Online/offline indicator
│   │   ├── AIEngineStatus.tsx          # Backend health polling badge
│   │   ├── MobileDrawer.tsx   # Sheet drawer for mobile sidebars
│   │   ├── MobileNav.tsx      # Hamburger menu
│   │   ├── MapSkeleton.tsx    # Map loading placeholder
│   │   ├── MapError.tsx       # Map fail fallback with retry
│   │   ├── ErrorBoundary.tsx  # React class ErrorBoundary
│   │   ├── LatLngInput.tsx    # Reusable lat/lng field pair
│   │   └── ui/                # shadcn primitives (Button, Card, Input, Dialog, Sheet, etc.)
│   ├── hooks/
│   │   ├── useFirestoreCollection.ts   # Generic onSnapshot hook
│   │   ├── useCouriers.ts              # Couriers listener
│   │   └── useOrders.ts                # Orders listener
│   ├── services/
│   │   ├── firebase.ts        # Firebase SDK init
│   │   ├── api.ts             # REST API client (Axios)
│   │   └── queryClient.ts     # React Query config
│   ├── types/
│   │   └── domain.ts          # Courier, Order, Obstacle, LatLng, etc.
│   ├── utils/
│   │   ├── polyline.ts        # Polyline decoder
│   │   ├── mapStyle.ts        # Custom Google Maps style
│   │   ├── formatTime.ts      # Relative timestamps
│   │   └── formatDistance.ts  # Meters → km formatting
│   └── styles/
│       └── index.css           # Tailwind directives + CSS vars
├── driver/                     # Standalone Driver Mobile App (Vite, port 3001)
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── firebase.json
├── .firebaserc
└── package.json
```

---

## 2. Component Interactions

### Data & Control Flow

```
┌──────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                        │
│                                                               │
│  ┌──────────────┐                        ┌──────────────┐   │
│  │ ControlPanel │                        │   MapView    │   │
│  │ (OrderForm,  │                        │ (Markers,    │   │
│  │  CourierList) │                       │  Polylines)  │   │
│  └──────┬───────┘                        └──────┬───────┘   │
│         │                                       │            │
│         ▼                                       ▼            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React State (useState)                      │ │
│  └───────────────────────────┬─────────────────────────────┘ │
│                              │                                │
│              ┌───────────────┴───────────────┐               │
│              ▼                               ▼               │
│  ┌───────────────────┐          ┌──────────────────────┐    │
│  │ Firestore Hooks   │          │ REST API Client      │    │
│  │ (onSnapshot)      │          │ (axios)              │    │
│  └────────┬──────────┘          └──────────┬───────────┘    │
└───────────┼────────────────────────────────┼────────────────┘
            │                                │
            ▼                                ▼
   ┌─────────────────┐            ┌──────────────────────┐
   │ Firebase         │            │ Backend (Cloud Run)  │
   │ Firestore        │            │ POST /orders/dispatch│
   │ (3 collections)  │            │ POST /obstacles/report│
   │                  │            │ POST /simulation/traffic│
   └─────────────────┘            └──────────────────────┘
```

### Communication Methods

1. **Real-time reads (Firestore → Frontend):** `onSnapshot` listeners on `couriers`, `orders`, and `obstacles` collections push live data into React state. No polling.
2. **Write operations (Frontend → Backend):** REST API calls via `axios` to the Cloud Run backend. The frontend never writes directly to Firestore.
3. **Intra-component:** React props for shared state (courier list, order list). No Redux or external state library.

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

1. React entry point (`main.tsx`) renders `<App />`.
2. Firebase Client SDK initializes with config from environment variables.
3. Custom hooks (`useCouriers`, `useOrders`) establish `onSnapshot` listeners.
4. Google Maps loads asynchronously via the Maps JavaScript API.
5. Initial data from Firestore populates the map and sidebar.

### User Interaction Flows

#### Flow A: Dispatch a New Order
1. Dispatcher fills in pickup/dropoff coordinates in `<OrderForm />`.
2. Form submits `POST /orders/dispatch` to the backend.
3. Backend processes → writes to Firestore.
4. `onSnapshot` on `orders` collection fires → React state updates → map renders new order markers.
5. `onSnapshot` on `couriers` fires → courier card updates with new assignment + route polyline redraws.

#### Flow B: Report an Obstacle (Courier Simulator)
1. User opens `<CourierSimulator />` modal (desktop) or navigates to `/simulator` (mobile).
2. Selects a courier + obstacle type, severity, and photo upload.
3. Form submits `POST /obstacles/report` with image as `multipart/form-data`.
4. Backend → Gemini Vision → reroute decision → Firestore writes.
5. `onSnapshot` listeners update the map (new polyline) and courier card (updated status).

#### Flow C: Simulate Traffic
1. User clicks "Simulate Traffic" button in the Navbar.
2. Triggers `POST /simulation/traffic` with a predefined traffic anomaly payload.
3. Backend injects anomaly → AI reroutes affected couriers → Firestore writes.
4. Real-time updates propagate to map and courier list.

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
