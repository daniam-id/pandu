import { MapIcon } from 'lucide-react';

/**
 * Loading placeholder shown while the Google Maps JS API loads.
 * Mimics the map container shape with a subtle pulse.
 */
export function MapSkeleton() {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg bg-map-land overflow-hidden animate-pulse">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-primary/10">
          <MapIcon className="w-7 h-7 text-brand-primary/60" aria-hidden="true" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-4 w-32 bg-surface-offset rounded mx-auto" />
          <div className="h-3 w-48 bg-surface-offset/70 rounded mx-auto" />
        </div>
      </div>
      {/* Decorative grid lines to suggest a map */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage:
            'linear-gradient(to right, #d4d7dc 1px, transparent 1px), linear-gradient(to bottom, #d4d7dc 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>
    </div>
  );
}
