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
  console.log('[orderListener] Setting up real-time listener for pending orders...');

  const unsubscribe = firestoreService.onPendingOrdersChange(async (orders: Order[]) => {
    console.log(`[orderListener] ${orders.length} pending order(s) detected`);

    for (const order of orders) {
      try {
        await processPendingOrder(order);
      } catch (error) {
        console.error(`[orderListener] Error processing order ${order.id}:`, error);
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
  console.log(`[orderListener] Processing pending order: ${order.id}`);

  // Step 1: Check for nearby couriers (batching opportunity)
  const nearby = await findNearbyCouriers(order.pickupLocation, 1.0);

  if (nearby.length > 0) {
    console.log(
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

    console.log(`[orderListener] AI response:`, aiResponse);

    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      // Handle function calls from AI
      for (const functionCall of aiResponse.functionCalls) {
        console.log(`[orderListener] AI called function: ${functionCall.name}`);
      }
    }

    return;
  }

  // Step 2: If no nearby couriers, find an idle one
  const idleCouriers = await firestoreService.getIdleCouriers();

  if (idleCouriers.length === 0) {
    console.log(`[orderListener] No available couriers for order ${order.id}`);
    return;
  }

  // Select the closest idle courier
  const selectedCourier = idleCouriers[0];
  console.log(`[orderListener] Assigning order ${order.id} to courier ${selectedCourier.id}`);

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

    console.log(`[orderListener] Order ${order.id} assigned to ${selectedCourier.name}`);
  }
}