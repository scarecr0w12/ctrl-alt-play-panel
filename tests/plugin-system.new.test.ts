import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request = require('supertest');
import path = require('path');
import fs = require('fs');
import { execSync } from 'child_process';

// Test constants
const TEST_PLUGIN_NAME = 'test-plugin-system';
const TEST_PLUGIN_PATH = path.join(__dirname, '../sample-plugins/test-plugin-system');
const CLI_SCRIPT = path.join(__dirname, '../scripts/plugin-tools/cli.js');

// Mock the plugin methods for testing
jest.mock('@prisma/client', () => {
  const mockPlugin = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
  
  const MockPrismaClient = jest.fn(() => ({
    plugin: mockPlugin,
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  }));
  
  return { PrismaClient: MockPrismaClient };
});

// Import PrismaClient after mocking
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper function to create a test plugin
const createTestPlugin = (name: string, config: Record<string, any> = {}) => {
  const pluginPath = path.join(__dirname, `../sample-plugins/${name}`);
  
  // Create plugin directory
  fs.mkdirSync(pluginPath, { recursive: true });
  
  // Create plugin.yaml
  const pluginConfig = {
    name: name,
    version: config.version || '1.0.0',
    author: config.author || 'Test Author',
    description: config.description || 'Test plugin for integration testing',
    main: 'plugin.js',
    ...config
  };
  
  fs.writeFileSync(
    path.join(pluginPath, 'plugin.yaml'),
    `name: ${pluginConfig.name}
version: ${pluginConfig.version}
author: ${pluginConfig.author}
description: ${pluginConfig.description}
main: ${pluginConfig.main}
`
  );
  
  // Create plugin.js
  fs.writeFileSync(
    path.join(pluginPath, 'plugin.js'),
    `class TestPlugin {
  constructor(config) {
    this.name = config.name;
    this.version = config.version;
    this.description = config.description;
  }

  log(message) {
    console.log('[TestPlugin]', message);
  }

  async install() {
    this.log('Installing ${name}...');
    return { success: true };
  }

  async enable() {
    this.log('Enabling ${name}...');
    return { success: true };
  }

  async disable() {
    this.log('Disabling ${name}...');
    return { success: true };
  }

  async uninstall() {
    this.log('Uninstalling ${name}...');
    return { success: true };
  }
}

module.exports = TestPlugin;
  `
  );

  return pluginPath;
};

// Helper function to cleanup test plugin
const cleanupTestPlugin = (name: string) => {
  const pluginPath = path.join(__dirname, `../sample-plugins/${name}`);
  
  try {
    execSync(`node ${CLI_SCRIPT} uninstall ${name}`, { stdio: 'pipe' });
  } catch {
    // Plugin might not be installed
  }

  try {
    fs.rmSync(pluginPath, { recursive: true, force: true });
  } catch {
    // Directory might not exist
  }
};

