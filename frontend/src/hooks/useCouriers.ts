import { useCallback } from 'react';
import type { Courier } from '@/types/domain';
import { useFirestoreCollection } from './useFirestoreCollection';

/**
 * Subscribe to the live `couriers` Firestore collection.
 *
 * Returns `{ data, loading, error }` where `data` is an array of `Courier`.
 * Listener automatically cleans up on unmount.
 */
export function useCouriers() {
  const transform = useCallback(
    (doc: { id: string; data(): Record<string, unknown> }): Courier => ({
      id: doc.id,
      ...(doc.data() as Omit<Courier, 'id'>),
    }),
    [],
  );

  return useFirestoreCollection<Courier>('couriers', [], transform);
}
