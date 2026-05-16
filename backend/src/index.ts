/**
 * Pandu.ai Backend - Entry Point
 * Express server initialization, routes setup, and listener startup
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/index.js';
import { setupOrderListener } from './listeners/orderListener.js';
import ordersRouter from './routes/orders.js';
import obstaclesRouter from './routes/obstacles.js';
import simulationRouter from './routes/simulation.js';
import driverRouter from './routes/driver.js';
import routesRouter from './routes/routes.js';
import { HealthResponse, ErrorResponse } from './types/index.js';
import { logger } from './utils/logger.js';

// ============ App Setup ============

const app: Express = express();

// Trust Cloud Run reverse proxy headers (required for rate-limit IP detection and HTTPS redirects)
app.set('trust proxy', true);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(cors({
  origin: config.corsOrigin === '*'
    ? '*'
    : config.corsOrigin.split(',').map(d => d.trim()),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
  maxAge: 86400,
  credentials: false,
}));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Response compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req) => !req.headers['content-type']?.toLowerCase().includes('multipart'),
}));

// Structured request logging (before rate limiter to preserve IP)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      userAgent: req.headers['user-agent'],
      clientIp: req.ip || req.socket.remoteAddress,
    }, `${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Rate limiting per INTEGRATION_SPEC §2.1: 100 req/min general, 240 req/min for location
const globalLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Terlalu banyak permintaan. Coba lagi sebentar.',
    },
  } as ErrorResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health',
});

const locationLimiter = rateLimit({
  windowMs: 60000,
  max: 240,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Terlalu banyak permintaan lokasi. Coba lagi sebentar.',
    },
  } as ErrorResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1', globalLimiter);
app.use('/api/v1/driver/location', locationLimiter);

// ============ Health Check (NO AUTH REQUIRED) ============

const serverStartTime = Date.now();

const healthHandler = async (req: express.Request, res: express.Response) => {
  try {
    let firestoreStatus: 'ok' | 'failing' = 'ok';
    let geminiStatus: 'ok' | 'failing' = 'ok';
    let mapsStatus: 'ok' | 'failing' = 'ok';

    try {
      const { firestoreService } = await import('./services/firestore.service.js');
      await firestoreService.getAllCouriers();
    } catch (err) {
      firestoreStatus = 'failing';
      logger.warn({ err }, 'Health: Firestore probe failed');
    }

    try {
      const { aiService } = await import('./services/ai.service.js');
      await aiService.processMessage('ping');
    } catch (err) {
      geminiStatus = 'failing';
      logger.warn({ err }, 'Health: Gemini probe failed');
    }

    const allOk = firestoreStatus === 'ok' && geminiStatus === 'ok' && mapsStatus === 'ok';
    const anyOk = firestoreStatus === 'ok' || geminiStatus === 'ok' || mapsStatus === 'ok';
    const health: HealthResponse = {
      status: allOk ? 'ok' : (anyOk ? 'degraded' : 'down'),
      services: {
        firestore: firestoreStatus,
        gemini: geminiStatus,
        maps: mapsStatus,
        storage: 'ok',
      },
      uptime_seconds: Math.floor((Date.now() - serverStartTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
    };
    res.status(200).json(health);
  } catch (err) {
    logger.error({ err }, 'Health: unhandled error');
    const health: HealthResponse = {
      status: 'down',
      services: {
        firestore: 'failing',
        gemini: 'failing',
        maps: 'failing',
        storage: 'failing',
      },
    };
    res.status(503).json(health);
  }
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// ============ API Key Validation ============

app.use('/api/v1', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key tidak ada di header x-api-key',
      },
    };
    res.status(401).json(errorResponse);
    return;
  }

  if (apiKey !== config.apiKey) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INVALID_API_KEY',
        message: 'API key tidak valid',
      },
    };
    res.status(401).json(errorResponse);
    return;
  }

  next();
});

// API v1 routes
const apiV1 = express.Router();

apiV1.use('/orders', ordersRouter);
apiV1.use('/obstacles', obstaclesRouter);
apiV1.use('/simulation', simulationRouter);
apiV1.use('/driver', driverRouter);
apiV1.use('/routes', routesRouter);

app.use('/api/v1', apiV1);

// 404 handler
app.use((req, res) => {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint tidak ditemukan',
    },
  };
  res.status(404).json(errorResponse);
});

// Multer file size limit handler (413)
app.use(
  (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.name === 'MulterError' && (err as any).code === 'LIMIT_FILE_SIZE') {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Ukuran file melebihi batas 5 MB',
        },
      };
      res.status(413).json(errorResponse);
      return;
    }
    next(err);
  }
);

// Generic error handler
app.use(
  (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kesalahan internal server',
        details: [
          {
            message: err.message,
          },
        ],
      },
    };
    res.status(500).json(errorResponse);
  }
);

// ============ Server Startup ============

async function startServer(): Promise<void> {
  try {
    validateConfig();

    let unsubscribeOrderListener: (() => void) | null = null;
    try {
      unsubscribeOrderListener = setupOrderListener();
      logger.info('Order listener initialized');
    } catch (err) {
      logger.warn({ err }, 'Could not initialize order listener');
    }

    const port = config.port;
    const server = app.listen(port, () => {
      logger.info(`Pandu.ai Backend running on port ${port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, draining...`);
      if (unsubscribeOrderListener) unsubscribeOrderListener();
      server.close(() => {
        logger.info('Server closed, exiting');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced exit after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
