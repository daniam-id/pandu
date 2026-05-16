<!--
Purpose      : Browser-based end-to-end manual test script for the Pandu.ai dual-frontend system
Audience     : QA testers, demo presenters, frontend & backend engineers performing acceptance checks
Dependencies : Admin Dashboard (port 3000 dev / Firebase Hosting prod), Driver Mobile App (port 3001), Cloud Run backend
Side Effects : Test cases dispatch real orders and write to Firestore; intended for staging/demo env only
-->

# Manual Testing Script — Pandu.ai Dual-Frontend System

| | |
|---|---|
| **Version** | 1.0 |
| **Last Updated** | 2026-05-16 |
| **Owner** | QA / Frontend Integration |
| **Target Build** | Backend Integration cycle (PROGRESS.md 2026-05-16) |
| **Estimated Duration** | 45–60 minutes (full pass) · 15 minutes (smoke subset) |

---

## How To Use This Document

1. **Read the Prerequisites section first** — most failures during testing trace back to env or credentials, not the application itself.
2. **Complete the Pre-Flight Checks** before running any test case. If pre-flight fails, stop and resolve before continuing.
3. **Run scenarios in order.** Each scenario builds on data created by the previous one (e.g. Scenario 3 reuses orders created in Scenario 2).
4. **For every step**, tick the checkbox once the action is completed. For every Expected Result, tick the checkbox once you have confirmed the outcome matches.
5. **Always fill in the Actual Result block** even when the test passes — a brief note helps reproduce later regressions.
6. **Status options:** `Pass` / `Fail` / `Blocked` (Blocked = could not run because a prior test or external dependency failed).
7. **Log every Fail** in the **Test Session Log** table at the bottom of this document. Cross-reference bug IDs from `docs/backend/BACKEND_FIX_REQUESTS.md` where applicable.

> Authentication note: this system has no user-facing login screen. Authentication is handled at the network layer via the `x-api-key` HTTP header, configured per device via the `REACT_APP_API_KEY` environment variable. Scenario 1 (Auth) therefore tests credential configuration rather than a UI login flow.

---

## Prerequisites

### URLs

| Service | Dev URL | Prod URL |
|---------|---------|----------|
| Admin Dashboard | `http://localhost:3000` | `https://pandu-ai-2026.web.app` |
| Driver Mobile App | `http://localhost:3001` | _(separate Firebase Hosting target — TBD)_ |
| Backend Cloud Run | `https://pandu-backend-879040945141.asia-southeast2.run.app` | same |
| Backend health endpoint | `…/health` | same |

### Required Credentials & Configuration

| Item | Source | Status |
|------|--------|--------|
| Backend API key (`REACT_APP_API_KEY`) | Backend team (secure channel) | ⚠️ Documented key in `INTEGRATION_STATUS.md` is currently rejected — see `BE-002` |
| Firebase Web App config (6 keys) | Firebase Console → Project Settings → Your apps → SDK setup | Required for `onSnapshot` listeners |
| Google Maps JavaScript API key | GCP Console with Maps JS API enabled + billing | Required for Admin MapView and Driver RouteMap |
| Courier ID (`REACT_APP_COURIER_ID`) | Pick any string per device, e.g. `courier_device_001` | Driver app only |

### Environment Setup

Both `.env` files must be populated before running. The doc assumes the following template values are replaced with real ones:

```bash
# /home/dnm/project/pandu/frontend/.env (Admin)
REACT_APP_API_BASE_URL=https://pandu-backend-879040945141.asia-southeast2.run.app/api/v1
REACT_APP_API_KEY=<from backend team>
REACT_APP_GOOGLE_MAPS_API_KEY=<from GCP>
REACT_APP_FIREBASE_API_KEY=<from Firebase Console>
REACT_APP_FIREBASE_AUTH_DOMAIN=pandu-ai-2026.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pandu-ai-2026
REACT_APP_FIREBASE_STORAGE_BUCKET=pandu-ai-2026.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
REACT_APP_FIREBASE_APP_ID=<from Firebase Console>

# /home/dnm/project/pandu/frontend/driver/.env (Driver) — same keys plus
REACT_APP_COURIER_ID=courier_device_001
```

