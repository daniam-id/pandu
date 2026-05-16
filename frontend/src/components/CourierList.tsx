import type { Courier } from '@/types/domain';
import { CourierCard } from './CourierCard';
import { CourierListSkeleton } from './CourierListSkeleton';
import { CourierListEmpty } from './CourierListEmpty';

interface CourierListProps {
  couriers: Courier[];
  loading: boolean;
}

/**
 * Live courier list panel.
 *
 * - Shows skeleton while loading
 * - Shows empty state when no couriers
 * - Renders CourierCard per item
 */
export function CourierList({ couriers, loading }: CourierListProps) {
  if (loading) {
    return <CourierListSkeleton />;
  }

  if (couriers.length === 0) {
    return <CourierListEmpty />;
  }

  return (
    <div className="space-y-2">
      {couriers.map((courier) => (
        <CourierCard key={courier.id} courier={courier} />
      ))}
    </div>
  );
}
