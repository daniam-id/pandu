# Project Summary
- Tujuan aplikasi: Dual-frontend real-time logistics system. Admin Dashboard (dispatcher) memvisualisasikan pergerakan kurir, status pesanan, dan keputusan routing AI. Driver Mobile App (courier) untuk menerima orderan, update status, lapor rintangan, dan navigasi rute.
- Tech stack utama: React.js, Vite, Tailwind CSS, Google Maps API, Firebase SDK (Firestore listeners), Axios, React Query (admin), shadcn/ui.
- Entrypoint utama: `src/main.tsx` (Admin), `driver/src/main.tsx` (Driver).
- Backend kontrak: Cloud Run (`https://pandu-backend-879040945141.asia-southeast2.run.app`). Semua endpoint `/api/v1/*` butuh header `x-api-key` (env `REACT_APP_API_KEY`). Endpoint `/health` tidak butuh auth. Response sukses dibungkus `{success: true, data}`, error `{error: {code, message, details}}` (message dalam Bahasa Indonesia, langsung tampil ke user).

# Architecture Overview
- Layer/struktur utama (Admin):
  - Views/UI (Components & Pages): `src/components/`, `src/pages/`
  - Routes: `src/routes.tsx`
  - Data Access/Hooks (Client State & Real-time): `src/hooks/`
  - Services/Adapter (API & Firebase init): `src/services/`
  - Utilities & Types: `src/utils/`, `src/types/`
- Layer/struktur utama (Driver): `driver/src/` (mirror pattern dengan nama berbeda — `driver/src/pages/`, `driver/src/components/`, dsb.)
- Pola arsitektur yang dipakai: Real-time event-driven UI. Pembacaan data dilakukan secara real-time dari Firestore (`onSnapshot`), sementara penulisan/mutasi data (Command) dilakukan via REST API ke backend. Kedua frontend berbagi Firestore sebagai shared state. Admin layout: 2-panel desktop (`[320px_1fr]`), sidebars jadi drawer di mobile. Driver layout: single-column mobile-first dengan bottom nav.

# Key File Index
- `src/main.tsx`: Entrypoint aplikasi React (Admin).
- `src/App.tsx`: Global root yang mengatur ErrorBoundary, QueryClientProvider, dan Toaster.
- `src/routes.tsx`: Konfigurasi React Router (`/` untuk Dashboard, `/simulator` untuk Courier Simulator).
- `src/pages/DashboardPage.tsx`: Layout utama 2-panel yang menggabungkan `ControlPanel` (kiri) dan `MapView` (tengah/kanan).
- `src/pages/SimulatorPage.tsx`: Halaman standalone untuk operator kurir melaporkan rintangan (obstacle).
- `src/services/api.ts`: REST API client. Axios instance dengan request interceptor (attach `x-api-key` ke semua `/api/v1/*` kecuali `/health`), response interceptor (unwrap envelope `{success, data}` + Indonesian error fallback + toast.error). Endpoint wrappers: `dispatchOrder`, `cancelOrder`, `fetchOrderDetail`, `reportObstacle`, `simulateTraffic`, `checkHealth` (returns `HealthSnapshot{state, services}` for 3-state UI badge).
- `src/services/firebase.ts`: Inisialisasi SDK Firebase (app, db, storage).
- `src/hooks/useCouriers.ts`: Hook untuk listen koleksi `couriers` di Firestore.
- `src/hooks/useOrders.ts`: Hook untuk listen koleksi `orders` di Firestore.
- `src/hooks/useFirestoreCollection.ts`: Generic hook pembungkus `onSnapshot` dengan memory management.
- `src/components/AppShell.tsx`: Layout wrapper Navbar + `<Outlet />`.
- `src/components/Navbar.tsx`: Top nav dengan logo, nav links, ConnectionStatus, AIEngineStatus, TrafficSimButton.
- `src/components/ControlPanel.tsx`: Left sidebar (OrderForm + CourierList).
- `src/components/MapView.tsx`: Google Maps dengan marker courier/order dan route polylines.
- `src/components/CourierSimulator.tsx`: Dialog modal untuk lapor rintangan (admin side).
- `src/components/CourierSimulatorButton.tsx`: Floating button di map — responsive (dialog di desktop, Link ke /simulator di mobile).
- `src/components/TrafficSimButton.tsx`: Tombol di Navbar untuk inject traffic anomaly (demo scenario 2 & 3).
- `src/components/MobileDrawer.tsx`: Generic Sheet drawer wrapper untuk sidebars di mobile.
- `src/components/MobileNav.tsx`: Hamburger menu mobile dengan nav links.
- `src/components/ErrorBoundary.tsx`: React class ErrorBoundary — tangkap render crash.
- `src/components/ConnectionStatus.tsx`: Indikator online/offline di Navbar.
- `src/components/AIEngineStatus.tsx`: Polling `/health` setiap 30s. 3-state badge (`ok` hijau / `degraded` amber / `down` merah) dengan `title` tooltip per-service (mis. `firestore: failing · gemini: ok · maps: ok`).

