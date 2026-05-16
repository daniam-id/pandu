import { UserX } from 'lucide-react';

/**
 * Empty state when no couriers are available in Firestore.
 */
export function CourierListEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-offset">
        <UserX className="w-5 h-5 text-text-muted" aria-hidden="true" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-text-muted">Tidak ada kurir aktif</p>
        <p className="text-xs text-text-faint">
          Data kurir akan muncul saat backend mulai mengirim data.
        </p>
      </div>
    </div>
  );
}
