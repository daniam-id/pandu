# Pandu.ai Driver Mobile Web App

> **Status:** Production-ready — Vite + React 18 + TypeScript + Tailwind CSS  
> **Audience:** Field couriers on mobile browsers (320px–428px viewport)

---

## Purpose

The Driver App is the courier-facing interface for Pandu.ai. While the Dispatcher Dashboard (`../src/`) is built for back-office dispatchers, this app is built for couriers in the field:

- Receiving assigned orders in real-time via Firestore
- Updating delivery status (accepted → picked up → in transit → delivered/failed)
- Turn-by-turn route guidance with Google Maps
- Reporting road obstacles via photo + description
- Broadcasting live GPS location to the dispatcher

---

## Commands

```bash
# Navigate to driver app
cd driver/

# Install dependencies
npm install

# Start dev server (port 3001)
npm start

# Production build
npm run build

# Type-check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Preview production build
npm run preview
```

---

## Architecture

| Layer | Technology |
|-------|------------|
| **Framework** | React 18.3 (functional components + hooks) |
| **Language** | TypeScript 5.6 (strict mode) |
| **Build** | Vite 5.4 |
| **Styling** | Tailwind CSS 3.4 (shares design tokens from `../DESIGN.md`) |
| **Maps** | Google Maps JavaScript API (`@googlemaps/js-api-loader`) |
| **Routing** | React Router v6 |
| **Forms** | `react-hook-form` + `zod` validation |
| **Notifications** | Sonner toasts |
| **Data Reads** | Firestore `onSnapshot` listeners (real-time) |
| **Data Writes** | REST API via Axios (`POST /api/v1/...`) |
| **Offline** | Offline retry queue in `api.ts` — queued writes flush on reconnect |

## File Structure

```
driver/
├── src/
│   ├── components/          # 12 presentational/feature components
│   │   ├── AppShell.tsx      # Layout wrapper with bottom nav clearance
│   │   ├── Navbar.tsx        # Fixed bottom navigation (4 tabs)
│   │   ├── ErrorBoundary.tsx # Functional error boundary
│   │   ├── OrderCard.tsx     # Order list item
│   │   ├── OrderActions.tsx  # Status-specific action buttons
│   │   ├── StatusTimeline.tsx # Vertical order status progression
│   │   ├── AddressCard.tsx   # Pickup/dropoff address display
│   │   ├── FailureReasonModal.tsx # Modal for capturing delivery failure reason
│   │   ├── RouteMap.tsx      # Google Maps with markers + polyline
│   │   ├── TurnByTurn.tsx    # Navigation step list
│   │   ├── LiveLocationToggle.tsx # GPS sharing toggle
│   │   ├── ConnectionStatus.tsx   # Online/offline banner
│   │   └── LoadingScreen.tsx # Full-screen spinner
│   ├── hooks/               # 4 custom hooks
│   │   ├── useFirestoreCollection.ts # Generic Firestore onSnapshot hook
│   │   ├── useDriverOrders.ts        # Assigned orders listener
│   │   ├── useDriverProfile.ts       # Courier profile listener
│   │   └── useLiveLocation.ts        # GPS watch + API broadcast
│   ├── pages/               # 5 route-level pages
│   │   ├── OrdersPage.tsx          # /orders
│   │   ├── OrderDetailPage.tsx     # /orders/:orderId
│   │   ├── RoutePage.tsx           # /route/:orderId?
│   │   ├── ReportObstaclePage.tsx  # /report
│   │   └── ProfilePage.tsx         # /profile
│   ├── services/            # Backend integration
│   │   ├── api.ts           # Axios client + endpoint wrappers + offline queue
│   │   └── firebase.ts      # Firebase v9 modular init (db + storage)
│   ├── types/
│   │   └── domain.ts        # Order, Courier, Obstacle, Route interfaces
│   ├── utils/
│   │   ├── formatTime.ts    # Relative timestamps ("2 menit lalu")
│   │   └── formatDistance.ts # "450 m" / "1.2 km"
│   └── lib/
│       └── utils.ts         # cn() — Tailwind class merging
├── .env.example             # Environment variables (VITE_API_BASE_URL, Firebase config)
├── index.html               # Vite entry HTML
├── package.json
├── tsconfig.json
└── vite.config.ts           # envPrefix: REACT_APP_ for compatibility
```

## Port Assignment

| App | Port | Command |
|-----|------|---------|
| Dispatcher Dashboard | 3000 | `npm start` (repo root) |
| Driver App | 3001 | `npm start` (in `driver/`) |

---

## Order Status State Machine

```
assigned → accepted → picked_up → in_transit → delivered
                                       └→ failed
```

The `OrderActions` component renders only the next legal action button(s) based on current status. Offline retry: failed HTTP calls queue and flush when `navigator.onLine` returns.

---

## Constraints

- **No AI logic on client** — all routing/reasoning is backend-only
- **No direct Firestore writes** — reads via `onSnapshot`, writes via REST API
- **Mobile-first** — designed for 320px–428px viewports, tablet secondary
- **Geolocation required** — `navigator.geolocation.watchPosition` for live location
- **Environment variables** — use `REACT_APP_` prefix per shared convention
- **Design system** — use tokens from `../DESIGN.md`, no ad-hoc colors/fonts

---

## Related Docs

- `../DESIGN.md` — Shared color tokens, typography, spacing
- `../AGENTS.md` — Coding conventions, header docs, scope boundaries
- `../technical_overview.md` — Backend API endpoints, data flow, Firebase structure
- `./ARCHITECTURE.md` — Detailed component specs and feature descriptions
