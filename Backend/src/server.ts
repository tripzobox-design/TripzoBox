import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config, validateEnv } from './config/env.js';

const startServer = async (): Promise<void> => {
  try {
    validateEnv();

    // Connect to MongoDB
    await connectDB();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 TripzoBox Backend API Server running on port ${config.port}`);
      console.log(`🔗 Health Check: http://localhost:${config.port}/health`);
      console.log(`📡 API Base:     http://localhost:${config.port}/api/v1`);
      console.log(`🌍 Environment:  ${config.nodeEnv}`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

