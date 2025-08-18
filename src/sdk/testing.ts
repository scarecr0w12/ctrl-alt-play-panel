/**
 * Plugin SDK Testing Utilities
 * Provides mocks, test helpers, and testing framework for plugin development
 */

import { PluginContext, PluginLogger, PluginDatabase, PluginApi, PluginEvents, PluginHooks, MockConfig, TestCase, TestSuite, TestResults } from './types';

/**
 * Mock Plugin Context for testing
 */
export class MockPluginContext implements PluginContext {
  name: string;
  version: string;
  config: any;
  logger: PluginLogger;
  database: PluginDatabase;
  api: PluginApi;
  events: PluginEvents;
  hooks: PluginHooks;

  constructor(name: string, config?: MockConfig) {
    this.name = name;
    this.version = '1.0.0';
    this.config = config || {};
    this.logger = new MockLogger();
    this.database = new MockDatabase();
    this.api = new MockApi();
    this.events = new MockEvents();
    this.hooks = new MockHooks();
  }
}

/**
 * Mock Logger implementation
 */
export class MockLogger implements PluginLogger {
  private logs: Array<{ level: string; message: string; meta?: object; timestamp: Date }> = [];

  info(message: string, meta?: object): void {
    this.logs.push({ level: 'info', message, meta, timestamp: new Date() });
  }

  warn(message: string, meta?: object): void {
    this.logs.push({ level: 'warn', message, meta, timestamp: new Date() });
  }

  error(message: string, meta?: object): void {
    this.logs.push({ level: 'error', message, meta, timestamp: new Date() });
  }

  debug(message: string, meta?: object): void {
    this.logs.push({ level: 'debug', message, meta, timestamp: new Date() });
  }

  child(options: object): PluginLogger {
    return new MockLogger();
  }

  // Test utilities
  getLogs(): Array<{ level: string; message: string; meta?: object; timestamp: Date }> {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  hasLog(level: string, message: string): boolean {
    return this.logs.some(log => log.level === level && log.message.includes(message));
  }
}

/**
 * Mock Database implementation
 */
export class MockDatabase implements PluginDatabase {
  private data: Map<string, any[]> = new Map();
  private transactionStack: any[] = [];

  async query(sql: string, params?: any[]): Promise<any> {
    // Simple mock implementation
    console.log(`Mock DB Query: ${sql}`, params);
    return { rows: [], rowCount: 0 };
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    const mockTx = {
      query: this.query.bind(this),
      commit: async () => {},
      rollback: async () => {}
    };

    try {
      const result = await callback(mockTx);
      return result;
    } catch (error) {
      throw error;
    }
  }

  model(name: string): any {
    return new MockModel(name, this.data);
  }

  // Test utilities
  setData(table: string, data: any[]): void {
    this.data.set(table, data);
  }

  getData(table: string): any[] {
    return this.data.get(table) || [];
  }

  clearData(): void {
    this.data.clear();
  }
}

/**
 * Mock Model implementation
 */
export class MockModel {
  constructor(private name: string, private data: Map<string, any[]>) {}

  async create(data: object): Promise<any> {
    const records = this.data.get(this.name) || [];
    const newRecord = { id: records.length + 1, ...data };
    records.push(newRecord);
    this.data.set(this.name, records);
    return newRecord;
  }

  async findMany(filter?: object): Promise<any[]> {
    const records = this.data.get(this.name) || [];
    if (!filter) return records;

    return records.filter(record => {
      return Object.entries(filter).every(([key, value]) => record[key] === value);
    });
  }

  async findUnique(filter: object): Promise<any> {
    const records = await this.findMany(filter);
    return records[0] || null;
  }

  async update(filter: object, data: object): Promise<any> {
    const records = this.data.get(this.name) || [];
    const record = records.find(r => {
      return Object.entries(filter).every(([key, value]) => r[key] === value);
    });

    if (record) {
      Object.assign(record, data);
    }

    return record;
  }