### Hardware & Browser Requirements

| Component | Minimum Spec | Recommended |
|-----------|--------------|-------------|
| Desktop browser | Chrome 120+, Firefox 120+, or Safari 17+ | Chrome with DevTools |
| Mobile device (or DevTools emulation) | Any Android Chrome / iOS Safari | Real device for touch + GPS test |
| Network | Stable broadband (≥10 Mbps down) | Optional: throttle to Slow 3G via DevTools for Scenario 4 |
| Screen | 1024×768 minimum | Two monitors helpful for side-by-side admin + driver |

### Test Data Constants

Use these coordinates throughout the script to keep test data consistent and visible on the same map view:

| Label | Latitude | Longitude | Description |
|-------|----------|-----------|-------------|
| Pickup A (Tunjungan) | -7.2575 | 112.7521 | Central Surabaya |
| Dropoff A (Ngagel) | -7.2906 | 112.7331 | South-central Surabaya |
| Pickup B (Wonokromo) | -7.3015 | 112.7378 | Alt test |
| Dropoff B (Gubeng) | -7.2654 | 112.7505 | Alt test |
| Off-route point (Citra Raya) | -7.3300 | 112.6500 | For traffic-sim reroute test |

---

## Pre-Flight Checks

Run these **before** any scenario. All must pass.

### PF-1: Backend health is OK

- [ ] 1. Open a terminal and run: `curl -s https://pandu-backend-879040945141.asia-southeast2.run.app/health | jq`
- [ ] 2. Expected response:
  ```json
  { "status": "ok", "services": { "firestore": "ok", "gemini": "ok", "maps": "ok" } }
  ```
- [ ] Expected Result: `status` is `"ok"` and every service is `"ok"`.
- **Actual Result:** _____________________________________________
- **Status:** ☐ Pass · ☐ Fail (Blocked by `BE-001`)

### PF-2: API key authentication works

- [ ] 1. In the terminal, run (replace `<KEY>` with the actual key):
  ```bash
  curl -s -w "\nHTTP=%{http_code}\n" -H "x-api-key: <KEY>" \
    "https://pandu-backend-879040945141.asia-southeast2.run.app/api/v1/orders?courierId=test"
  ```
- [ ] Expected Result: HTTP 200, response body is `{"success":true,"data":…}`.
- **Actual Result:** _____________________________________________
- **Status:** ☐ Pass · ☐ Fail (Blocked by `BE-002`)

### PF-3: Dev servers boot cleanly

- [ ] 1. Terminal 1: `cd /home/dnm/project/pandu/frontend && npm install && npm run dev`
- [ ] 2. Terminal 2: `cd /home/dnm/project/pandu/frontend/driver && npm install && npm run dev`
- [ ] 3. Wait for both to print `Local: http://localhost:3000` and `…:3001`.
- [ ] Expected Result: No red errors in either terminal output; both report `ready in <Xs>` cleanly.
- **Actual Result:** _____________________________________________
- **Status:** ☐ Pass · ☐ Fail

### PF-4: Frontend pages load without console errors

- [ ] 1. Open `http://localhost:3000` in Chrome with DevTools (F12) → Console tab.
- [ ] 2. Open `http://localhost:3001` in a second tab with DevTools open.
- [ ] Expected Result: No red errors in either console. Firebase initialises silently. MapView renders Surabaya map.
- **Actual Result:** _____________________________________________
- **Status:** ☐ Pass · ☐ Fail

> If any pre-flight fails: stop and resolve before proceeding. Most likely cause is missing or invalid env vars — re-read the Prerequisites section.

---

## Scenario 1 — Authentication & Configuration

This scenario verifies the API-key auth contract from the frontend's perspective.

### TC-1.1: Admin app boots with a valid API key configured

**Preconditions:** PF-1, PF-2, PF-3, PF-4 all Pass.

