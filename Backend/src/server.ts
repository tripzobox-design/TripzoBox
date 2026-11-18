import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config, validateEnv } from './config/env.js';
import { verifyEmailService } from './services/emailService.js';

const startServer = async (): Promise<void> => {
  try {
    validateEnv();

    const app = createApp();
    const port = Number(process.env.PORT) || config.port || 10000;
    const host = '0.0.0.0';

    const server = app.listen(port, host, () => {
      console.log(`====================================================`);
      console.log(`🚀 TripzoBox Backend API Server running on port ${port}`);
      console.log(`🔗 Health Check: http://${host}:${port}/health`);
      console.log(`📡 API Base:     http://${host}:${port}/api/v1`);
      console.log(`🌍 Environment:  ${config.nodeEnv}`);
      console.log(`====================================================`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('[Server] HTTP server error:', error);
      process.exit(1);
    });

    // Idempotent graceful shutdown handling
    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections();
      }

      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await disconnectDB();
        } catch (dbErr) {
          console.error('[Server] Error disconnecting database during shutdown:', dbErr);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Connect to MongoDB after HTTP listener starts
    try {
      await connectDB();
      // Verify email service (Brevo HTTPS API or SMTP) asynchronously on startup
      verifyEmailService().catch((emailErr) => {
        console.warn('[Server] Email service verification note:', emailErr.message);
      });
    } catch (dbError) {
      console.error('[Server] Initial MongoDB connection failed:', dbError);
      if (!isShuttingDown) {
        isShuttingDown = true;
        if (typeof server.closeIdleConnections === 'function') {
          server.closeIdleConnections();
        }
        server.close(async () => {
          console.log('[Server] HTTP server closed due to database connection failure.');
          try {
            await disconnectDB();
          } catch (cleanErr) {
            console.error('[Server] Cleanup error after DB failure:', cleanErr);
          }
          process.exit(1);
        });

        // Safety fallback timer to guarantee exit even if connections persist
        const forceExitTimer = setTimeout(async () => {
          console.warn('[Server] Forcing process termination after DB failure timeout...');
          try {
            await disconnectDB();
          } catch {}
          process.exit(1);
        }, 5000);
        forceExitTimer.unref();
      }
    }
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

