import { Router } from 'express';
import { ResourceAnalyticsService } from '../services/resourceAnalyticsService';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission 
} from '../middlewares/permissions';

const router = Router();
const analyticsService = new ResourceAnalyticsService();

/**
 * Get resource trends with advanced analytics
 * GET /api/analytics/trends
 */
router.get('/trends', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.view']), async (req, res) => {
  try {
    const { serverId, startDate, endDate, interval = 'hour' } = req.query;

    // Validate interval
    const validIntervals = ['minute', 'hour', 'day', 'week'];
    if (!validIntervals.includes(interval as string)) {
      return res.status(400).json({ error: 'Invalid interval. Must be minute, hour, day, or week' });
    }

    // Parse dates
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }
    } else {
      // Default to last 24 hours
      end = new Date();
      start = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const timeRange = {
      start,
      end,
      interval: interval as 'minute' | 'hour' | 'day' | 'week'
    };

    const trends = await analyticsService.getResourceTrends(
      serverId as string || undefined,
      timeRange
    );

    return res.json({
      success: true,
      data: {
        trends,
        timeRange,
        metadata: {
          totalDataPoints: trends.length,
          interval: interval,
          serverId: serverId || 'all'
        }
      }
    });
  } catch (error) {
    console.error('Failed to get resource trends:', error);
    return res.status(500).json({ error: 'Failed to retrieve resource trends' });
  }
});

/**
 * Compare multiple servers
 * POST /api/analytics/compare
 */
router.post('/compare', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.view']), async (req, res) => {
  try {
    const { serverIds, startDate, endDate } = req.body;

    if (!Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({ error: 'serverIds must be a non-empty array' });
    }

    if (serverIds.length > 10) {
      return res.status(400).json({ error: 'Cannot compare more than 10 servers at once' });
    }

    // Parse dates
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    } else {
      // Default to last 7 days
      end = new Date();
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const timeRange = { start, end, interval: 'hour' as const };
    const comparisons = await analyticsService.compareServers(serverIds, timeRange);

    return res.json({
      success: true,
      data: {
        comparisons,
        timeRange,
        metadata: {
          serversCompared: comparisons.length,
          requestedServers: serverIds.length
        }
      }
    });
  } catch (error) {
    console.error('Failed to compare servers:', error);
    return res.status(500).json({ error: 'Failed to compare servers' });
  }
});

/**
 * Get alert thresholds
 * GET /api/analytics/thresholds
 */
router.get('/thresholds', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.manage']), async (req, res) => {
  try {
    const { serverId } = req.query;

    const thresholds = await analyticsService.getAlertThresholds(serverId as string || undefined);

    return res.json({
      success: true,
      data: thresholds
    });
  } catch (error) {
    console.error('Failed to get alert thresholds:', error);
    return res.status(500).json({ error: 'Failed to retrieve alert thresholds' });
  }
});

/**
 * Update alert threshold
 * PUT /api/analytics/thresholds
 */
router.put('/thresholds', authenticateToken, requirePermission('analytics.manage'), async (req, res) => {
  try {
    const threshold = req.body;

    // Validate threshold data
    const requiredFields = ['resourceType', 'warningThreshold', 'criticalThreshold', 'duration', 'enabled'];
    for (const field of requiredFields) {
      if (threshold[field] === undefined) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const validResourceTypes = ['cpu', 'memory', 'disk', 'network'];
    if (!validResourceTypes.includes(threshold.resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    if (threshold.warningThreshold >= threshold.criticalThreshold) {
      return res.status(400).json({ error: 'Warning threshold must be less than critical threshold' });
    }

    if (threshold.warningThreshold < 0 || threshold.criticalThreshold > 100) {
      return res.status(400).json({ error: 'Thresholds must be between 0 and 100' });
    }

    const success = await analyticsService.updateAlertThreshold(threshold);

    if (success) {
      return res.json({
        success: true,
        message: 'Alert threshold updated successfully'
      });
    } else {
      return res.status(500).json({ error: 'Failed to update alert threshold' });
    }
  } catch (error) {
    console.error('Failed to update alert threshold:', error);
    return res.status(500).json({ error: 'Failed to update alert threshold' });
  }
});

/**
 * Get capacity planning recommendations
 * GET /api/analytics/recommendations
 */
router.get('/recommendations', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.view']), async (req, res) => {
  try {
    const { serverId } = req.query;

    const recommendations = await analyticsService.getCapacityRecommendations(serverId as string || undefined);

    return res.json({
      success: true,
      data: recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        serverId: serverId || 'all',
        basedOnDays: 30
      }
    });
  } catch (error) {
    console.error('Failed to get capacity recommendations:', error);
    return res.status(500).json({ error: 'Failed to generate capacity recommendations' });
  }
});

/**
 * Get active alerts
 * GET /api/analytics/alerts
 */
router.get('/alerts', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.view']), async (req, res) => {
  try {
    const { serverId, severity } = req.query;

    let alerts = await analyticsService.getActiveAlerts(serverId as string || undefined);

    // Filter by severity if specified
    if (severity) {
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validSeverities.includes(severity as string)) {
        return res.status(400).json({ error: 'Invalid severity level' });
      }
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return res.json({
      success: true,
      data: alerts,
      metadata: {
        totalAlerts: alerts.length,
        filters: { serverId, severity }
      }
    });
  } catch (error) {
    console.error('Failed to get active alerts:', error);
    return res.status(500).json({ error: 'Failed to retrieve active alerts' });
  }
});

