import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/services/queryClient';
import { Routes } from '@/routes';

/**
 * Root app component.
 *
 * Hierarchy (outer → inner):
 * 1. ErrorBoundary — catches render crashes anywhere in the tree.
 * 2. QueryClientProvider — gives all descendants access to React Query cache.
 * 3. Routes — React Router route tree (BrowserRouter inside).
 * 4. Toaster — global sonner toast stack.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Routes />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
