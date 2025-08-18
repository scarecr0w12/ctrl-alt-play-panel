/**
 * Plugin SDK Template System
 * Enhanced template generation and management for plugin development
 */

import { PluginTemplate, TemplateVariable } from './types';
import { TemplateUtils, FileUtils } from './utils';

/**
 * Enhanced Plugin Templates with more sophisticated structure
 */
export class PluginTemplateRegistry {
  private static templates: Map<string, PluginTemplate> = new Map();

  static registerTemplate(name: string, template: PluginTemplate): void {
    this.templates.set(name, template);
  }

  static getTemplate(name: string): PluginTemplate | undefined {
    return this.templates.get(name);
  }

  static listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  static getAllTemplates(): PluginTemplate[] {
    return Array.from(this.templates.values());
  }

  // Initialize with built-in templates
  static initialize(): void {
    // Basic Plugin Template
    this.registerTemplate('basic', {
      name: 'Basic Plugin',
      description: 'A simple plugin template with basic structure',
      files: {
        'plugin.yaml': `name: "{{name}}"
version: "{{version}}"
author: "{{author}}"
description: "{{description}}"
permissions:
  read: true
  write: false
  execute: false
  network: false
  database: false
  filesystem: false
  routes: {{enableRoutes}}
  hooks: {{enableHooks}}

dependencies: []

apis: []

hooks: []`,
        'index.js': `/**
 * {{name}} Plugin
 * {{description}}
 * 
 * @author {{author}}
 * @version {{version}}
 */

class {{className}} {
  constructor(context) {
    this.context = context;
    this.name = '{{name}}';
    this.version = '{{version}}';
    this.logger = context.logger.child({ plugin: this.name });
  }

  /**
   * Called when plugin is loaded
   */
  async onLoad() {
    this.logger.info('Plugin loading...');
    // Initialize your plugin here
  }

  /**
   * Called when plugin is enabled
   */
  async onEnable() {
    this.logger.info('Plugin enabled');
    // Start plugin services
  }

  /**
   * Called when plugin is disabled
   */
  async onDisable() {
    this.logger.info('Plugin disabled');
    // Stop plugin services
  }

  /**
   * Called when plugin is unloaded
   */
  async onUnload() {
    this.logger.info('Plugin unloading...');
    // Cleanup resources
  }
}

module.exports = {{className}};`,
        'package.json': `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint .",
    "dev": "plugin-cli dev",
    "build": "plugin-cli build",
    "docs": "plugin-cli docs"
  },
  "keywords": ["ctrl-alt-play", "plugin"],
  "author": "{{author}}",
  "license": "MIT",
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}`,
        'README.md': `# {{name}}

{{description}}

## Installation

\`\`\`bash
plugin-cli install ./{{name}}
plugin-cli enable {{name}}
\`\`\`

## Configuration

This plugin supports the following configuration options:

- \`enabled\`: Enable/disable the plugin
- \`debug\`: Enable debug logging

## API

### Endpoints

{{#if enableRoutes}}
- \`GET /{{name}}/status\` - Get plugin status
- \`POST /{{name}}/action\` - Perform plugin action
{{/if}}

## Development

\`\`\`bash
# Start development server
npm run dev

# Run tests
npm test

# Generate documentation
npm run docs
\`\`\`

## License

MIT`,
        'tests/plugin.test.js': `const {{className}} = require('../index');
const { MockPluginContext } = require('@ctrl-alt-play/plugin-sdk/testing');

describe('{{name}} Plugin', () => {
  let plugin;
  let context;

  beforeEach(() => {
    context = new MockPluginContext('{{name}}');
    plugin = new {{className}}(context);
  });

  test('should initialize correctly', () => {
    expect(plugin.name).toBe('{{name}}');
    expect(plugin.version).toBe('{{version}}');
  });

  test('should load without errors', async () => {
    await expect(plugin.onLoad()).resolves.not.toThrow();
  });

  test('should enable without errors', async () => {
    await expect(plugin.onEnable()).resolves.not.toThrow();
  });

  test('should disable without errors', async () => {
    await expect(plugin.onDisable()).resolves.not.toThrow();
  });

  test('should unload without errors', async () => {
    await expect(plugin.onUnload()).resolves.not.toThrow();
  });
});`
      },
      dependencies: ['jest', 'eslint'],
      instructions: `
1. Install dependencies: npm install
2. Run tests: npm test
3. Start development: npm run dev
4. Generate docs: npm run docs
`
    });

    // Game Server Template
    this.registerTemplate('game-server', {
      name: 'Game Server Plugin',
      description: 'Complete game server management plugin with Docker support',
      files: {
        'plugin.yaml': `name: "{{name}}"
version: "{{version}}"
author: "{{author}}"
description: "{{description}}"
permissions:
  read: true
  write: true
  execute: true
  network: true
  database: true
  filesystem: true
  routes: true
  hooks: true

gameServer:
  type: "{{gameType}}"
  ports:
    - container: {{gamePort}}
      host: {{gamePort}}
      protocol: "tcp"
  environment:
    - "SERVER_PORT={{gamePort}}"
    - "SERVER_NAME={{serverName}}"
    - "MAX_PLAYERS={{maxPlayers}}"

dependencies:
  - name: "dockerode"
    version: "^3.3.0"
  - name: "node-cron"
    version: "^3.0.0"`,

        'index.js': `/**
 * {{name}} Game Server Plugin
 * Manages {{gameType}} game servers with Docker support
 */

const Docker = require('dockerode');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class {{className}} {
  constructor(context) {
    this.context = context;
    this.name = '{{name}}';
    this.version = '{{version}}';
    this.logger = context.logger.child({ plugin: this.name });
    this.docker = new Docker();
    this.servers = new Map();
    this.backupSchedule = null;
  }

  async onLoad() {
    this.logger.info('Loading game server plugin...');
    
    // Register API routes
    if (this.context.permissions.routes) {
      this.registerRoutes();
    }

    // Initialize server monitoring
    this.startMonitoring();
  }

  async onEnable() {
    this.logger.info('Game server plugin enabled');
    
    // Start automatic backups
    this.scheduleBackups();
  }

  async onDisable() {
    this.logger.info('Game server plugin disabled');
    
    // Stop backups
    if (this.backupSchedule) {
      this.backupSchedule.stop();
    }
  }

  registerRoutes() {
    // Server management routes
    this.context.api.registerRoute({
      path: '/{{name}}/servers',
      method: 'GET',
      handler: 'listServers',
      description: 'List all game servers'
    });

    this.context.api.registerRoute({
      path: '/{{name}}/servers',
      method: 'POST',
      handler: 'createServer',
      description: 'Create a new game server'
    });

    this.context.api.registerRoute({
      path: '/{{name}}/servers/:id/start',
      method: 'POST',
      handler: 'startServer',
      description: 'Start a game server'
    });

    this.context.api.registerRoute({
      path: '/{{name}}/servers/:id/stop',
      method: 'POST',
      handler: 'stopServer',
      description: 'Stop a game server'
    });

    this.context.api.registerRoute({
      path: '/{{name}}/servers/:id/status',
      method: 'GET',
      handler: 'getServerStatus',
      description: 'Get server status'
    });
  }

  async listServers(req, res) {
    try {
      const containers = await this.docker.listContainers({ all: true });
      const gameServers = containers.filter(container => 
        container.Labels && container.Labels['game-type'] === '{{gameType}}'
      );

      res.json({
        success: true,
        servers: gameServers.map(container => ({
          id: container.Id,
          name: container.Names[0],
          status: container.State,
          ports: container.Ports
        }))
      });
    } catch (error) {
      this.logger.error('Failed to list servers:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createServer(req, res) {
    try {
      const { name, config } = req.body;
      
      const container = await this.docker.createContainer({
        Image: '{{dockerImage}}',
        name: name,
        Labels: {
          'game-type': '{{gameType}}',
          'managed-by': 'ctrl-alt-play',
          'plugin': this.name
        },
        Env: [
          \`SERVER_PORT=\${config.port || {{gamePort}}}\`,
          \`SERVER_NAME=\${config.serverName || name}\`,
          \`MAX_PLAYERS=\${config.maxPlayers || {{maxPlayers}}}\`
        ],
        ExposedPorts: {
          \`\${config.port || {{gamePort}}}/tcp\`: {}
        },
        HostConfig: {
          PortBindings: {
            \`\${config.port || {{gamePort}}}/tcp\`: [{ HostPort: String(config.port || {{gamePort}}) }]
          }
        }
      });

      this.servers.set(container.id, {
        container,
        config,
        created: new Date()
      });

      res.json({
        success: true,
        serverId: container.id,
        message: 'Server created successfully'
      });
    } catch (error) {
      this.logger.error('Failed to create server:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async startServer(req, res) {
    try {
      const { id } = req.params;
      const container = this.docker.getContainer(id);
      
      await container.start();
      
      this.logger.info(\`Server \${id} started\`);
      res.json({ success: true, message: 'Server started' });
    } catch (error) {
      this.logger.error(\`Failed to start server \${req.params.id}:\`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async stopServer(req, res) {
    try {
      const { id } = req.params;
      const container = this.docker.getContainer(id);
      
      await container.stop();
      
      this.logger.info(\`Server \${id} stopped\`);
      res.json({ success: true, message: 'Server stopped' });
    } catch (error) {
      this.logger.error(\`Failed to stop server \${req.params.id}:\`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getServerStatus(req, res) {
    try {
      const { id } = req.params;
      const container = this.docker.getContainer(id);
      const info = await container.inspect();
      
      res.json({
        success: true,
        status: {
          id: info.Id,
          name: info.Name,
          state: info.State,
          created: info.Created,
          config: info.Config
        }
      });
    } catch (error) {
      this.logger.error(\`Failed to get server status \${req.params.id}:\`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  startMonitoring() {
    // Monitor server health every 30 seconds
    setInterval(async () => {
      try {
        const containers = await this.docker.listContainers({
          filters: { label: ['game-type={{gameType}}'] }
        });

        for (const containerInfo of containers) {
          const container = this.docker.getContainer(containerInfo.Id);
          const stats = await container.stats({ stream: false });
          
          // Log performance metrics
          this.logger.debug(\`Server \${containerInfo.Names[0]} metrics:\`, {
            cpu: stats.cpu_stats,
            memory: stats.memory_stats,
            network: stats.networks
          });
        }
      } catch (error) {
        this.logger.error('Monitoring error:', error);
      }
    }, 30000);
  }

  scheduleBackups() {
    // Run backups every day at 2 AM
    this.backupSchedule = cron.schedule('0 2 * * *', async () => {
      this.logger.info('Starting scheduled backup...');
      await this.performBackup();
    });
  }

  async performBackup() {
    try {
      const containers = await this.docker.listContainers({
        filters: { label: ['game-type={{gameType}}'] }
      });

      for (const containerInfo of containers) {
        const container = this.docker.getContainer(containerInfo.Id);
        const backupPath = path.join('/backups', \`\${containerInfo.Names[0]}-\${Date.now()}.tar\`);
        
        // Create backup archive
        const stream = await container.getArchive({ path: '/data' });
        const writeStream = require('fs').createWriteStream(backupPath);
        
        stream.pipe(writeStream);
        
        this.logger.info(\`Backup created: \${backupPath}\`);
      }
    } catch (error) {
      this.logger.error('Backup failed:', error);
    }
  }
}

module.exports = {{className}};`,

        'docker/Dockerfile': `FROM {{baseImage}}

# Install game server dependencies
RUN apt-get update && apt-get install -y \\
    {{#each serverDependencies}}
    {{this}} \\
    {{/each}}
    && rm -rf /var/lib/apt/lists/*

# Create server directory
WORKDIR /server

# Download and install game server
RUN wget {{downloadUrl}} -O server.zip \\
    && unzip server.zip \\
    && chmod +x {{executable}}

# Create data directory
VOLUME ["/data"]

# Expose game port
EXPOSE {{gamePort}}

# Start server
CMD ["./{{executable}}", "--port={{gamePort}}", "--data-dir=/data"]`,

        'scripts/install.sh': `#!/bin/bash
# {{name}} Installation Script

echo "Installing {{name}} game server..."

# Create directories
mkdir -p /opt/{{name}}/data
mkdir -p /opt/{{name}}/backups
mkdir -p /opt/{{name}}/logs

# Set permissions
chmod 755 /opt/{{name}}
chmod 777 /opt/{{name}}/data
chmod 777 /opt/{{name}}/backups
chmod 777 /opt/{{name}}/logs

echo "Installation complete!"`,

        'templates/server-config.yaml': `# {{name}} Server Configuration Template
server:
  name: "{{serverName}}"
  port: {{gamePort}}
  maxPlayers: {{maxPlayers}}
  
world:
  name: "{{worldName}}"
  seed: "{{worldSeed}}"
  
gameplay:
  difficulty: "{{difficulty}}"
  pvp: {{enablePvP}}
  
networking:
  enableWhitelist: false
  enableRcon: true
  rconPort: {{rconPort}}`,

        'package.json': `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint .",
    "dev": "plugin-cli dev",
    "build": "plugin-cli build",
    "docs": "plugin-cli docs",
    "docker:build": "docker build -t {{name}} .",
    "docker:run": "docker run -p {{gamePort}}:{{gamePort}} {{name}}"
  },
  "keywords": ["ctrl-alt-play", "plugin", "game-server", "{{gameType}}"],
  "author": "{{author}}",
  "license": "MIT",
  "dependencies": {
    "dockerode": "^3.3.0",
    "node-cron": "^3.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}`,

        'README.md': `# {{name}} - {{gameType}} Server Plugin

{{description}}

## Features

- 🐳 Docker-based server management
- 📊 Real-time monitoring and metrics
- 🔄 Automatic backups
- 🌐 RESTful API for server control
- 📝 Comprehensive logging
- ⚙️ Flexible configuration

## Installation

\`\`\`bash
plugin-cli install ./{{name}}
plugin-cli enable {{name}}
\`\`\`

## Configuration

Edit \`plugin.yaml\` to configure your game server:

\`\`\`yaml
gameServer:
  type: "{{gameType}}"
  ports:
    - container: {{gamePort}}
      host: {{gamePort}}
      protocol: "tcp"
\`\`\`

## API Endpoints

- \`GET /{{name}}/servers\` - List all servers
- \`POST /{{name}}/servers\` - Create new server
- \`POST /{{name}}/servers/:id/start\` - Start server
- \`POST /{{name}}/servers/:id/stop\` - Stop server
- \`GET /{{name}}/servers/:id/status\` - Get server status

## Docker Support

Build and run the server container:

\`\`\`bash
npm run docker:build
npm run docker:run
\`\`\`

## Monitoring

The plugin provides automatic monitoring and logging:

- Server performance metrics
- Player activity tracking
- Resource usage monitoring
- Automated backup scheduling

## Development

\`\`\`bash
# Start development server
npm run dev

# Run tests
npm test

# Generate documentation
npm run docs
\`\`\`

## License

MIT`
      },
      dependencies: ['dockerode', 'node-cron'],
      instructions: `
1. Configure Docker settings in plugin.yaml
2. Install dependencies: npm install
3. Build Docker image: npm run docker:build
4. Run tests: npm test
5. Start development: npm run dev
`
    });

    // React Component Template
    this.registerTemplate('react-component', {
      name: 'React Component Plugin',
      description: 'Plugin with React frontend components',
      files: {
        'plugin.yaml': `name: "{{name}}"
version: "{{version}}"
author: "{{author}}"
description: "{{description}}"
permissions:
  read: true
  write: true
  routes: true
  hooks: true

frontend:
  type: "react"
  components:
    - name: "{{componentName}}"
      path: "/components/{{componentName}}.jsx"
  routes:
    - path: "/{{name}}"
      component: "{{componentName}}"`,

        'index.js': `/**
 * {{name}} React Plugin
 * Backend API for React frontend components
 */

class {{className}} {
  constructor(context) {
    this.context = context;
    this.name = '{{name}}';
    this.version = '{{version}}';
    this.logger = context.logger.child({ plugin: this.name });
  }

  async onLoad() {
    this.logger.info('Loading React plugin...');
    this.registerRoutes();
  }

  registerRoutes() {
    // API endpoint for frontend data
    this.context.api.registerRoute({
      path: '/api/{{name}}/data',
      method: 'GET',
      handler: 'getData',
      description: 'Get plugin data for frontend'
    });

    this.context.api.registerRoute({
      path: '/api/{{name}}/data',
      method: 'POST',
      handler: 'updateData',
      description: 'Update plugin data from frontend'
    });
  }

  async getData(req, res) {
    try {
      // Fetch data for React component
      const data = {
        status: 'active',
        items: [],
        config: {},
        timestamp: new Date().toISOString()
      };

      res.json({ success: true, data });
    } catch (error) {
      this.logger.error('Failed to get data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateData(req, res) {
    try {
      const { data } = req.body;
      
      // Process update from React component
      this.logger.info('Data updated from frontend:', data);
      
      res.json({ success: true, message: 'Data updated successfully' });
    } catch (error) {
      this.logger.error('Failed to update data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = {{className}};`,

        'components/{{componentName}}.jsx': `import React, { useState, useEffect } from 'react';
import { usePluginApi, PluginCard } from '@ctrl-alt-play/plugin-sdk';

/**
 * {{componentName}} React Component
 * {{description}}
 */
export const {{componentName}} = () => {
  const { data, loading, error, execute } = usePluginApi('/api/{{name}}/data');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (data) {
      setFormData(data.config || {});
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await execute(formData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading {{name}}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{{name}}</h2>
        <p className="text-gray-600 mb-6">{{description}}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={\`px-2 py-1 rounded text-sm \${
                  data?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }\`}>
                  {data?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-sm text-gray-500">
                  {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Configuration</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setting 1
                </label>
                <input
                  type="text"
                  value={formData.setting1 || ''}
                  onChange={(e) => setFormData({...formData, setting1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter setting value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setting 2
                </label>
                <select
                  value={formData.setting2 || ''}
                  onChange={(e) => setFormData({...formData, setting2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Configuration
              </button>
            </form>
          </div>
        </div>

        {/* Data Display */}
        {data?.items && data.items.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Items</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">
                        <span className={\\`px-2 py-1 rounded text-xs \\${
                          item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }\\`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:underline text-sm">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default {{componentName}};`,

        'package.json': `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint .",
    "dev": "plugin-cli dev",
    "build": "plugin-cli build",
    "docs": "plugin-cli docs",
    "frontend:build": "webpack --mode production",
    "frontend:dev": "webpack serve --mode development"
  },
  "keywords": ["ctrl-alt-play", "plugin", "react"],
  "author": "{{author}}",
  "license": "MIT",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "webpack": "^5.0.0",
    "webpack-cli": "^4.0.0",
    "webpack-dev-server": "^4.0.0",
    "@babel/core": "^7.0.0",
    "@babel/preset-react": "^7.0.0",
    "babel-loader": "^8.0.0"
  }
}`,

        'webpack.config.js': `const path = require('path');

module.exports = {
  entry: './components/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: '{{name}}',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
};`
      },
      dependencies: ['react', 'react-dom', 'webpack', 'babel-loader'],
      instructions: `
1. Install dependencies: npm install
2. Build frontend: npm run frontend:build
3. Start development: npm run dev
4. Run tests: npm test
`
    });
  }
}

