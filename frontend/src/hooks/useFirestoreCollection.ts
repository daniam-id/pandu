import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  type QueryConstraint,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface FirestoreHookState<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * Generic Firestore `onSnapshot` hook.
 *
 * @param collectionPath  Firestore collection name (e.g. `'couriers'`)
 * @param constraints     Optional query constraints (orderBy, limit, where)
 * @param transform       Convert raw doc data into domain type + inject `id`
 *
 * @example
 * const { data, loading, error } = useFirestoreCollection(
 *   'couriers',
 *   [orderBy('name')],
 *   (doc) => ({ id: doc.id, ...doc.data() } as Courier),
 * );
 */
export function useFirestoreCollection<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  transform: (doc: { id: string; data(): Record<string, unknown> }) => T = (doc) =>
    doc.data() as unknown as T,
): FirestoreHookState<T> {
  const [state, setState] = useState<FirestoreHookState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const handleError = useCallback((err: FirestoreError) => {
    console.error(`[Firestore] ${collectionPath} listener error:`, err);
    setState((prev) => ({ ...prev, loading: false, error: err }));
  }, [collectionPath]);

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const q = query(collection(db, collectionPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) =>
          transform({ id: doc.id, data: () => doc.data() as Record<string, unknown> }),
        );
        setState({ data: items, loading: false, error: null });
      },
      handleError,
    );

    return () => {
      unsubscribe();
    };
  }, [collectionPath, constraints, transform, handleError]);

  return state;
}
