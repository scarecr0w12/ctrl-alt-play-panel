/**
 * Dashboard API Routes
 * Provides endpoints for accessing marketplace dashboard data and analytics
 */

import { Router, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { marketplaceDashboardService } from '../services/MarketplaceDashboardService';
import { authenticateToken, AuthRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Apply authentication middleware to all dashboard routes
 */
router.use(authenticateToken);

/**
 * GET /api/dashboard/stats
 * Get comprehensive marketplace dashboard statistics
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Dashboard stats requested', { user: req.user?.id });

    const stats = await marketplaceDashboardService.getDashboardStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get dashboard stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics'
    });
  }
});

/**
 * GET /api/dashboard/plugin/:pluginId
 * Get detailed plugin dashboard
 */
router.get('/plugin/:pluginId', [
  param('pluginId').isString().notEmpty().withMessage('Plugin ID is required')
], async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { pluginId } = req.params;
    
    logger.info('Plugin dashboard requested', { 
      pluginId, 
      user: req.user?.id 
    });

    const dashboard = await marketplaceDashboardService.getPluginDashboard(pluginId);

    return res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Failed to get plugin dashboard', {
      pluginId: req.params.pluginId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve plugin dashboard'
    });
  }
});

/**
 * GET /api/dashboard/user/:userId
 * Get user/developer dashboard
 */
router.get('/user/:userId', [
  param('userId').isString().notEmpty().withMessage('User ID is required')
], async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    
    // Check if user can access this dashboard (self or admin)
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    logger.info('User dashboard requested', { 
      userId, 
      requestingUser: req.user?.id 
    });

    const dashboard = await marketplaceDashboardService.getUserDashboard(userId);

    return res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Failed to get user dashboard', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user dashboard'
    });
  }
});

/**
 * GET /api/dashboard/health
 * Get marketplace health metrics
 */
router.get('/health', async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Health metrics requested', { user: req.user?.id });

    const healthMetrics = await marketplaceDashboardService.getHealthMetrics();

    res.json({
      success: true,
      data: healthMetrics
    });

  } catch (error) {
    logger.error('Failed to get health metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health metrics'
    });
  }
});

/**
 * GET /api/dashboard/overview
 * Get marketplace overview for landing page
 */
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Dashboard overview requested', { user: req.user?.id });

    const stats = await marketplaceDashboardService.getDashboardStats();

    // Return simplified overview data
    const overview = {
      total_plugins: stats.overview.total_plugins,
      total_downloads: stats.overview.total_downloads,
      active_users: stats.overview.active_users,
      plugin_rating_avg: stats.overview.plugin_rating_avg,
      featured_plugins: stats.top_plugins.slice(0, 3),
      categories: stats.categories.slice(0, 6),
      recent_activity: stats.recent_activity.slice(0, 5)
    };

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    logger.error('Failed to get dashboard overview', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard overview'
    });
  }
});

/**
 * GET /api/dashboard/trends
 * Get marketplace trends data
 */
router.get('/trends', [
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period'),
  query('metric').optional().isIn(['downloads', 'users', 'revenue', 'plugins']).withMessage('Invalid metric')
], async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const period = req.query.period as string || '30d';
    const metric = req.query.metric as string || 'downloads';

    logger.info('Dashboard trends requested', { 
      period, 
      metric, 
      user: req.user?.id 
    });

    const stats = await marketplaceDashboardService.getDashboardStats();

    // Generate trend data based on period and metric
    const trendData = {
      period,
      metric,
      current_value: getCurrentValue(stats, metric),
      previous_value: getPreviousValue(stats, metric, period),
      change_percentage: calculateChangePercentage(stats, metric, period),
      trend_direction: 'up' as 'up' | 'down' | 'stable',
      data_points: generateTrendDataPoints(period, metric)
    };

    return res.json({
      success: true,
      data: trendData
    });

  } catch (error) {
    logger.error('Failed to get dashboard trends', {
      period: req.query.period,
      metric: req.query.metric,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard trends'
    });
  }
});

/**
 * GET /api/dashboard/categories
 * Get category performance data
 */
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    logger.info('Category dashboard requested', { user: req.user?.id });

    const stats = await marketplaceDashboardService.getDashboardStats();

    // Enhanced category data with performance metrics
    const categoryData = stats.categories.map(category => ({
      ...category,
      growth_rate: Math.random() * 20 - 10, // Mock growth rate
      avg_rating: 4.0 + Math.random() * 1, // Mock average rating
      top_plugin: `Top plugin in ${category.name}` // Would fetch actual top plugin
    }));

    res.json({
      success: true,
      data: categoryData
    });

  } catch (error) {
    logger.error('Failed to get category dashboard', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category dashboard'
    });
  }
});

/**
 * GET /api/dashboard/users/activity
 * Get user activity dashboard for admins
 */
router.get('/users/activity', async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    // Admin only endpoint
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    logger.info('User activity dashboard requested', { user: req.user?.id });

    const stats = await marketplaceDashboardService.getDashboardStats();

    const userActivity = {
      engagement: stats.user_engagement,
      recent_users: stats.recent_activity.map(activity => ({
        user_id: activity.user_id,
        last_activity: activity.timestamp,
        activity_type: activity.type
      })),
      geographic_distribution: {
        // Mock data - would fetch actual geographic distribution
        'US': 45,
        'UK': 20,
        'DE': 15,
        'FR': 10,
        'CA': 10
      },
      user_segments: {
        new_users: stats.trends.new_users_7d,
        returning_users: stats.user_engagement.weekly_active_users - stats.trends.new_users_7d,
        power_users: Math.floor(stats.user_engagement.weekly_active_users * 0.1)
      }
    };

    return res.json({
      success: true,
      data: userActivity
    });

  } catch (error) {
    logger.error('Failed to get user activity dashboard', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user activity dashboard'
    });
  }
});

// Helper methods for trend calculations
function getCurrentValue(stats: any, metric: string): number {
  switch (metric) {
    case 'downloads':
      return stats.overview.total_downloads;
    case 'users':
      return stats.overview.active_users;
    case 'revenue':
      return stats.overview.total_revenue;
    case 'plugins':
      return stats.overview.total_plugins;
    default:
      return 0;
  }
}

function getPreviousValue(stats: any, metric: string, period: string): number {
  // Mock previous values - would calculate actual values
  const current = getCurrentValue(stats, metric);
  const changeRate = period === '7d' ? 0.1 : period === '30d' ? 0.25 : 0.5;
  return Math.floor(current * (1 - changeRate));
}

function calculateChangePercentage(stats: any, metric: string, period: string): number {
  const current = getCurrentValue(stats, metric);
  const previous = getPreviousValue(stats, metric, period);
  
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function generateTrendDataPoints(period: string, metric: string): Array<{ date: string; value: number }> {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const points = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    points.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 100
    });
  }
  
  return points;
}

export { router as dashboardRoutes };