**Steps:**
- [ ] 1. Open `http://localhost:3000` in Chrome.
- [ ] 2. Open DevTools → Network tab → filter "health".
- [ ] 3. Wait 30 seconds.

**Expected Result:**
- [ ] A `GET /health` request is fired automatically.
- [ ] Response is HTTP 200.
- [ ] The Admin Navbar displays an "AI Engine: online" or equivalent green status badge (no red error).
- [ ] No `x-api-key` header is present on the health request (per backend contract — health is auth-free).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-1.2: Driver app boots with a valid courier identity

**Preconditions:** TC-1.1 Pass.

**Steps:**
- [ ] 1. Open `http://localhost:3001` in Chrome.
- [ ] 2. Open DevTools → Application → Local Storage → check `REACT_APP_COURIER_ID` is bundled (visible in `__vite_env__` global).
- [ ] 3. Navigate to "Profile" tab in the bottom navbar.

**Expected Result:**
- [ ] The Profile page shows the courier ID from `.env` (e.g. `courier_device_001`).
- [ ] OrdersPage renders with either an empty state ("Belum ada orderan") or active orders for this courier.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-1.3: Invalid API key surfaces an Indonesian error toast (Admin)

**Preconditions:** Admin dev server running.

**Steps:**
- [ ] 1. Stop the admin dev server (`Ctrl+C` in Terminal 1).
- [ ] 2. Edit `/home/dnm/project/pandu/frontend/.env` and change `REACT_APP_API_KEY` to `"invalid_key_for_test"`.
- [ ] 3. Restart `npm run dev` and reload the page.
- [ ] 4. Fill the Order Form: Pickup A (-7.2575, 112.7521), Dropoff A (-7.2906, 112.7331), Priority Normal.
- [ ] 5. Submit.

**Expected Result:**
- [ ] A toast notification appears in the bottom-right.
- [ ] Toast message reads `"API key tidak valid"` (or the matching Indonesian fallback `"API key tidak valid atau hilang. Periksa konfigurasi."`).
- [ ] DevTools Network tab shows `POST /orders/dispatch` returned HTTP 401 with body `{"error":{"code":"INVALID_API_KEY",…}}`.
- [ ] The form is **not** cleared (input values remain so the operator can retry after fixing the key).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

**Cleanup:**
- [ ] 6. Restore the correct API key in `.env` and restart the dev server before moving on.

### TC-1.4: Missing API key surfaces an Indonesian error toast (Driver)

**Preconditions:** Driver dev server running.

**Steps:**
- [ ] 1. Stop the driver dev server.
- [ ] 2. Edit `/home/dnm/project/pandu/frontend/driver/.env` and comment out the `REACT_APP_API_KEY` line.
- [ ] 3. Restart `npm run dev`.
- [ ] 4. Open `http://localhost:3001` → Orders tab. Tap any visible order. Try to tap "Ambil Paket" or "Mulai Antar".

**Expected Result:**
- [ ] Toast appears with message `"API key tidak ada di header x-api-key"` (or the matching fallback `"API key tidak valid atau hilang."`).
- [ ] DevTools Network tab confirms the request was sent without the header.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

**Cleanup:**
- [ ] 5. Restore the API key line in `driver/.env` and restart the dev server.

### TC-1.5: Health endpoint polling reflects backend state (3-state badge)

**Preconditions:** Admin dev server running, network stable.

**Steps:**
- [ ] 1. Open `http://localhost:3000`. Observe the Navbar `AIEngineStatus` badge.
- [ ] 2. Wait 30 seconds. Watch Network tab — `GET /health` should fire periodically.
- [ ] 3. Hover the badge — a tooltip should appear showing per-service status (e.g. `firestore: ok · gemini: ok · maps: ok`).
- [ ] 4. In a separate terminal, temporarily block the backend (or kill VPN if testing through one) to simulate downtime.

