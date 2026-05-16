# 🚚 Pandu.ai

> **Agentic AI dispatcher for urban last-mile delivery in Surabaya.**  
> Real-time route optimization powered by Gemini 3.1 Flash-Lite — autonomously reroutes couriers around traffic, floods, and road obstacles.

![Status](https://img.shields.io/badge/status-production--ready-085427)
![Hackathon](https://img.shields.io/badge/hackathon-Antigravity%202026-8CE363)
![License](https://img.shields.io/badge/license-MIT-blue)

**Live Demo:** [pandu-ai-2026.web.app](https://pandu-ai-2026.web.app) · **Backend API:** [Cloud Run](https://pandu-backend-879040945141.asia-southeast2.run.app) · **Pitch Deck:** `[TODO: Add Link]` · **Demo Video:** `[TODO: Add Link]`

---

## 💡 The Problem

Urban logistics in Surabaya face **operational drag** from unpredictable conditions:

- 🌊 **Sudden obstacles** — floods, accidents, road closures appear without warning, causing delivery delays
- 🔄 **Reactive routing** — dispatchers manually reroute couriers after problems occur, wasting time and fuel
- 📡 **No real-time visibility** — dispatchers lack live courier positions and AI-assisted decision support

## ✨ The Solution

Pandu.ai is an **autonomous logistics dispatcher** that:

1. **Listens** to real-time courier positions and incoming orders via Firestore
2. **Thinks** using Gemini 3.1 Flash-Lite to assign couriers and batch nearby orders
3. **Sees** road obstacles through multimodal vision analysis of courier-uploaded photos
4. **Acts** by instantly recalculating routes and pushing updates to all dashboards in < 1 second

---

## 🏆 Key Features

| Feature | Description |
|---------|-------------|
| ⚡ **Real-Time Order Sync** | Firestore `onSnapshot` listeners push live courier positions, order status, and route polylines to all connected dashboards |
| 🤖 **AI Courier Assignment** | Gemini autonomously assigns the optimal courier for each new order, with multi-order batching logic to save distance |
| 📸 **Multimodal Obstacle Detection** | Couriers upload photos of road conditions → Gemini Vision analyzes severity → automatic emergency reroute if high severity |
| 🗺️ **Live Map Dashboard** | Google Maps canvas with status-colored courier markers, order pickup/dropoff pins, and dynamic route polylines |
| 📱 **Driver Mobile Web App** | Mobile-first courier interface with turn-by-turn navigation, status updates, GPS broadcasting, and obstacle reporting |
| 🚦 **Traffic Simulation** | Demo tool to inject fake traffic anomalies and watch the AI reroute affected couriers in real-time |

---

## 🛠️ Tech Stack

### Frontend — Dispatcher Dashboard

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5.4 |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| Maps | Google Maps Platform (`@react-google-maps/api`) |
| State | React Query 5 + Firestore `onSnapshot` |
| Forms | react-hook-form + Zod |
| Testing | Vitest + Testing Library |

### Frontend — Driver Mobile App

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5.4 |
| Styling | Tailwind CSS 3.4 (shared design tokens) |
| Maps | Google Maps JS API (`@googlemaps/js-api-loader`) |
| Navigation | React Router v6 |
| Offline | Retry queue in `api.ts` — flushes on reconnect |

### Backend — Agentic Routing Engine

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript (strict) |
| Framework | Express 4 |
| Hosting | Google Cloud Run (serverless, auto-scaling) |
| AI Engine | Gemini 3.1 Flash-Lite Preview (`@google/generative-ai`) |
| Database | Firebase Admin SDK (Firestore) |
| Security | Helmet, rate limiting (100/min), static API key auth |
| Logging | Pino (structured JSON) |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Firebase Firestore | Real-time data sync (4 collections) |
| Firebase Hosting | CDN-backed static frontend hosting |
| Google Cloud Run | Serverless backend deployment |
| Google Cloud Secret Manager | API key and credential storage |
| Google Cloud Build | CI/CD auto-deploy from GitHub |
| Google Maps Routes API | Route calculation and polyline generation |

---

## 🏗️ Architecture — How It Works

```
┌─────────────────────┐         REST API          ┌──────────────────────────┐
│  Dispatcher Dashboard│ ───────────────────────►  │  Backend (Cloud Run)     │
│  (React + Maps)      │                           │  Node.js + Express       │
│                      │                           │                          │
│  Firestore ◄─────────┼──── Real-time Sync ───────┼── Firebase Admin SDK     │
│  onSnapshot          │                           │                          │
│                      │                           │  Gemini 3.1 ◄──►         │
│  Driver App ◄────────┼──── Real-time Sync ───────┼── Function Calling       │
│  (React Mobile)      │                           │  (reroute, batch)        │
└─────────────────────┘                           └──────────────────────────┘
```

### Data Flow

1. **Dispatcher creates order** → `POST /api/v1/orders/dispatch` → Backend writes to Firestore → AI assigns courier → Dashboard updates in real-time
2. **Courier reports obstacle** → Uploads photo → `POST /api/v1/obstacles/report` → Gemini Vision analyzes severity → High severity triggers `reroute_courier` → All dashboards see new route instantly
3. **Driver broadcasts GPS** → `POST /api/v1/driver/location` every 15s → Backend updates Firestore → Dispatcher map shows courier moving live

### Firestore Collections

| Collection | Purpose |
|------------|---------|
| `couriers` | Real-time courier state, GPS location, assigned orders, route polylines |
| `orders` | Delivery requests with pickup/dropoff locations and status lifecycle |
| `obstacles` | Multimodal obstacle reports with AI analysis (severity, description, action taken) |
| `ai_decision_logs` | Audit trail of every AI reasoning action for dispatcher visibility |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/orders/dispatch` | Dispatch new order with AI courier assignment |
| `GET` | `/api/v1/orders?courierId=X` | List orders assigned to a courier |
| `GET` | `/api/v1/orders/:orderId` | Get order detail |
| `POST` | `/api/v1/orders/:orderId/status` | Update order status (idempotent) |
| `POST` | `/api/v1/orders/:orderId/cancel` | Cancel an order |
| `POST` | `/api/v1/obstacles/report` | Report obstacle (text or multipart photo) |
| `POST` | `/api/v1/driver/location` | Broadcast driver GPS location |
| `GET` | `/api/v1/routes/:orderId` | Fetch route polyline + turn-by-turn steps |
| `POST` | `/api/v1/simulation/traffic` | Inject fake traffic anomaly for demo |
| `GET` | `/health` | Health check (Firestore + Gemini connectivity) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Google Cloud SDK** (`gcloud`) — for backend deployment
- **Firebase CLI** — for frontend deployment
- A Google Cloud project with the following APIs enabled:
  - Firebase Firestore
  - Google Maps Platform (Routes API, JavaScript API)
  - Google AI Studio (Gemini API)

### 1. Clone the Repository

```bash
git clone https://github.com/daniam-id/pandu.git
cd pandu
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Fill in `.env`:

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_VERSION=gemini-3.1-flash-lite-preview

# Firebase Admin SDK (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJwcm9qZWN0X2lkIjoi...

# Static API key for hackathon auth (min 32 chars)
API_SECRET_KEY=your_secret_key_here

# Server port (Cloud Run sets this automatically)
PORT=8080
```

```bash
# Run development server
npm run dev          # http://localhost:8080

# Build for production
npm run build        # tsc compile → dist/
npm start            # node dist/index.js
```

**Deploy to Cloud Run:**

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud run deploy pandu-backend \
  --source . \
  --region=asia-southeast2 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5
```

### 3. Frontend — Dispatcher Dashboard

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Fill in `.env`:

```env
# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
REACT_APP_API_KEY=your_api_key_here

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Firebase Client SDK
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=pandu-ai-2026.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pandu-ai-2026
REACT_APP_FIREBASE_STORAGE_BUCKET=pandu-ai-2026.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

```bash
# Run development server (port 3000)
npm start

# Production build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 4. Frontend — Driver Mobile App

```bash
cd frontend/driver

# Install dependencies
npm install

# Create environment file (same Firebase config as dispatcher)
cp .env.example .env
```

```bash
# Run development server (port 3001)
npm start

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 📸 Screenshots

### Dispatcher Dashboard

| Live Map View | Control Panel |
|---------------|---------------|
| ![Map View](`[TODO: Add screenshot]`) | ![Control Panel](`[TODO: Add screenshot]`) |

> Full-screen Google Maps with real-time courier markers, order pins, and route polylines. Left sidebar for order dispatch and courier management.

### Driver Mobile App

| Orders List | Route Navigation | Obstacle Report |
|-------------|-----------------|-----------------|
| ![Orders](`[TODO: Add screenshot]`) | ![Route](`[TODO: Add screenshot]`) | ![Report](`[TODO: Add screenshot]`) |

> Mobile-first interface (320px–428px) with bottom navigation, turn-by-turn guidance, and photo-based obstacle reporting.

### Demo Flow

```
[TODO: Add GIF — Show the complete demo flow:]
1. Dispatcher creates a new order → AI assigns courier → map updates
2. Courier reports flood via photo → Gemini Vision analyzes → route reroutes
3. Traffic simulation → multiple couriers rerouted simultaneously
```

---

## 👥 Team

| Name | Role |
|------|------|
| **Adam Dani Apta Mahendra** | Fullstack Engineering — Frontend dashboard, driver app, backend integration |
| **Nadif Fijri Fajar Arifin** | Backend & AI Engineering — Cloud Run, Gemini orchestration, Firestore |

**Project:** Mini Hackathon Antigravity 2026 · **Organizer:** GDG Surabaya

---

## 📄 License & Acknowledgments

**License:** MIT

### Acknowledgments

- **Google AI Studio** — Gemini 3.1 Flash-Lite Preview for agentic function calling and multimodal vision
- **Google Maps Platform** — Routes API and JavaScript API for mapping and navigation
- **Firebase** — Firestore real-time sync, Hosting, and Admin SDK
- **GDG Surabaya** — Antigravity 2026 hackathon organizers
- **shadcn/ui** — Accessible UI component primitives
- **Vite** — Lightning-fast build tooling

---

> Built with 💚 in Surabaya, Indonesia
