/**
 * Plugin Publishing Service
 * Handles the complete plugin publishing workflow to marketplace
 */

import { marketplaceIntegration } from './MarketplaceIntegration';
import { logger } from '../utils/logger';
import { 
  PluginPublishRequest, 
  PluginPublishResponse
} from '../types/marketplace';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface PluginMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  tags: string[];
  category: string;
  icon_url?: string;
  screenshots?: string[];
  price?: number;
  currency?: string;
  dependencies?: Record<string, string>;
  min_panel_version?: string;
  max_panel_version?: string;
}

export interface PluginValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: PluginMetadata;
  fileHashes?: Record<string, string>;
}

export interface PublishingWorkflowState {
  plugin_id: string;
  user_id: string;
  status: 'validating' | 'packaging' | 'uploading' | 'publishing' | 'published' | 'failed';
  step: number;
  totalSteps: number;
  message: string;
  errors?: string[];
  marketplace_item_id?: string;
  created_at: Date;
  updated_at: Date;
}

export class PluginPublishingService {
  private workflows = new Map<string, PublishingWorkflowState>();

  /**
   * Start the complete plugin publishing workflow
   */
  async startPublishingWorkflow(
    pluginPath: string,
    userId: string,
    options: {
      autoPublish?: boolean;
      skipValidation?: boolean;
      publishAsUpdate?: boolean;
      existingMarketplaceId?: string;
    } = {}
  ): Promise<{ workflowId: string; status: PublishingWorkflowState }> {
    const workflowId = crypto.randomUUID();
    
    // Initialize workflow state
    const workflow: PublishingWorkflowState = {
      plugin_id: workflowId,
      user_id: userId,
      status: 'validating',
      step: 1,
      totalSteps: options.autoPublish ? 4 : 3,
      message: 'Starting plugin validation...',
      created_at: new Date(),
      updated_at: new Date()
    };

    this.workflows.set(workflowId, workflow);

    logger.info('Starting plugin publishing workflow', {
      workflowId,
      userId,
      pluginPath,
      options
    });

    try {
      // Step 1: Validate plugin
      if (!options.skipValidation) {
        await this.updateWorkflowStatus(workflowId, 'validating', 1, 'Validating plugin structure and metadata...');
        const validation = await this.validatePlugin(pluginPath);
        
        if (!validation.isValid) {
          await this.updateWorkflowStatus(workflowId, 'failed', 1, 'Plugin validation failed', validation.errors);
          return { workflowId, status: this.workflows.get(workflowId)! };
        }

        if (validation.warnings.length > 0) {
          logger.warn('Plugin validation warnings', {
            workflowId,
            warnings: validation.warnings
          });
        }
      }

      // Step 2: Package plugin
      await this.updateWorkflowStatus(workflowId, 'packaging', 2, 'Creating plugin package...');
      const packageInfo = await this.packagePlugin(pluginPath, workflowId);

      // Step 3: Upload to marketplace
      await this.updateWorkflowStatus(workflowId, 'uploading', 3, 'Uploading to marketplace...');
      const uploadResult = await this.uploadPluginPackage(packageInfo, userId);

      // Step 4: Publish (if auto-publish enabled)
      if (options.autoPublish) {
        await this.updateWorkflowStatus(workflowId, 'publishing', 4, 'Publishing to marketplace...');
        const publishResult = await this.publishToMarketplace(uploadResult, userId, options);
        
        await this.updateWorkflowStatus(
          workflowId, 
          'published', 
          4, 
          'Plugin successfully published!',
          undefined,
          publishResult.marketplace_item_id
        );
      } else {
        await this.updateWorkflowStatus(workflowId, 'published', 3, 'Plugin package ready for review');
      }

      return { workflowId, status: this.workflows.get(workflowId)! };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateWorkflowStatus(workflowId, 'failed', -1, 'Publishing failed', [errorMessage]);
      
      logger.error('Plugin publishing workflow failed', {
        workflowId,
        userId,
        error: errorMessage
      });

      return { workflowId, status: this.workflows.get(workflowId)! };
    }
  }

  /**
   * Validate plugin structure and metadata
   */
  async validatePlugin(pluginPath: string): Promise<PluginValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fileHashes: Record<string, string> = {};

