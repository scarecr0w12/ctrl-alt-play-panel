import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from '../utils/logger';
import { PluginMetadata } from '../types/plugin/interfaces';

enum PluginStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  UPDATING = 'UPDATING'
}

/**
 * Simplified Plugin Manager for initial implementation
 * Handles basic plugin lifecycle operations
 */
export class PluginManager {
  private static instance: PluginManager;
  public prisma: PrismaClient;
  private pluginDirectory: string;
  private installedPlugins: Map<string, PluginMetadata>;

  constructor(prisma: PrismaClient, pluginDirectory?: string) {
    this.prisma = prisma;
    this.pluginDirectory = pluginDirectory || path.join(__dirname, '../../plugins');
    this.installedPlugins = new Map();
    this.ensurePluginDirectory();
    // Ensure prisma client is connected
    this.prisma.$connect().catch(error => {
      logger.error('Failed to connect Prisma client in PluginManager:', error);
    });
  }

  /**
   * Get singleton instance for CLI usage
   */
  static getInstance(prisma: PrismaClient, pluginDirectory?: string): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager(prisma, pluginDirectory);
    } else {
      // Always update the prisma client if a new one is provided
      PluginManager.instance.prisma = prisma;
    }
    // Always return the existing instance
    return PluginManager.instance;
  }

  /**
   * Static method to install plugin
   */
  static async validatePlugin(pluginPath: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const metadataPath = path.join(pluginPath, 'plugin.yaml');
      
      if (!fs.existsSync(metadataPath)) {
        throw new Error('Plugin metadata file (plugin.yaml) not found');
      }

      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      const metadata = yaml.load(metadataContent) as PluginMetadata;

      const errors: string[] = [];
      if (!metadata.name) errors.push('Plugin name is required');
      if (!metadata.version) errors.push('Plugin version is required');
      if (!metadata.author) errors.push('Plugin author is required');

      // Check if main plugin file exists
      if (metadata.main) {
        const mainFilePath = path.join(pluginPath, metadata.main);
        if (!fs.existsSync(mainFilePath)) {
          errors.push(`Main plugin file '${metadata.main}' not found`);
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Plugin validation failed: ${errorMessage}`);
    }
  }

  static async installPlugin(pluginPath: string, source: string = 'local', prismaClient?: PrismaClient): Promise<{ success: boolean; plugin: PluginMetadata; message: string }> {
    // For static methods, create a new PrismaClient if not provided
    let prisma: PrismaClient;
    if (prismaClient) {
      prisma = prismaClient;
    } else {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      await prisma.$connect();
    }
    const instance = PluginManager.getInstance(prisma);
    return await instance.installPlugin(pluginPath, source);
  }

  /**
   * Static method to enable plugin
   */
  static async enablePlugin(pluginName: string, prismaClient?: PrismaClient): Promise<{ success: boolean; message: string }> {
    // For static methods, create a new PrismaClient if not provided
    let prisma: PrismaClient;
    if (prismaClient) {
      prisma = prismaClient;
    } else {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      await prisma.$connect();
    }
    const instance = PluginManager.getInstance(prisma);
    return await instance.enablePlugin(pluginName);
  }

  /**
   * Static method to disable plugin
   */
  static async disablePlugin(pluginName: string, prismaClient?: PrismaClient): Promise<{ success: boolean; message: string }> {
    // For static methods, create a new PrismaClient if not provided
    let prisma: PrismaClient;
    if (prismaClient) {
      prisma = prismaClient;
    } else {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      await prisma.$connect();
    }
    const instance = PluginManager.getInstance(prisma);
    return await instance.disablePlugin(pluginName);
  }

  /**
   * Static method to uninstall plugin
   */
  static async uninstallPlugin(pluginName: string, prismaClient?: PrismaClient): Promise<{ success: boolean; message: string }> {
    // For static methods, create a new PrismaClient if not provided
    let prisma: PrismaClient;
    if (prismaClient) {
      prisma = prismaClient;
    } else {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      await prisma.$connect();
    }
    const instance = PluginManager.getInstance(prisma);
    return await instance.uninstallPlugin(pluginName);
  }

  /**
   * Static method to list plugins
   */
  static async getInstalledPlugins(prismaClient?: PrismaClient): Promise<any[]> {
    // For static methods, create a new PrismaClient if not provided
    let prisma: PrismaClient;
    if (prismaClient) {
      prisma = prismaClient;
    } else {
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      await prisma.$connect();
    }
    const instance = PluginManager.getInstance(prisma);
    return await instance.getInstalledPlugins();
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Plugin Manager...');
    
    try {
      this.ensurePluginDirectory();
      logger.info('Plugin Manager initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize Plugin Manager:', errorMessage);
      throw error;
    }
  }

  /**
   * Install plugin with source parameter for CLI compatibility
   */
  async installPlugin(pluginPath: string, source: string = 'local'): Promise<{ success: boolean; plugin: PluginMetadata; message: string }> {
    logger.info(`Installing plugin from: ${pluginPath}`);

    // Check if prisma is defined
    if (!this.prisma) {
      throw new Error('Prisma client is not defined');
    }

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

      // Add to installed plugins map
      this.installedPlugins.set(metadata.name, metadata);

      logger.info(`Plugin "${metadata.name}" installed successfully`);
      
      return {
        success: true,
        plugin: metadata,
        message: 'Plugin installed successfully'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to install plugin: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get all installed plugins
   */
  async getInstalledPlugins(): Promise<any[]> {
    // Check if prisma is defined
    if (!this.prisma) {
      throw new Error('Prisma client is not defined');
    }

    return await (this.prisma as any).plugin.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginName: string): Promise<{ success: boolean; message: string }> {
    logger.info(`Enabling plugin: ${pluginName}`);

    // Check if prisma is defined
    if (!this.prisma) {
      throw new Error('Prisma client is not defined');
    }

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

      // Update database status
      await (this.prisma as any).plugin.update({
        where: { name: pluginName },
        data: { status: PluginStatus.ACTIVE }
      });

      logger.info(`Plugin "${pluginName}" enabled successfully`);
      return { success: true, message: `Plugin "${pluginName}" enabled successfully` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to enable plugin "${pluginName}": ${errorMessage}`);
      return { success: false, message: `Failed to enable plugin: ${errorMessage}` };
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginName: string): Promise<{ success: boolean; message: string }> {
    logger.info(`Disabling plugin: ${pluginName}`);

    // Check if prisma is defined
    if (!this.prisma) {
      throw new Error('Prisma client is not defined');
    }

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

      // Update database status
      await (this.prisma as any).plugin.update({
        where: { name: pluginName },
        data: { status: PluginStatus.INACTIVE }
      });

      logger.info(`Plugin "${pluginName}" disabled successfully`);
      return { success: true, message: `Plugin "${pluginName}" disabled successfully` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to disable plugin "${pluginName}": ${errorMessage}`);
      return { success: false, message: `Failed to disable plugin: ${errorMessage}` };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<{ success: boolean; message: string }> {
    logger.info(`Uninstalling plugin: ${pluginName}`);

    // Check if prisma is defined
    if (!this.prisma) {
      throw new Error('Prisma client is not defined');
    }

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

      // Remove plugin files
      const pluginPath = path.join(this.pluginDirectory, pluginName);
      if (fs.existsSync(pluginPath)) {
        await fs.promises.rmdir(pluginPath, { recursive: true });
      }

      // Remove from database
      await (this.prisma as any).plugin.delete({
        where: { name: pluginName }
      });

      logger.info(`Plugin "${pluginName}" uninstalled successfully`);
      return { success: true, message: `Plugin "${pluginName}" uninstalled successfully` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to uninstall plugin "${pluginName}": ${errorMessage}`);
      return { success: false, message: `Failed to uninstall plugin: ${errorMessage}` };
    }
  }

  /**
   * Private helper methods
   */

  private ensurePluginDirectory(): void {
    if (!fs.existsSync(this.pluginDirectory)) {
      fs.mkdirSync(this.pluginDirectory, { recursive: true });
    }
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

  // Additional methods needed by CLI

  /**
   * Validate a plugin configuration
   */
  async validatePlugin(config: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!config.name) errors.push('Plugin name is required');
    if (!config.version) errors.push('Plugin version is required');
    if (!config.author) errors.push('Plugin author is required');

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Get list of plugins
   */
  async getPlugins(type?: string): Promise<PluginMetadata[]> {
    const plugins: PluginMetadata[] = [];
    
    if (fs.existsSync(this.pluginDirectory)) {
      const pluginDirs = fs.readdirSync(this.pluginDirectory);
      
      for (const dir of pluginDirs) {
        try {
          const pluginPath = path.join(this.pluginDirectory, dir);
          if (fs.statSync(pluginPath).isDirectory()) {
            const metadata = await this.validatePluginStructure(pluginPath);
            plugins.push(metadata);
          }
        } catch (error) {
          // Skip invalid plugins
          continue;
        }
      }
    }
    
    return plugins;
  }

}

export default PluginManager;
