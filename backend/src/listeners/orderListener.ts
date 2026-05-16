import { logger } from '../utils/logger.js';
// filepath: src/listeners/orderListener.ts
/**
 * Order Listener
 * Real-time Firestore listener for pending orders
 * Triggers AI decision-making when new orders arrive
 */

import { firestoreService } from '../services/firestore.service.js';
import { aiService } from '../services/ai.service.js';
import { mapsService } from '../services/maps.service.js';
import { findNearbyCouriers } from '../tools/batchOrders.js';
import { Order } from '../types/index.js';

/**
 * Set up listener for pending orders
 * This should be called on server startup
 */
export function setupOrderListener(): () => void {
  logger.info('[orderListener] Setting up real-time listener for pending orders...');

  const unsubscribe = firestoreService.onPendingOrdersChange(async (orders: Order[]) => {
    logger.info(`[orderListener] ${orders.length} pending order(s) detected`);

    for (const order of orders) {
      try {
        await processPendingOrder(order);
      } catch (error) {
        logger.error(`[orderListener] Error processing order ${order.id}:`, error);
      }
    }
  });

  return unsubscribe;
}

/**
 * Process a single pending order
 * AI decides whether to batch or dispatch a new courier
 */
async function processPendingOrder(order: Order): Promise<void> {
  logger.info(`[orderListener] Processing pending order: ${order.id}`);

  // Guard: skip if already assigned (race condition with POST /orders/dispatch)
  if (order.assignedCourierId) {
    logger.info(`[orderListener] Order ${order.id} already assigned, skipping`);
    return;
  }

  // Step 1: Check for nearby couriers (batching opportunity)
  const nearby = await findNearbyCouriers(order.pickupLocation, 1.0);

  if (nearby.length > 0) {
    logger.info(
      `[orderListener] Found ${nearby.length} nearby courier(s) for batching`
    );

    // Batch to the closest one
    const targetCourier = nearby[0];

    // Execute batching via AI tool simulation
    const batchContext = {
      couriers: [{ id: targetCourier.courierId }],
      orders: [order],
    };

    const aiMessage = `New order ${order.id} is within 1km of courier ${targetCourier.courierId}. Should we batch this order?`;
    const aiResponse = await aiService.processMessage(aiMessage, batchContext);

    logger.info(`[orderListener] AI response:`, aiResponse);

    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      // Handle function calls from AI
      for (const functionCall of aiResponse.functionCalls) {
        logger.info(`[orderListener] AI called function: ${functionCall.name}`);
      }
    }

    return;
  }

  // Step 2: If no nearby couriers, find an idle one
  const idleCouriers = await firestoreService.getIdleCouriers();

  if (idleCouriers.length === 0) {
    logger.info(`[orderListener] No available couriers for order ${order.id}`);
    return;
  }

  // Select the closest idle courier
  const selectedCourier = idleCouriers[0];
  logger.info(`[orderListener] Assigning order ${order.id} to courier ${selectedCourier.id}`);

  // Calculate route
  const route = await mapsService.calculateRoute(
    selectedCourier.currentLocation,
    order.dropoffLocation
  );

  if (route) {
    // Assign order
    await firestoreService.assignOrderToCourier(selectedCourier.id!, order.id!);
    await firestoreService.updateOrderStatus(order.id!, 'assigned', selectedCourier.id);

    // Log decision
    await firestoreService.createAIDecisionLog({
      type: 'route_optimized',
      message: `Assigned order ${order.id} to ${selectedCourier.name}. ETA: ${route.duration}`,
      relatedCourierId: selectedCourier.id ?? null,
      relatedOrderId: order.id ?? null,
      timestamp: new Date(),
    });

    logger.info(`[orderListener] Order ${order.id} assigned to ${selectedCourier.name}`);
  }
}