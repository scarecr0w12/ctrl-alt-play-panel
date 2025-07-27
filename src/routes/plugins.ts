import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Plugin Management Routes
 * Basic CRUD operations for the plugin system
 */

// GET / - List all installed plugins
router.get('/', async (req: Request, res: Response) => {
  try {
    const plugins = await (prisma as any).plugin.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: plugins,
      count: plugins.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plugins',
      details: errorMessage
    });
  }
});

// GET /:name - Get specific plugin details
router.get('/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    
    const plugin = await (prisma as any).plugin.findUnique({
      where: { name }
    });

    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
      return;
    }

    res.json({
      success: true,
      data: plugin
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plugin',
      details: errorMessage
    });
  }
});

// POST /:name/enable - Enable a plugin
router.post('/:name/enable', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    
    const plugin = await (prisma as any).plugin.findUnique({
      where: { name }
    });

    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
      return;
    }

    if (plugin.status === 'ACTIVE') {
      res.status(400).json({
        success: false,
        error: 'Plugin is already active'
      });
      return;
    }

    // Update plugin status
    const updatedPlugin = await (prisma as any).plugin.update({
      where: { name },
      data: { 
        status: 'ACTIVE',
        lastUpdated: new Date()
      }
    });

    res.json({
      success: true,
      message: `Plugin "${name}" enabled successfully`,
      data: updatedPlugin
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable plugin',
      details: errorMessage
    });
  }
});

// POST /:name/disable - Disable a plugin
router.post('/:name/disable', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    
    const plugin = await (prisma as any).plugin.findUnique({
      where: { name }
    });

    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
      return;
    }

    if (plugin.status === 'INACTIVE') {
      res.status(400).json({
        success: false,
        error: 'Plugin is already inactive'
      });
      return;
    }

    // Update plugin status
    const updatedPlugin = await (prisma as any).plugin.update({
      where: { name },
      data: { 
        status: 'INACTIVE',
        lastUpdated: new Date()
      }
    });

    res.json({
      success: true,
      message: `Plugin "${name}" disabled successfully`,
      data: updatedPlugin
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable plugin',
      details: errorMessage
    });
  }
});

// DELETE /:name - Uninstall a plugin
router.delete('/:name', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    
    const plugin = await (prisma as any).plugin.findUnique({
      where: { name }
    });

    if (!plugin) {
      res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
      return;
    }

    // Delete plugin from database
    await (prisma as any).plugin.delete({
      where: { name }
    });

    res.json({
      success: true,
      message: `Plugin "${name}" uninstalled successfully`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Failed to uninstall plugin',
      details: errorMessage
    });
  }
});

export default router;
