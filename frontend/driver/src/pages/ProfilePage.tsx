// Tujuan    : Courier profile with live location toggle and app info
// Caller    : routes.tsx (/profile)
// Dependensi: useDriverProfile, LiveLocationToggle
// Main Func : Renders courier info card + location sharing toggle
// Side Effects: Firestore onSnapshot (via useDriverProfile)

import { User, Smartphone, Package } from 'lucide-react';
import { useDriverProfile } from '@/hooks/useDriverProfile';
import LiveLocationToggle from '@/components/LiveLocationToggle';

export default function ProfilePage() {
  const { data: courier, loading } = useDriverProfile();

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border h-12 flex items-center px-4">
        <h1 className="text-lg font-semibold text-text-primary">Profil</h1>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="h-32 bg-surface rounded-lg animate-pulse" />
        ) : courier ? (
          <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <User size={24} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">{courier.name}</h2>
                <p className="text-sm text-text-muted">{courier.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Package size={16} />
              <span>{courier.assignedOrders.length} orderan aktif</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">Profil tidak ditemukan</div>
        )}

        {/* Live Location Toggle */}
        <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
          <LiveLocationToggle />
        </div>

        {/* App version */}
        <div className="flex items-center gap-2 text-xs text-text-faint pt-4">
          <Smartphone size={14} />
          <span>Pandu Driver v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