# Driver App Key Files
- `driver/src/main.tsx`: Entrypoint Driver app (port 3001).
- `driver/src/App.tsx`: Root dengan ErrorBoundary + ConnectionStatus + Toaster.
- `driver/src/routes.tsx`: 5 route: /orders, /orders/:orderId, /route/:orderId?, /report, /profile.
- `driver/src/services/api.ts`: REST client. Axios instance dengan request interceptor (`x-api-key`), response interceptor (unwrap `{success, data}` envelope + offline retry queue + Indonesian fallback messages). Endpoint wrappers: `updateOrderStatus`, `reportObstacle`, `updateLocation`, `fetchRoute`, `fetchOrders`.
- `driver/src/hooks/useDriverOrders.ts`: onSnapshot orders filtered by `REACT_APP_COURIER_ID`.
- `driver/src/hooks/useLiveLocation.ts`: `watchPosition` + 15s broadcast interval.
- `driver/src/components/Navbar.tsx`: Fixed bottom nav 4-tab (Orders/Route/Report/Profile).

# Flow Map
1. **Real-time Data Read Flow (Query):**
   - Trigger: Komponen (misal `DashboardPage` atau `OrdersPage`) dirender.
   - Hook: Memanggil `useCouriers`, `useOrders` (admin) atau `useDriverOrders` (driver).
   - Data Access: Membungkus `useFirestoreCollection`, yang melakukan attach `onSnapshot` ke Firestore.
   - Database: Firebase Firestore (shared state antara admin dan driver).
   - UI Update: Perubahan di Firestore men-trigger update state di React, UI di-render ulang.
   
2. **Data Write Flow (Command — Dispatch Order / Report Obstacle / Status Update / Traffic Sim):**
   - Trigger: User men-submit form (OrderForm, SimulatorPage, ReportObstaclePage, OrderActions) atau klik TrafficSimButton.
   - Handler/Component: Validasi form lokal (zod), lalu memanggil fungsi service.
   - Service/Adapter: `src/services/api.ts` atau `driver/src/services/api.ts` mengirim HTTP request via axios.
     - Request interceptor menambahkan header `x-api-key` (kecuali untuk `/health`).
     - Response interceptor unwrap envelope `{success, data}` → `data` langsung dapat dipakai caller.
     - Error interceptor mengubah `error.message` (Bahasa Indonesia) jadi toast; status 401/404/429 punya pesan fallback khusus.
   - Backend/API: Backend Cloud Run memproses logika (rate-limited 100/min global, 240/min lokasi), dan melakukan penulisan ke Firestore.
   - UI Update: Begitu Firestore berubah, aliran Read Flow (1) mengambil alih — kedua frontend terupdate.

3. **Traffic Simulation Flow:**
   - Trigger: Klik TrafficSimButton di Navbar admin.
   - API Call: `POST /simulation/traffic` ke backend.
   - Backend: Inject traffic anomaly → AI reroute → tulis ke Firestore.
   - UI: MapView update polyline, driver RoutePage update rute.

# Known Gaps
- Admin layout sudah 2-panel (AI Decision Log dihapus per Cycle 10).
- Komponen internal shadcn/ui (Button, Card, Input, Dialog, Badge, Skeleton, Separator) tidak dipetakan detail karena presentational.
- Konfigurasi Vite, Tailwind, PostCSS, ESLint, Prettier di luar siklus data layer.
- Backend routing logic + Gemini AI berjalan async di luar konteks frontend.
- Driver app adalah standalone Vite project di `driver/` dengan port 3001; shared Firestore database.
- Photo upload obstacle (Firebase Storage) butuh Blaze plan — saat ini photo opsional, report tetap jalan text-only. Migrasi ke Cloudinary tersedia di backend docs.
- Endpoint `cancelOrder` & `fetchOrderDetail` sudah di-expose di admin `api.ts` tapi belum dipakai UI (siap dipakai jika fitur cancel order admin ditambah).
- Subskripsi Firestore `ai_decision_logs` ada di kontrak backend tapi tidak dirender — UI panel sengaja dihapus per Cycle 10.
