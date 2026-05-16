// Tujuan    : Functional error boundary wrapper using react-error-boundary
// Caller    : App.tsx (wraps routes)
// Dependensi: react-error-boundary (ErrorBoundary component), lucide-react (AlertTriangle)
// Main Func : Catches rendering errors and shows fallback UI with reload action
// Side Effects: None (client-side only)

import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <AlertTriangle size={48} className="text-status-error mb-4" />
      <h1 className="text-xl font-semibold text-text-primary mb-2">Terjadi kesalahan</h1>
      <p className="text-sm text-text-muted mb-6">
        {error.message || 'Aplikasi mengalami masalah. Coba muat ulang.'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-3 bg-brand-primary text-white rounded-full font-medium min-h-[44px]"
      >
        Muat Ulang
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
