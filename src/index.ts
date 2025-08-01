import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer, Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import PluginManager from './services/PluginManager.full';

// Import routes that are working
import monitoringRoutes from './routes/monitoring';
import analyticsRoutes from './routes/analytics';
import workshopRoutes from './routes/workshop';
import filesRoutes from './routes/files';
import consoleRoutes from './routes/console';
import pluginsRoutes from './routes/plugins';
import authRoutes from './routes/auth';
import serversRoutes from './routes/servers';
import usersRoutes from './routes/users';
import userProfileRoutes from './routes/userProfile';
import nodesRoutes from './routes/nodes';
import ctrlsRoutes from './routes/ctrls';
import altsRoutes from './routes/alts';
import agentsRoutes from './routes/agents';
import { dashboardRoutes } from './routes/dashboard';

// Import middleware and services
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';
import { AgentDiscoveryService } from './services/agentDiscoveryService';
import { MonitoringService } from './services/monitoringService';
import { DatabaseService } from './services/database';
import { getSafePortConfiguration, portManager } from './utils/portManager';
import { initializeRedis } from './utils/redisClient';

// Load environment variables with development/production awareness
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else {
  dotenv.config();
}

class GamePanelApp {
  private app: express.Application;
  private server!: Server;
  private wss!: WebSocketServer;
  private port: number;
  private frontendPort: number;
  private agentPort: number;
  private deploymentConfig: any;

