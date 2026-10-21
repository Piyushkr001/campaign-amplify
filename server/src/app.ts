import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { campaignRouter } from './modules/campaigns/campaign.routes';
import { creatorRouter } from './modules/creator/creator.routes';
import { reviewRouter } from './modules/reviews/review.routes';
import { myContributionsRouter } from './modules/contributions/contribution.routes';
import { paymentsRouter } from './modules/payments/payment.routes';
import { authRouter } from './modules/auth/auth.routes';
import { activityRouter } from './modules/activity/activity.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { apiSuccess } from './utils/response';

export function createApp(): Express {
  const app = express();

  // Security & Core Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: '*', // Allow local Expo dev client & emulators
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());

  // Health endpoint (process health)
  app.get('/api/v1/health', (_req, res) => {
    apiSuccess(res, {
      status: 'ok',
      service: 'campaign-amplify-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness endpoint (checks database connectivity)
  app.get('/api/v1/ready', async (_req, res) => {
    if (!env.DATABASE_URL) {
      return apiSuccess(res, {
        status: 'ready',
        database: 'standalone_fallback_mode',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const { getDb } = await import('./db/index');
      const { sql } = await import('drizzle-orm');
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      return apiSuccess(res, {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[ReadyCheck] Database connectivity check failed:', err);
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is currently unreachable.',
        },
      });
    }
  });

  // API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/campaigns', campaignRouter);
  app.use('/api/v1/me/campaigns', creatorRouter);
  app.use('/api/v1/review/campaigns', reviewRouter);
  app.use('/api/v1/me/contributions', myContributionsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/me/activity', activityRouter);
  app.use('/api/v1/ai', aiRouter);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
