import { PluginContext, RouteHandler, PluginAPICall } from './interfaces';
import { Logger } from 'winston';

/**
 * Base class for all plugins
 * All plugins must extend this class and implement the required methods
 */
export abstract class PluginBase {
  protected context: PluginContext;
  protected logger: Logger;

  constructor(context: PluginContext) {
    this.context = context;
    this.logger = context.logger;
  }

  /**
   * Lifecycle Methods - Override these in your plugin
   */

  /**
   * Called when the plugin is installed
   */
  async onInstall(): Promise<void> {
    // Override in plugin implementation
  }

  /**
   * Called when the plugin is uninstalled
   */
  async onUninstall(): Promise<void> {
    // Override in plugin implementation
  }

  /**
   * Called when the plugin is enabled
   */
  async onEnable(): Promise<void> {
    // Override in plugin implementation
  }

  /**
   * Called when the plugin is disabled
   */
  async onDisable(): Promise<void> {
    // Override in plugin implementation
  }

  /**
   * Data Storage Methods
   */

  /**
   * Get plugin-specific data
   */
  protected async getData(key: string): Promise<unknown> {
    return await this.context.getData(key);
  }

  /**
   * Set plugin-specific data
   */
  protected async setData(key: string, value: unknown): Promise<void> {
    await this.context.setData(key, value);
  }

  /**
   * API Methods
   */

  /**
   * Register a new API route
   * This will be implemented by the plugin manager
   */
  protected registerRoute(path: string, _handler: RouteHandler): void {
    this.logger.info(`Registering route: ${path}`);
    // Implementation will be added by plugin manager
  }

  /**
   * Call existing system API
   */
  protected async callSystemAPI(call: PluginAPICall): Promise<unknown> {
    this.logger.info(`Calling system API: ${call.endpoint}`);
    // Implementation will be added by plugin manager
    throw new Error('System API calls not yet implemented');
  }

  /**
   * Agent Communication Methods
   */

  /**
   * Send command to external agent
   */
  protected async sendAgentCommand(agentId: string, command: Record<string, unknown>): Promise<unknown> {
    this.logger.info(`Sending command to agent ${agentId}:`, command);
    // Implementation will be added by plugin manager
    throw new Error('Agent communication not yet implemented');
  }

  /**
   * Utility Methods
   */

  /**
   * Get plugin name
   */
  protected getPluginName(): string {
    return this.context.pluginName;
  }

  /**
   * Get plugin path
   */
  protected getPluginPath(): string {
    return this.context.pluginPath;
  }

  /**
   * Log info message
   */
  protected logInfo(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  /**
   * Log warning message
   */
  protected logWarn(message: string, ...args: unknown[]): void {
    this.logger.warn(message, ...args);
  }

  /**
   * Log error message
   */
  protected logError(message: string, ...args: unknown[]): void {
    this.logger.error(message, ...args);
  }

  /**
   * Log debug message
   */
  protected logDebug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }
}

export default PluginBase;