  constructor() {
    this.app = express();
    // Initialize with default ports, will be updated during start()
    this.port = parseInt(process.env.PORT || '3000');
    this.frontendPort = parseInt(process.env.FRONTEND_PORT || '3001');
    this.agentPort = parseInt(process.env.AGENT_PORT || '8080');

    this.initializeMiddlewares();
    this.initializeBasicRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  private initializeMiddlewares(): void {
    // Rate limiting - DISABLED FOR TESTING
    // const limiter = rateLimit({
    //   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
    //   max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    //   message: 'Too many requests from this IP, please try again later.'
    // });

    // Apply middlewares
    // this.app.use(helmet()); // DISABLED FOR TESTING
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    // this.app.use(limiter); // DISABLED FOR TESTING

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeBasicRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.6.0',
        features: ['monitoring', 'steam-workshop', 'user-profiles', 'notifications', 'external-agents', 'ctrl-alt-system']
      });
    });
  }

  private initializeRoutes(): void {
    // Essential API routes
    console.log('Adding essential API routes...');
    console.log('Mounting /api/auth routes...');
    this.app.use('/api/auth', authRoutes);
    console.log('Mounted /api/auth routes successfully');
    this.app.use('/api/monitoring', monitoringRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/workshop', workshopRoutes);
    this.app.use('/api/files', filesRoutes);
    this.app.use('/api/console', consoleRoutes);
    this.app.use('/api/plugins', pluginsRoutes);
    
    // Core management routes
    this.app.use('/api/servers', serversRoutes);
    this.app.use('/api/users', usersRoutes);
    this.app.use('/api/user', userProfileRoutes);
    this.app.use('/api/nodes', nodesRoutes);
    this.app.use('/api/ctrls', ctrlsRoutes);
    this.app.use('/api/alts', altsRoutes);
    this.app.use('/api/agents', agentsRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);
    console.log('Added essential API routes successfully');

    // Basic info endpoint
    console.log('Adding /api/info route...');
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
    console.log('Added /api/info route successfully');

    // Serve static files (frontend)
    console.log('Adding static file serving...');
    
    // Serve Next.js static files from frontend/public
    this.app.use(express.static('frontend/public'));
    
    // Serve Next.js built files from frontend/.next/static
    this.app.use('/_next/static', express.static('frontend/.next/static'));
    
    // Serve legacy public files if they exist
    this.app.use(express.static('public'));
    
    console.log('Added static file serving successfully');

    // Safe redirect routes
    console.log('Adding redirect routes...');
    
    this.app.get('/console', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/console`);
    });

    this.app.get('/', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/dashboard`);
    });
    console.log('Added redirect routes successfully');

    // HTML redirect routes
    this.app.get('/dashboard.html', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/dashboard`);
    });

    this.app.get('/login.html', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/login`);
    });

    this.app.get('/register.html', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/register`);
    });

    this.app.get('/files.html', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/files`);
    });

    this.app.get('/console.html', (req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.redirect(`${baseUrl}/console`);
    });

    // Serve frontend HTML files directly from Next.js build
    this.app.use((req, res, next) => {
      // Skip API routes and WebSocket routes
      if (req.path.startsWith('/api/') || req.path.startsWith('/ws/')) {
        return next();
      }
      
      // Handling frontend request
      
      // Determine the HTML file path based on the request
      let htmlFilePath = '';
      
      // Handle root path
      if (req.path === '/' || req.path === '') {
        htmlFilePath = 'frontend/.next/server/pages/index.html';
      } 
      // Handle specific routes
      else if (req.path === '/login') {
        htmlFilePath = 'frontend/.next/server/pages/login.html';
      } else if (req.path === '/register') {
        htmlFilePath = 'frontend/.next/server/pages/register.html';
      } else if (req.path === '/dashboard') {
        htmlFilePath = 'frontend/.next/server/pages/dashboard.html';
      } else if (req.path === '/profile') {
        htmlFilePath = 'frontend/.next/server/pages/profile.html';
      } else if (req.path === '/servers') {
        htmlFilePath = 'frontend/.next/server/pages/servers.html';
      } else if (req.path === '/agents') {
        htmlFilePath = 'frontend/.next/server/pages/agents.html';
      } else if (req.path === '/ctrls') {
        htmlFilePath = 'frontend/.next/server/pages/ctrls.html';
      } else if (req.path === '/files') {
        htmlFilePath = 'frontend/.next/server/pages/files.html';
      } else if (req.path === '/console') {
        htmlFilePath = 'frontend/.next/server/pages/console.html';
      } else if (req.path === '/monitoring') {
        htmlFilePath = 'frontend/.next/server/pages/monitoring.html';
      } else if (req.path === '/analytics') {
        htmlFilePath = 'frontend/.next/server/pages/analytics.html';
      } else if (req.path.startsWith('/admin')) {
        // Handle admin routes
        htmlFilePath = 'frontend/.next/server/pages/admin.html';
      } else if (req.path.startsWith('/alts')) {
        // Handle alts routes
        htmlFilePath = 'frontend/.next/server/pages/alts.html';
      } else if (req.path.startsWith('/servers/')) {
        // Handle specific server routes
        htmlFilePath = 'frontend/.next/server/pages/servers.html';
      } else {
        // For any other route, try to serve the corresponding HTML file
        // or fall back to index.html for client-side routing
        const path = req.path.replace(/^\//, '').replace(/\//g, '-') || 'index';
        htmlFilePath = `frontend/.next/server/pages/${path}.html`;
      }
      
      // Trying to serve HTML file
      
      // Check if the file exists
      const fullPath = path.resolve('/app', htmlFilePath);
      
      if (fs.existsSync(fullPath)) {
        // Serving HTML file
        res.setHeader('Content-Type', 'text/html');
        fs.readFile(fullPath, 'utf8', (err, data) => {
          if (err) {
            console.error(`[ERROR] Failed to read file ${fullPath}:`, err);
            next(err);
          } else {
            res.send(data);
          }
        });
      } else {
        // If the specific HTML file doesn't exist, try index.html as fallback
        const indexPath = 'frontend/.next/server/pages/index.html';
        const fullIndexPath = path.resolve('/app', indexPath);
        // Trying fallback index.html
        
        if (fs.existsSync(fullIndexPath)) {
          // Serving fallback HTML file
          res.setHeader('Content-Type', 'text/html');
          fs.readFile(fullIndexPath, 'utf8', (err, data) => {
            if (err) {
              console.error(`[ERROR] Failed to read file ${fullIndexPath}:`, err);
              next(err);
            } else {
              res.send(data);
            }
          });
        } else {
          // If even index.html doesn't exist, let the next middleware handle it
          // No HTML file found, passing to next middleware
          next();
        }
      }
    });

    // Simple 404 handler (avoid problematic catch-all)
    this.app.use((req, res) => {
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      res.status(404).json({
        error: 'Page not found',
        message: 'The requested page does not exist. Please use the React frontend.',
        reactFrontend: baseUrl
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeWebSocket(): void {
    // WebSocket will be initialized when server starts
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket connection established');

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'console',
        message: '\x1b[32m[INFO] Connected to server console\x1b[0m'
      }));

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      // Start sending periodic stats updates
      this.startStatsUpdates(ws);
    });
  }

  private handleWebSocketMessage(ws: WebSocket, message: { type: string; command?: string; action?: string }): void {
    switch (message.type) {
      case 'command':
        if (message.command) {
          this.handleServerCommand(ws, message.command);
        }
        break;
      case 'power':
        if (message.action) {
          this.handlePowerAction(ws, message.action);
        }
        break;
      default:
        logger.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private handleServerCommand(ws: WebSocket, command: string): void {
    logger.info(`Server command received: ${command}`);

    // Simulate command execution
    setTimeout(() => {
      const responses = {
        'help': '[Server thread/INFO]: Available commands: help, list, stop, say, time, weather',
        'list': '[Server thread/INFO]: There are 0 of a max of 20 players online:',
        'time': '[Server thread/INFO]: The time is 1000',
        'weather': '[Server thread/INFO]: The weather is clear',
        'say': '[Server thread/INFO]: [Server] Hello from the server!',
        'stop': '[Server thread/INFO]: Stopping the server...'
      };

      const response = responses[command as keyof typeof responses] ||
        `[Server thread/INFO]: Unknown command. Type "help" for help.`;

      ws.send(JSON.stringify({
        type: 'console',
        message: response
      }));
    }, 100);
  }

  private handlePowerAction(ws: WebSocket, action: string): void {
    logger.info(`Power action received: ${action}`);

    setTimeout(() => {
      const actions = {
        'start': '[Server thread/INFO]: Starting server...',
        'stop': '[Server thread/INFO]: Stopping server...',
        'restart': '[Server thread/INFO]: Restarting server...',
        'kill': '[Server thread/INFO]: Force stopping server...'
      };

      const response = actions[action as keyof typeof actions] ||
        '[Server thread/ERROR]: Unknown power action';

      ws.send(JSON.stringify({
        type: 'console',
        message: response
      }));
    }, 500);
  }

  private startStatsUpdates(ws: WebSocket): void {
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }

      // Generate realistic server stats
      const stats = {
        cpu: Math.random() * 80 + 10, // 10-90%
        memory: Math.random() * 1024 + 512, // 512-1536 MB
        disk: Math.random() * 5000 + 2000, // 2-7 GB
        networkRx: Math.random() * 500 + 100, // 100-600 MB
        networkTx: Math.random() * 200 + 50, // 50-250 MB
        players: Math.floor(Math.random() * 10) // 0-9 players
      };

      ws.send(JSON.stringify({
        type: 'stats',
        data: stats
      }));
    }, 2000);
  }

  public async start(): Promise<void> {
    try {
      console.log('Starting application...');
      
      // Initialize database first
      console.log('Initializing database...');
      await DatabaseService.initialize();
      console.log('📄 Database initialized successfully');
      logger.info('📄 Database initialized successfully');
      
      // Initialize Redis
      console.log('Initializing Redis...');
      await initializeRedis();
      console.log('🔗 Redis initialized successfully');
      logger.info('🔗 Redis initialized successfully');

      // Initialize Plugin Manager
      console.log('Initializing Plugin Manager...');
      const prisma = DatabaseService.getInstance();
      const pluginManager = new PluginManager(prisma);
      await pluginManager.initialize();
      console.log('🔌 Plugin Manager initialized successfully');
      logger.info('🔌 Plugin Manager initialized successfully');

      // Initialize API routes after database is ready
      console.log('Initializing routes...');
      this.initializeRoutes();
      console.log('🛣️  API routes initialized successfully');
      logger.info('🛣️  API routes initialized successfully');

      // Create HTTP server
      console.log('Creating HTTP server...');
      this.server = createServer(this.app);
      console.log('🌐 HTTP server created successfully');
      logger.info('🌐 HTTP server created successfully');

      // Initialize WebSocket server
      console.log('Initializing WebSocket server...');
      this.wss = new WebSocketServer({ server: this.server });
      this.setupWebSocketHandlers();
      console.log('🔌 WebSocket server initialized successfully');
      logger.info('� WebSocket server initialized successfully');

      // Skip agent discovery for now to get the server running
      console.log('Skipping agent discovery service for now...');
      logger.info('🔍 Skipping agent discovery service for now...');

      console.log('Starting HTTP server...');
      this.server.listen(this.port, () => {
      logger.info(`🚀 Ctrl-Alt-Play Panel started successfully!`);
      logger.info(`📡 Server running on port ${this.port}`);
      logger.info(`🔌 WebSocket server ready for connections`);
      logger.info(`🔧 Agent WebSocket server ready on port ${process.env.AGENT_PORT || '8080'}`);
      logger.info(`🏥 Health check: http://localhost:${this.port}/health`);
      logger.info(`📊 Monitoring API: http://localhost:${this.port}/api/monitoring`);
      logger.info(`🎮 Workshop API: http://localhost:${this.port}/api/workshop`);
      logger.info(`🎛️  React Frontend: http://localhost:3001`);
      logger.info(`🎯 Backend API: http://localhost:${this.port}/api`);

      // Start monitoring scheduler
      this.startMonitoringScheduler();
    });
    } catch (error) {
      console.error('Failed to start application:', error);
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private startMonitoringScheduler(): void {
    const monitoringService = new MonitoringService();
    
    logger.info('📊 Starting monitoring scheduler...');
    
    // Collect server metrics every 30 seconds
    setInterval(async () => {
      try {
        await monitoringService.collectAllServerMetrics();
        logger.debug('📈 Server metrics collection completed');
      } catch (error) {
        logger.error('Failed to collect server metrics:', error);
      }
    }, 30000); // 30 seconds
    
    // Collect and emit system metrics every 5 seconds for real-time dashboard
    setInterval(async () => {
      try {
        await monitoringService.collectAndEmitSystemMetrics();
      } catch (error) {
        logger.error('Failed to collect system metrics:', error);
      }
    }, 5000); // 5 seconds for real-time updates
    
    // Emit initial stats after 2 seconds
    setTimeout(async () => {
      try {
        await monitoringService.collectAndEmitSystemMetrics();
        logger.info('📊 Initial monitoring data broadcast complete');
      } catch (error) {
        logger.error('Failed to emit initial stats:', error);
      }
    }, 2000);
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
app.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
