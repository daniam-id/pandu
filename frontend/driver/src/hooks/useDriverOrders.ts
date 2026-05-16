// Tujuan    : Listen to assigned orders for the current courier via Firestore onSnapshot
// Caller    : OrdersPage
// Dependensi: firebase/firestore (where, orderBy), useFirestoreCollection
// Main Func : Returns { data: Order[], loading, error }
// Side Effects: Attaches onSnapshot to 'orders' collection on mount, detaches on unmount

import { where, orderBy } from 'firebase/firestore';
import { useFirestoreCollection } from './useFirestoreCollection';
import type { Order } from '@/types/domain';

const COURIER_ID = import.meta.env.REACT_APP_COURIER_ID;

export function useDriverOrders() {
  return useFirestoreCollection<Order>(
    'orders',
    [where('courierId', '==', COURIER_ID), orderBy('createdAt', 'desc')],
    (doc) => ({ id: doc.id, ...doc.data() } as Order),
  );
}
