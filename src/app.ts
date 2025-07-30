import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import routes
import monitoringRoutes from './routes/monitoring';
import analyticsRoutes from './routes/analytics';
import workshopRoutes from './routes/workshop';
import filesRoutes from './routes/files';
import authRoutes from './routes/auth';
import serversRoutes from './routes/servers';
import usersRoutes from './routes/users';
import nodesRoutes from './routes/nodes';
import ctrlsRoutes from './routes/ctrls';
import altsRoutes from './routes/alts';
import consoleRoutes from './routes/console';
import pluginsRoutes from './routes/plugins';
import marketplaceRoutes from './routes/marketplace';
import { dashboardRoutes } from './routes/dashboard';

// Import middleware
import { errorHandler } from './middlewares/errorHandler';

/**
 * Create Express application for testing
 * Separate from main server to avoid WebSocket and server lifecycle issues
 */
export function createApp(): express.Application {
  const app = express();

  // DEBUG: Prove our code changes are being applied
  app.use((req, res, next) => {
    res.setHeader('X-Debug-Source', 'My-App-Is-Definitely-Running-This-Code');
    next();
  });

  // Security middleware - DISABLED FOR TESTING
  // app.use(helmet({
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'"],
  //       styleSrc: ["'self'", "'unsafe-inline'"],
  //       scriptSrc: ["'self'"],
  //       imgSrc: ["'self'", "data:", "https:"],
  //       connectSrc: ["'self'", "ws:", "wss:"],
  //       fontSrc: ["'self'", "https:", "data:"],
  //       objectSrc: ["'none'"],
  //       mediaSrc: ["'self'"],
  //       frameSrc: ["'none'"],
  //     },
  //   },
  //   crossOriginEmbedderPolicy: false
  // }));

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));

  // Compression and parsing
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting - COMPLETELY DISABLED FOR TESTING
  // const limiter = rateLimit({
  //   windowMs: 1 * 60 * 1000, // 1 minute window for faster reset
  //   max: 1000, // Much higher limit for development and testing
  //   message: 'Too many requests from this IP, please try again later.',
  //   standardHeaders: true,
  //   legacyHeaders: false,
  //   skip: (req, res) => process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true', // Allow disabling in development
  // });
  // app.use(limiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/servers', serversRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/nodes', nodesRoutes);
  app.use('/api/ctrls', ctrlsRoutes);
  app.use('/api/alts', altsRoutes);
  app.use('/api/console', consoleRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/workshop', workshopRoutes);
  app.use('/api/files', filesRoutes);
  // app.use('/api', pluginsRoutes);  // Temporarily disabled
  app.use('/api/plugins', pluginsRoutes);
  app.use('/api/integration', marketplaceRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

// Export configured app for testing
export default createApp();
