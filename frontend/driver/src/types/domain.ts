// Tujuan    : Domain type definitions for the driver app
// Caller    : All hooks, services, components, pages
// Dependensi: firebase/firestore (Timestamp type only)
// Main Func : TypeScript interfaces for Order, Address, Courier, Obstacle, Route
// Side Effects: None (pure types)

import type { Timestamp } from 'firebase/firestore';

export interface LatLng {
  lat: number;
  lng: number;
}

export type OrderStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface Address {
  name: string;
  phone: string;
  lat: number;
  lng: number;
  address: string;
  notes?: string;
}

export interface Order {
  id: string;
  courierId: string;
  status: OrderStatus;
  pickup: Address;
  dropoff: Address;
  items: string;
  priority: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CourierStatus = 'idle' | 'delivering' | 'rerouted' | 'offline';

export interface Courier {
  id: string;
  name: string;
  phone: string;
  status: CourierStatus;
  currentLocation?: LatLng;
  assignedOrders: string[];
}

export type ObstacleType =
  | 'flood'
  | 'accident'
  | 'construction'
  | 'road_closure'
  | 'heavy_traffic'
  | 'other';

export type Severity = 1 | 2 | 3 | 4 | 5;

export interface Obstacle {
  courierId: string;
  type: ObstacleType;
  severity: Severity;
  description: string;
  photo?: File;
  lat?: number;
  lng?: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  maneuver?: 'turn-left' | 'turn-right' | 'straight' | 'u-turn' | string;
}

export interface Route {
  orderId: string;
  polyline: LatLng[];
  steps: RouteStep[];
}
