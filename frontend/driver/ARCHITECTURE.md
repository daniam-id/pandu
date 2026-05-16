# Driver App — Architecture & Feature Specification

> **Status:** Production-ready — Vite + React 18 + TypeScript + Tailwind CSS driver mobile web app.

---

## 1. Scope & Boundaries

### In Scope (MVP)

| Feature | Priority | Description |
|---------|----------|-------------|
| Assigned Orders List | P1 | Real-time list of orders assigned to this courier via Firestore `orders` collection |
| Order Detail View | P1 | Pickup & dropoff address, contact info, package notes, lat/lng |
| Status Update | P1 | Toggle: `assigned` → `picked_up` → `in_transit` → `delivered` or `failed` |
| Obstacle Report | P1 | Photo upload (≤5 MB) + type + severity + description → `POST /obstacles/report` |
| Live Location | P1 | `navigator.geolocation.watchPosition` → `POST /driver/location` every 10–30 s |
| Route Overview | P2 | Map with current position + pickup + dropoff + polyline (Google Maps JS API) |
| Turn-by-Turn | P2 | Step-by-step instructions (text + arrow icons), no voice |

### Out of Scope

- Chat with dispatcher (obstacle report is sufficient for MVP)
- Push notifications (rely on Firestore real-time + in-app toasts)
- Offline-first PWA with service worker (graceful degradation only)
- Complex batching / multi-order routing logic (backend responsibility)
- Direct Gemini AI calls

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Build Tool | Vite 5.x | Fast HMR, same as dispatcher |
| Framework | React 18 + TypeScript (strict) | Consistency with parent repo |
| Styling | Tailwind CSS 3.4 | Reuse `DESIGN.md` tokens |
| Forms | react-hook-form + zod | Proven in dispatcher `OrderForm` |
| Maps | Google Maps JS API (loader) | Lighter than `@react-google-maps/api`; fine for 1 map view |
| Real-time | Firebase v9 modular SDK (Firestore `onSnapshot`) | Same backend data layer |
| HTTP | Axios | Same `api.ts` pattern as dispatcher |
| Toast | Sonner | Same toast system as dispatcher |
| Icons | Lucide React | Same icon library |

---

## 3. File Structure (Actual — Cycle 10+)

```
driver/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # Root: ErrorBoundary + ConnectionStatus + Toaster
│   ├── routes.tsx               # 5 routes: /orders, /orders/:id, /route, /report, /profile
│   ├── pages/
│   │   ├── OrdersPage.tsx       # Assigned orders list (main screen)
│   │   ├── OrderDetailPage.tsx  # Single order detail + status controls + failure modal
│   │   ├── RoutePage.tsx        # Map + turn-by-turn instructions
│   │   ├── ReportObstaclePage.tsx # Standalone obstacle report form (photo + type + severity)
│   │   └── ProfilePage.tsx      # Courier info card + LiveLocationToggle
│   ├── components/
│   │   ├── AddressCard.tsx      # Pickup/dropoff address display with copy-to-clipboard
│   │   ├── AppShell.tsx         # Layout wrapper: header + <Outlet/>
│   │   ├── ConnectionStatus.tsx # Online/offline indicator banner
│   │   ├── ErrorBoundary.tsx    # react-error-boundary wrapper with reload fallback
│   │   ├── FailureReasonModal.tsx # Failure reason picker (dialog triggered from OrderActions)
│   │   ├── LiveLocationToggle.tsx # Heart-icon toggle + pulse animation + status text
│   │   ├── LoadingScreen.tsx    # Full-screen spinner with Pandu logo
│   │   ├── Navbar.tsx           # Bottom nav 4-tab: Orders / Route / Report / Profile
│   │   ├── OrderActions.tsx     # Status update buttons + prompts (inlined in OrderDetailPage)
│   │   ├── RouteMap.tsx         # Google Maps with courier position + order markers + polyline
│   │   ├── StatusTimeline.tsx   # Visual step indicators for order lifecycle
│   │   └── TurnByTurn.tsx       # Step list with maneuver arrow icons + distances
│   ├── hooks/
│   │   ├── useDriverOrders.ts     # Listen to orders where courierId == current driver
│   │   ├── useDriverProfile.ts    # Current courier doc from Firestore
│   │   ├── useFirestoreCollection.ts # Generic multi-doc onSnapshot hook (admin mirror)
│   │   └── useLiveLocation.ts     # watchPosition → 15s broadcast → POST /driver/location
│   ├── services/
│   │   ├── firebase.ts            # Firebase init (same config as dispatcher)
│   │   ├── api.ts                 # Axios instance + offline retry queue + all endpoints
│   │   └── queryClient.ts         # React Query defaults + error toast
│   ├── types/
│   │   └── domain.ts              # Order, OrderStatus, Address, Courier, Obstacle, Route, RouteStep
│   ├── utils/
│   │   ├── formatTime.ts          # Relative timestamps ("2 menit lalu")
│   │   └── formatDistance.ts      # "450 m" / "1.2 km"
│   └── styles/
│       └── index.css              # Tailwind directives + CSS vars (DESIGN.md tokens)
└── public/
    └── favicon.svg
```

