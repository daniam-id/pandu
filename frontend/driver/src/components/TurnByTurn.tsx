// Tujuan    : Turn-by-turn instruction list for route navigation
// Caller    : RoutePage
// Dependensi: api.fetchRoute, types/domain (RouteStep), lucide-react (ArrowLeft, ArrowRight, ArrowUp, Undo2)
// Main Func : Renders scrollable list of navigation steps with icons and distances
// Side Effects: HTTP GET /api/v1/routes/:orderId on mount

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Undo2, Navigation } from 'lucide-react';
import { fetchRoute } from '@/services/api';
import { formatDistance } from '@/utils/formatDistance';
import type { RouteStep } from '@/types/domain';

interface TurnByTurnProps {
  orderId: string;
}

const maneuverIcon = (maneuver?: string) => {
  switch (maneuver) {
    case 'turn-left':
      return <ArrowLeft size={18} className="text-brand-primary" />;
    case 'turn-right':
      return <ArrowRight size={18} className="text-brand-primary" />;
    case 'u-turn':
      return <Undo2 size={18} className="text-brand-primary" />;
    default:
      return <ArrowUp size={18} className="text-brand-primary" />;
  }
};

export default function TurnByTurn({ orderId }: TurnByTurnProps) {
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoute(orderId)
      .then((data) => {
        setSteps(data.steps || []);
      })
      .catch(() => {
        setSteps([]);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="space-y-3 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Navigation size={32} className="text-text-faint mb-2" />
        <p className="text-sm text-text-muted">Instruksi rute tidak tersedia</p>
        <p className="text-xs text-text-faint mt-1">Gunakan Google Maps untuk navigasi</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {steps.map((step, index) => (
        <div
          key={index}
          className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-surface transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">{maneuverIcon(step.maneuver)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary leading-snug">{step.instruction}</p>
            <p className="text-xs text-text-faint mt-0.5">{formatDistance(step.distance)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
