/**
 * Plugin Context Implementation
 * Provides runtime context and utilities for plugins
 */

import { PluginContext, PluginConfig, PluginLogger, PluginDatabase, PluginApi, PluginEvents, PluginHooks } from './types';

/**
 * Plugin Context Implementation
 */
export class PluginContextImpl implements PluginContext {
  name: string;
  version: string;
  config: PluginConfig;
  logger: PluginLogger;
  database: PluginDatabase;
  api: PluginApi;
  events: PluginEvents;
  hooks: PluginHooks;

  constructor(
    name: string,
    version: string,
    config: PluginConfig,
    dependencies: {
      logger: PluginLogger;
      database: PluginDatabase;
      api: PluginApi;
      events: PluginEvents;
      hooks: PluginHooks;
    }
  ) {
    this.name = name;
    this.version = version;
    this.config = config;
    this.logger = dependencies.logger;
    this.database = dependencies.database;
    this.api = dependencies.api;
    this.events = dependencies.events;
    this.hooks = dependencies.hooks;
  }

  /**
   * Update plugin configuration
   */
  updateConfig(newConfig: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.events.emit('config-updated', { plugin: this.name, config: this.config });
  }

  /**
   * Get plugin data directory
   */
  getDataPath(): string {
    return `/plugins/${this.name}/data`;
  }

  /**
   * Get plugin configuration directory
   */
  getConfigPath(): string {
    return `/plugins/${this.name}/config`;
  }

  /**
   * Get plugin logs directory
   */
  getLogsPath(): string {
    return `/plugins/${this.name}/logs`;
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(permission: keyof PluginConfig['permissions']): boolean {
    return Boolean(this.config.permissions?.[permission]);
  }

  /**
   * Validate plugin permissions for an operation
   */
  validatePermission(permission: keyof PluginConfig['permissions']): void {
    if (!this.hasPermission(permission)) {
      throw new Error(`Plugin ${this.name} does not have ${permission} permission`);
    }
  }

  /**
   * Get plugin metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await this.api.get(`/plugins/${this.name}/metrics`);
      return response.data;
    } catch (error) {
      this.logger.warn('Failed to get plugin metrics:', error);
      return null;
    }
  }

  /**
   * Get plugin status
   */
  async getStatus(): Promise<string> {
    try {
      const response = await this.api.get(`/plugins/${this.name}/status`);
      return response.data.status;
    } catch (error) {
      this.logger.warn('Failed to get plugin status:', error);
      return 'unknown';
    }
  }
}

/**
 * Plugin Context Factory
 */
export class PluginContextFactory {
  private static contexts: Map<string, PluginContext> = new Map();

  /**
   * Create plugin context
   */
  static create(
    name: string,
    version: string,
    config: PluginConfig,
    dependencies: any
  ): PluginContext {
    const context = new PluginContextImpl(name, version, config, dependencies);
    this.contexts.set(name, context);
    return context;
  }

  /**
   * Get existing plugin context
   */
  static get(name: string): PluginContext | undefined {
    return this.contexts.get(name);
  }

  /**
   * Remove plugin context
   */
  static remove(name: string): void {
    this.contexts.delete(name);
  }

  /**
   * List all plugin contexts
   */
  static list(): PluginContext[] {
    return Array.from(this.contexts.values());
  }
}