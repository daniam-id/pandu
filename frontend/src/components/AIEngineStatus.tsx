import { useQuery } from '@tanstack/react-query';
import { Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { checkHealth, type HealthSnapshot } from '@/services/api';

/**
 * Backend AI engine health badge.
 *
 * Polls the backend `/health` endpoint every 30 seconds.
 * Renders one of three states:
 *  - `ok`       : green — all services healthy
 *  - `degraded` : amber — backend responded but at least one service is failing
 *                 (e.g. Firestore down but Gemini + Maps still serve requests)
 *  - `down`     : red — backend unreachable / timeout / no response body
 *
 * Hover the badge to see per-service breakdown (HTML `title` attribute).
 */
export function AIEngineStatus() {
  const { data: health } = useQuery<HealthSnapshot>({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 30_000,
  });

  const state = health?.state ?? 'down';
  const services = health?.services ?? {};

  const label =
    state === 'ok' ? 'AI Engine' : state === 'degraded' ? 'AI Degraded' : 'AI Offline';

  const className =
    state === 'ok'
      ? 'border-brand-accent/40 text-brand-accent bg-brand-primary-hover'
      : state === 'degraded'
      ? 'border-status-warning/40 text-status-warning bg-status-warning/10'
      : 'border-status-error/40 text-status-error bg-status-error/10';

  // Build a human-readable tooltip listing each known service and its state.
  const tooltip = (() => {
    const entries = Object.entries(services);
    if (entries.length === 0) {
      return state === 'down' ? 'Backend tidak dapat dihubungi' : 'AI Engine';
    }
    return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
  })();

  return (
    <Badge variant="outline" className={className} title={tooltip}>
      <Gauge className="w-3 h-3" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Badge>
  );
}
