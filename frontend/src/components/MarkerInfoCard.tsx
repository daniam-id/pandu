import { User, Navigation, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Courier } from '@/types/domain';

interface MarkerInfoCardProps {
  courier: Courier;
}

/**
 * Content rendered inside an InfoWindow when a courier marker is clicked.
 * Compact, readable, and accessible.
 */
export function MarkerInfoCard({ courier }: MarkerInfoCardProps) {
  const statusColor: Record<Courier['status'], string> = {
    idle: 'bg-text-muted text-white',
    delivering: 'bg-brand-primary text-white',
    rerouted: 'bg-status-warning text-white',
  };

  return (
    <div className="min-w-[180px] p-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-brand-primary" aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary leading-tight">
            {courier.name}
          </h4>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <Badge className={`text-[10px] px-1.5 py-0.5 ${statusColor[courier.status]}`}>
          {courier.status}
        </Badge>
      </div>

      {courier.assignedOrderIds && courier.assignedOrderIds.length > 0 && (
        <div className="flex items-start gap-1.5 text-xs text-text-muted">
          <Navigation className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{courier.assignedOrderIds.length} order(s) assigned</span>
        </div>
      )}

      {courier.lastUpdated && (
        <div className="flex items-center gap-1.5 text-[10px] text-text-faint mt-1.5">
          <Clock className="w-3 h-3" aria-hidden="true" />
          <span>Updated {courier.lastUpdated.toDate().toLocaleTimeString('id-ID')}</span>
        </div>
      )}
    </div>
  );
}
