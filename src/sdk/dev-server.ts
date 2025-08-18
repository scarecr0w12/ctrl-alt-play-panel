/**
 * Plugin Development Server
 * Hot-reload development server for plugin development
 */

import express from 'express';
import * as chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import { DevServerOptions } from './types';

export class DevServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private watcher: chokidar.FSWatcher | null = null;
  private options: DevServerOptions;
  private pluginPath: string;

  constructor(pluginPath: string, options: Partial<DevServerOptions> = {}) {
    this.pluginPath = path.resolve(pluginPath);
    this.options = {
      port: 3001,
      host: 'localhost',
      watch: true,
      hotReload: true,
      cors: true,
      ...options
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // Enable CORS for development
    if (this.options.cors) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        next();
      });
    }

    // JSON parsing
    this.app.use(express.json());

    // Static file serving
    this.app.use('/assets', express.static(path.join(this.pluginPath, 'assets')));
  }

  private setupRoutes(): void {
    // Plugin status endpoint
    this.app.get('/status', (req, res) => {
      res.json({
        plugin: path.basename(this.pluginPath),
        status: 'development',
        mode: 'dev-server',
        hotReload: this.options.hotReload,
        watching: this.options.watch,
        timestamp: new Date().toISOString()
      });
    });

    // Plugin configuration endpoint
    this.app.get('/config', (req, res) => {
      try {
        const configPath = path.join(this.pluginPath, 'plugin.yaml');
        if (fs.existsSync(configPath)) {
          const yaml = require('js-yaml');
          const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
          res.json(config);
        } else {
          res.status(404).json({ error: 'Plugin configuration not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to load configuration' });
      }
    });

    // Plugin files endpoint
    this.app.get('/files', (req, res) => {
      try {
        const files = this.getPluginFiles();
        res.json({ files });
      } catch (error) {
        res.status(500).json({ error: 'Failed to list files' });
      }
    });

    // Reload trigger endpoint
    this.app.post('/reload', (req, res) => {
      this.triggerReload('manual');
      res.json({ success: true, message: 'Reload triggered' });
    });

    // Development tools endpoint
    this.app.get('/dev-tools', (req, res) => {
      res.json({
        features: {
          hotReload: this.options.hotReload,
          fileWatching: this.options.watch,
          webSocket: true,
          liveReload: true
        },
        paths: {
          plugin: this.pluginPath,
          config: path.join(this.pluginPath, 'plugin.yaml'),
          main: path.join(this.pluginPath, 'index.js')
        }
      });
    });
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ noServer: true });

    this.wss.on('connection', (ws) => {
      console.log('🔌 Development client connected');

      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          plugin: path.basename(this.pluginPath),
          status: 'connected',
          timestamp: new Date().toISOString()
        }
      }));

      ws.on('close', () => {
        console.log('🔌 Development client disconnected');
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(data, ws);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });
    });
  }

  private handleWebSocketMessage(data: any, ws: any): void {
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      case 'get-status':
        ws.send(JSON.stringify({
          type: 'status',
          data: {
            plugin: path.basename(this.pluginPath),
            files: this.getPluginFiles().length,
            watching: Boolean(this.watcher),
            timestamp: new Date().toISOString()
          }
        }));
        break;

      case 'trigger-reload':
        this.triggerReload('client-request');
        break;

      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }

  private getPluginFiles(): string[] {
    const files: string[] = [];
    const scanDir = (dir: string, basePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else {
          files.push(relativePath);
        }
      }
    };

    try {
      scanDir(this.pluginPath);
    } catch (error) {
      console.error('Failed to scan plugin files:', error);
    }

    return files;
  }

  private setupFileWatching(): void {
    if (!this.options.watch) return;

    this.watcher = chokidar.watch(this.pluginPath, {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/logs/**',
        '**/coverage/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on('change', (filePath) => {
      const relativePath = path.relative(this.pluginPath, filePath);
      console.log(`📝 File changed: ${relativePath}`);
      
      this.broadcastToClients({
        type: 'file-changed',
        data: {
          file: relativePath,
          path: filePath,
          timestamp: new Date().toISOString()
        }
      });

      if (this.options.hotReload) {
        this.triggerReload('file-change', relativePath);
      }
    });

    this.watcher.on('add', (filePath) => {
      const relativePath = path.relative(this.pluginPath, filePath);
      console.log(`📄 File added: ${relativePath}`);
      
      this.broadcastToClients({
        type: 'file-added',
        data: {
          file: relativePath,
          path: filePath,
          timestamp: new Date().toISOString()
        }
      });
    });

    this.watcher.on('unlink', (filePath) => {
      const relativePath = path.relative(this.pluginPath, filePath);
      console.log(`🗑️ File removed: ${relativePath}`);
      
      this.broadcastToClients({
        type: 'file-removed',
        data: {
          file: relativePath,
          path: filePath,
          timestamp: new Date().toISOString()
        }
      });
    });

    console.log('👀 File watcher started');
  }

  private triggerReload(reason: string, file?: string): void {
    console.log(`🔄 Plugin reload triggered: ${reason}${file ? ` (${file})` : ''}`);
    
    this.broadcastToClients({
      type: 'reload',
      data: {
        reason,
        file,
        timestamp: new Date().toISOString()
      }
    });
  }

  private broadcastToClients(message: any): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.options.port, this.options.host, () => {
        console.log(`🚀 Plugin development server started`);
        console.log(`   URL: http://${this.options.host}:${this.options.port}`);
        console.log(`   Plugin: ${path.basename(this.pluginPath)}`);
        console.log(`   Hot Reload: ${this.options.hotReload ? '✅' : '❌'}`);
        console.log(`   File Watching: ${this.options.watch ? '✅' : '❌'}`);
        
        // Setup WebSocket upgrade
        this.server.on('upgrade', (request: any, socket: any, head: any) => {
          this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request);
          });
        });

        // Setup file watching
        this.setupFileWatching();

        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${this.options.port} is already in use`);
          reject(new Error(`Port ${this.options.port} is already in use`));
        } else {
          console.error('❌ Failed to start development server:', error);
          reject(error);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🛑 Stopping development server...');
      
      // Stop file watcher
      if (this.watcher) {
        this.watcher.close();
        this.watcher = null;
      }

      // Close WebSocket connections
      this.wss.clients.forEach(client => {
        client.close();
      });

      // Close HTTP server
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Development server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    return `http://${this.options.host}:${this.options.port}`;
  }

  getWebSocketUrl(): string {
    return `ws://${this.options.host}:${this.options.port}`;
  }
}