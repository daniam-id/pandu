import type { Timestamp } from 'firebase/firestore';

/** Generic geo coordinate pair used across the domain. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Courier entity from Firestore `couriers` collection. */
export interface Courier {
  id: string;
  name: string;
  status: 'idle' | 'delivering' | 'rerouted';
  assignedOrderIds?: string[];
  position?: LatLng;
  routePolyline?: string;
  lastUpdated?: Timestamp;
}

/** Order entity from Firestore `orders` collection. */
export interface Order {
  id: string;
  pickup: LatLng & { address?: string };
  dropoff: LatLng & { address?: string };
  status: 'pending' | 'dispatched' | 'in_transit' | 'completed' | 'cancelled';
  assignedCourierId?: string;
  createdAt?: Timestamp;
}

/** Obstacle report entity (returned from API, not necessarily Firestore). */
export interface Obstacle {
  id: string;
  courierId: string;
  photoUrl?: string;
  location: LatLng;
  description: string;
  type?: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  reportedAt: Timestamp;
}

/**
 * Payload for `POST /api/v1/orders/dispatch`.
 * Field names match the backend contract (see INTEGRATION_STATUS.md cURL test #4).
 */
export interface DispatchOrderPayload {
  pickupLocation: LatLng;
  dropoffLocation: LatLng;
  priority?: 'normal' | 'high' | 'urgent';
}

/** Response from `POST /api/v1/orders/dispatch` after envelope unwrap. */
export interface DispatchOrderResponse {
  orderId: string;
  assignedCourierId: string;
  estimatedDeliveryTime?: string;
}
