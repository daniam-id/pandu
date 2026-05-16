// Tujuan    : Generic Firestore onSnapshot hook with automatic cleanup
// Caller    : useDriverOrders, useDriverProfile (adapted)
// Dependensi: firebase/firestore, react (useEffect, useState, useCallback)
// Main Func : useFirestoreCollection<T>() returns { data, loading, error }
// Side Effects: Attaches onSnapshot listener on mount, detaches on unmount

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

  const handleError = useCallback(
    (err: FirestoreError) => {
      console.error(`[Firestore] ${collectionPath} listener error:`, err);
      setState((prev) => ({ ...prev, loading: false, error: err }));
    },
    [collectionPath],
  );

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
