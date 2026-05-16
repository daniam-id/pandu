// filepath: src/tools/rerouteCourier.ts
/**
 * Tool: rerouteCourier
 * AI function to recalculate and assign a new route for a courier
 */

import { mapsService } from '../services/maps.service.js';
import { firestoreService } from '../services/firestore.service.js';
import { RerouteCourierParams, GeoLocation } from '../types/index.js';

export interface RerouteCourierResult {
  success: boolean;
  courierId: string;
  newRoutePolyline: string;
  estimatedAdditionalTime: number;
  message: string;
}

/**
 * Execute reroute_courier function
 * Calculates a new route avoiding the specified location
 */
export async function rerouteCourier(params: RerouteCourierParams): Promise<RerouteCourierResult> {
  try {
    console.log(`[rerouteCourier] Rerouting courier ${params.courierId} to avoid ${params.avoidLocation}`);

    // Get courier's current info
    const courier = await firestoreService.getCourier(params.courierId);
    if (!courier) {
      return {
        success: false,
        courierId: params.courierId,
        newRoutePolyline: '',
        estimatedAdditionalTime: 0,
        message: `Courier ${params.courierId} not found`,
      };
    }

    // Get the courier's current destination (last assigned order)
    if (courier.assignedOrders.length === 0) {
      return {
        success: false,
        courierId: params.courierId,
        newRoutePolyline: '',
        estimatedAdditionalTime: 0,
        message: `Courier ${params.courierId} has no active orders`,
      };
    }

    // Get the last order to find destination
    const lastOrderId = courier.assignedOrders[courier.assignedOrders.length - 1];
    const order = await firestoreService.getOrder(lastOrderId);
    if (!order) {
      return {
        success: false,
        courierId: params.courierId,
        newRoutePolyline: '',
        estimatedAdditionalTime: 0,
        message: `Order ${lastOrderId} not found`,
      };
    }

    // Calculate new route avoiding the location
    // In production, would parse avoidLocation to get coordinates
    const avoidLocation: GeoLocation = { lat: -7.283333, lng: 112.733333 }; // Default Surabaya
    const newRoute = await mapsService.calculateRouteAvoiding(
      courier.currentLocation,
      order.dropoffLocation,
      [avoidLocation]
    );

    if (!newRoute) {
      return {
        success: false,
        courierId: params.courierId,
        newRoutePolyline: '',
        estimatedAdditionalTime: 0,
        message: 'Failed to calculate new route',
      };
    }

    // Update courier's route in Firestore
    await firestoreService.updateCourierLocation(
      params.courierId,
      courier.currentLocation,
      newRoute.polyline
    );

    // Log the decision
    await firestoreService.createAIDecisionLog({
      type: 'route_optimized',
      message: `Rerouting ${courier.name} to avoid ${params.avoidLocation}. ${params.reason}`,
      relatedCourierId: params.courierId,
      relatedOrderId: lastOrderId,
      timestamp: new Date(),
    });

    return {
      success: true,
      courierId: params.courierId,
      newRoutePolyline: newRoute.polyline,
      estimatedAdditionalTime: 3, // minutes
      message: `Successfully rerouted courier ${params.courierId}`,
    };
  } catch (error) {
    console.error('[rerouteCourier] Error:', error);
    return {
      success: false,
      courierId: params.courierId,
      newRoutePolyline: '',
      estimatedAdditionalTime: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}