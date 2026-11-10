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
import safetyRoutes from './routes/safetyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

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

  // CORS configuration (Supporting Frontend, Admin Panel, Cloudflare Workers/Pages, and Production domains)
  const allowedOrigins = [
    config.frontendUrl,
    config.adminUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://tripzobox.com',
    'https://admin.tripzobox.com',
    'https://tripzobox.tripzobox.workers.dev',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.includes('tripzobox') ||
          origin.endsWith('.tripzobox.com') ||
          origin.endsWith('.workers.dev') ||
          origin.endsWith('.pages.dev') ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.netlify.app') ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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

  // SEO Endpoints for crawlers querying API root
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://tripzobox.com/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://tripzobox.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://tripzobox.com/explore</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://tripzobox.com/trips</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://tripzobox.com/stories</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://tripzobox.com/how-it-works</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://tripzobox.com/safety</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://tripzobox.com/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://tripzobox.com/contact</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
</urlset>`);
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
  apiV1.use('/safety', safetyRoutes);
  apiV1.use('/admin', adminRoutes);
  apiV1.use('/content', contentRoutes);
  apiV1.use('/settings', settingsRoutes);
  apiV1.use('/reviews', reviewRoutes);

  app.use('/api/v1', apiV1);
  app.use('/api/reviews', reviewRoutes);

  // 404 Route Not Found
  app.use('*', (req: Request, res: Response) => {
    sendError(res, `Cannot ${req.method} ${req.originalUrl} - Route not found`, 404);
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};

