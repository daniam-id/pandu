import { Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Courier } from '@/types/domain';

interface CourierCardProps {
  courier: Courier;
}

const statusConfig: Record<
  Courier['status'],
  { variant: 'default' | 'secondary' | 'accent' | 'warning'; label: string }
> = {
  idle: { variant: 'secondary', label: 'Idle' },
  delivering: { variant: 'accent', label: 'Delivering' },
  rerouted: { variant: 'warning', label: 'Rerouted' },
};

/**
 * Single courier item card.
 * Shows initials avatar, name, status badge, and assigned order count.
 */
export function CourierCard({ courier }: CourierCardProps) {
  const { variant, label } = statusConfig[courier.status] ?? statusConfig.idle;
  const initials = courier.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-3 rounded-sm border border-border bg-white hover:bg-surface/60 transition-colors">
      {/* Avatar */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center">
        <span className="text-xs font-semibold text-brand-primary">{initials}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {courier.name}
          </span>
          <Badge variant={variant} className="text-[10px] px-1.5 py-0">
            {label}
          </Badge>
        </div>

        {courier.assignedOrderIds && courier.assignedOrderIds.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-text-muted">
            <Navigation className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{courier.assignedOrderIds.length} order(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}