**Expected Result:**
- [ ] When all services are healthy: badge text is **"AI Engine"** with **green** styling.
- [ ] When the backend is reachable but at least one service is failing (e.g. Firestore down per `BE-001`): badge text is **"AI Degraded"** with **amber/warning** styling. Tooltip lists which service is failing.
- [ ] When the backend is unreachable entirely (timeout, network error, DNS): badge text is **"AI Offline"** with **red** styling. Tooltip reads `"Backend tidak dapat dihubungi"`.
- [ ] Restoring the connection causes the badge to return to its correct state within one polling cycle (≤30s).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

---

## Scenario 2 — End-to-End Order Lifecycle

This scenario walks an order from creation by the Dispatcher through completion by the Driver. Keep both browsers visible side-by-side.

### TC-2.1: Dispatcher creates a new order

**Preconditions:** Scenario 1 complete, both apps loaded, both DevTools Network panels open.

**Steps:**
- [ ] 1. In the Admin tab, focus the "Buat Order Baru" / Order Form panel on the left sidebar.
- [ ] 2. Fill Pickup A (-7.2575, 112.7521).
- [ ] 3. Fill Dropoff A (-7.2906, 112.7331).
- [ ] 4. Select Priority `Normal`.
- [ ] 5. Click `Submit` / `Dispatch Order`.
- [ ] 6. Start a stopwatch the moment you click Submit. _(used in TC-2.2)_

**Expected Result:**
- [ ] Submit button shows a brief loading state (spinner or disabled state) for ~0.5–2s.
- [ ] Toast `"Order dispatched"` appears in the bottom-right.
- [ ] Form fields reset to empty/defaults.
- [ ] Network tab shows `POST /orders/dispatch` with status 200.
- [ ] Response body is `{"success":true,"data":{"orderId":"…","assignedCourierId":"…","estimatedDeliveryTime":"…"}}`.
- [ ] A new marker pair (pickup + dropoff) appears on the Admin MapView with a connecting polyline.

**Actual Result:** _____________________________________________

**Created order ID:** _________________________ _(record this for downstream tests)_

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-2.2: Driver receives the new order within 2 seconds

**Preconditions:** TC-2.1 Pass, stopwatch running.

**Steps:**
- [ ] 1. Immediately switch focus to the Driver tab.
- [ ] 2. Watch the Orders list / OrdersPage.
- [ ] 3. Stop the stopwatch when the new order card appears.

**Expected Result:**
- [ ] A new order card appears in the Driver Orders list **within 2 seconds** of the Admin clicking Submit.
- [ ] Order card shows: priority badge, status `"Diterima"` (or `"assigned"`), pickup and dropoff addresses (or coordinates if reverse-geocoding is off).
- [ ] The order ID matches the one recorded in TC-2.1.

**Actual Result (with latency):** ____________ seconds — _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-2.3: Driver opens the order and views the route

**Preconditions:** TC-2.2 Pass.

**Steps:**
- [ ] 1. Tap the newly received order card.

**Expected Result:**
- [ ] OrderDetailPage opens with the order's full information.
- [ ] StatusTimeline component displays 4 steps (`Diterima` → `Diambil` → `Diantar` → `Selesai`), with `Diterima` active (highlighted with brand-primary colour and pulsing dot).
- [ ] An "Ambil Paket" or "Pickup" button is visible and tappable.
- [ ] An "Open in Maps" / "Buka di Maps" deep link is visible.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-2.4: Driver picks up the order; Dispatcher sees the status change

**Preconditions:** TC-2.3 Pass.

**Steps:**
- [ ] 1. In Driver, tap `Ambil Paket`.
- [ ] 2. Switch to Admin and click on the courier marker for this order on the MapView.

**Expected Result:**
- [ ] Driver: button shows brief loading, then toast `"Status berhasil diperbarui"` appears. StatusTimeline updates: step `Diterima` becomes a green check, step `Diambil` becomes active.
- [ ] Driver: button changes to `Mulai Antar`.
- [ ] Admin: clicking the courier marker opens an InfoWindow showing order status `picked_up` or `Diambil`.
- [ ] The status change propagates to Admin within 2 seconds of the Driver's tap.
- [ ] Network tab on Driver shows `POST /orders/{id}/status` with status 200.

