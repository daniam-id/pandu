// Tujuan    : React Query client placeholder (intentionally skipped per research decision)
// Caller    : N/A — not used in this project
// Dependensi: None
// Main Func : Document decision to skip React Query
// Side Effects: None

// Decision: React Query is intentionally NOT used in this project.
// Rationale:
// - Only ~5 API endpoints (status update, obstacle report, location post, route fetch)
// - Most data comes from Firestore onSnapshot (real-time, not request/response)
// - React Query adds ~30KB bundle size with minimal benefit for this scale
// - Manual loading/error states with Axios + Sonner toast are sufficient
// If caching needs grow, React Query can be added later without breaking changes.
