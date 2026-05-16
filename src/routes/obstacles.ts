// filepath: src/routes/obstacles.ts
/**
 * Route Handler: Obstacles
 * POST /api/v1/obstacles/report - Report and analyze obstacles
 * Per INTEGRATION_SPEC §2.3 - Accepts multipart/form-data with optional photo
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
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
          message: 'Missing required fields: courierId, type, severity, description, lat, lng',
          details: [
            courierId ? null : { field: 'courierId', message: 'Required' },
            type ? null : { field: 'type', message: 'Required' },
            severity ? null : { field: 'severity', message: 'Required' },
            description ? null : { field: 'description', message: 'Required' },
            lat !== undefined ? null : { field: 'lat', message: 'Required' },
            lng !== undefined ? null : { field: 'lng', message: 'Required' },
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
          message: `Invalid obstacle type. Must be one of: ${validTypes.join(', ')}`,
          details: [{ field: 'type', message: `Valid values: ${validTypes.join(', ')}` }],
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
          message: 'severity must be an integer between 1 and 5',
          details: [{ field: 'severity', message: 'Valid range: 1-5' }],
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
          message: 'Invalid GPS coordinates',
          details: [
            { field: 'lat', message: 'Valid range: -90 to 90' },
            { field: 'lng', message: 'Valid range: -180 to 180' },
          ],
        },
      };
      res.status(400).json(errorRes);
      return;
    }

    // TODO: Upload photo to Firebase Storage if provided
    let imageUrl: string | null = null;
    if (req.file) {
      console.log(`[Obstacles] Processing photo: ${req.file.originalname} (${req.file.size} bytes)`);
      // For now, use a placeholder. In production, upload to Firebase Storage:
      // const bucket = admin.storage().bucket();
      // const file = bucket.file(`obstacles/${Date.now()}_${req.file.originalname}`);
      // await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
      // imageUrl = await file.publicUrl();
      imageUrl = `https://placeholder.example.com/obstacle_${Date.now()}.jpg`;
    }

    // Create obstacle record in Firestore
    const obstacle = {
      courierId,
      type: type as ObstacleType,
      severity: severityNum as ObstacleSeverity,
      description,
      imageUrl,
      location: { lat: latNum, lng: lngNum },
      status: 'pending_analysis' as const,
      aiAnalysis: null,
      createdAt: new Date(),
    };

    const obstacleId = await firestoreService.createObstacle(obstacle);
    console.log(`[Obstacles] Created obstacle record: ${obstacleId}`);

    // Analyze with Gemini Vision if image provided
    let analysis = null;
    if (imageUrl) {
      try {
        analysis = await aiService.analyzeObstacle(imageUrl);
        console.log(`[Obstacles] AI analysis result:`, analysis);

        // Update obstacle with AI analysis
        await firestoreService.updateObstacleAnalysis(obstacleId, {
          severity: analysis.severity,
          description: analysis.description,
          actionTaken: analysis.requiresReroute ? 'rerouted' : 'ignored',
        });

        // If high severity, trigger reroute
        if ((analysis.severity === 'high' || analysis.severity === '5') && analysis.requiresReroute) {
          const rerouteResult = await rerouteCourier({
            courierId,
            avoidLocation: `${latNum},${lngNum}`,
            reason: `Obstacle detected: ${analysis.description}`,
          });
          console.log(`[Obstacles] Reroute result:`, rerouteResult);
        }
      } catch (aiError) {
        console.error('[Obstacles] AI analysis failed:', aiError);
        // Don't fail the entire request if AI analysis fails
      }
    }

    const successRes: SuccessResponse = {
      success: true,
      data: {
        reportId: obstacleId,
        message: 'Laporan berhasil dikirim',
      },
    };
    res.status(201).json(successRes);
  } catch (error) {
    console.error('[Obstacles] Error:', error);
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
          message: 'Obstacle not found',
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
    console.error('[Obstacles] Error:', error);
    const errorRes: ErrorResponse = {
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'Failed to retrieve obstacle',
      },
    };
    res.status(500).json(errorRes);
  }
});

export default router;