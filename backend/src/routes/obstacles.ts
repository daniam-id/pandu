import { logger } from '../utils/logger.js';
// filepath: src/routes/obstacles.ts
/**
 * Route Handler: Obstacles
 * POST /api/v1/obstacles/report - Report and analyze obstacles
 * Per INTEGRATION_SPEC §2.3 - Accepts multipart/form-data with optional photo
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getStorage } from 'firebase-admin/storage';
import { config } from '../config/index.js';
import { firestoreService } from '../services/firestore.service.js';
import { aiService } from '../services/ai.service.js';
import { rerouteCourier } from '../tools/rerouteCourier.js';
import {
  SuccessResponse,
  ErrorResponse,
  ObstacleType,
  ObstacleSeverity,
} from '../types/index.js';

const router = Router();

// Configure multer for file uploads (5 MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/v1/obstacles/report
 * Report an obstacle with optional image for multimodal analysis
 * Accepts multipart/form-data with fields:
 *   - courierId (required)
 *   - type (required): flood | accident | road_closure | construction | damaged_road | other
 *   - severity (required): 1-5
 *   - description (required): max 500 chars
 *   - lat (required): latitude
 *   - lng (required): longitude
 *   - photo (optional): image file, max 5MB
 */
router.post('/report', upload.single('photo'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract form fields
    const { courierId, type, severity, description, lat, lng } = req.body;

    // Validate required fields
    if (!courierId || !type || !severity || !description || lat === undefined || lng === undefined) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Kolom wajib tidak ada: courierId, type, severity, description, lat, lng',
          details: [
            courierId ? null : { field: 'courierId', message: 'Wajib diisi' },
            type ? null : { field: 'type', message: 'Wajib diisi' },
            severity ? null : { field: 'severity', message: 'Wajib diisi' },
            description ? null : { field: 'description', message: 'Wajib diisi' },
            lat !== undefined ? null : { field: 'lat', message: 'Wajib diisi' },
            lng !== undefined ? null : { field: 'lng', message: 'Wajib diisi' },
          ].filter((d) => d !== null) as any,
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Validate type enum
    const validTypes: ObstacleType[] = ['flood', 'accident', 'road_closure', 'construction', 'damaged_road', 'other'];
    if (!validTypes.includes(type as ObstacleType)) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: `Tipe rintangan tidak valid. Harus salah satu dari: ${validTypes.join(', ')}`,
          details: [{ field: 'type', message: `Nilai yang valid: ${validTypes.join(', ')}` }],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Validate severity (1-5)
    const severityNum = parseInt(severity, 10);
    if (isNaN(severityNum) || severityNum < 1 || severityNum > 5) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'severity harus bilangan bulat antara 1 dan 5',
          details: [{ field: 'severity', message: 'Rentang valid: 1-5' }],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Validate description max length
    if (description.length > 500) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Deskripsi maksimal 500 karakter',
          details: [{ field: 'description', message: `Maksimal 500 karakter, diterima ${description.length}` }],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Validate coordinates
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Koordinat GPS tidak valid',
          details: [
            { field: 'lat', message: 'Rentang valid: -90 sampai 90' },
            { field: 'lng', message: 'Rentang valid: -180 sampai 180' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // Upload photo to Firebase Storage if provided
    let imageUrl: string | null = null;
    if (req.file) {
      try {
        const bucket = getStorage().bucket(config.firebase.storageBucket);
        const fileName = `obstacles/${Date.now()}_${req.file.originalname}`;
        const file = bucket.file(fileName);
        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype },
        });
        await file.makePublic();
        imageUrl = file.publicUrl();
        logger.info(`[Obstacles] Photo uploaded: ${imageUrl}`);
      } catch (storageError) {
        logger.error(storageError);
        // Continue without image — report still valid
      }
    }

    // Analyze with Gemini Vision if image provided
    let aiSeverity: string | null = null;
    let actionTaken: string | null = null;
    if (req.file && imageUrl) {
      try {
        const analysis = await aiService.analyzeObstacle(req.file.buffer, req.file.mimetype);
        logger.info(`[Obstacles] AI analysis result:`, analysis);

        aiSeverity = analysis.severity;
        actionTaken = analysis.requiresReroute ? 'rerouted' : 'ignored';

        // If high severity, trigger reroute
        if ((analysis.severity === 'high' || analysis.severity === '5') && analysis.requiresReroute) {
          const rerouteResult = await rerouteCourier({
            courierId,
            avoidLocation: `${latNum},${lngNum}`,
            reason: `Obstacle detected: ${analysis.description}`,
          });
          logger.info(`[Obstacles] Reroute result:`, rerouteResult);
        }
      } catch (aiError) {
        logger.error(aiError);
        // Don't fail the entire request if AI analysis fails
      }
    }

    // Create obstacle record in Firestore
    const obstacleStatus: 'pending_analysis' | 'analyzed' = aiSeverity ? 'analyzed' : 'pending_analysis';
    const obstacle = {
      courierId,
      type: type as ObstacleType,
      severity: severityNum as ObstacleSeverity,
      description,
      imageUrl,
      location: { lat: latNum, lng: lngNum },
      status: obstacleStatus,
      aiAnalysis: aiSeverity
        ? {
            severity: aiSeverity,
            description: `AI image analysis result`,
            actionTaken: actionTaken as 'rerouted' | 'ignored',
          }
        : null,
      createdAt: new Date(),
    };

    const obstacleId = await firestoreService.createObstacle(obstacle);
    logger.info(`[Obstacles] Created obstacle record: ${obstacleId}`);

    // Update obstacle with AI analysis result if we have it
    if (aiSeverity) {
      await firestoreService.updateObstacleAnalysis(obstacleId, {
        severity: aiSeverity,
        description: 'AI image analysis result',
        actionTaken: actionTaken!,
      });
    }

    const successRes: SuccessResponse = {
      success: true,
      data: {
        reportId: obstacleId,
        severity: aiSeverity || 'unknown',
        actionTaken: actionTaken || 'none',
        message: 'Laporan berhasil dikirim',
      },
    };
    res.status(201).json(successRes);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'IMAGE_PROCESSING_FAILED',
        message: 'Gagal menganalisis foto. Coba lagi.',
      },
    };
    res.status(500).json(errorRes);
  }
});

/**
 * GET /api/v1/obstacles/:obstacleId
 * Get obstacle details and analysis
 */
router.get('/:obstacleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { obstacleId } = req.params;
    const obstacle = await firestoreService.getObstacle(obstacleId);

    if (!obstacle) {
      const errorRes: ErrorResponse = {
        error: {
          code: 'OBSTACLE_NOT_FOUND',
          message: 'Laporan rintangan tidak ditemukan',
        },
      };
      res.status(404).json(errorRes);
      return;
    }

    const successRes: SuccessResponse = {
      success: true,
      data: obstacle,
    };
    res.json(successRes);
  } catch (error) {
    logger.error(error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'Gagal mengambil laporan rintangan',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;