# AGENTS.md — Frontend (Pandu.ai Dispatcher Dashboard)

> A dedicated configuration file for AI coding agents working on this frontend codebase.

---

## Project Context

- **Product:** Pandu.ai — Real-time AI Dispatcher Dashboard
- **Stack:** React.js, Tailwind CSS, Google Maps API, Firebase Client SDK
- **Scope:** Web frontend only. All AI logic and routing lives in the backend.
- **Status:** Pre-code (specification phase). No application code exists yet.

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

- **Components:** Functional components with hooks. No class components.
- **Naming:** PascalCase for components (`MapView.jsx`), camelCase for hooks (`useCouriers.js`), camelCase for utilities.
- **Hooks:** Custom hooks in `src/hooks/`. Firestore listeners must clean up in `useEffect` return.
- **Services:** Firebase init in `src/services/firebase.js`. API client in `src/services/api.js`.
- **Styling:** Tailwind utility classes. Custom CSS only in `src/styles/index.css` with `@layer` directives.
- **File structure:** Follow the layout defined in `technical_overview.md` Section 1C.

## Scope Boundaries

### In Scope
- UI layout (three-panel + navbar + floating modal)
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
