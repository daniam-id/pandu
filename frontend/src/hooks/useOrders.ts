import { useCallback } from 'react';
import type { Order } from '@/types/domain';
import { useFirestoreCollection } from './useFirestoreCollection';

/**
 * Subscribe to the live `orders` Firestore collection.
 *
 * Returns `{ data, loading, error }` where `data` is an array of `Order`.
 * Listener automatically cleans up on unmount.
 */
export function useOrders() {
  const transform = useCallback(
    (doc: { id: string; data(): Record<string, unknown> }): Order => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, 'id'>),
    }),
    [],
  );

  return useFirestoreCollection<Order>('orders', [], transform);
}
