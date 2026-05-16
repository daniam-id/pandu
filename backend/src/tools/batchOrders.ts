import { logger } from '../utils/logger.js';
// filepath: src/tools/batchOrders.ts
/**
 * Tool: batchOrders
 * AI function to assign a new order to an existing nearby courier
 */

import { mapsService } from '../services/maps.service.js';
import { firestoreService } from '../services/firestore.service.js';
import { BatchOrdersParams } from '../types/index.js';

export interface BatchOrdersResult {
  success: boolean;
  courierId: string;
  orderId: string;
  estimatedDistanceSavedKm: number;
  message: string;
}

/**
 * Execute batch_orders function
 * Assigns a new order to an existing courier who is nearby
 */
export async function batchOrders(params: BatchOrdersParams): Promise<BatchOrdersResult> {
  try {
    logger.info(`[batchOrders] Batching order ${params.newOrderId} to courier ${params.courierId}`);

    // Get courier info
    const courier = await firestoreService.getCourier(params.courierId);
    if (!courier) {
      return {
        success: false,
        courierId: params.courierId,
        orderId: params.newOrderId,
        estimatedDistanceSavedKm: 0,
        message: `Courier ${params.courierId} not found`,
      };
    }

    // Get the new order info
    const newOrder = await firestoreService.getOrder(params.newOrderId);
    if (!newOrder) {
      return {
        success: false,
        courierId: params.courierId,
        orderId: params.newOrderId,
        estimatedDistanceSavedKm: 0,
        message: `Order ${params.newOrderId} not found`,
      };
    }

    // Calculate distance saved by batching
    // In production, would compare: direct dispatch vs batching to existing courier
    const distanceSaved = params.estimatedDistanceSavedKm || 0;

    // Assign order to courier
    await firestoreService.assignOrderToCourier(params.courierId, params.newOrderId);

    // Update order status
    await firestoreService.updateOrderStatus(params.newOrderId, 'assigned', params.courierId);

    // Log the decision
    await firestoreService.createAIDecisionLog({
      type: 'order_batched',
      message: `Batched order ${params.newOrderId} to ${courier.name}. Saved ~${distanceSaved.toFixed(1)}km.`,
      relatedCourierId: params.courierId,
      relatedOrderId: params.newOrderId,
      timestamp: new Date(),
    });

    return {
      success: true,
      courierId: params.courierId,
      orderId: params.newOrderId,
      estimatedDistanceSavedKm: distanceSaved,
      message: `Successfully batched order ${params.newOrderId} to courier ${params.courierId}`,
    };
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      courierId: params.courierId,
      orderId: params.newOrderId,
      estimatedDistanceSavedKm: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Find nearby couriers for a new order
 * Used by AI to determine if batching is possible
 */
export async function findNearbyCouriers(
  orderLocation: { lat: number; lng: number },
  radiusKm: number = 1
): Promise<{ courierId: string; distanceKm: number }[]> {
  const couriers = await firestoreService.getAllCouriers();
  const nearby: { courierId: string; distanceKm: number }[] = [];

  for (const courier of couriers) {
    const distance = mapsService.calculateDistance(
      orderLocation as { lat: number; lng: number },
      courier.currentLocation
    );

    if (distance <= radiusKm) {
      nearby.push({
        courierId: courier.id!,
        distanceKm: distance,
      });
    }
  }

  // Sort by distance
  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
}