  async delete(filter: object): Promise<any> {
    const records = this.data.get(this.name) || [];
    const index = records.findIndex(r => {
      return Object.entries(filter).every(([key, value]) => r[key] === value);
    });

    if (index !== -1) {
      const deleted = records.splice(index, 1)[0];
      this.data.set(this.name, records);
      return deleted;
    }

    return null;
  }
}

/**
 * Mock API implementation
 */
export class MockApi implements PluginApi {
  private responses: Map<string, any> = new Map();
  private routes: Map<string, any> = new Map();

  async get(path: string, options?: any): Promise<any> {
    return this.mockRequest('GET', path, undefined, options);
  }

  async post(path: string, data?: any, options?: any): Promise<any> {
    return this.mockRequest('POST', path, data, options);
  }

  async put(path: string, data?: any, options?: any): Promise<any> {
    return this.mockRequest('PUT', path, data, options);
  }

  async delete(path: string, options?: any): Promise<any> {
    return this.mockRequest('DELETE', path, undefined, options);
  }

  registerRoute(definition: any): void {
    const key = `${definition.method}:${definition.path}`;
    this.routes.set(key, definition);
  }

  unregisterRoute(path: string, method: string): void {
    const key = `${method}:${path}`;
    this.routes.delete(key);
  }

  private async mockRequest(method: string, path: string, data?: any, options?: any): Promise<any> {
    const key = `${method}:${path}`;
    const response = this.responses.get(key) || { status: 200, data: {}, headers: {} };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return response;
  }

  // Test utilities
  setResponse(method: string, path: string, response: any): void {
    const key = `${method}:${path}`;
    this.responses.set(key, response);
  }

  getRoutes(): Map<string, any> {
    return this.routes;
  }

  clearRoutes(): void {
    this.routes.clear();
  }

  clearResponses(): void {
    this.responses.clear();
  }
}

/**
 * Mock Events implementation
 */
export class MockEvents implements PluginEvents {
  private listeners: Map<string, Function[]> = new Map();
  private emittedEvents: Array<{ event: string; data?: any; timestamp: Date }> = [];

  emit(event: string, data?: any): void {
    this.emittedEvents.push({ event, data, timestamp: new Date() });
    
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  on(event: string, handler: (data?: any) => void): void {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }

  off(event: string, handler?: (data?: any) => void): void {
    if (!handler) {
      this.listeners.delete(event);
      return;
    }

    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.listeners.set(event, handlers);
    }
  }

  once(event: string, handler: (data?: any) => void): void {
    const onceHandler = (data?: any) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  // Test utilities
  getEmittedEvents(): Array<{ event: string; data?: any; timestamp: Date }> {
    return this.emittedEvents;
  }

  wasEventEmitted(event: string): boolean {
    return this.emittedEvents.some(e => e.event === event);
  }

  clearEvents(): void {
    this.emittedEvents = [];
  }

  getListeners(event: string): Function[] {
    return this.listeners.get(event) || [];
  }
}

/**
 * Mock Hooks implementation
 */
export class MockHooks implements PluginHooks {
  private hooks: Map<string, any> = new Map();
  private triggeredHooks: Array<{ name: string; data?: any; timestamp: Date }> = [];

  register(definition: any): void {
    this.hooks.set(definition.name, definition);
  }

  unregister(name: string): void {
    this.hooks.delete(name);
  }

  async trigger(name: string, data?: any): Promise<any> {
    this.triggeredHooks.push({ name, data, timestamp: new Date() });
    
    const hook = this.hooks.get(name);
    if (hook && hook.handler) {
      // Mock handler execution
      return { success: true, data };
    }
    
    return data;
  }

  // Test utilities
  getTriggeredHooks(): Array<{ name: string; data?: any; timestamp: Date }> {
    return this.triggeredHooks;
  }

  wasHookTriggered(name: string): boolean {
    return this.triggeredHooks.some(h => h.name === name);
  }

  clearHooks(): void {
    this.triggeredHooks = [];
  }

