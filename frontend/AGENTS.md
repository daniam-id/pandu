# AGENTS.md — Frontend (Pandu.ai Dispatcher Dashboard)

> A dedicated configuration file for AI coding agents working on this frontend codebase.

---

## Project Context

- **Product:** Pandu.ai — Real-time AI Dispatcher Dashboard
- **Stack:** React.js, Tailwind CSS, Google Maps API, Firebase Client SDK
- **Scope:** Web frontend only. All AI logic and routing lives in the backend.
- **Status:** Production-ready — 10 build cycles complete + driver app fully implemented. Dual-frontend architecture: Admin Dashboard (`src/`) + Driver Mobile App (`driver/`). `npm run build` ✅, `npm run typecheck` ✅, Firebase Hosting config ready.

## Essential Files

Before making any change, **always read these 3 files first:**

| File | Purpose |
|------|---------|
| `technical_overview.md` | Architecture, components, data flow, runtime behavior |
| `AGENTS.md` | This file — rules, commands, conventions |
| `PROGRESS.md` | Development history, completed work, current status |

Also reference:
- `DESIGN.md` — Color tokens, typography, spacing, component specs
- `PRD.MD` — Product requirements and scope boundaries
- `USER_FLOW_WIREFRAME.md` — User flows, wireframe layout, Tailwind class guide

## Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Production build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Lint
npx eslint src/

# Format
npx prettier --write src/
```

## Architecture Rules

1. **No AI logic on the client.** All cognitive processing happens on the backend via Gemini.
2. **No direct Firestore writes.** The frontend reads via `onSnapshot`; writes go through REST API to the backend.
3. **React state drives the UI.** Firestore listeners → React state → component re-renders.
4. **Environment variables** must use the `REACT_APP_` prefix. See `.env.example` for the full list.
5. **Design system compliance.** Use tokens from `DESIGN.md` — do not introduce ad-hoc colors, fonts, or spacing.

## Code Conventions

- **Components:** Functional components with hooks (preferred). `ErrorBoundary.tsx` uses a class component — React requires it for error boundary lifecycle methods.
- **Naming:** PascalCase for components (`MapView.tsx`), camelCase for hooks (`useCouriers.ts`), camelCase for utilities.
- **Hooks:** Custom hooks in `src/hooks/`. Firestore listeners must clean up in `useEffect` return.
- **Services:** Firebase init in `src/services/firebase.ts`. API client in `src/services/api.ts`.
- **Styling:** Tailwind utility classes. Custom CSS only in `src/styles/index.css` with `@layer` directives.
- **File structure:** Follow the layout defined in `technical_overview.md` Section 1C.

## Scope Boundaries

### In Scope
- UI layout (two-panel + navbar + floating modal)
- Real-time data rendering from Firestore
- REST API calls to backend endpoints
- Google Maps integration (markers, polylines)
- Responsive layout (mobile 320px → desktop 1024px+)

### Out of Scope
- Route calculations or optimization logic
- Direct Gemini API calls
- User authentication (hackathon — no auth required)
- Multi-order batching algorithms

## Testing Expectations

- Verify `npm run build` succeeds with zero errors before committing.
- Confirm all Firestore listeners attach/detach correctly (no memory leaks).
- Validate REST API calls handle error responses gracefully.

---

## Critical Rules

- ✅ **ALWAYS consult all 3 files before work** (`technical_overview.md`, `AGENTS.md`, `PROGRESS.md`)
- ✅ **MUST update PROGRESS.md before commits**
- ✅ **Maintain consistency with patterns** defined in this file and `technical_overview.md`
- ✅ **Document significant changes** in `PROGRESS.md` with timestamps and descriptions

---
# NAVIGATION & CONTEXT RULES

## Mandatory Map Check
Setiap awal sesi baru, WAJIB baca `SYSTEM_MAP.md` di root sebagai kompas utama
arsitektur, tech stack, dan lokasi fungsi kunci. DILARANG melakukan blind scan.

## Fallback Map
Jika `SYSTEM_MAP.md` belum ada atau diduga usang terhadap kondisi kode saat ini,
buat/perbarui dulu secara ringkas sebelum analisis dimulai.

## Trace-by-Function / Trace-by-Flow
Gunakan SYSTEM_MAP.md untuk menentukan titik mulai, lalu telusuri alur berurutan:
Trigger/Entry Point → Handler/Controller → Business Logic/Service → Data Access/Repository → Database/Storage

## Universal Layer Mapping
Jika istilah Controller/Service/Repo tidak dipakai, map ke padanan terdekat
(Handler, Usecase, Domain, Adapter, DAO, dll) tanpa memaksa nama layer.

## Efisiensi
Jangan gunakan `rg` untuk explorasi. Gunakan SYSTEM_MAP.md + Header Doc
untuk langsung ke target file dan fungsi.

## Universal Exclusions
Selalu abaikan folder berikut tanpa pengecualian:
node_modules, .venv, venv, env, vendor, target, .gradle, bin, obj, pkg,
.git, .vscode, .idea, __pycache__, dist, build, tmp, coverage, .next, .nuxt, .cache

## Super Efisien
- Minim command, minim file read.
- File >500 baris: baca per blok fungsi/class terkait, BUKAN full file kecuali diminta user.

## Pre-Edit Trace Note
Sebelum edit file apapun, tulis singkat (1–2 kalimat):
file target + alur fungsi yang akan disentuh.

## Persetujuan Inisiatif
Jika ada perubahan di luar request user, wajib minta izin sebelum eksekusi.

## Modularitas
Pecah logika ke modul/file kecil sesuai tanggung jawab (Single Responsibility).
Jangan tumpuk banyak logic dalam satu file.

---
# DOKUMENTASI (WAJIB)

## Header Doc
Setiap file yang dibuat/diubah WAJIB punya header doc di paling atas file
(sesuai gaya komentar bahasa: //, #, ', /* */).

Isi minimal Header Doc:
- Tujuan    : tujuan file/module
- Caller    : pemanggil/pengguna utama
- Dependensi: service/repo/API utama
- Main Func : fungsi/class public/utama
- Side Effects: DB read/write, HTTP call, file I/O

## Synchronized Documentation
Setiap perubahan logic WAJIB diikuti update Header Doc agar tetap akurat.

## Synchronized Map Update
Jika menambah/menghapus file atau mengubah flow fungsi utama yang tercatat,
WAJIB update SYSTEM_MAP.md pada bagian terkait di sesi yang sama.

## Larangan
Dilarang menambah/mengubah logic tanpa menyesuaikan Header Doc.

---
# STANDAR DATABASE & QUERY (WAJIB)

- Rancang query dengan prinsip minimum I/O, minimum cost, minimum lock contention.
- Selalu evaluasi: cardinality/selectivity, pemakaian index, join order & strategy,
  dampak CPU/memory/disk/network.
- Hindari: proses berulang, temp table tidak perlu, write berlapis, N+1 query.
- Pilih strategi sesuai konteks: upsert, merge, batch, incremental, query rewrite.
- Sebelum finalize perubahan DB-heavy, jelaskan singkat alasan efisiensi,
  trade-off, dan risiko performa yang dihindari.
---
