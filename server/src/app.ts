import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { campaignRouter } from './modules/campaigns/campaign.routes';
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

  // Health endpoint
  app.get('/api/v1/health', (_req, res) => {
    apiSuccess(res, {
      status: 'ok',
      service: 'campaign-amplify-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 Routes
  app.use('/api/v1/campaigns', campaignRouter);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