/**
 * Template Variable Processor
 */
export class TemplateVariableProcessor {
  static getVariablesForTemplate(templateName: string): TemplateVariable[] {
    const baseVariables: TemplateVariable[] = [
      { name: 'name', type: 'string', required: true, description: 'Plugin name' },
      { name: 'version', type: 'string', default: '1.0.0', description: 'Plugin version' },
      { name: 'author', type: 'string', required: true, description: 'Plugin author' },
      { name: 'description', type: 'string', required: true, description: 'Plugin description' },
      { name: 'className', type: 'string', description: 'Main class name (auto-generated from name)' }
    ];

    switch (templateName) {
      case 'basic':
        return [
          ...baseVariables,
          { name: 'enableRoutes', type: 'boolean', default: false, description: 'Enable API routes' },
          { name: 'enableHooks', type: 'boolean', default: false, description: 'Enable hooks system' }
        ];

      case 'game-server':
        return [
          ...baseVariables,
          { name: 'gameType', type: 'string', required: true, description: 'Type of game server (e.g., minecraft, terraria)' },
          { name: 'gamePort', type: 'number', default: 25565, description: 'Game server port' },
          { name: 'serverName', type: 'string', description: 'Default server name' },
          { name: 'maxPlayers', type: 'number', default: 20, description: 'Maximum players' },
          { name: 'dockerImage', type: 'string', description: 'Docker base image' },
          { name: 'baseImage', type: 'string', default: 'ubuntu:latest', description: 'Docker base image' },
          { name: 'downloadUrl', type: 'string', description: 'Server download URL' },
          { name: 'executable', type: 'string', description: 'Server executable name' },
          { name: 'worldName', type: 'string', default: 'world', description: 'Default world name' },
          { name: 'worldSeed', type: 'string', description: 'World generation seed' },
          { name: 'difficulty', type: 'string', default: 'normal', description: 'Game difficulty' },
          { name: 'enablePvP', type: 'boolean', default: true, description: 'Enable PvP' },
          { name: 'rconPort', type: 'number', default: 25575, description: 'RCON port' }
        ];

      case 'react-component':
        return [
          ...baseVariables,
          { name: 'componentName', type: 'string', description: 'React component name (auto-generated from name)' }
        ];

      default:
        return baseVariables;
    }
  }

  static processVariables(
    template: PluginTemplate,
    variables: Record<string, any>
  ): PluginTemplate {
    // Auto-generate derived variables
    if (variables.name && !variables.className) {
      variables.className = this.toPascalCase(variables.name);
    }
    
    if (variables.name && !variables.componentName) {
      variables.componentName = this.toPascalCase(variables.name);
    }

    // Process template files
    const processedFiles: Record<string, string> = {};
    
    for (const [filePath, content] of Object.entries(template.files)) {
      const processedPath = TemplateUtils.processTemplate(filePath, variables);
      const processedContent = TemplateUtils.processTemplate(content, variables);
      processedFiles[processedPath] = processedContent;
    }

    return {
      ...template,
      files: processedFiles
    };
  }

  private static toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^(.)/, (char) => char.toUpperCase());
  }
}

// Initialize built-in templates
PluginTemplateRegistry.initialize();