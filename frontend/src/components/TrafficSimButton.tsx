// Tujuan    : One-click traffic simulation trigger for hackathon demo scenarios 2 & 3
// Caller    : Navbar (always visible)
// Dependensi: services/api.ts (simulateTraffic), sonner (toast), lucide-react (Car, Loader2)
// Main Func : Button that calls POST /simulation/traffic; shows loading + toast feedback
// Side Effects: HTTP POST to backend (injects anomaly → AI reroutes → Firestore writes → UI updates)

import { useState } from 'react';
import { Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { simulateTraffic } from '@/services/api';

export function TrafficSimButton() {
  const [submitting, setSubmitting] = useState(false);

  const handleSimulate = async () => {
    setSubmitting(true);
    try {
      await simulateTraffic();
      toast.success('Traffic anomaly injected — AI is rerouting');
    } catch (err) {
      // Error toast is shown by the axios response interceptor in `src/services/api.ts`.
      // eslint-disable-next-line no-console
      console.error('Traffic simulation failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSimulate}
      disabled={submitting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 transition-colors disabled:opacity-50"
      aria-label="Simulate traffic anomaly"
      title="Inject traffic congestion (demo scenarios 2 & 3)"
    >
      {submitting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Car className="w-3.5 h-3.5" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">Simulate Traffic</span>
    </button>
  );
}
