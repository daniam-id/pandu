// Tujuan    : Root app component with routing, error boundary, toast, and connection status
// Caller    : main.tsx (React root mount)
// Dependensi: react-router-dom (RouterProvider), sonner (Toaster), ErrorBoundary, ConnectionStatus, router
// Main Func : Wraps app shell with error boundary, renders router, shows global toasts + offline banner
// Side Effects: None (client-side only)

import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import ConnectionStatus from '@/components/ConnectionStatus';
import { router } from './routes';

export default function App() {
  return (
    <ErrorBoundary>
      <div className="h-full max-w-md mx-auto relative bg-white shadow-lg">
        <ConnectionStatus />
        <RouterProvider router={router} />
        <Toaster position="bottom-center" />
      </div>
    </ErrorBoundary>
  );
}
