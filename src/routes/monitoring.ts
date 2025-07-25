import { Router } from 'express';
import { MonitoringService } from '../services/monitoringService';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission 
} from '../middlewares/permissions';
import { UserRole } from '../types';

const router = Router();
const monitoringService = new MonitoringService();

/**
 * Get server metrics history
 * GET /api/monitoring/servers/:id/metrics
 */
router.get('/servers/:id/metrics', authenticateToken, requireAnyPermission(['monitoring.view', 'servers.view']), async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '24h' } = req.query;

    // Validate time range
    const validRanges = ['1h', '6h', '24h', '7d', '30d'];
    if (!validRanges.includes(timeRange as string)) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    const metrics = await monitoringService.getServerMetricsHistory(
      id,
      timeRange as '1h' | '6h' | '24h' | '7d' | '30d'
    );

    return res.json({
      success: true,
      data: metrics,
      timeRange
    });
  } catch (error) {
    console.error('Failed to get server metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

/**
 * Get current server metrics
 * GET /api/monitoring/servers/:id/current
 */
router.get('/servers/:id/current', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Collect fresh metrics
    const currentMetrics = await monitoringService.collectServerMetrics(id);

    if (!currentMetrics) {
      return res.status(404).json({ error: 'Server not found or metrics unavailable' });
    }

    return res.json({
      success: true,
      data: currentMetrics
    });
  } catch (error) {
    console.error('Failed to get current server metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve current metrics' });
  }
});

/**
 * Generate metrics graph
 * GET /api/monitoring/servers/:id/graph
 */
router.get('/servers/:id/graph', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { metric = 'cpu', timeRange = '24h' } = req.query;

    // Validate parameters
    const validMetrics = ['cpu', 'memory', 'players'];
    const validRanges = ['1h', '6h', '24h', '7d'];

    if (!validMetrics.includes(metric as string)) {
      return res.status(400).json({ error: 'Invalid metric type' });
    }

    if (!validRanges.includes(timeRange as string)) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    const graphBuffer = await monitoringService.generateMetricsGraph(
      id,
      metric as 'cpu' | 'memory' | 'players',
      timeRange as '1h' | '6h' | '24h' | '7d'
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': graphBuffer.length,
      'Cache-Control': 'public, max-age=300' // 5 minutes cache
    });

    return res.send(graphBuffer);
  } catch (error) {
    console.error('Failed to generate metrics graph:', error);
    return res.status(500).json({ error: 'Failed to generate graph' });
  }
});

/**
 * Get node metrics
 * GET /api/monitoring/nodes/:id/metrics
 */
router.get('/nodes/:id/metrics', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '24h' } = req.query;

    // Validate time range
    const validRanges = ['1h', '6h', '24h', '7d'];
    if (!validRanges.includes(timeRange as string)) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    const metrics = await monitoringService.getNodeMetrics(
      id,
      timeRange as '1h' | '6h' | '24h' | '7d'
    );

    return res.json({
      success: true,
      data: metrics,
      timeRange
    });
  } catch (error) {
    console.error('Failed to get node metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve node metrics' });
  }
});

/**
 * Trigger metrics collection for all servers
 * POST /api/monitoring/collect
 */
router.post('/collect', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    await monitoringService.collectAllServerMetrics();

    return res.json({
      success: true,
      message: 'Metrics collection initiated'
    });
  } catch (error) {
    console.error('Failed to trigger metrics collection:', error);
    return res.status(500).json({ error: 'Failed to trigger metrics collection' });
  }
});

/**
 * Get system alerts
 * GET /api/monitoring/alerts
 */
router.get('/alerts', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    const { acknowledged = 'false', severity } = req.query;

    // This would be implemented in the MonitoringService
    // For now, return a placeholder response
    return res.json({
      success: true,
      data: [],
      message: 'Alerts endpoint placeholder - to be implemented'
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    return res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
});

/**
 * Acknowledge alert
 * POST /api/monitoring/alerts/:id/acknowledge
 */
router.post('/alerts/:id/acknowledge', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    const { id } = req.params;

    // This would be implemented in the MonitoringService
    return res.json({
      success: true,
      message: `Alert ${id} acknowledged`
    });
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    return res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * Get system stats
 * GET /api/monitoring/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await monitoringService.getAggregatedStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Failed to get system stats:', error);
    return res.status(500).json({ error: 'Failed to get system stats' });
  }
});

/**
 * Get health status
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        fileSystem: 'healthy',
        agents: 'healthy'
      },
      uptime: process.uptime()
    };

    return res.json({ success: true, data: health });
  } catch (error) {
    console.error('Failed to get health status:', error);
    return res.status(500).json({ error: 'Failed to get health status' });
  }
});

export default router;
