import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from '../utils/logger';

// Basic types for plugin system
interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description?: string;
  permissions?: Record<string, any>;
}

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
  private prisma: PrismaClient;
  private pluginDirectory: string;

  constructor(prisma: PrismaClient, pluginDirectory: string = './plugins') {
    this.prisma = prisma;
    this.pluginDirectory = path.resolve(pluginDirectory);
    this.ensurePluginDirectory();
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
   * Install a plugin from a local package
   */
  async installPlugin(pluginPath: string): Promise<any> {
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

      logger.info(`Plugin "${metadata.name}" installed successfully`);
      return plugin;

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
    return await (this.prisma as any).plugin.findMany({
      orderBy: { name: 'asc' }
    });
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

      // Update database status
      await (this.prisma as any).plugin.update({
        where: { name: pluginName },
        data: { status: PluginStatus.ACTIVE }
      });

      logger.info(`Plugin "${pluginName}" enabled successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to enable plugin "${pluginName}": ${errorMessage}`);
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to uninstall plugin "${pluginName}": ${errorMessage}`);
      throw error;
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
}

export default PluginManager;
