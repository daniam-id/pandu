// Tujuan    : Toggle switch for live GPS location sharing with status indicator
// Caller    : ProfilePage
// Dependensi: useLiveLocation hook, lucide-react (Radio)
// Main Func : Renders toggle with pulse animation, last update time, permission warning
// Side Effects: Starts/stops navigator.geolocation.watchPosition + API POST interval

import { Radio } from 'lucide-react';
import { useLiveLocation } from '@/hooks/useLiveLocation';

export default function LiveLocationToggle() {
  const { isActive, lastUpdate, error, start, stop } = useLiveLocation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={18} className={isActive ? 'text-brand-accent' : 'text-text-faint'} />
          <span className="text-sm font-medium text-text-primary">Bagikan Lokasi</span>
        </div>

        <button
          onClick={isActive ? stop : start}
          className={[
            'relative w-12 h-7 rounded-full transition-colors duration-200',
            isActive ? 'bg-brand-accent' : 'bg-surface-offset',
          ].join(' ')}
          aria-label={isActive ? 'Matikan lokasi' : 'Aktifkan lokasi'}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200',
              isActive ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-full animate-ping bg-brand-accent/30" />
            )}
          </span>
        </button>
      </div>

      {isActive && lastUpdate && (
        <p className="text-xs text-text-muted">
          Lokasi aktif · Terakhir: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {!isActive && !error && (
        <p className="text-xs text-text-faint">Lokasi tidak dibagikan ke dispatcher</p>
      )}

      {error && (
        <div className="bg-red-50 rounded-md p-3 text-xs text-status-error">
          <p className="font-medium">{error}</p>
          <p className="mt-1 text-text-muted">
            Aktifkan izin lokasi di Pengaturan perangkat Anda
          </p>
        </div>
      )}
    </div>
  );
}
