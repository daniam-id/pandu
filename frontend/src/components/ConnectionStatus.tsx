import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Live Firestore connectivity badge.
 *
 * Uses `navigator.onLine` as the primary signal. In a production app
 * this could be augmented with a hidden Firestore `.info/connected`
 * listener or snapshot-metadata `fromCache` checks.
 */
export function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <Badge
      variant="outline"
      className={
        online
          ? 'border-brand-accent/40 text-brand-accent bg-brand-primary-hover'
          : 'border-status-error/40 text-status-error bg-status-error/10'
      }
    >
      <Radio className="w-3 h-3" aria-hidden="true" />
      <span className="hidden sm:inline">{online ? 'Firestore' : 'Offline'}</span>
    </Badge>
  );
}