### Notes on Structure

- **`LoginPage` intentionally skipped** — hackathon scope has no authentication.
- **`OrderCard` and `StatusBadge` inlined** — list rendering and status badges live inside `OrdersPage.tsx` / `StatusTimeline.tsx`; no standalone files needed at current complexity.
- **`ObstacleForm` merged** into `ReportObstaclePage.tsx` — single-file page is simpler for a mobile form.
- **`RouteOverview` renamed to `RouteMap`** for clarity (it's the map component, not a mini overview).
- **`useFirestoreCollection` (not `useFirestoreDoc`)** — the generic hook handles multi-doc queries, matching the admin pattern.

---

## 4. Data Flow

### Read Flow (Orders, Profile)

```
OrdersPage mounts
  → useDriverOrders() calls useFirestoreCollection('orders', { courierId: 'DRIVER_ID' })
    → onSnapshot on Firestore 'orders' collection
      → React state update
        → OrderCard list re-renders
```

### Write Flow (Status Update)

```
Courier taps "Picked Up"
  → OrderDetailPage calls api.updateOrderStatus(orderId, 'picked_up')
    → POST /api/v1/orders/:id/status
      → Backend writes to Firestore
        → onSnapshot fires → UI updates automatically
```

### Live Location Flow

```
LiveLocationToggle ON
  → navigator.geolocation.watchPosition(callback)
    → Every 15s, POST /api/v1/driver/location
      → Backend writes to Firestore 'couriers/{id}'
        → Dispatcher dashboard sees courier move in real-time
```

---

## 5. API Endpoints (Frontend → Backend)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/orders?courierId={id}` | Fetch assigned orders (initial load) |
| `POST` | `/api/v1/orders/:id/status` | Update order status |
| `POST` | `/api/v1/obstacles/report` | Report obstacle (FormData, multipart) |
| `POST` | `/api/v1/driver/location` | Broadcast GPS location |
| `GET` | `/api/v1/routes/:orderId` | Fetch route polyline + turn-by-turn steps |

---

## 6. Design Tokens (from DESIGN.md)

Reuse all tokens. Mobile-specific additions:

- **Bottom nav height:** 64px (safe area + 44px touch target)
- **Card padding:** 16px (same)
- **Status badge sizes:** sm (mobile), md (tablet)
- **Map height:** 40vh on mobile, 60vh on tablet

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile (default) | 320px–767px | Single column, bottom nav, full-width cards |
| Tablet | 768px–1023px | Two-column on OrdersPage, side nav |
| Desktop | 1024px+ | Not primary target; same as tablet but wider |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Geolocation permission denied | Live location broken | Fallback: manual "Arrived" button; show warning banner |
| Mobile browser throttles GPS | Location updates lag | Increase interval to 30s; batch updates |
| Photo upload >5 MB on slow 3G | Upload fails | Client-side compression before upload; progress indicator |
| Firebase quota exceeded | Real-time sync stops | Implement exponential backoff retry; offline toast |
| Google Maps JS API key missing | Map blank | Show static fallback with pickup/dropoff addresses |

---

## 9. Extraction Checklist

When moving to `pandu-driver-frontend` repo:

- [ ] `mv driver/ ../pandu-driver-frontend/`
- [ ] Update `package.json` name → `pandu-driver-frontend`
- [ ] Remove `"../DESIGN.md"` relative references; copy tokens inline or publish package
- [ ] Initialize new git repo + push to GitHub
- [ ] Set up Firebase Hosting project `pandu-driver-2026`
- [ ] Update CORS on backend to allow new domain
