import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import DatabaseService from '../services/database';
import PluginManager from '../services/PluginManager.full';
import { logger } from '../utils/logger';

const router = Router();

// Factory function to create a PluginManager instance using the current DatabaseService state
function getPluginManager(): PluginManager {
  try {
    return new PluginManager(DatabaseService.getInstance());
  } catch (error) {
    // Fallback to creating a new PrismaClient instance if DatabaseService is not initialized
    const prisma = new PrismaClient();
    return new PluginManager(prisma);
  }
}

/**
 * Plugin Management Routes
 * Basic CRUD operations for the plugin system
 */

// GET / - List all installed plugins
router.get('/', async (req: Request, res: Response) => {
  try {
    const pluginManager = getPluginManager();
    const plugins = await pluginManager.getInstalledPlugins();

    res.json({
      success: true,
      data: plugins,
      message: 'Plugins retrieved successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to retrieve plugins'
    });
  }
});

// GET /:name - Get specific plugin details
router.get('/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const pluginName = req.params.name;
    const pluginManager = getPluginManager();
    const plugins = await pluginManager.getInstalledPlugins();
    
    // Debug output
    console.log(`Looking for plugin: ${pluginName}`);
    console.log(`Available plugins:`, plugins.map((p: any) => p.name));
    
    const plugin = plugins.find((p: any) => p.name === pluginName);
    
    if (!plugin) {
      console.log(`Plugin "${pluginName}" not found`);
      res.status(404).json({
        success: false,
        error: 'Plugin not found',
        message: `Plugin "${pluginName}" not found`
      });
      return;
    }
    
    console.log(`Plugin "${pluginName}" found:`, plugin);
    res.json({
      success: true,
      data: plugin,
      message: 'Plugin retrieved successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error retrieving plugin:', error);
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to retrieve plugin'
    });
  }
});

// POST /:name/enable - Enable a plugin
router.post('/:name/enable', async (req: Request, res: Response): Promise<void> => {
  try {
    const pluginName = req.params.name;
    const pluginManager = getPluginManager();
    
    // Check if plugin exists
    const plugins = await pluginManager.getInstalledPlugins();
    const plugin = plugins.find((p: any) => p.name === pluginName);
    
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found',
        message: `Plugin "${pluginName}" not found`
      });
      return;
    }

    await pluginManager.enablePlugin(pluginName);
    
    res.json({
      success: true,
      message: `Plugin "${pluginName}" enabled successfully`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to enable plugin'
    });
  }
});

// POST /:name/disable - Disable a plugin
router.post('/:name/disable', async (req: Request, res: Response): Promise<void> => {
  try {
    const pluginName = req.params.name;
    const pluginManager = getPluginManager();
    
    // Check if plugin exists
    const plugins = await pluginManager.getInstalledPlugins();
    const plugin = plugins.find((p: any) => p.name === pluginName);
    
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found',
        message: `Plugin "${pluginName}" not found`
      });
      return;
    }

    await pluginManager.disablePlugin(pluginName);
    
    res.json({
      success: true,
      message: `Plugin "${pluginName}" disabled successfully`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to disable plugin'
    });
  }
});

// DELETE /:name - Uninstall a plugin
router.delete('/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const pluginName = req.params.name;
    const pluginManager = getPluginManager();
    
    // Check if plugin exists
    const plugins = await pluginManager.getInstalledPlugins();
    const plugin = plugins.find((p: any) => p.name === pluginName);
    
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found',
        message: `Plugin "${pluginName}" not found`
      });
      return;
    }

    await pluginManager.uninstallPlugin(pluginName);
    
    res.json({
      success: true,
      message: `Plugin "${pluginName}" uninstalled successfully`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: 'Failed to uninstall plugin'
    });
  }
});

export default router;
