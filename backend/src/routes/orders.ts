import { logger } from '../utils/logger.js';
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
  CancelOrderRequest,
  CancelOrderResponse,
  SuccessResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

/**
 * GET /api/v1/orders
 * Fetch assigned orders for a courier
 * Query params: ?courierId=X
 * Per INTEGRATION_SPEC §2.1 endpoint #4
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { courierId } = req.query;

    if (!courierId || typeof courierId !== 'string') {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter courierId diperlukan',
          details: [{ field: 'courierId', message: 'Required query parameter' }],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    const orders = await firestoreService.getOrdersByCourier(courierId);

    const successRes: SuccessResponse = {
      success: true,
      data: orders,
    };
    res.json(successRes);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'Gagal mengambil data pesanan',
      },
    };
    res.status(500).json(errorRes);
  }
});

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
          message: 'Kolom wajib tidak ada: pickupLocation, dropoffLocation',
          details: [
            { field: 'pickupLocation', message: 'Wajib diisi' },
            { field: 'dropoffLocation', message: 'Wajib diisi' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Map priority: string input → number 1-5 per INTEGRATION_SPEC §3.1
    const priorityMap: Record<string, number> = { normal: 3, high: 4, urgent: 5 };
    const priority = typeof payload.priority === 'string'
      ? (priorityMap[payload.priority] ?? 3)
      : (typeof payload.priority === 'number' ? payload.priority : 3);

    // Create order in Firestore
    const order = {
      pickupLocation: payload.pickupLocation,
      dropoffLocation: payload.dropoffLocation,
      status: 'pending' as const,
      assignedCourierId: null,
      priority,
      items: (payload as any).items || null,
      createdAt: new Date(),
      completedAt: null,
    };

    const orderId = await firestoreService.createOrder(order);
    logger.info(`[Orders] Created order: ${orderId}`);

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
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'DISPATCH_FAILED',
        message: 'Gagal mengirim pesanan',
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
          message: 'Pesanan tidak ditemukan',
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
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'Gagal mengambil pesanan',
      },
    };
    res.status(500).json(errorRes);
  }
});

/**
 * POST /api/v1/orders/:orderId/cancel
 * Cancel an order (dispatcher or driver initiated)
 * Sets status=failed, removes from courier's assignedOrders
 */
router.post('/:orderId/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const payload = req.body as CancelOrderRequest;

    if (!payload.reason) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Alasan pembatalan diperlukan',
          details: [{ field: 'reason', message: 'Wajib diisi' }],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    const order = await firestoreService.getOrder(orderId);
    if (!order) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pesanan tidak ditemukan',
        },
      };
      res.status(404).json(errorRes);
      return;
    }

    // Can only cancel pending or assigned orders
    if (order.status !== 'pending' && order.status !== 'assigned') {
      const errorRes: ErrorResponse = {
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Pesanan dengan status ${order.status} tidak dapat dibatalkan`,
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    const updateData: Record<string, unknown> = {
      status: 'failed' as const,
      driverStatus: 'failed',
      failureReason: payload.reason,
      completedAt: new Date().toISOString(),
    };

    await firestoreService.updateOrderStatusWithData(orderId, updateData);

    if (order.assignedCourierId) {
      await firestoreService.removeOrderFromCourier(order.assignedCourierId, orderId);
    }

    // Log cancellation
    await firestoreService.createAIDecisionLog({
      type: 'route_optimized',
      message: `Pesanan ${orderId} dibatalkan: ${payload.reason}`,
      relatedCourierId: order.assignedCourierId,
      relatedOrderId: orderId,
      timestamp: new Date(),
    });

    const successRes: SuccessResponse<CancelOrderResponse> = {
      success: true,
      data: {
        orderId,
        newStatus: 'failed',
        cancelledAt: new Date().toISOString(),
      },
    };
    res.json(successRes);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'CANCEL_FAILED',
        message: 'Gagal membatalkan pesanan',
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
          message: 'Kolom wajib tidak ada: status, timestamp',
          details: [
            { field: 'status', message: 'Wajib diisi' },
            { field: 'timestamp', message: 'Wajib diisi' },
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
          message: 'failureReason diperlukan saat status === "failed"',
          details: [{ field: 'failureReason', message: 'Wajib diisi untuk status gagal' }],
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
          message: 'Pesanan tidak ditemukan',
        },
      };
      res.status(404).json(errorRes);
      return;
    }

    // Idempotency: same-state transition is always a no-op (BE-004)
    const currentDriverStatus = order.driverStatus || 'assigned';

    if (payload.status === currentDriverStatus) {
      const successRes: SuccessResponse<UpdateOrderStatusResponse> = {
        success: true,
        data: {
          orderId,
          newStatus: payload.status,
          updatedAt: order.updatedAt as string || new Date().toISOString(),
          noChange: true,
        },
      };
      res.json(successRes);
      return;
    }

    // Final states cannot be transitioned out of (BE-004)
    const finalStates = ['delivered', 'failed'];
    if (finalStates.includes(currentDriverStatus)) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'ALREADY_FINAL',
          message: `Pesanan sudah berstatus ${currentDriverStatus} dan tidak dapat diubah lagi`,
        },
      };
      res.status(409).json(errorRes);
      return;
    }

    // Validate status transition (per spec §2.5)
    const validTransitions: Record<string, string[]> = {
      assigned: ['picked_up'],
      picked_up: ['in_transit'],
      in_transit: ['delivered', 'failed'],
    };

    const allowedNextStatuses = validTransitions[currentDriverStatus] || [];

    if (!allowedNextStatuses.includes(payload.status)) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'INVALID_TRANSITION',
          message: `Tidak dapat beralih dari ${currentDriverStatus} ke ${payload.status}`,
          details: [
            {
              field: 'status',
              message: `Transisi yang valid dari ${currentDriverStatus}: ${allowedNextStatuses.join(', ')}`,
            },
          ],
        },
      };
      res.status(409).json(errorRes);
      return;
    }

    // Determine canonical status from driver status
    const terminalDriverStatuses = ['delivered', 'failed'];
    let canonicalStatus: 'assigned' | 'completed' | 'failed' = 'assigned';
    if (payload.status === 'delivered') {
      canonicalStatus = 'completed';
    } else if (payload.status === 'failed') {
      canonicalStatus = 'failed';
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      driverStatus: payload.status,
      updatedAt: new Date().toISOString(),
    };

    if (terminalDriverStatuses.includes(payload.status)) {
      updateData.status = canonicalStatus;
      updateData.completedAt = new Date().toISOString();
    }

    if (payload.failureReason) {
      updateData.failureReason = payload.failureReason;
    }

    await firestoreService.updateOrderStatusWithData(orderId, updateData);

    // If completed/failed, clear from courier's assignedOrders
    if (terminalDriverStatuses.includes(payload.status) && order.assignedCourierId) {
      await firestoreService.removeOrderFromCourier(order.assignedCourierId, orderId);
    }

    const updatedAtStr = new Date().toISOString();

    const successRes: SuccessResponse<UpdateOrderStatusResponse> = {
      success: true,
      data: {
        orderId,
        newStatus: payload.status,
        updatedAt: updatedAtStr,
      },
    };

    res.json(successRes);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: 'Gagal memperbarui status pesanan',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;