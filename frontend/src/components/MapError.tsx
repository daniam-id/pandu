import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Error fallback when Google Maps fails to load (invalid key, network error, etc.).
 * Provides a retry CTA so the user can attempt reload without refreshing the page.
 */
export function MapError({ message, onRetry }: MapErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full min-h-[400px] rounded-lg bg-surface border border-border p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-status-error/10">
        <AlertTriangle className="w-7 h-7 text-status-error" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-text-primary">Peta tidak dapat dimuat</h3>
        <p className="text-sm text-text-muted max-w-xs">
          {message ?? 'Gagal memuat Google Maps. Periksa koneksi internet atau API key.'}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} className="gap-2">
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
