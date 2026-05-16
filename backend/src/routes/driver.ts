import { logger } from '../utils/logger.js';
/**
 * Route Handler: Driver
 * POST /api/v1/driver/location - Broadcast GPS coordinates
 */

import { Router, Request, Response } from 'express';
import { firestoreService } from '../services/firestore.service.js';
import {
  LocationBroadcastRequest,
  LocationBroadcastResponse,
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
          message: 'Kolom wajib tidak ada: courierId, lat, lng, timestamp',
          details: [
            { field: 'courierId', message: 'Wajib diisi' },
            { field: 'lat', message: 'Wajib diisi' },
            { field: 'lng', message: 'Wajib diisi' },
            { field: 'timestamp', message: 'Wajib diisi' },
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
          message: 'Koordinat GPS tidak valid. lat harus [-90,90], lng harus [-180,180]',
          details: [
            { field: 'lat', message: `Rentang valid: -90 sampai 90, diterima ${payload.lat}` },
            { field: 'lng', message: `Rentang valid: -180 sampai 180, diterima ${payload.lng}` },
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
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'LOCATION_UPDATE_FAILED',
        message: 'Gagal memperbarui lokasi kurir',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;
