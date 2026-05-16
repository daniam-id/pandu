import { logger } from '../utils/logger.js';
/**
 * Route Handler: Route Polyline
 * GET /api/v1/routes/:orderId — Fetch computed route and turn-by-turn instructions
 * Per INTEGRATION_SPEC §2.7
 */

import { Router, Request, Response } from 'express';
import { firestoreService } from '../services/firestore.service.js';
import { mapsService } from '../services/maps.service.js';
import { config } from '../config/index.js';
import {
  RouteResponse,
  LatLng,
  RouteStep,
  SuccessResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

// Simple in-memory cache for routes
const routeCache = new Map<string, { data: RouteResponse; timestamp: number }>();

/**
 * GET /api/v1/routes/:orderId
 * Fetch computed route polyline and turn-by-turn instructions
 * Per INTEGRATION_SPEC §2.7
 * Cache result for configurable TTL to reduce Google Maps API quota
 */
router.get('/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    // Check cache first
    const cached = routeCache.get(orderId);
    if (cached && Date.now() - cached.timestamp < config.routeCacheTtlMs) {
      logger.info(`[Routes] Serving route from cache: ${orderId}`);
      const successRes: SuccessResponse<RouteResponse> = {
        success: true,
        data: cached.data,
      };
      res.json(successRes);
      return;
    }

    // Fetch order
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

    // Get assigned courier to check status
    if (!order.assignedCourierId) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'ORDER_NOT_ASSIGNED',
          message: 'Pesanan belum ditugaskan ke kurir',
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Fetch route from Google Maps
    let routeData = await mapsService.calculateRoute(
      order.pickupLocation,
      order.dropoffLocation
    );

    if (!routeData) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'ROUTE_CALCULATION_FAILED',
          message: 'Tidak dapat menghitung rute. Lokasi mungkin tidak valid.',
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Parse polyline string into LatLng array
    // Google Maps polyline is encoded; for now, return placeholder
    const polylineArray: LatLng[] = [
      order.pickupLocation,
      {
        lat: (order.pickupLocation.lat + order.dropoffLocation.lat) / 2,
        lng: (order.pickupLocation.lng + order.dropoffLocation.lng) / 2,
      },
      order.dropoffLocation,
    ];

    // Parse steps from route data (this assumes mapsService returns structured data)
    const steps: RouteStep[] = [];
    if (routeData.duration && routeData.distance) {
      steps.push({
        instruction: `Head towards destination`,
        distance: parseInt(routeData.distance.replace(/[^\d]/g, '')) || 0,
        maneuver: 'straight',
      });
    }

    // Parse distance and duration from Google Maps response format
    const distanceMatch = routeData.distance?.match(/(\d+(?:\.\d+)?)/);
    const durationMatch = routeData.duration?.match(/(\d+)/);

    const totalDistance = distanceMatch ? Math.round(parseFloat(distanceMatch[1]) * 1000) : 0; // Convert km to meters
    const estimatedDuration = durationMatch ? parseInt(durationMatch[1]) * 60 : 0; // Convert minutes to seconds

    const response: RouteResponse = {
      orderId,
      polyline: polylineArray,
      steps,
      totalDistance,
      estimatedDuration,
    };

    // Cache the result
    routeCache.set(orderId, { data: response, timestamp: Date.now() });

    const successRes: SuccessResponse<RouteResponse> = {
      success: true,
      data: response,
    };
    res.json(successRes);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'ROUTE_FETCH_FAILED',
        message: 'Gagal mengambil rute',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;
