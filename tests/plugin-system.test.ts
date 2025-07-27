import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

// Test constants
const TEST_PLUGIN_NAME = 'test-plugin-system';
const TEST_PLUGIN_PATH = path.join(__dirname, '../sample-plugins/test-plugin');
const CLI_SCRIPT = path.join(__dirname, '../scripts/plugin-tools/cli.js');

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
      await prisma.plugin.deleteMany({
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
      await prisma.plugin.deleteMany({
        where: { name: TEST_PLUGIN_NAME }
      });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Close connections
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Reset plugin state before each test
    try {
      await prisma.plugin.updateMany({
        where: { name: TEST_PLUGIN_NAME },
        data: { status: 'INACTIVE' }
      });
    } catch (error) {
      // Plugin may not exist yet
    }
  });

  describe('CLI Tools', () => {
    test('should create a new plugin', () => {
      expect(() => {
        execSync(`node ${CLI_SCRIPT} create ${TEST_PLUGIN_NAME}`, { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '../sample-plugins')
        });
        testPluginCreated = true;
      }).not.toThrow();

      // Verify plugin directory was created
      expect(fs.existsSync(TEST_PLUGIN_PATH)).toBe(true);
      expect(fs.existsSync(path.join(TEST_PLUGIN_PATH, 'plugin.js'))).toBe(true);
      expect(fs.existsSync(path.join(TEST_PLUGIN_PATH, 'plugin.yaml'))).toBe(true);
    });

    test('should validate plugin structure', () => {
      expect(() => {
        execSync(`node ${CLI_SCRIPT} validate ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });
      }).not.toThrow();
    });

    test('should install a plugin', async () => {
      expect(() => {
        execSync(`node ${CLI_SCRIPT} install ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });
      }).not.toThrow();

      // Verify plugin was installed in database
      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin).toBeTruthy();
      expect(plugin?.status).toBe('INACTIVE');
    });

    test('should enable a plugin', async () => {
      expect(() => {
        execSync(`node ${CLI_SCRIPT} enable ${TEST_PLUGIN_NAME}`, { stdio: 'inherit' });
      }).not.toThrow();

      // Verify plugin is enabled
      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin?.status).toBe('ACTIVE');
    });

    test('should disable a plugin', async () => {
      expect(() => {
        execSync(`node ${CLI_SCRIPT} disable ${TEST_PLUGIN_NAME}`, { stdio: 'inherit' });
      }).not.toThrow();

      // Verify plugin is disabled
      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin?.status).toBe('INACTIVE');
    });

    test('should list installed plugins', () => {
      expect(() => {
        const output = execSync(`node ${CLI_SCRIPT} list`, { encoding: 'utf8' });
        expect(output).toContain(TEST_PLUGIN_NAME);
      }).not.toThrow();
    });
  });

  describe('API Endpoints', () => {
    test('GET /api/plugins should return installed plugins', async () => {
      const response = await request(app)
        .get('/api/plugins')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      const testPlugin = response.body.data.find((p: any) => p.name === TEST_PLUGIN_NAME);
      if (testPlugin) {
        expect(testPlugin).toHaveProperty('name');
        expect(testPlugin).toHaveProperty('version');
        expect(testPlugin).toHaveProperty('status');
      }
    });

    test('GET /api/plugins/:name should return specific plugin', async () => {
      const response = await request(app)
        .get(`/api/plugins/${TEST_PLUGIN_NAME}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(TEST_PLUGIN_NAME);
    });

    test('POST /api/plugins/:name/enable should enable plugin', async () => {
      const response = await request(app)
        .post(`/api/plugins/${TEST_PLUGIN_NAME}/enable`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin?.status).toBe('ACTIVE');
    });

    test('POST /api/plugins/:name/disable should disable plugin', async () => {
      const response = await request(app)
        .post(`/api/plugins/${TEST_PLUGIN_NAME}/disable`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin?.status).toBe('INACTIVE');
    });

    test('DELETE /api/plugins/:name should uninstall plugin', async () => {
      const response = await request(app)
        .delete(`/api/plugins/${TEST_PLUGIN_NAME}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify plugin was removed from database
      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin).toBeNull();
    });

    test('should handle non-existent plugin gracefully', async () => {
      await request(app)
        .get('/api/plugins/non-existent-plugin')
        .expect(404);

      await request(app)
        .post('/api/plugins/non-existent-plugin/enable')
        .expect(404);

      await request(app)
        .delete('/api/plugins/non-existent-plugin')
        .expect(404);
    });
  });

  describe('Plugin Manager Service', () => {
    let PluginManager: any;

    beforeAll(async () => {
      const { default: PM } = await import('../src/services/PluginManager');
      PluginManager = PM;
    });

    test('should install plugin programmatically', async () => {
      const result = await PluginManager.installPlugin(TEST_PLUGIN_PATH);
      expect(result.success).toBe(true);

      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin).toBeTruthy();
    });

    test('should enable plugin programmatically', async () => {
      const result = await PluginManager.enablePlugin(TEST_PLUGIN_NAME);
      expect(result.success).toBe(true);

      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin?.status).toBe('ACTIVE');
    });

    test('should disable plugin programmatically', async () => {
      const result = await PluginManager.disablePlugin(TEST_PLUGIN_NAME);
      expect(result.success).toBe(true);

      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin?.status).toBe('INACTIVE');
    });

    test('should uninstall plugin programmatically', async () => {
      const result = await PluginManager.uninstallPlugin(TEST_PLUGIN_NAME);
      expect(result.success).toBe(true);

      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME }
      });
      expect(plugin).toBeNull();
    });

    test('should list plugins programmatically', async () => {
      // First install a plugin
      await PluginManager.installPlugin(TEST_PLUGIN_PATH);

      const plugins = await PluginManager.listPlugins();
      expect(Array.isArray(plugins)).toBe(true);
      
      const testPlugin = plugins.find(p => p.name === TEST_PLUGIN_NAME);
      expect(testPlugin).toBeTruthy();
    });
  });

  describe('Database Integration', () => {
    test('should create plugin record with correct structure', async () => {
      await execSync(`node ${CLI_SCRIPT} install ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });

      const plugin = await prisma.plugin.findUnique({
        where: { name: TEST_PLUGIN_NAME },
        include: { data: true }
      });

      expect(plugin).toBeTruthy();
      expect(plugin?.name).toBe(TEST_PLUGIN_NAME);
      expect(plugin?.version).toBeTruthy();
      expect(plugin?.author).toBeTruthy();
      expect(plugin?.status).toBe('INACTIVE');
      expect(plugin?.permissions).toBeTruthy();
      expect(plugin?.installedAt).toBeTruthy();
    });

    test('should handle plugin data storage', async () => {
      await execSync(`node ${CLI_SCRIPT} install ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });

      // Test data creation
      const dataResult = await prisma.pluginData.create({
        data: {
          pluginId: TEST_PLUGIN_NAME,
          key: 'test-key',
          value: { test: 'data' },
        }
      });

      expect(dataResult).toBeTruthy();
      expect(dataResult.key).toBe('test-key');
      expect(dataResult.value).toEqual({ test: 'data' });

      // Test data retrieval
      const retrievedData = await prisma.pluginData.findFirst({
        where: {
          pluginId: TEST_PLUGIN_NAME,
          key: 'test-key'
        }
      });

      expect(retrievedData).toBeTruthy();
      expect(retrievedData!.value).toEqual({ test: 'data' });
    });

    test('should enforce plugin constraints', async () => {
      // Test unique plugin name constraint
      await execSync(`node ${CLI_SCRIPT} install ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });

      await expect(
        prisma.plugin.create({
          data: {
            name: TEST_PLUGIN_NAME,
            version: '1.0.0',
            author: 'Test Author',
            status: 'INACTIVE',
            permissions: {},
            autoUpdate: false,
            versionLocked: false
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid plugin paths', () => {
      expect(() => {
        execSync(`node ${CLI_SCRIPT} install /invalid/path`, { stdio: 'pipe' });
      }).toThrow();
    });

    test('should handle malformed plugin.yaml', () => {
      const malformedPath = path.join(__dirname, '../sample-plugins/malformed-plugin');
      
      // Create a malformed plugin
      if (!fs.existsSync(malformedPath)) {
        fs.mkdirSync(malformedPath, { recursive: true });
        fs.writeFileSync(path.join(malformedPath, 'plugin.yaml'), 'invalid: yaml: content: [');
        fs.writeFileSync(path.join(malformedPath, 'plugin.js'), 'module.exports = {};');
      }

      expect(() => {
        execSync(`node ${CLI_SCRIPT} validate ${malformedPath}`, { stdio: 'pipe' });
      }).toThrow();

      // Clean up
      fs.rmSync(malformedPath, { recursive: true, force: true });
    });

    test('should handle missing plugin files', () => {
      const incompletePath = path.join(__dirname, '../sample-plugins/incomplete-plugin');
      
      // Create incomplete plugin (missing plugin.js)
      if (!fs.existsSync(incompletePath)) {
        fs.mkdirSync(incompletePath, { recursive: true });
        fs.writeFileSync(path.join(incompletePath, 'plugin.yaml'), `
name: incomplete-plugin
version: 1.0.0
author: Test
description: Test plugin
main: plugin.js
        `);
      }

      expect(() => {
        execSync(`node ${CLI_SCRIPT} validate ${incompletePath}`, { stdio: 'pipe' });
      }).toThrow();

      // Clean up
      fs.rmSync(incompletePath, { recursive: true, force: true });
    });
  });

  describe('Plugin Lifecycle', () => {
    test('should complete full plugin lifecycle', async () => {
      // 1. Create plugin
      execSync(`node ${CLI_SCRIPT} create ${TEST_PLUGIN_NAME}`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../sample-plugins')
      });

      // 2. Validate plugin
      execSync(`node ${CLI_SCRIPT} validate ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });

      // 3. Install plugin
      execSync(`node ${CLI_SCRIPT} install ${TEST_PLUGIN_PATH}`, { stdio: 'inherit' });
      let plugin = await prisma.plugin.findUnique({ where: { name: TEST_PLUGIN_NAME } });
      expect(plugin?.status).toBe('INACTIVE');

      // 4. Enable plugin
      execSync(`node ${CLI_SCRIPT} enable ${TEST_PLUGIN_NAME}`, { stdio: 'inherit' });
      plugin = await prisma.plugin.findUnique({ where: { name: TEST_PLUGIN_NAME } });
      expect(plugin?.status).toBe('ACTIVE');

      // 5. Disable plugin
      execSync(`node ${CLI_SCRIPT} disable ${TEST_PLUGIN_NAME}`, { stdio: 'inherit' });
      plugin = await prisma.plugin.findUnique({ where: { name: TEST_PLUGIN_NAME } });
      expect(plugin?.status).toBe('INACTIVE');

      // 6. Uninstall plugin
      execSync(`node ${CLI_SCRIPT} uninstall ${TEST_PLUGIN_NAME}`, { stdio: 'inherit' });
      plugin = await prisma.plugin.findUnique({ where: { name: TEST_PLUGIN_NAME } });
      expect(plugin).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple plugins efficiently', async () => {
      const startTime = Date.now();
      
      // Install multiple plugins
      for (let i = 0; i < 5; i++) {
        const pluginName = `test-plugin-${i}`;
        const pluginPath = path.join(__dirname, `../sample-plugins/${pluginName}`);
        
        // Create minimal plugin
        fs.mkdirSync(pluginPath, { recursive: true });
        fs.writeFileSync(path.join(pluginPath, 'plugin.yaml'), `
name: ${pluginName}
version: 1.0.0
author: Test
description: Test plugin ${i}
main: plugin.js
permissions:
  routes: false
  database: false
  filesystem: false
  network: false
        `);
        fs.writeFileSync(path.join(pluginPath, 'plugin.js'), `
const { PluginBase } = require('../../sdk/PluginBase');
class TestPlugin extends PluginBase {
  constructor(context) {
    super(context);
    this.name = '${pluginName}';
    this.version = '1.0.0';
  }
  async install() { return { success: true }; }
  async enable() { return { success: true }; }
  async disable() { return { success: true }; }
  async uninstall() { return { success: true }; }
}
module.exports = TestPlugin;
        `);

        execSync(`node ${CLI_SCRIPT} install ${pluginPath}`, { stdio: 'inherit' });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should install 5 plugins in reasonable time (under 10 seconds)
      expect(duration).toBeLessThan(10000);

      // Clean up
      for (let i = 0; i < 5; i++) {
        const pluginName = `test-plugin-${i}`;
        const pluginPath = path.join(__dirname, `../sample-plugins/${pluginName}`);
        
        try {
          execSync(`node ${CLI_SCRIPT} uninstall ${pluginName}`, { stdio: 'inherit' });
          fs.rmSync(pluginPath, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });
});

// Helper functions for test setup
export const createTestPlugin = (name: string, config: Record<string, any> = {}) => {
  const pluginPath = path.join(__dirname, `../sample-plugins/${name}`);
  
  if (!fs.existsSync(pluginPath)) {
    fs.mkdirSync(pluginPath, { recursive: true });
  }

  const defaultConfig = {
    name,
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test plugin',
    main: 'plugin.js',
    permissions: {
      routes: false,
      database: false,
      filesystem: false,
      network: false
    }
  };

  const pluginConfig = { ...defaultConfig, ...config };
  
  fs.writeFileSync(
    path.join(pluginPath, 'plugin.yaml'),
    Object.entries(pluginConfig)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join('\n')
  );

  fs.writeFileSync(path.join(pluginPath, 'plugin.js'), `
const { PluginBase } = require('../../sdk/PluginBase');

class TestPlugin extends PluginBase {
  constructor(context) {
    super(context);
    this.name = '${name}';
    this.version = '${pluginConfig.version}';
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
  `);

  return pluginPath;
};

export const cleanupTestPlugin = (name: string) => {
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
