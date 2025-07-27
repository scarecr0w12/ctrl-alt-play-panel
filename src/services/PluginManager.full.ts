import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PluginBase } from '../types/plugin/PluginBase';
import { PluginMetadata, PluginContext } from '../types/plugin/interfaces';
import { logger } from '../utils/logger';

// Plugin types (will be available after Prisma generation)
enum PluginStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  UPDATING = 'UPDATING'
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string | null;
  permissions: unknown;
  autoUpdate: boolean;
  versionLocked: boolean;
  status: PluginStatus;
  installedAt: Date;
  lastUpdated?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PluginManager {
  private prisma: PrismaClient;
  private loadedPlugins: Map<string, PluginBase> = new Map();
  private pluginDirectory: string;

  constructor(prisma: PrismaClient, pluginDirectory: string = './plugins') {
    this.prisma = prisma;
    this.pluginDirectory = path.resolve(pluginDirectory);
    this.ensurePluginDirectory();
  }

  /**
   * Initialize the plugin manager and load all active plugins
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Plugin Manager...');
    
    try {
      await this.ensurePluginDirectory();
      await this.loadActivePlugins();
      logger.info(`Plugin Manager initialized with ${this.loadedPlugins.size} active plugins`);
    } catch (error) {
      logger.error('Failed to initialize Plugin Manager:', error);
      throw error;
    }
  }

  /**
   * Install a plugin from a local package
   */
  async installPlugin(pluginPath: string): Promise<Plugin> {
    logger.info(`Installing plugin from: ${pluginPath}`);

    try {
      // Validate plugin structure
      const metadata = await this.validatePluginStructure(pluginPath);
      
      // Check if plugin already exists
      const existingPlugin = await (this.prisma as any).plugin.findUnique({
        where: { name: metadata.name }
      });

      if (existingPlugin) {
        throw new Error(`Plugin "${metadata.name}" is already installed`);
      }

      // Copy plugin to plugins directory
      const targetPath = path.join(this.pluginDirectory, metadata.name);
      await this.copyPlugin(pluginPath, targetPath);

      // Register plugin in database
      const plugin = await (this.prisma as any).plugin.create({
        data: {
          name: metadata.name,
          version: metadata.version,
          author: metadata.author,
          description: metadata.description,
          permissions: metadata.permissions || {},
          autoUpdate: false,
          versionLocked: false,
          status: PluginStatus.INACTIVE
        }
      });

      // Run install lifecycle hook
      await this.runPluginLifecycleHook(targetPath, 'onInstall');

      logger.info(`Plugin "${metadata.name}" installed successfully`);
      return plugin;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to install plugin: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginName: string): Promise<void> {
    logger.info(`Enabling plugin: ${pluginName}`);

    try {
      const plugin = await (this.prisma as any).plugin.findUnique({
        where: { name: pluginName }
      });

      if (!plugin) {
        throw new Error(`Plugin "${pluginName}" not found`);
      }

      if (plugin.status === PluginStatus.ACTIVE) {
        throw new Error(`Plugin "${pluginName}" is already active`);
      }

      // Load the plugin
      const loadedPlugin = await this.loadPlugin(pluginName);
      
      // Run enable lifecycle hook
      await loadedPlugin.onEnable();

      // Update database status
      await (this.prisma as any).plugin.update({
        where: { name: pluginName },
        data: { status: PluginStatus.ACTIVE }
      });

      this.loadedPlugins.set(pluginName, loadedPlugin);
      logger.info(`Plugin "${pluginName}" enabled successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to enable plugin "${pluginName}": ${errorMessage}`);
      
      // Update status to error
      await (this.prisma as any).plugin.update({
        where: { name: pluginName },
        data: { status: PluginStatus.ERROR }
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginName: string): Promise<void> {
    logger.info(`Disabling plugin: ${pluginName}`);

    try {
      const plugin = await (this.prisma as any).plugin.findUnique({
        where: { name: pluginName }
      });

      if (!plugin) {
        throw new Error(`Plugin "${pluginName}" not found`);
      }

      if (plugin.status !== PluginStatus.ACTIVE) {
        throw new Error(`Plugin "${pluginName}" is not active`);
      }

      // Get loaded plugin instance
      const loadedPlugin = this.loadedPlugins.get(pluginName);
      if (loadedPlugin) {
        // Run disable lifecycle hook
        await loadedPlugin.onDisable();
        
        // Remove from loaded plugins
        this.loadedPlugins.delete(pluginName);
      }

      // Update database status
      await (this.prisma as any).plugin.update({
        where: { name: pluginName },
        data: { status: PluginStatus.INACTIVE }
      });

      logger.info(`Plugin "${pluginName}" disabled successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to disable plugin "${pluginName}": ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<void> {
    logger.info(`Uninstalling plugin: ${pluginName}`);

    try {
      // Disable plugin first if it's active
      const plugin = await (this.prisma as any).plugin.findUnique({
        where: { name: pluginName }
      });

      if (!plugin) {
        throw new Error(`Plugin "${pluginName}" not found`);
      }

      if (plugin.status === PluginStatus.ACTIVE) {
        await this.disablePlugin(pluginName);
      }

      // Run uninstall lifecycle hook
      const pluginPath = path.join(this.pluginDirectory, pluginName);
      await this.runPluginLifecycleHook(pluginPath, 'onUninstall');

      // Remove plugin files
      await fs.promises.rmdir(pluginPath, { recursive: true });

      // Remove from database
      await (this.prisma as any).plugin.delete({
        where: { name: pluginName }
      });

      logger.info(`Plugin "${pluginName}" uninstalled successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to uninstall plugin "${pluginName}": ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get plugin data
   */
  async getPluginData(pluginName: string, key: string): Promise<unknown> {
    const data = await (this.prisma as any).pluginData.findUnique({
      where: {
        pluginId_key: {
          pluginId: pluginName,
          key
        }
      }
    });

    return data?.value || null;
  }

  /**
   * Set plugin data
   */
  async setPluginData(pluginName: string, key: string, value: unknown): Promise<void> {
    await (this.prisma as any).pluginData.upsert({
      where: {
        pluginId_key: {
          pluginId: pluginName,
          key
        }
      },
      update: {
        value,
        updatedAt: new Date()
      },
      create: {
        pluginId: pluginName,
        key,
        value
      }
    });
  }

  /**
   * Get all installed plugins
   */
  async getInstalledPlugins(): Promise<Plugin[]> {
    return await (this.prisma as any).plugin.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): Map<string, PluginBase> {
    return new Map(this.loadedPlugins);
  }

  /**
   * Call plugin method
   */
  async callPluginMethod(pluginName: string, methodName: string, ...args: unknown[]): Promise<unknown> {
    const plugin = this.loadedPlugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" is not loaded`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (plugin as any)[methodName] !== 'function') {
      throw new Error(`Method "${methodName}" not found in plugin "${pluginName}"`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (plugin as any)[methodName](...args);
  }

  /**
   * Private methods
   */

  private ensurePluginDirectory(): void {
    if (!fs.existsSync(this.pluginDirectory)) {
      fs.mkdirSync(this.pluginDirectory, { recursive: true });
    }
  }

  private async loadActivePlugins(): Promise<void> {
    const activePlugins = await (this.prisma as any).plugin.findMany({
      where: { status: PluginStatus.ACTIVE }
    });

    for (const plugin of activePlugins) {
      try {
        const loadedPlugin = await this.loadPlugin(plugin.name);
        await loadedPlugin.onEnable();
        this.loadedPlugins.set(plugin.name, loadedPlugin);
        logger.info(`Loaded active plugin: ${plugin.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to load plugin "${plugin.name}": ${errorMessage}`);
        
        // Update status to error
        await (this.prisma as any).plugin.update({
          where: { id: plugin.id },
          data: { status: PluginStatus.ERROR }
        });
      }
    }
  }

  private async loadPlugin(pluginName: string): Promise<PluginBase> {
    const pluginPath = path.join(this.pluginDirectory, pluginName);
    const backendPath = path.join(pluginPath, 'backend', 'index.js');

    if (!fs.existsSync(backendPath)) {
      throw new Error(`Plugin backend file not found: ${backendPath}`);
    }

    // Create plugin context
    const context: PluginContext = {
      pluginName,
      pluginPath,
      getData: (key: string) => this.getPluginData(pluginName, key),
      setData: (key: string, value: unknown) => this.setPluginData(pluginName, key, value),
      logger: logger.child({ plugin: pluginName })
    };

    // Load the plugin module
    const PluginClass = require(backendPath).default || require(backendPath);
    
    if (typeof PluginClass !== 'function') {
      throw new Error(`Plugin "${pluginName}" does not export a valid class`);
    }

    return new PluginClass(context);
  }

  private async validatePluginStructure(pluginPath: string): Promise<PluginMetadata> {
    const metadataPath = path.join(pluginPath, 'plugin.yaml');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Plugin metadata file (plugin.yaml) not found');
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf8');
    const metadata = yaml.load(metadataContent) as PluginMetadata;

    // Validate required fields
    if (!metadata.name || !metadata.version || !metadata.author) {
      throw new Error('Plugin metadata missing required fields: name, version, author');
    }

    // Validate plugin structure
    const backendPath = path.join(pluginPath, 'backend', 'index.js');
    if (!fs.existsSync(backendPath)) {
      throw new Error('Plugin backend entry point (backend/index.js) not found');
    }

    return metadata;
  }

  private async copyPlugin(sourcePath: string, targetPath: string): Promise<void> {
    const copyRecursive = async (src: string, dest: string) => {
      const stat = await fs.promises.stat(src);
      
      if (stat.isDirectory()) {
        await fs.promises.mkdir(dest, { recursive: true });
        const files = await fs.promises.readdir(src);
        
        for (const file of files) {
          await copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        await fs.promises.copyFile(src, dest);
      }
    };

    await copyRecursive(sourcePath, targetPath);
  }

  private async runPluginLifecycleHook(pluginPath: string, hookName: string): Promise<void> {
    try {
      const backendPath = path.join(pluginPath, 'backend', 'index.js');
      
      if (fs.existsSync(backendPath)) {
        const PluginClass = require(backendPath).default || require(backendPath);
        const tempContext: PluginContext = {
          pluginName: path.basename(pluginPath),
          pluginPath,
          getData: () => Promise.resolve(null),
          setData: () => Promise.resolve(),
          logger: logger.child({ plugin: path.basename(pluginPath) })
        };
        
        const instance = new PluginClass(tempContext);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (instance as any)[hookName] === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (instance as any)[hookName]();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to run lifecycle hook "${hookName}": ${errorMessage}`);
    }
  }
}

export default PluginManager;