**Actual Result (latency to admin):** ____________ seconds — _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-2.5: Driver starts delivery (in_transit)

**Preconditions:** TC-2.4 Pass.

**Steps:**
- [ ] 1. In Driver, tap `Mulai Antar`.

**Expected Result:**
- [ ] Status updates to `in_transit` / `Diantar`. Timeline step 3 active.
- [ ] Two new buttons appear: `Selesai` (success/green) and `Gagal` (failure/red).
- [ ] Admin MapView reflects the new status within 2 seconds.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-2.6: Driver completes the delivery; Dispatcher sees completion

**Preconditions:** TC-2.5 Pass.

**Steps:**
- [ ] 1. In Driver, tap `Selesai`.
- [ ] 2. Switch to Admin.

**Expected Result:**
- [ ] Driver: status becomes `delivered`. All four timeline steps show green checks. Buttons disable to `Pengantaran Selesai`.
- [ ] Admin: the order is either removed from active markers or moved to a "completed" pool (depending on implementation).
- [ ] No error toast appears at any point during the lifecycle.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-2.7: Cancel order from Admin (optional)

**Preconditions:** Create a new order via TC-2.1 first to avoid touching the delivered one.

**Steps:**
- [ ] 1. From Admin, locate the freshly dispatched order's cancel control. _Note: as of 2026-05-16 the Admin UI does not expose a cancel button — this test exercises the API only._
- [ ] 2. Open DevTools Console and run:
  ```js
  fetch(import.meta.env.REACT_APP_API_BASE_URL + '/orders/<ORDER_ID>/cancel', {
    method: 'POST',
    headers: { 'x-api-key': import.meta.env.REACT_APP_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'manual test' }),
  }).then(r => r.json()).then(console.log)
  ```
- [ ] 3. Replace `<ORDER_ID>` with the order ID from TC-2.1.

**Expected Result:**
- [ ] Console logs `{ success: true, data: { orderId, status: "cancelled", … } }`.
- [ ] Driver OrderDetailPage updates within 2 seconds to show a cancelled state (red banner or removed from active list).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked · ☐ Skipped (no UI yet)

---

## Scenario 3 — Real-Time Synchronisation

This scenario stress-tests the Firestore `onSnapshot` pipeline and the live-location broadcast.

### TC-3.1: End-to-end latency measurement (3 trials)

**Preconditions:** Both apps loaded, network stable, devtools open.

**Steps:**
- [ ] 1. From Admin, dispatch an order (Pickup A → Dropoff A). Start a stopwatch on Submit. Stop when the order appears in Driver. Record time.
- [ ] 2. Repeat 2 more times with Pickup B / Dropoff B and Pickup A / Dropoff B.

**Expected Result:**
- [ ] All three trials show latency **< 2 seconds**.
- [ ] No trial exceeds 5 seconds (hard ceiling).
- [ ] Average across the three trials is < 1.5 seconds.

**Actual Result:**
| Trial | Latency (s) |
|-------|-------------|
| 1 | _______ |
| 2 | _______ |
| 3 | _______ |
| **Avg** | _______ |

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-3.2: Driver live location broadcast

**Preconditions:** Driver Orders has at least one active order. Browser has granted geolocation permission (or use DevTools → Sensors → Override Location to feed a fixed lat/lng).

**Steps:**
- [ ] 1. In Driver, navigate to the Profile or Route page where the `LiveLocationToggle` is exposed.
- [ ] 2. Toggle live location ON.
- [ ] 3. Open Driver DevTools → Network → filter "location" → observe.
- [ ] 4. Watch for at least 60 seconds.

**Expected Result:**
- [ ] A `POST /driver/location` fires approximately every 15 seconds (≈4 calls in 60 s, ±1).
- [ ] Each request body contains `{courierId, lat, lng, timestamp}`.
- [ ] Each response is HTTP 200.
- [ ] On the Admin MapView, the courier marker updates position to match the most recent broadcast within 2 seconds of each POST.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-3.3: Multi-tab Admin sync