/**
 * Export analytics data
 * POST /api/analytics/export
 */
router.post('/export', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.export']), async (req, res) => {
  try {
    const { serverIds, startDate, endDate, format = 'json', includeGraphs = false } = req.body;

    if (!Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({ error: 'serverIds must be a non-empty array' });
    }

    const validFormats = ['json', 'csv', 'pdf'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be json, csv, or pdf' });
    }

    // Parse dates
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const exportConfig = {
      timeRange: { start, end, interval: 'day' as const },
      servers: serverIds,
      format,
      includeGraphs
    };

    const exportData = await analyticsService.exportAnalytics(exportConfig);

    // Set appropriate headers based on format
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.csv"`);
        break;
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.pdf"`);
        break;
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${Date.now()}.json"`);
    }

    return res.send(exportData);
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return res.status(500).json({ error: 'Failed to export analytics data' });
  }
});

/**
 * Get system overview analytics
 * GET /api/analytics/overview
 */
router.get('/overview', authenticateToken, requireAnyPermission(['monitoring.view', 'analytics.view']), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Get time range
    let start: Date;
    let end = new Date();
    
    switch (timeRange) {
      case '1h':
        start = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '6h':
        start = new Date(Date.now() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const analyticsTimeRange = {
      start,
      end,
      interval: timeRange === '30d' ? 'day' as const : 'hour' as const
    };

    // Get overall trends
    const trends = await analyticsService.getResourceTrends(undefined, analyticsTimeRange);
    
    // Get active alerts
    const alerts = await analyticsService.getActiveAlerts();
    
    // Get capacity recommendations
    const recommendations = await analyticsService.getCapacityRecommendations();

    // Calculate summary statistics
    const summary = {
      avgCpu: trends.length > 0 ? trends.reduce((sum, t) => sum + t.cpu, 0) / trends.length : 0,
      avgMemory: trends.length > 0 ? trends.reduce((sum, t) => sum + t.memory, 0) / trends.length : 0,
      avgDisk: trends.length > 0 ? trends.reduce((sum, t) => sum + t.disk, 0) / trends.length : 0,
      peakCpu: trends.length > 0 ? Math.max(...trends.map(t => t.cpu)) : 0,
      peakMemory: trends.length > 0 ? Math.max(...trends.map(t => t.memory)) : 0,
      peakDisk: trends.length > 0 ? Math.max(...trends.map(t => t.disk)) : 0,
      totalPlayers: trends.length > 0 ? trends[trends.length - 1].players : 0,
      alertsCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      recommendationsCount: recommendations.length
    };

    return res.json({
      success: true,
      data: {
        summary,
        trends: trends.slice(-100), // Limit to last 100 points for overview
        alerts: alerts.slice(0, 10), // Limit to 10 most recent alerts
        recommendations: recommendations.slice(0, 5), // Limit to 5 recommendations
        timeRange: analyticsTimeRange
      }
    });
  } catch (error) {
    console.error('Failed to get analytics overview:', error);
    return res.status(500).json({ error: 'Failed to retrieve analytics overview' });
  }
});

export default router;