    try {
      // Check if plugin directory exists
      const stats = await fs.stat(pluginPath);
      if (!stats.isDirectory()) {
        errors.push('Plugin path must be a directory');
        return { isValid: false, errors, warnings };
      }

      // Check for required files
      const requiredFiles = ['manifest.json', 'index.js'];
      for (const file of requiredFiles) {
        const filePath = path.join(pluginPath, file);
        try {
          await fs.access(filePath);
          // Generate file hash
          const content = await fs.readFile(filePath);
          fileHashes[file] = crypto.createHash('sha256').update(content).digest('hex');
        } catch {
          errors.push(`Required file missing: ${file}`);
        }
      }

      // Validate manifest.json
      let metadata: PluginMetadata | undefined;
      try {
        const manifestPath = path.join(pluginPath, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        
        metadata = await this.validateManifest(manifest);
        
        // Additional file validations
        const optionalFiles = ['README.md', 'LICENSE', 'CHANGELOG.md'];
        for (const file of optionalFiles) {
          const filePath = path.join(pluginPath, file);
          try {
            await fs.access(filePath);
            const content = await fs.readFile(filePath);
            fileHashes[file] = crypto.createHash('sha256').update(content).digest('hex');
          } catch {
            warnings.push(`Recommended file missing: ${file}`);
          }
        }

        // Check for icon file
        if (metadata.icon_url && !metadata.icon_url.startsWith('http')) {
          const iconPath = path.join(pluginPath, metadata.icon_url);
          try {
            await fs.access(iconPath);
            const content = await fs.readFile(iconPath);
            fileHashes[metadata.icon_url] = crypto.createHash('sha256').update(content).digest('hex');
          } catch {
            warnings.push(`Icon file not found: ${metadata.icon_url}`);
          }
        }

        // Validate screenshots
        if (metadata.screenshots) {
          for (const screenshot of metadata.screenshots) {
            if (!screenshot.startsWith('http')) {
              const screenshotPath = path.join(pluginPath, screenshot);
              try {
                await fs.access(screenshotPath);
                const content = await fs.readFile(screenshotPath);
                fileHashes[screenshot] = crypto.createHash('sha256').update(content).digest('hex');
              } catch {
                warnings.push(`Screenshot file not found: ${screenshot}`);
              }
            }
          }
        }

      } catch (error) {
        errors.push(`Invalid manifest.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Check plugin size
      const size = await this.calculateDirectorySize(pluginPath);
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (size > maxSize) {
        errors.push(`Plugin size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
      } else if (size > 10 * 1024 * 1024) {
        warnings.push(`Plugin size (${Math.round(size / 1024 / 1024)}MB) is quite large`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata,
        fileHashes
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate manifest.json structure
   */
  private async validateManifest(manifest: Record<string, unknown>): Promise<PluginMetadata> {
    const errors: string[] = [];

    // Required fields
    const requiredFields = ['name', 'version', 'description', 'author'];
    for (const field of requiredFields) {
      if (!manifest[field] || typeof manifest[field] !== 'string' || (manifest[field] as string).trim() === '') {
        errors.push(`Missing or invalid required field: ${field}`);
      }
    }

    // Version format validation
    if (manifest.version && typeof manifest.version === 'string' && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(manifest.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }

    // Name validation
    if (manifest.name && typeof manifest.name === 'string' && (manifest.name.length < 3 || manifest.name.length > 50)) {
      errors.push('Plugin name must be between 3 and 50 characters');
    }

    // Description validation
    if (manifest.description && typeof manifest.description === 'string' && (manifest.description.length < 10 || manifest.description.length > 500)) {
      errors.push('Plugin description must be between 10 and 500 characters');
    }

    // Tags validation
    if (manifest.tags && !Array.isArray(manifest.tags)) {
      errors.push('Tags must be an array');
    } else if (manifest.tags && Array.isArray(manifest.tags) && manifest.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    // Category validation
    const validCategories = [
      'utility', 'game', 'monitoring', 'security', 'automation', 
      'interface', 'integration', 'analytics', 'backup', 'development'
    ];
    if (manifest.category && typeof manifest.category === 'string' && !validCategories.includes(manifest.category)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Price validation
    if (manifest.price !== undefined) {
      if (typeof manifest.price !== 'number' || manifest.price < 0) {
        errors.push('Price must be a non-negative number');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Manifest validation failed: ${errors.join(', ')}`);
    }

    return {
      name: manifest.name as string,
      description: manifest.description as string,
      version: manifest.version as string,
      author: manifest.author as string,
      homepage: manifest.homepage as string | undefined,
      repository: manifest.repository as string | undefined,
      license: (manifest.license as string) || 'MIT',
      tags: (manifest.tags as string[]) || [],
      category: (manifest.category as string) || 'utility',
      icon_url: manifest.icon_url as string | undefined,
      screenshots: manifest.screenshots as string[] | undefined,
      price: (manifest.price as number) || 0,
      currency: (manifest.currency as string) || 'USD',
      dependencies: (manifest.dependencies as Record<string, string>) || {},
      min_panel_version: manifest.min_panel_version as string | undefined,
      max_panel_version: manifest.max_panel_version as string | undefined
    };
  }

  /**
   * Package plugin into a zip file (simplified without archiver)
   */
  private async packagePlugin(pluginPath: string, workflowId: string): Promise<{
    packagePath: string;
    packageHash: string;
    packageSize: number;
  }> {
    // For now, create a simple mock package
    const packageDir = path.join(__dirname, '../../temp/packages');
    await fs.mkdir(packageDir, { recursive: true });
    
    const packagePath = path.join(packageDir, `${workflowId}.zip`);
    
    // Create a simple mock zip file (in real implementation, use proper zip library)
    const mockContent = `Mock package for workflow ${workflowId}`;
    await fs.writeFile(packagePath, mockContent);
    
    const stats = await fs.stat(packagePath);
    const content = await fs.readFile(packagePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    logger.info('Plugin package created (mock)', {
      workflowId,
      packagePath,
      size: stats.size,
      hash
    });

    return {
      packagePath,
      packageHash: hash,
      packageSize: stats.size
    };
  }

  /**
   * Upload plugin package to marketplace
   */
  private async uploadPluginPackage(
    packageInfo: { packagePath: string; packageHash: string; packageSize: number },
    userId: string
  ): Promise<{ package_url: string; package_hash: string; upload_id: string }> {
    try {
      // In a real implementation, this would upload to a cloud storage service
      // For now, we'll simulate the upload and return a mock URL
      const uploadId = crypto.randomUUID();
      const packageUrl = `https://packages.ctrl-alt-play.com/plugins/${uploadId}.zip`;

      logger.info('Plugin package uploaded', {
        userId,
        uploadId,
        packageUrl,
        hash: packageInfo.packageHash,
        size: packageInfo.packageSize
      });

      // Clean up local package file
      await fs.unlink(packageInfo.packagePath);

      return {
        package_url: packageUrl,
        package_hash: packageInfo.packageHash,
        upload_id: uploadId
      };
    } catch (error) {
      logger.error('Failed to upload plugin package', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Publish plugin to marketplace
   */
  private async publishToMarketplace(
    uploadResult: { package_url: string; package_hash: string; upload_id: string },
    userId: string,
    options: { publishAsUpdate?: boolean; existingMarketplaceId?: string }
  ): Promise<PluginPublishResponse> {
    try {
      // Read manifest from uploaded package (in real implementation)
      // For now, we'll create a mock request
      const publishRequest: PluginPublishRequest = {
        user_id: userId,
        panel_item_id: uploadResult.upload_id,
        item_data: {
          title: 'Sample Plugin',
          description: 'A sample plugin for demonstration',
          category_id: 'utility',
          tags: ['sample', 'demo'],
          price: 0,
          currency: 'USD',
          license_type: 'free',
          files: [{
            name: 'package.zip',
            size: 1024,
            type: 'application/zip',
            url: uploadResult.package_url,
            checksum: uploadResult.package_hash
          }],
          screenshots: [],
          metadata: {},
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      if (options.publishAsUpdate && options.existingMarketplaceId) {
        return await marketplaceIntegration.updatePlugin(options.existingMarketplaceId, publishRequest);
      } else {
        return await marketplaceIntegration.publishPlugin(publishRequest);
      }
    } catch (error) {
      logger.error('Failed to publish plugin to marketplace', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(
    workflowId: string,
    status: PublishingWorkflowState['status'],
    step: number,
    message: string,
    errors?: string[],
    marketplaceItemId?: string
  ): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.status = status;
    workflow.step = step;
    workflow.message = message;
    workflow.updated_at = new Date();
    
    if (errors) {
      workflow.errors = errors;
    }
    
    if (marketplaceItemId) {
      workflow.marketplace_item_id = marketplaceItemId;
    }

    this.workflows.set(workflowId, workflow);

    logger.info('Workflow status updated', {
      workflowId,
      status,
      step,
      message
    });
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<PublishingWorkflowState | null> {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * List user workflows
   */
  async getUserWorkflows(userId: string): Promise<PublishingWorkflowState[]> {
    return Array.from(this.workflows.values()).filter(w => w.user_id === userId);
  }

  /**
   * Calculate directory size
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        totalSize += await this.calculateDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  /**
   * Clean up old workflows
   */
  async cleanupOldWorkflows(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [workflowId, workflow] of this.workflows.entries()) {
      if (workflow.updated_at < cutoffTime) {
        this.workflows.delete(workflowId);
        cleaned++;
      }
    }

    logger.info('Cleaned up old workflows', { cleaned, maxAgeHours });
  }
}

/**
 * Default plugin publishing service instance
 */
export const pluginPublishingService = new PluginPublishingService();
