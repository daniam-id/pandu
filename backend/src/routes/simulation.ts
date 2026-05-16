import { logger } from '../utils/logger.js';
// filepath: src/routes/simulation.ts
/**
 * Route Handler: Simulation
 * POST /api/v1/simulation/traffic - Inject traffic anomalies for demo
 */

import { Router, Request, Response } from 'express';
import { firestoreService } from '../services/firestore.service.js';
import { mapsService } from '../services/maps.service.js';
import { rerouteCourier } from '../tools/rerouteCourier.js';
import {
  TrafficSimulationRequest,
  TrafficSimulationResponse,
  SuccessResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

/**
 * POST /api/v1/simulation/traffic
 * Simulate a traffic anomaly to demonstrate AI rerouting
 */
router.post('/traffic', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as TrafficSimulationRequest;

    // Validate payload
    if (!payload.targetAreaName || !payload.congestionLevel || !payload.affectedRadiusKm) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Kolom wajib tidak ada: targetAreaName, congestionLevel, affectedRadiusKm',
          details: [
            { field: 'targetAreaName', message: 'Wajib diisi' },
            { field: 'congestionLevel', message: 'Wajib diisi' },
            { field: 'affectedRadiusKm', message: 'Wajib diisi' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    logger.info(`[Simulation] Traffic anomaly: ${payload.targetAreaName} (${payload.congestionLevel})`);

    // Find all couriers
    const allCouriers = await firestoreService.getAllCouriers();
    const affectedCouriers: string[] = [];

    // For demo purposes, check which couriers might be affected
    // In production, would use real traffic API to determine affected areas
    for (const courier of allCouriers) {
      // Simulate: couriers are affected if they're delivering
      if (courier.status === 'delivering') {
        affectedCouriers.push(courier.id!);

        // Reroute this courier
        const rerouteResult = await rerouteCourier({
          courierId: courier.id!,
          avoidLocation: payload.targetAreaName,
          reason: `Traffic anomaly: ${payload.congestionLevel} congestion on ${payload.targetAreaName}`,
        });

        logger.info(`[Simulation] Rerouted courier ${courier.id}:`, rerouteResult);
      }
    }

    // Log this simulation event
    await firestoreService.createAIDecisionLog({
      type: 'route_optimized',
      message: `Traffic anomaly simulated on ${payload.targetAreaName} (${payload.congestionLevel}). Affected ${affectedCouriers.length} courier(s).`,
      relatedCourierId: null,
      relatedOrderId: null,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      data: {
        affectedCouriers,
      },
    } as SuccessResponse<TrafficSimulationResponse>);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'SIMULATION_FAILED',
        message: 'Gagal mensimulasikan lalu lintas',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;