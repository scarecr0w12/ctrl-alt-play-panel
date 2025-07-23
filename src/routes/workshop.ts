import { Router } from 'express';
import { SteamWorkshopService } from '../services/steamWorkshopService';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const workshopService = new SteamWorkshopService();

/**
 * Search Steam Workshop items
 * GET /api/workshop/search
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { gameId, query, type, page = '1', limit = '20' } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    const result = await workshopService.searchWorkshopItems(
      gameId as string,
      query as string,
      type as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to search workshop items:', error);
    return res.status(500).json({ error: 'Failed to search workshop items' });
  }
});

/**
 * Get workshop item details
 * GET /api/workshop/items/:workshopId
 */
router.get('/items/:workshopId', authenticateToken, async (req, res) => {
  try {
    const { workshopId } = req.params;

    const item = await workshopService.getWorkshopItem(workshopId);

    if (!item) {
      return res.status(404).json({ error: 'Workshop item not found' });
    }

    return res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Failed to get workshop item:', error);
    return res.status(500).json({ error: 'Failed to get workshop item' });
  }
});

/**
 * Install workshop item on server
 * POST /api/workshop/servers/:serverId/install
 */
router.post('/servers/:serverId/install', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { workshopId } = req.body;

    if (!workshopId) {
      return res.status(400).json({ error: 'Workshop ID is required' });
    }

    const success = await workshopService.installWorkshopItem(serverId, workshopId);

    if (success) {
      return res.json({
        success: true,
        message: 'Workshop item installation started'
      });
    } else {
      return res.status(500).json({ error: 'Failed to start installation' });
    }
  } catch (error) {
    console.error('Failed to install workshop item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to install workshop item';
    return res.status(500).json({ error: errorMessage });
  }
});

/**
 * Remove workshop item from server
 * DELETE /api/workshop/servers/:serverId/items/:workshopId
 */
router.delete('/servers/:serverId/items/:workshopId', authenticateToken, async (req, res) => {
  try {
    const { serverId, workshopId } = req.params;

    const success = await workshopService.removeWorkshopItem(serverId, workshopId);

    if (success) {
      return res.json({
        success: true,
        message: 'Workshop item removed successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to remove workshop item' });
    }
  } catch (error) {
    console.error('Failed to remove workshop item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove workshop item';
    return res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get server's installed workshop items
 * GET /api/workshop/servers/:serverId/items
 */
router.get('/servers/:serverId/items', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;

    const items = await workshopService.getServerWorkshopItems(serverId);

    return res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Failed to get server workshop items:', error);
    return res.status(500).json({ error: 'Failed to get server workshop items' });
  }
});

/**
 * Update installation status (webhook for agents)
 * POST /api/workshop/webhook/status
 */
router.post('/webhook/status', async (req, res) => {
  try {
    const { serverId, workshopId, status, error } = req.body;

    if (!serverId || !workshopId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await workshopService.updateInstallationStatus(serverId, workshopId, status, error);

    return res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Failed to update installation status:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * Sync workshop items with Steam
 * POST /api/workshop/sync
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    await workshopService.syncWorkshopItems();

    return res.json({
      success: true,
      message: 'Workshop items sync initiated'
    });
  } catch (error) {
    console.error('Failed to sync workshop items:', error);
    return res.status(500).json({ error: 'Failed to sync workshop items' });
  }
});

export default router;
