import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes that are working
import monitoringRoutes from './routes/monitoring';
import workshopRoutes from './routes/workshop';

// Import middleware
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

class GamePanelApp {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      message: 'Too many requests from this IP, please try again later.'
    });

    // Apply middlewares
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    this.app.use(limiter);

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        features: ['monitoring', 'steam-workshop']
      });
    });

    // API routes
    this.app.use('/api/monitoring', monitoringRoutes);
    this.app.use('/api/workshop', workshopRoutes);

    // Basic info endpoint
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'Ctrl-Alt-Play Panel',
        version: '1.0.0',
        description: 'Next-generation game server management panel',
        features: [
          'Resource Monitoring',
          'Steam Workshop Integration',
          'Advanced Server Management',
          'Multi-Node Support'
        ]
      });
    });

    // Serve static files (frontend) - placeholder
    this.app.use(express.static('public'));

    // Catch-all route for SPA
    this.app.get('*', (req, res) => {
      res.status(404).json({
        error: 'Frontend not yet implemented',
        message: 'Please use the API endpoints directly for now',
        availableEndpoints: [
          '/health',
          '/api/info',
          '/api/monitoring/*',
          '/api/workshop/*'
        ]
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Ctrl-Alt-Play Panel started successfully!`);
      logger.info(`📡 Server running on port ${this.port}`);
      logger.info(`🏥 Health check: http://localhost:${this.port}/health`);
      logger.info(`📊 Monitoring API: http://localhost:${this.port}/api/monitoring`);
      logger.info(`🎮 Workshop API: http://localhost:${this.port}/api/workshop`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        logger.info('Server stopped');
      });
    }
  }
}

// Create and start the application
const app = new GamePanelApp();

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  app.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  app.stop();
  process.exit(0);
});

// Start the server
app.start();

export default app;
