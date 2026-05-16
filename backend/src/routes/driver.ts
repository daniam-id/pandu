/**
 * Route Handler: Driver
 * POST /api/v1/driver/location - Broadcast GPS coordinates
 * GET /api/v1/routes/:orderId - Fetch route polyline and turn-by-turn instructions
 */

import { Router, Request, Response } from 'express';
import { firestoreService } from '../services/firestore.service.js';
import { mapsService } from '../services/maps.service.js';
import {
  LocationBroadcastRequest,
  LocationBroadcastResponse,
  RouteResponse,
  LatLng,
  RouteStep,
  SuccessResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

/**
 * POST /api/v1/driver/location
 * Broadcast current GPS location (called at ~15-second intervals by driver app)
 * Per INTEGRATION_SPEC §2.6
 */
router.post('/location', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as LocationBroadcastRequest;

    // Validate required fields
    if (!payload.courierId || payload.lat === undefined || payload.lng === undefined || !payload.timestamp) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: courierId, lat, lng, timestamp',
          details: [
            { field: 'courierId', message: 'Required' },
            { field: 'lat', message: 'Required' },
            { field: 'lng', message: 'Required' },
            { field: 'timestamp', message: 'Required' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Validate coordinates
    if (payload.lat < -90 || payload.lat > 90 || payload.lng < -180 || payload.lng > 180) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid GPS coordinates. lat must be [-90,90], lng must be [-180,180]',
          details: [
            { field: 'lat', message: `Valid range: -90 to 90, got ${payload.lat}` },
            { field: 'lng', message: `Valid range: -180 to 180, got ${payload.lng}` },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Update courier location in Firestore
    const location = { lat: payload.lat, lng: payload.lng };
    await firestoreService.updateCourierLocation(payload.courierId, location);

    const successRes: SuccessResponse<LocationBroadcastResponse> = {
      success: true,
      data: {
        receivedAt: new Date().toISOString(),
      },
    };
    res.json(successRes);
  } catch (error) {
    console.error('[Driver] Location broadcast error:', error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'LOCATION_UPDATE_FAILED',
        message: 'Failed to update driver location',
      },
    };
    res.status(500).json(errorRes);
  }
});

/**
 * GET /api/v1/routes/:orderId
 * Fetch computed route polyline and turn-by-turn instructions
 * Per INTEGRATION_SPEC §2.7
 * Cache result for 60 seconds to reduce Google Maps API quota
 */

// Simple in-memory cache for routes
const routeCache = new Map<string, { data: RouteResponse; timestamp: number }>();
const ROUTE_CACHE_TTL_MS = 60000; // 60 seconds

router.get('/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    // Check cache first
    const cached = routeCache.get(orderId);
    if (cached && Date.now() - cached.timestamp < ROUTE_CACHE_TTL_MS) {
      console.log(`[Driver] Serving route from cache: ${orderId}`);
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
          message: 'Order not found',
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
          message: 'Order has not been assigned to a courier yet',
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
          message: 'Could not calculate route. Locations may be invalid or unreachable.',
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
    console.error('[Driver] Route fetch error:', error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'ROUTE_FETCH_FAILED',
        message: 'Failed to fetch route',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;
