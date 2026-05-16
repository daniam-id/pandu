// Tujuan    : Vertical timeline showing order status progression
// Caller    : OrderDetailPage
// Dependensi: lucide-react (Check), domain types (OrderStatus)
// Main Func : Renders 4-step timeline: Diterima -> Diambil -> Dalam Perjalanan -> Selesai
// Side Effects: None

import { Check } from 'lucide-react';
import type { OrderStatus } from '@/types/domain';

const steps: { key: OrderStatus; label: string }[] = [
  { key: 'assigned', label: 'Diterima' },
  { key: 'picked_up', label: 'Diambil' },
  { key: 'in_transit', label: 'Dalam Perjalanan' },
  { key: 'delivered', label: 'Selesai' },
];

interface StatusTimelineProps {
  status: OrderStatus;
}

export default function StatusTimeline({ status }: StatusTimelineProps) {
  const currentIndex = steps.findIndex((s) => s.key === status);
  const isFailed = status === 'failed';

  if (isFailed) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-100">
        <p className="text-sm font-medium text-status-error">Pengantaran Gagal</p>
        <p className="text-xs text-text-muted mt-1">Order ini telah ditandai gagal</p>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between px-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={[
                  'absolute top-3 left-1/2 w-full h-0.5',
                  index < currentIndex ? 'bg-brand-accent' : 'bg-surface-offset',
                ].join(' ')}
              />
            )}

            {/* Circle */}
            <div
              className={[
                'relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2',
                isCompleted
                  ? 'bg-brand-accent border-brand-accent'
                  : isCurrent
                    ? 'bg-brand-primary border-brand-primary animate-pulse'
                    : 'bg-white border-surface-offset',
              ].join(' ')}
            >
              {isCompleted && <Check size={14} className="text-white" />}
              {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>

            {/* Label */}
            <span
              className={[
                'mt-2 text-[10px] font-medium text-center leading-tight',
                isCurrent ? 'text-brand-primary' : isFuture ? 'text-text-faint' : 'text-text-muted',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