**Preconditions:** TC-2.1 Pass.

**Steps:**
- [ ] 1. Open a second Admin tab at `http://localhost:3000`.
- [ ] 2. Dispatch a new order from Admin tab 1.
- [ ] 3. Switch to Admin tab 2 without manually refreshing.

**Expected Result:**
- [ ] The new order's marker pair and polyline appear in Admin tab 2 within 2 seconds.
- [ ] Both tabs remain in sync as further status updates are made.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-3.4: Driver offline → online queue flush

**Preconditions:** Driver dev server running, at least one order in `assigned` or `picked_up` state.

**Steps:**
- [ ] 1. Open Driver DevTools → Network → set throttling to `Offline`.
- [ ] 2. In Driver, tap `Mulai Antar` (transition to `in_transit`).
- [ ] 3. Observe: a toast should appear indicating the update is queued for retry. _(Expected toast text in Indonesian: `"Status akan diperbarui saat koneksi kembali"` or equivalent.)_
- [ ] 4. After 10 seconds, set Network throttling back to `Online` (or `No throttling`).
- [ ] 5. Wait up to 10 seconds.

**Expected Result:**
- [ ] When offline, the `POST /status` request fails and a queue toast appears (not a generic error toast).
- [ ] When network returns, a fresh `POST /status` fires automatically.
- [ ] Response is HTTP 200.
- [ ] Toast updates to a success notification.
- [ ] The Admin UI reflects the status change within 2 seconds of the queued request flushing.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-3.5: Page refresh preserves state via Firestore re-sync

**Preconditions:** Multiple active orders in flight, both apps open.

**Steps:**
- [ ] 1. In Admin, hard refresh the page (`Ctrl+Shift+R`).
- [ ] 2. In Driver, hard refresh the page.

**Expected Result:**
- [ ] All previously visible markers, courier positions, and order cards reappear within 3 seconds after each refresh.
- [ ] No "404 / order not found" errors. No console errors related to missing data.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

---

## Scenario 4 — Error Handling & Resilience

### TC-4.1: Admin Order Form rejects empty submission

**Steps:**
- [ ] 1. In Admin, open the Order Form. Leave all fields empty.
- [ ] 2. Click `Submit`.

**Expected Result:**
- [ ] Inline error messages appear under each required field (zod validation).
- [ ] No network request is made (verify in Network tab — filter "dispatch", count 0).
- [ ] Submit button does not show a loading state.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-4.2: Order Form rejects out-of-range coordinates

**Steps:**
- [ ] 1. Fill Pickup lat = `999`, Pickup lng = `999`. Leave Dropoff valid.
- [ ] 2. Click `Submit`.

**Expected Result:**
- [ ] Inline error under the pickup fields indicating lat/lng range (e.g. `"Latitude harus antara -90 dan 90"`).
- [ ] No network request is fired.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-4.3: Network drop during order dispatch

**Steps:**
- [ ] 1. Fill the form with Pickup A and Dropoff A. Do **not** submit yet.
- [ ] 2. Open DevTools → Network → set throttling to `Offline`.
- [ ] 3. Click Submit.
- [ ] 4. Within 8 seconds, set throttling back to `Online`.

**Expected Result:**
- [ ] First click: a generic offline error toast appears (the admin does not have a retry queue — driver does).
- [ ] The form fields remain populated (the operator should not lose their input).
- [ ] After bringing network back, a manual re-submit succeeds normally.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-4.4: Driver report form rejects oversized photo

**Steps:**
- [ ] 1. In Driver, navigate to Report tab.
- [ ] 2. Attempt to upload a photo larger than 5 MB (use any large JPEG; create one with `dd if=/dev/urandom of=big.jpg bs=1M count=6` if needed — note the file will not be a valid image but the client-side size check should still trigger).