  getRegisteredHooks(): Map<string, any> {
    return this.hooks;
  }
}

/**
 * Test Runner
 */
export class PluginTestRunner {
  private suites: TestSuite[] = [];

  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  async runAll(): Promise<TestResults> {
    const results: TestResults = {
      passed: 0,
      failed: 0,
      errors: [],
      duration: 0
    };

    const startTime = Date.now();

    for (const suite of this.suites) {
      console.log(`\n🧪 Running test suite: ${suite.name}`);
      
      try {
        if (suite.setup) {
          await suite.setup();
        }

        for (const testCase of suite.cases) {
          try {
            if (testCase.setup) {
              await testCase.setup();
            }

            await testCase.test();
            
            if (testCase.teardown) {
              await testCase.teardown();
            }

            results.passed++;
            console.log(`  ✓ ${testCase.name}`);
          } catch (error) {
            results.failed++;
            results.errors.push({ test: testCase.name, error: error as Error });
            console.log(`  ✗ ${testCase.name}: ${(error as Error).message}`);
          }
        }

        if (suite.teardown) {
          await suite.teardown();
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ test: suite.name, error: error as Error });
        console.log(`  ✗ Suite setup/teardown failed: ${(error as Error).message}`);
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  }
}

/**
 * Test helpers
 */
export class TestHelpers {
  /**
   * Create a basic test case
   */
  static createTest(name: string, testFn: () => Promise<void>): TestCase {
    return {
      name,
      test: testFn
    };
  }

  /**
   * Create a test suite
   */
  static createSuite(name: string, cases: TestCase[]): TestSuite {
    return {
      name,
      cases
    };
  }

  /**
   * Assert that a value is truthy
   */
  static assert(condition: any, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  /**
   * Assert that two values are equal
   */
  static assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  /**
   * Assert that a function throws an error
   */
  static async assertThrows(fn: () => Promise<any>, expectedError?: string): Promise<void> {
    try {
      await fn();
      throw new Error('Expected function to throw an error');
    } catch (error) {
      if (expectedError && !(error as Error).message.includes(expectedError)) {
        throw new Error(`Expected error containing "${expectedError}", got "${(error as Error).message}"`);
      }
    }
  }

  /**
   * Wait for a condition to be true
   */
  static async waitFor(condition: () => boolean, timeout: number = 1000): Promise<void> {
    const startTime = Date.now();
    
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (!condition()) {
      throw new Error('Condition not met within timeout');
    }
  }
}

/**
 * Plugin test utilities
 */
export class PluginTestUtils {
  /**
   * Create a complete mock environment for plugin testing
   */
  static createMockEnvironment(pluginName: string, config?: MockConfig): MockPluginContext {
    return new MockPluginContext(pluginName, config);
  }

  /**
   * Test plugin lifecycle
   */
  static async testPluginLifecycle(pluginClass: any, context: PluginContext): Promise<void> {
    const plugin = new pluginClass(context);

    // Test loading
    if (plugin.onLoad) {
      await plugin.onLoad();
    }

    // Test basic functionality
    if (plugin.initialize) {
      await plugin.initialize();
    }

    // Test unloading
    if (plugin.onUnload) {
      await plugin.onUnload();
    }
  }

  /**
   * Validate plugin structure
   */
  static validatePluginStructure(pluginPath: string): string[] {
    const errors: string[] = [];
    const fs = require('fs');
    const path = require('path');

    // Check required files
    const requiredFiles = ['plugin.yaml', 'index.js'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(pluginPath, file))) {
        errors.push(`Missing required file: ${file}`);
      }
    }

    // Check plugin.yaml structure
    try {
      const yaml = require('js-yaml');
      const configPath = path.join(pluginPath, 'plugin.yaml');
      const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

      if (!config.name) errors.push('Plugin name is required');
      if (!config.version) errors.push('Plugin version is required');
      if (!config.author) errors.push('Plugin author is required');
    } catch (error) {
      errors.push(`Invalid plugin.yaml: ${(error as Error).message}`);
    }

    return errors;
  }
}