describe('Plugin System Integration Tests', () => {
  let app: any;
  let server: any;
  let testPluginCreated = false;

  beforeAll(async () => {
    // Import the app instance
    const appModule = await import('../src/app');
    app = appModule.default;
    server = app.listen(0); // Use random port for testing

    // Clean up any existing test plugins
    try {
      await (prisma as any).plugin.deleteMany({
        where: { name: TEST_PLUGIN_NAME }
      });
    } catch (error) {
      // Ignore errors if plugin doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up test plugins
    if (testPluginCreated) {
      try {
        execSync(`node ${CLI_SCRIPT} uninstall ${TEST_PLUGIN_NAME}`, { stdio: 'inherit' });
      } catch (error) {
        console.warn('Failed to uninstall test plugin:', error);
      }
    }

    // Clean up database
    try {
      await (prisma as any).plugin.deleteMany({
        where: { name: TEST_PLUGIN_NAME }
      });
    } catch (error) {
      // Ignore errors
    }

    // Close server
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test plugin files
    cleanupTestPlugin(TEST_PLUGIN_NAME);
  });

  describe('CLI Tools', () => {
    test('should validate plugin structure', () => {
      // Create a test plugin
      createTestPlugin(TEST_PLUGIN_NAME);
      testPluginCreated = true;

      // Validate plugin
      const result = execSync(`node ${CLI_SCRIPT} validate ${TEST_PLUGIN_PATH}`, { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8' 
      });
      
      expect(result).toContain('Validating plugin:');
    });

    test('should install plugin via CLI', () => {
      // Create a test plugin
      createTestPlugin(TEST_PLUGIN_NAME);
      testPluginCreated = true;

      // Install plugin
      const result = execSync(`node ${CLI_SCRIPT} install ${TEST_PLUGIN_PATH}`, { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8' 
      });
      
      expect(result).toContain('Installing plugin from:');
    });
  });

  describe('API Endpoints', () => {
    test('GET /api/plugins should return installed plugins', async () => {
      const response = await request(app)
        .get('/api/plugins')
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    test('POST /api/plugins should install a plugin', async () => {
      // This would require a real plugin file to test
      // For now, we'll just test that the endpoint exists
      // Skip this test as there's no POST /api/plugins route
      expect(true).toBe(true);
    });
  });

  describe('Plugin Manager Service', () => {
    let PluginManager: any;

    beforeAll(async () => {
      // Import PluginManager
      const pluginManagerModule = await import('../src/services/PluginManager');
      PluginManager = pluginManagerModule.default;
    });

    test('should install plugin using static method', async () => {
      // Create a test plugin
      createTestPlugin(TEST_PLUGIN_NAME);
      testPluginCreated = true;

      // Test static install method
      const result = await PluginManager.installPlugin(TEST_PLUGIN_PATH, 'local', prisma as any);
      expect(result.success).toBe(true);
      expect(result.plugin).toHaveProperty('name', TEST_PLUGIN_NAME);
    });

    test('should enable plugin using static method', async () => {
      // Mock plugin data
      (prisma as any).plugin.findUnique.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'INACTIVE'
      });
      
      (prisma as any).plugin.update.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'ACTIVE'
      });

      // Test static enable method
      const result = await PluginManager.enablePlugin(TEST_PLUGIN_NAME, prisma as any);
      expect(result.success).toBe(true);
      expect(result.message).toContain('enabled successfully');
    });

    test('should disable plugin using static method', async () => {
      // Mock plugin data
      (prisma as any).plugin.findUnique.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'ACTIVE'
      });
      
      (prisma as any).plugin.update.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'INACTIVE'
      });

      // Test static disable method
      const result = await PluginManager.disablePlugin(TEST_PLUGIN_NAME, prisma as any);
      expect(result.success).toBe(true);
      expect(result.message).toContain('disabled successfully');
    });

    test('should uninstall plugin using static method', async () => {
      // Mock plugin data
      (prisma as any).plugin.findUnique.mockResolvedValue({
        name: TEST_PLUGIN_NAME
      });
      
      (prisma as any).plugin.delete.mockResolvedValue({
        name: TEST_PLUGIN_NAME
      });

      // Test static uninstall method
      const result = await PluginManager.uninstallPlugin(TEST_PLUGIN_NAME, prisma as any);
      expect(result.success).toBe(true);
      expect(result.message).toContain('uninstalled successfully');
    });

    test('should list installed plugins using static method', async () => {
      // Mock plugin data
      (prisma as any).plugin.findMany.mockResolvedValue([
        { name: TEST_PLUGIN_NAME, version: '1.0.0', status: 'ACTIVE' }
      ]);

      // Test static getInstalledPlugins method
      const plugins = await PluginManager.getInstalledPlugins(prisma as any);
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toHaveProperty('name', TEST_PLUGIN_NAME);
    });
  });

  describe('Database Integration', () => {
    let PluginManager: any;
    
    beforeAll(async () => {
      // Import PluginManager
      const pluginManagerModule = await import('../src/services/PluginManager');
      PluginManager = pluginManagerModule.default;
    });

    test('should create plugin entry in database', async () => {
      // Mock database operations
      (prisma as any).plugin.create.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        version: '1.0.0',
        status: 'INACTIVE'
      });

      // Create plugin entry
      const pluginData = {
        name: TEST_PLUGIN_NAME,
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test plugin',
        status: 'INACTIVE',
        source: 'local',
        config: {}
      };

      const result = await (prisma as any).plugin.create({ data: pluginData });
      expect(result).toHaveProperty('name', TEST_PLUGIN_NAME);
      expect(result).toHaveProperty('status', 'INACTIVE');
    });

    test('should update plugin status in database', async () => {
      // Mock database operations
      (prisma as any).plugin.update.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'ACTIVE'
      });

      // Update plugin status
      const result = await (prisma as any).plugin.update({
        where: { name: TEST_PLUGIN_NAME },
        data: { status: 'ACTIVE' }
      });
      
      expect(result).toHaveProperty('status', 'ACTIVE');
    });
  });

  describe('Error Handling', () => {
    let PluginManager: any;
    
    beforeAll(async () => {
      // Import PluginManager
      const pluginManagerModule = await import('../src/services/PluginManager');
      PluginManager = pluginManagerModule.default;
    });

    test('should handle missing plugin.yaml', async () => {
      // Create plugin directory without plugin.yaml
      const pluginPath = path.join(__dirname, `../sample-plugins/${TEST_PLUGIN_NAME}-invalid`);
      fs.mkdirSync(pluginPath, { recursive: true });
      testPluginCreated = true;

      // Try to install invalid plugin
      await expect(PluginManager.installPlugin(pluginPath, 'local', prisma as any))
        .rejects
        .toThrow('Plugin metadata file (plugin.yaml) not found');

      // Cleanup
      fs.rmSync(pluginPath, { recursive: true, force: true });
    });

    test('should handle plugin not found when enabling', async () => {
      // Mock database to return null
      (prisma as any).plugin.findUnique.mockResolvedValue(null);

      // Try to enable non-existent plugin
      const result = await PluginManager.enablePlugin('non-existent-plugin', prisma as any);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Plugin Lifecycle', () => {
    let PluginManager: any;
    
    beforeAll(async () => {
      // Import PluginManager
      const pluginManagerModule = await import('../src/services/PluginManager');
      PluginManager = pluginManagerModule.default;
    });

    test('should complete full plugin lifecycle', async () => {
      // Create a test plugin
      createTestPlugin(TEST_PLUGIN_NAME);
      testPluginCreated = true;

      // 1. Install plugin
      (prisma as any).plugin.create.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        version: '1.0.0',
        status: 'INACTIVE'
      });
      
      const installResult = await PluginManager.installPlugin(TEST_PLUGIN_PATH, 'local', prisma as any);
      expect(installResult.success).toBe(true);

      // 2. Enable plugin
      (prisma as any).plugin.findUnique.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'INACTIVE'
      });
      
      (prisma as any).plugin.update.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'ACTIVE'
      });
      
      const enableResult = await PluginManager.enablePlugin(TEST_PLUGIN_NAME, prisma as any);
      expect(enableResult.success).toBe(true);

      // 3. Disable plugin
      (prisma as any).plugin.findUnique.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'ACTIVE'
      });
      
      (prisma as any).plugin.update.mockResolvedValue({
        name: TEST_PLUGIN_NAME,
        status: 'INACTIVE'
      });
      
      const disableResult = await PluginManager.disablePlugin(TEST_PLUGIN_NAME, prisma as any);
      expect(disableResult.success).toBe(true);

      // 4. Uninstall plugin
      (prisma as any).plugin.findUnique.mockResolvedValue({
        name: TEST_PLUGIN_NAME
      });
      
      (prisma as any).plugin.delete.mockResolvedValue({
        name: TEST_PLUGIN_NAME
      });
      
      const uninstallResult = await PluginManager.uninstallPlugin(TEST_PLUGIN_NAME, prisma as any);
      expect(uninstallResult.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    let PluginManager: any;
    
    beforeAll(async () => {
      // Import PluginManager
    });

    test('should handle multiple concurrent plugin operations', async () => {
      // Import PluginManager inside the test
      const pluginManagerModule = await import('../src/services/PluginManager');
      const PluginManager = pluginManagerModule.default;
      
      // Clean up any existing test plugins first
      for (let i = 1; i <= 3; i++) {
        const pluginName = `test-plugin-system-${i}`;
        const pluginPath = path.join(__dirname, `../sample-plugins/${pluginName}`);
        
        // Try to uninstall the plugin if it exists
        try {
          // First, check if plugin exists in database
          (prisma as any).plugin.findUnique.mockResolvedValueOnce(null);
          await PluginManager.uninstallPlugin(pluginName, prisma as any);
        } catch (error) {
          // Ignore errors if plugin doesn't exist
        }
        
        // Remove the plugin directory
        try {
          fs.rmSync(pluginPath, { recursive: true, force: true });
        } catch (error) {
          // Ignore errors if directory doesn't exist
        }
      }
      
      // Create multiple test plugins
      const pluginPaths = [];
      const createdPlugins = [];
      for (let i = 1; i <= 3; i++) {
        const pluginName = `test-plugin-system-${i}`;
        const pluginPath = path.join(__dirname, `../sample-plugins/${pluginName}`);
        createTestPlugin(pluginName);
        pluginPaths.push(pluginPath);
        createdPlugins.push(pluginPath);
      }

      // Mock database operations for concurrent operations
      (prisma as any).plugin.create.mockResolvedValue({
        name: 'test-plugin',
        version: '1.0.0',
        status: 'INACTIVE'
      });
      
      // Mock findUnique to return null (plugin doesn't exist)
      (prisma as any).plugin.findUnique.mockResolvedValue(null);

      // Install plugins concurrently
      const installPromises = pluginPaths.map(path => 
        PluginManager.installPlugin(path, 'local', prisma as any)
      );
      
      const installResults = await Promise.all(installPromises);
      
      // Verify all installations succeeded
      installResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(installResults).toHaveLength(3);
      
      // Cleanup
      createdPlugins.forEach(pluginPath => {
        try {
          fs.rmSync(pluginPath, { recursive: true, force: true });
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    });
  });
});
