import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client with sensible defaults for the dashboard.
 *
 * - `retry: 1`      — one automatic retry to smooth transient blips
 * - `staleTime: 30s` — cache stays fresh for 30s to reduce re-fetch churn
 * - `mutations.retry: 1` — mirror the same retry policy for mutations
 *
 * Note: error toasts for backend failures are handled centrally by the
 * axios response interceptor in `src/services/api.ts`. A global mutation
 * `onError` handler here would cause duplicate toasts, so it is omitted.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