**Expected Result:**
- [ ] Toast or inline error: `"Ukuran foto maks 5MB"` (or equivalent Indonesian message).
- [ ] No upload network request is fired.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-4.5: Driver report form requires obstacle type

**Steps:**
- [ ] 1. In Driver Report tab, fill description but leave the obstacle Type dropdown empty. Tap Submit.

**Expected Result:**
- [ ] Inline error: `"Pilih jenis rintangan"` or equivalent.
- [ ] No network request fired.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-4.6: Backend 5xx surfaces a graceful error

**Steps:**
- [ ] 1. Temporarily edit `.env` and change `REACT_APP_API_BASE_URL` to a known-bad URL such as `https://this-domain-does-not-exist-1234567.example.com/api/v1`.
- [ ] 2. Restart the dev server and reload.
- [ ] 3. Submit an order via Admin Order Form.

**Expected Result:**
- [ ] After ~8 seconds (axios timeout), a toast appears: `"Server bermasalah. Coba lagi sebentar lagi."` or `"Terjadi kesalahan. Silakan coba lagi."`.
- [ ] The UI does not freeze or crash.
- [ ] Form fields remain populated.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

**Cleanup:**
- [ ] 4. Restore the correct `REACT_APP_API_BASE_URL` and restart the dev server.

### TC-4.7: Rate-limit handling (deferred — see `BE-006`)

**Status:** ☐ Skipped (deferred to backend team — see `docs/backend/BACKEND_FIX_REQUESTS.md` `BE-006`).

---

## Scenario 5 — Responsive Layout & UX (Bonus)

Quick visual regression checks for demo readiness.

### TC-5.1: Admin layout adapts across breakpoints

**Steps:**
- [ ] 1. Open `http://localhost:3000` in Chrome. Open DevTools (F12).
- [ ] 2. Toggle Device Toolbar (`Ctrl+Shift+M`).
- [ ] 3. Test viewports: `375×667` (iPhone SE), `768×1024` (iPad), `1280×800` (laptop), `1920×1080` (desktop).

**Expected Result:**
- [ ] At ≥1024 px width: layout shows a 2-column grid `[320px sidebar | 1fr map]`. Order Form sidebar inline on the left.
- [ ] At <1024 px: sidebar collapses; a floating drawer trigger button (hamburger or `PanelLeftOpen` icon) appears at top-left of the map.
- [ ] Drawer slides in from the left, takes ~85% of viewport width, can be dismissed.
- [ ] CourierSimulatorButton remains visible and accessible at bottom-right of the map across all breakpoints.

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-5.2: CourierSimulatorButton routes vs modals correctly

**Steps:**
- [ ] 1. At viewport 1280×800: tap CourierSimulatorButton.
- [ ] 2. Close it. Switch viewport to 375×667 and tap it again.

**Expected Result:**
- [ ] Desktop: a centred dialog/modal opens with the Simulator form inside.
- [ ] Mobile: the URL changes to `/simulator` and a full-screen SimulatorPage opens (no dialog).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-5.3: Driver touch targets meet 44px minimum

**Steps:**
- [ ] 1. Open Driver at 375×667 viewport.
- [ ] 2. Use DevTools → Inspect to measure the height of the bottom navbar buttons, `Ambil Paket`, `Mulai Antar`, `Selesai`, and the Report submit button.

**Expected Result:**
- [ ] Every interactive button has computed `height` ≥ 44 px (or has padding bringing the click area to ≥ 44px).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

### TC-5.4: Driver bottom navbar is fixed and reachable

**Steps:**
- [ ] 1. In Driver at 375×667, scroll the OrdersPage to the bottom.

**Expected Result:**
- [ ] Bottom navbar remains pinned at the bottom of the viewport throughout scrolling.
- [ ] All 4 tabs (Orders / Route / Report / Profile) are accessible.
- [ ] No content is obscured under the navbar (content scroll area accounts for navbar height via `padding-bottom`).

**Actual Result:** _____________________________________________

**Status:** ☐ Pass · ☐ Fail · ☐ Blocked

