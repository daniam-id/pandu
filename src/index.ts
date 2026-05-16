// filepath: src/index.ts
/**
 * Pandu.ai Backend - Entry Point
 * Express server initialization, routes setup, and listener startup
 */

import express, { Express } from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import { setupOrderListener } from './listeners/orderListener.js';
import ordersRouter from './routes/orders.js';
import obstaclesRouter from './routes/obstacles.js';
import simulationRouter from './routes/simulation.js';
import driverRouter from './routes/driver.js';
import { HealthResponse, ErrorResponse } from './types/index.js';

// ============ App Setup ============

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ Health Check (NO AUTH REQUIRED) ============
// Per INTEGRATION_SPEC §2.8 - Health endpoint requires NO authentication

app.get('/health', async (req, res) => {
  try {
    const health: HealthResponse = {
      status: 'healthy',
      services: {
        firestore: 'ok',
        gemini: 'ok',
        maps: 'ok',
      },
    };
    res.json(health);
  } catch (error) {
    const health: HealthResponse = {
      status: 'unhealthy',
      services: {
        firestore: 'failing',
        gemini: 'failing',
        maps: 'failing',
      },
    };
    res.status(503).json(health);
  }
});

// ============ API Key Validation (for /api/v1 routes) ============

app.use('/api/v1', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'MISSING_API_KEY',
        message: 'Missing API key in x-api-key header',
      },
    };
    res.status(401).json(errorResponse);
    return;
  }

  if (apiKey !== config.apiKey) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
      },
    };
    res.status(403).json(errorResponse);
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

app.use('/api/v1', apiV1);

// 404 handler
app.use((req, res) => {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  };
  res.status(404).json(errorResponse);
});

// Error handler
app.use(
  (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
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
    // Validate configuration
    validateConfig();

    // Start listening for orders on Firestore
    let unsubscribeOrderListener: (() => void) | null = null;
    try {
      unsubscribeOrderListener = setupOrderListener();
      console.log('[Server] Order listener initialized');
    } catch (error) {
      console.warn('[Server] Could not initialize order listener:', error);
      // Don't fail startup if listener init fails
    }

    // Start Express server
    const port = config.port;
    app.listen(port, () => {
      console.log(`[Server] ✅ Pandu.ai Backend running on port ${port}`);
      console.log(`[Server] Health check: http://localhost:${port}/health`);
      console.log(`[Server] API base: http://localhost:${port}/api/v1`);
    });

    // Graceful shutdown handler
    process.on('SIGINT', () => {
      console.log('[Server] Shutting down gracefully...');
      if (unsubscribeOrderListener) {
        unsubscribeOrderListener();
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();