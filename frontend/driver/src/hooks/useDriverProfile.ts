// Tujuan    : Listen to the current courier's Firestore document
// Caller    : ProfilePage, LiveLocationToggle
// Dependensi: firebase/firestore (doc, onSnapshot), react (useEffect, useState)
// Main Func : Returns { data: Courier, loading, error }
// Side Effects: Attaches onSnapshot to 'couriers/{id}' doc on mount, detaches on unmount

import { useEffect, useState } from 'react';
import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { Courier } from '@/types/domain';

const COURIER_ID = import.meta.env.REACT_APP_COURIER_ID;

export interface ProfileHookState {
  data: Courier | null;
  loading: boolean;
  error: FirestoreError | null;
}

export function useDriverProfile() {
  const [state, setState] = useState<ProfileHookState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const ref = doc(db, 'couriers', COURIER_ID);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setState({
            data: { id: snapshot.id, ...snapshot.data() } as Courier,
            loading: false,
            error: null,
          });
        } else {
          setState({ data: null, loading: false, error: null });
        }
      },
      (err: FirestoreError) => {
        console.error('[Firestore] couriers listener error:', err);
        setState((prev) => ({ ...prev, loading: false, error: err }));
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