---

## Test Session Log

Fill in once per test session. Cross-reference any failures to bug IDs.

| Date | Tester | Build / Commit | Pass | Fail | Blocked | Skipped | Notes |
|------|--------|----------------|:----:|:----:|:-------:|:-------:|-------|
| _yyyy-mm-dd_ | _name_ | _commit sha_ | _n_ | _n_ | _n_ | _n_ | e.g. "Blocked on BE-001, BE-002" |

### Defects Discovered

| Test Case ID | Severity (Blocker/Critical/Major/Minor) | Description | Suspected File / Component | Backend Bug ID (if applicable) |
|--------------|:--------------------------------------:|-------------|----------------------------|:------------------------------:|
| | | | | |

### Sign-Off

| Role | Name | Date | Verdict |
|------|------|------|---------|
| QA Lead | | | ☐ Approve · ☐ Reject |
| Frontend Lead | | | ☐ Approve · ☐ Reject |
| Backend Lead | | | ☐ Approve · ☐ Reject |
| Product / Demo Owner | | | ☐ Approve · ☐ Reject |

---

## Appendix A — Common Failures & Quick Fixes

| Symptom | Likely Cause | Quick Check | Fix |
|---------|--------------|-------------|-----|
| Toast "API key tidak valid" on every action | Wrong or rotated key | Run `curl -H "x-api-key: $KEY" …/orders?courierId=test` | Re-obtain key, update `.env`, restart dev server |
| Map shows "Peta tidak tersedia" placeholder | Missing or restricted Google Maps key | Inspect Network for blocked `maps.googleapis.com` requests | Set `REACT_APP_GOOGLE_MAPS_API_KEY` with billing enabled, allow `localhost`/`*.web.app` in key restrictions |
| Driver shows no orders despite admin dispatch | Firestore not initialised on client | Console error mentioning `Firebase: project not found` | Populate all `REACT_APP_FIREBASE_*` keys, ensure `PROJECT_ID` matches backend |
| Admin AI status badge red | `/health` returning non-2xx | `curl …/health` | If Firestore failing → escalate `BE-001`. If 401 → check `/health` shouldn't need auth, verify backend bug |
| Order appears in Admin but not in Driver | Driver `COURIER_ID` mismatch with backend assignment | Console → check `REACT_APP_COURIER_ID` and assigned `courierId` in dispatch response | Set `REACT_APP_COURIER_ID` to match the courier seeded by backend |
| Latency >5s consistently | Firestore region or network issue | DevTools Network → Firebase listener metadata | Test from same region as Cloud Run (`asia-southeast2`); check VPN / corporate proxy |
| Submit button stays loading forever | Backend timeout (no response) | Network tab: pending request | Hard refresh; check backend `/health`; raise issue with backend team |

## Appendix B — Useful DevTools Tricks

- **Override geolocation for Driver:** DevTools → `…` menu → More tools → Sensors → Location → choose preset or enter custom lat/lng. Lets you simulate movement without leaving your desk.
- **Throttle network:** DevTools → Network → Throttling dropdown → Offline / Slow 3G / Fast 3G. Useful for Scenario 4.
- **Persist log:** DevTools → Network → check "Preserve log". Survives page refresh.
- **Filter Firestore traffic:** Network → filter `firestore.googleapis.com` to see snapshot listener stream.
- **Mobile emulation:** `Ctrl+Shift+M` toggles device toolbar. Use "Responsive" mode and drag edges for custom sizes.

## Appendix C — One-Liner Smoke Test (≤ 5 minutes)

When you have very little time before a demo, run only these tests:

1. **PF-1, PF-2, PF-4** — Pre-flight (5 minutes)
2. **TC-2.1, TC-2.2, TC-2.4, TC-2.6** — Order lifecycle (5 minutes)
3. **TC-3.1** — Latency (2 minutes, single trial only)
4. **TC-4.1** — Empty form rejection (1 minute)

If all of the above pass: green-light for demo. Otherwise: stop and escalate.
