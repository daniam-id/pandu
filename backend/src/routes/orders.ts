// filepath: src/routes/orders.ts
/**
 * Route Handler: Orders
 * POST /api/v1/orders/dispatch - Dispatch a new order
 */

import { Router, Request, Response } from 'express';
import { firestoreService } from '../services/firestore.service.js';
import { mapsService } from '../services/maps.service.js';
import { aiService } from '../services/ai.service.js';
import { findNearbyCouriers } from '../tools/batchOrders.js';
import { batchOrders } from '../tools/batchOrders.js';
import {
  CreateOrderRequest,
  DispatchOrderResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
  SuccessResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

/**
 * POST /api/v1/orders/dispatch
 * Create and dispatch a new order, AI decides courier assignment
 */
router.post('/dispatch', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as CreateOrderRequest;

    // Validate payload
    if (!payload.pickupLocation || !payload.dropoffLocation) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: pickupLocation, dropoffLocation',
          details: [
            { field: 'pickupLocation', message: 'Required' },
            { field: 'dropoffLocation', message: 'Required' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Create order in Firestore
    const order = {
      pickupLocation: payload.pickupLocation,
      dropoffLocation: payload.dropoffLocation,
      status: 'pending' as const,
      assignedCourierId: null,
      priority: payload.priority || 'normal',
      createdAt: new Date(),
      completedAt: null,
    };

    const orderId = await firestoreService.createOrder(order);
    console.log(`[Orders] Created order: ${orderId}`);

    // AI decision: Find nearby couriers for batching
    const nearby = await findNearbyCouriers(payload.pickupLocation, 1.0);

    let assignedCourierId: string | null = null;
    let estimatedTime = 0;

    if (nearby.length > 0) {
      // Batch to existing courier
      const targetCourier = nearby[0];
      const result = await batchOrders({
        courierId: targetCourier.courierId,
        newOrderId: orderId,
        estimatedDistanceSavedKm: 0.5,
      });

      if (result.success) {
        assignedCourierId = targetCourier.courierId;
        estimatedTime = 15; // minutes
      }
    }

    // If no nearby courier, find an idle one
    if (!assignedCourierId) {
      const idleCouriers = await firestoreService.getIdleCouriers();

      if (idleCouriers.length === 0) {
        const successRes: SuccessResponse<DispatchOrderResponse> = {
          success: true,
          data: {
            orderId,
            assignedCourierId: null,
            estimatedDeliveryTime: null,
          },
        };
        res.status(202).json(successRes);
        return;
      }

      // Assign to closest idle courier
      const selectedCourier = idleCouriers[0];
      assignedCourierId = selectedCourier.id!;

      // Calculate route
      const route = await mapsService.calculateRoute(
        selectedCourier.currentLocation,
        payload.dropoffLocation
      );

      if (route) {
        await firestoreService.assignOrderToCourier(assignedCourierId, orderId);
        await firestoreService.updateOrderStatus(orderId, 'assigned', assignedCourierId);

        // Parse duration to minutes (e.g., "15 mins" -> 15)
        const durationMatch = route.duration.match(/\\d+/);
        estimatedTime = durationMatch ? parseInt(durationMatch[0], 10) : 15;
      }
    }

    res.status(201).json({
      success: true,
      data: {
        orderId,
        assignedCourierId: assignedCourierId || null,
        estimatedDeliveryTime: estimatedTime || null,
      },
    } as SuccessResponse<DispatchOrderResponse>);
  } catch (error) {
    console.error('[Orders] Error:', error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'DISPATCH_FAILED',
        message: 'Failed to dispatch order',
      },
    };
    res.status(500).json(errorRes);
  }
});

/**
 * GET /api/v1/orders/:orderId
 * Get order details
 */
router.get('/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await firestoreService.getOrder(orderId);

    if (!order) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      };
      res.status(404).json(errorRes);
      return;
    }

    const successRes: SuccessResponse = {
      success: true,
      data: order,
    };
    res.json(successRes);
  } catch (error) {
    console.error('[Orders] Error:', error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'Failed to retrieve order',
      },
    };
    res.status(500).json(errorRes);
  }
});

/**
 * POST /api/v1/orders/:id/status
 * Update order status (driver-facing status transitions)
 * Per INTEGRATION_SPEC §2.5 - Status transitions with validation
 */
router.post('/:orderId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const payload = req.body as UpdateOrderStatusRequest;

    // Validate required fields
    if (!payload.status || !payload.timestamp) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: status, timestamp',
          details: [
            { field: 'status', message: 'Required' },
            { field: 'timestamp', message: 'Required' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Validate failureReason if status === 'failed'
    if (payload.status === 'failed' && !payload.failureReason) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'failureReason is required when status === "failed"',
          details: [{ field: 'failureReason', message: 'Required for failed status' }],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Get current order
    const order = await firestoreService.getOrder(orderId);
    if (!order) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      };
      res.status(404).json(errorRes);
      return;
    }

    // Validate status transition (per spec §2.5)
    const validTransitions: Record<string, string[]> = {
      assigned: ['picked_up'],
      picked_up: ['in_transit'],
      in_transit: ['delivered', 'failed'],
    };

    // Map canonical status to driver status for validation
    const currentCanonicalStatus = order.status;
    const allowedNextStatuses = validTransitions[currentCanonicalStatus] || [];

    if (!allowedNextStatuses.includes(payload.status)) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition from ${currentCanonicalStatus} to ${payload.status}`,
          details: [
            {
              field: 'status',
              message: `Valid transitions from ${currentCanonicalStatus}: ${allowedNextStatuses.join(', ')}`,
            },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Update order with new canonical status
    let canonicalStatus: 'pending' | 'assigned' | 'completed' | 'failed' = currentCanonicalStatus as any;
    if (payload.status === 'delivered') {
      canonicalStatus = 'completed';
    } else if (payload.status === 'failed') {
      canonicalStatus = 'failed';
    }

    // Perform update
    const updateData: any = {
      status: canonicalStatus,
      updatedAt: new Date().toISOString(),
    };

    if (canonicalStatus === 'completed' || canonicalStatus === 'failed') {
      updateData.completedAt = new Date().toISOString();
    }

    if (payload.failureReason) {
      updateData.failureReason = payload.failureReason;
    }

    await firestoreService.updateOrderStatusWithData(orderId, updateData);

    // If completed/failed, clear from courier's assignedOrders
    if ((canonicalStatus === 'completed' || canonicalStatus === 'failed') && order.assignedCourierId) {
      await firestoreService.removeOrderFromCourier(order.assignedCourierId, orderId);
    }

    const successRes: SuccessResponse<UpdateOrderStatusResponse> = {
      success: true,
      data: {
        orderId,
        newStatus: payload.status,
        updatedAt: new Date().toISOString(),
      },
    };
    res.json(successRes);
  } catch (error) {
    console.error('[Orders] Error updating status:', error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: 'Failed to update order status',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;