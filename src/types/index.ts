// filepath: src/types/index.ts
/**
 * Pandu.ai TypeScript Type Definitions
 * All interfaces for the backend system
 */

// ============ Location Types ============

export interface GeoLocation {
  lat: number;
  lng: number;
}

// ============ Order Types ============

export type OrderStatus = 'pending' | 'assigned' | 'completed' | 'failed';
export type OrderPriority = 'normal' | 'high' | 'urgent';

export interface Order {
  id?: string;
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
  status: OrderStatus;
  assignedCourierId: string | null;
  createdAt: Date;
  completedAt: Date | null;
  priority: OrderPriority;
}

export interface CreateOrderRequest {
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
  priority?: OrderPriority;
}

export interface DispatchOrderResponse {
  orderId: string;
  assignedCourierId: string | null;
  estimatedDeliveryTime: number | null;
}

// ============ Courier Types ============

export type CourierStatus = 'idle' | 'delivering' | 'rerouted' | 'offline';

export interface Courier {
  id?: string;
  name: string;
  phone?: string;
  status: CourierStatus;
  currentLocation: GeoLocation;
  assignedOrders: string[];
  currentRoutePolyline: string;
  updatedAt: Date;
}

// ============ Obstacle Types ============

export type ObstacleSeverity = 1 | 2 | 3 | 4 | 5; // 1=lowest, 5=highest
export type ObstacleType = 'flood' | 'accident' | 'road_closure' | 'construction' | 'damaged_road' | 'other';
export type ObstacleAction = 'rerouted' | 'ignored';
export type ObstacleStatus = 'pending_analysis' | 'analyzed';

export interface Obstacle {
  id?: string;
  courierId: string;
  imageUrl?: string | null;
  location: GeoLocation;
  type: ObstacleType;
  severity: ObstacleSeverity; // Client-provided 1-5
  description: string;
  aiAnalysis?: {
    severity: string; // AI-determined
    description: string;
    actionTaken: ObstacleAction;
  } | null;
  status: ObstacleStatus;
  createdAt: Date;
}

export interface ReportObstacleRequest {
  courierId: string;
  type: ObstacleType;
  severity: ObstacleSeverity;
  description: string;
  lat: number;
  lng: number;
}

export interface ObstacleAnalysisResult {
  obstacleDetected: boolean;
  description: string;
  severity: string;
  requiresReroute: boolean;
}

// ============ AI Decision Log Types ============

export type AIDecisionType = 'route_optimized' | 'order_batched' | 'obstacle_avoided';

export interface AIDecisionLog {
  id?: string;
  type: AIDecisionType;
  message: string;
  relatedCourierId: string | null;
  relatedOrderId: string | null;
  timestamp: Date;
}

// ============ Simulation Types ============

export type CongestionLevel = 'light' | 'moderate' | 'heavy';

export interface TrafficSimulationRequest {
  targetAreaName: string;
  congestionLevel: CongestionLevel;
  affectedRadiusKm: number;
}

export interface TrafficSimulationResponse {
  affectedCouriers: string[];
}

// ============ Status Transition Types ============

export type DriverOrderStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface UpdateOrderStatusRequest {
  status: DriverOrderStatus;
  timestamp: string; // ISO 8601
  failureReason?: string; // Required if status === 'failed'
}

export interface UpdateOrderStatusResponse {
  orderId: string;
  newStatus: DriverOrderStatus;
  updatedAt: string; // ISO 8601
}

// ============ Location Broadcast Types ============

export interface LocationBroadcastRequest {
  courierId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string; // ISO 8601
}

export interface LocationBroadcastResponse {
  receivedAt: string; // ISO 8601
}

// ============ Route Types ============

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distance: number; // in meters
  maneuver: string;
}

export interface RouteResponse {
  orderId: string;
  polyline: LatLng[];
  steps: RouteStep[];
  totalDistance: number; // in meters
  estimatedDuration: number; // in seconds
}

// ============ Health Check Types ============

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    firestore: 'ok' | 'failing';
    gemini: 'ok' | 'failing';
    maps: 'ok' | 'failing';
  };
}

// ============ Error Response Types ============

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string; // User-friendly, can be in Indonesian
    details?: ErrorDetail[];
  };
}

// ============ API Response Types ============

export interface ApiResponse<T = unknown> {
  success?: boolean; // For newer endpoints per INTEGRATION_SPEC
  status?: 'success' | 'error'; // Legacy
  message?: string; // Legacy
  data?: T;
  code?: string; // Legacy
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

// ============ Function Calling Types ============

export interface RerouteCourierParams {
  courierId: string;
  avoidLocation: string;
  reason: string;
}

export interface RerouteCourierResult {
  success: boolean;
  message: string;
  newPolyline?: string;
}

export interface BatchOrdersParams {
  courierId: string;
  newOrderId: string;
  estimatedDistanceSavedKm: number;
}

export interface BatchOrdersResult {
  success: boolean;
  message: string;
  optimizedRoute?: string;
}

// ============ Google Maps Types ============

export interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
}

export interface TrafficData {
  areaName: string;
  congestionLevel: CongestionLevel;
  affectedRadiusKm: number;
}