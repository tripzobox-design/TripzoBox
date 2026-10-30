import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess, sendError } from './utils/response.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import diaryRoutes from './routes/diaryRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

export const createApp = (): Express => {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxies (Nginx, Render, etc.)
  app.set('trust proxy', 1);

  // Security headers (Allow cross-origin resource sharing for static files / uploads)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
  }

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(config.cookieSecret));

  // Serve static uploaded files
  app.use('/uploads', express.static(config.uploadDir));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() }, 'TripzoBox API Server OK');
  });

  // Mount API v1 routes
  const apiV1 = express.Router();
  apiV1.get('/health', (req: Request, res: Response) => {
    sendSuccess(res, { status: 'healthy', version: '1.0.0' }, 'TripzoBox API v1 Operational');
  });

  apiV1.use('/auth', authRoutes);
  apiV1.use('/trips', tripRoutes);
  apiV1.use('/destinations', destinationRoutes);
  apiV1.use('/diary', diaryRoutes);
  apiV1.use('/stories', storyRoutes);
  apiV1.use('/messages', messageRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/vault', vaultRoutes);
  apiV1.use('/upload', uploadRoutes);

  app.use('/api/v1', apiV1);

  // 404 Route Not Found
  app.use('*', (req: Request, res: Response) => {
    sendError(res, `Cannot ${req.method} ${req.originalUrl} - Route not found`, 404);
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};

