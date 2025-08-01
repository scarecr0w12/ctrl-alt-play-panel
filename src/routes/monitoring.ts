import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MonitoringService } from '../services/monitoringService';
import DatabaseService from '../services/database';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission 
} from '../middlewares/permissions';

const prisma = new PrismaClient();

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
    
    const db = DatabaseService.getInstance();
    
    // Build filter conditions
    const where: {
      acknowledged?: boolean;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    } = {};
    
    if (acknowledged === 'false') {
      where.acknowledged = false;
    } else if (acknowledged === 'true') {
      where.acknowledged = true;
    }
    
    if (severity && typeof severity === 'string') {
      const upperSeverity = severity.toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upperSeverity)) {
        where.severity = upperSeverity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      }
    }

    // Fetch alerts from database
    const alerts = await db.alert.findMany({
      where,
      include: {
        server: {
          select: {
            id: true,
            name: true,
            uuid: true
          }
        },
        node: {
          select: {
            id: true,
            name: true,
            uuid: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

/**
 * Acknowledge alert
 * POST /api/monitoring/alerts/:id/acknowledge
 */
router.post('/alerts/:id/acknowledge', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as unknown as { user: { id: string } }).user.id;

    const db = DatabaseService.getInstance();

    // Update alert to acknowledged
    const updatedAlert = await db.alert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            uuid: true
          }
        },
        node: {
          select: {
            id: true,
            name: true,
            uuid: true
          }
        }
      }
    });

    console.log(`Alert ${id} acknowledged by user ${userId}`);

    res.json({
      success: true,
      data: updatedAlert,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

/**
 * Export monitoring data
 * GET /api/monitoring/export
 */
router.get('/export', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    const { timeRange = '24h', format = 'json' } = req.query;

    // Get monitoring data for export
    const endTime = new Date();
    const startTime = new Date();
    
    // Calculate time range
    switch (timeRange) {
      case '1h':
        startTime.setHours(endTime.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(endTime.getHours() - 6);
        break;
      case '24h':
        startTime.setDate(endTime.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(endTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(endTime.getDate() - 30);
        break;
      default:
        startTime.setDate(endTime.getDate() - 1); // Default to 24h
    }

    // Get server metrics for the time range
    const metrics = await prisma.serverMetrics.findMany({
      where: {
        timestamp: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        server: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=monitoring-data-${Date.now()}.csv`
      });
      
      // Generate CSV content
      const csvHeader = 'timestamp,server_id,server_name,cpu_percent,memory_percent,disk_percent,network_in,network_out\n';
      const csvRows = metrics.map(metric => 
        `${metric.timestamp.toISOString()},${metric.serverId},${metric.server.name},${metric.cpuPercent},${metric.memoryPercent},${metric.diskPercent},${metric.networkIn},${metric.networkOut}`
      ).join('\n');
      
      return res.send(csvHeader + csvRows);
    }

    const exportData = {
      timeRange,
      format,
      timestamp: new Date().toISOString(),
      data: metrics,
      summary: {
        totalRecords: metrics.length,
        timeRange: `${startTime.toISOString()} to ${endTime.toISOString()}`,
        servers: [...new Set(metrics.map(m => m.serverId))].length
      }
    };

    return res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting monitoring data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export monitoring data'
    });
  }
});

/**
 * Get multi-server comparison data
 * POST /api/monitoring/compare
 */
router.post('/compare', authenticateToken, requirePermission('monitoring.view'), async (req, res) => {
  try {
    const { serverIds, timeRange = '24h', metric = 'cpu' } = req.body;

    if (!Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({ error: 'Server IDs array is required' });
    }

    // Calculate time range for comparison
    const endTime = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(endTime.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(endTime.getHours() - 6);
        break;
      case '24h':
        startTime.setDate(endTime.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(endTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(endTime.getDate() - 30);
        break;
      default:
        startTime.setDate(endTime.getDate() - 1);
    }

    // Get metrics for all specified servers
    const serverMetrics = await prisma.serverMetrics.findMany({
      where: {
        serverId: {
          in: serverIds
        },
        timestamp: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        server: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Group metrics by server and calculate averages
    const serverData = {};
    serverIds.forEach(serverId => {
      const metrics = serverMetrics.filter(m => m.serverId === serverId);
      if (metrics.length > 0) {
        const avgCpu = metrics.reduce((sum, m) => sum + m.cpuPercent, 0) / metrics.length;
        const avgMemory = metrics.reduce((sum, m) => sum + m.memoryPercent, 0) / metrics.length;
        const avgDisk = metrics.reduce((sum, m) => sum + m.diskPercent, 0) / metrics.length;
        const avgNetworkIn = metrics.reduce((sum, m) => sum + m.networkIn, 0) / metrics.length;
        const avgNetworkOut = metrics.reduce((sum, m) => sum + m.networkOut, 0) / metrics.length;

        serverData[serverId] = {
          server: metrics[0].server,
          metrics: {
            cpu: avgCpu,
            memory: avgMemory,
            disk: avgDisk,
            networkIn: avgNetworkIn,
            networkOut: avgNetworkOut
          },
          dataPoints: metrics.length,
          timeRange: `${startTime.toISOString()} to ${endTime.toISOString()}`
        };
      }
    });

    const comparisonData = {
      serverIds,
      timeRange,
      metric,
      timestamp: new Date().toISOString(),
      data: serverData,
      summary: {
        totalServers: Object.keys(serverData).length,
        timeRange: `${startTime.toISOString()} to ${endTime.toISOString()}`,
        totalDataPoints: serverMetrics.length
      }
    };

    return res.json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Error comparing servers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to compare servers'
    });
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
