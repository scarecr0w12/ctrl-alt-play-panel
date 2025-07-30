/**
 * Marketplace Integration Routes
 * Handles marketplace integration endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireServiceAuth } from '../middleware/serviceAuth';
import { marketplaceIntegration } from '../services/MarketplaceIntegration';
import { pluginPublishingService } from '../services/PluginPublishingService';
import { pluginAnalyticsService } from '../services/PluginAnalyticsService';
import {
  UserSyncRequest,
  PluginPublishRequest,
  PluginSearchQuery,
  CategorySyncRequest,
  MarketplaceErrorCode
} from '../types/marketplace';
import { logger } from '../utils/logger';
import { validateSchema } from '../utils/validation';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for integration endpoints - DISABLED FOR TESTING
// const integrationRateLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requests per window
//   message: {
//     success: false,
//     error: {
//       code: MarketplaceErrorCode.RATE_LIMIT_EXCEEDED,
//       message: 'Too many requests, please try again later'
//     }
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Apply rate limiting and service authentication to all routes
// router.use(integrationRateLimit); // DISABLED FOR TESTING
router.use(requireServiceAuth);

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isHealthy = await marketplaceIntegration.testConnection();
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'marketplace-integration'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Synchronize user with marketplace
 * POST /api/integration/users/sync
 */
router.post('/users/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const userSyncSchema = {
      type: 'object',
      properties: {
        user_id: { type: 'string', minLength: 1 },
        action: { type: 'string', enum: ['create', 'update', 'delete'] },
        user_data: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 1 },
            display_name: { type: 'string' },
            avatar_url: { type: 'string' },
            preferences: { type: 'object' },
            metadata: { type: 'object' }
          },
          required: ['email', 'username']
        }
      },
      required: ['user_id', 'action', 'user_data']
    };

    validateSchema(req.body, userSyncSchema);

    const request: UserSyncRequest = req.body;
    const result = await marketplaceIntegration.syncUser(request);

    logger.info('User synchronization successful', {
      userId: request.user_id,
      action: request.action,
      marketplaceUserId: result.marketplace_user_id,
      requestId: req.headers['x-request-id']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user profile from marketplace
 * GET /api/integration/users/:userId
 */
router.get('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'User ID is required'
        }
      });
      return;
    }

    const userProfile = await marketplaceIntegration.getUserProfile(userId);

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Publish plugin to marketplace
 * POST /api/integration/plugins/publish
 */
router.post('/plugins/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publishSchema = {
      type: 'object',
      properties: {
        panel_item_id: { type: 'string', minLength: 1 },
        metadata: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+' },
            author: { type: 'string' },
            homepage: { type: 'string' },
            repository: { type: 'string' },
            license: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            icon_url: { type: 'string' },
            screenshots: { type: 'array', items: { type: 'string' } },
            price: { type: 'number', minimum: 0 },
            currency: { type: 'string', default: 'USD' }
          },
          required: ['name', 'description', 'version', 'author']
        },
        files: {
          type: 'object',
          properties: {
            manifest: { type: 'string', minLength: 1 },
            readme: { type: 'string' },
            changelog: { type: 'string' },
            package_url: { type: 'string' }
          },
          required: ['manifest', 'package_url']
        }
      },
      required: ['panel_item_id', 'metadata', 'files']
    };

    validateSchema(req.body, publishSchema);

    const request: PluginPublishRequest = req.body;
    const result = await marketplaceIntegration.publishPlugin(request);

    logger.info('Plugin published successfully', {
      panelItemId: request.panel_item_id,
      marketplaceItemId: result.marketplace_item_id,
      status: result.status,
      requestId: req.headers['x-request-id']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update published plugin
 * PUT /api/integration/plugins/:marketplaceItemId
 */
router.put('/plugins/:marketplaceItemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { marketplaceItemId } = req.params;
    
    if (!marketplaceItemId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Marketplace item ID is required'
        }
      });
      return;
    }

    const result = await marketplaceIntegration.updatePlugin(marketplaceItemId, req.body);

    logger.info('Plugin updated successfully', {
      marketplaceItemId,
      status: result.status,
      requestId: req.headers['x-request-id']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Unpublish plugin from marketplace
 * DELETE /api/integration/plugins/:marketplaceItemId
 */
router.delete('/plugins/:marketplaceItemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { marketplaceItemId } = req.params;
    
    if (!marketplaceItemId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Marketplace item ID is required'
        }
      });
      return;
    }

    const success = await marketplaceIntegration.unpublishPlugin(marketplaceItemId);

    logger.info('Plugin unpublished successfully', {
      marketplaceItemId,
      requestId: req.headers['x-request-id']
    });

    res.json({
      success: true,
      data: { unpublished: success }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Search marketplace plugins
 * GET /api/integration/plugins/search
 */
router.get('/plugins/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: PluginSearchQuery = {
      q: req.query.q as string || '',
      category: req.query.category as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      price_min: req.query.price_min ? parseFloat(req.query.price_min as string) : undefined,
      price_max: req.query.price_max ? parseFloat(req.query.price_max as string) : undefined,
      sort: req.query.sort as 'relevance' | 'rating' | 'price' | 'date' | 'downloads' || 'relevance',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await marketplaceIntegration.searchPlugins(query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get plugin analytics
 * GET /api/integration/analytics/plugins/:pluginId
 */
router.get('/analytics/plugins/:pluginId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pluginId } = req.params;
    
    if (!pluginId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Plugin ID is required'
        }
      });
      return;
    }

    const analytics = await marketplaceIntegration.getPluginAnalytics(pluginId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user analytics
 * GET /api/integration/analytics/users/:userId
 */
router.get('/analytics/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'User ID is required'
        }
      });
      return;
    }

    const analytics = await marketplaceIntegration.getUserAnalytics(userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Synchronize categories
 * POST /api/integration/categories/sync
 */
router.post('/categories/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categorySyncSchema = {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', minLength: 1 },
              name: { type: 'string', minLength: 1 },
              description: { type: 'string' },
              slug: { type: 'string' },
              icon: { type: 'string' },
              color: { type: 'string' },
              parent_id: { type: ['string', 'null'] }
            },
            required: ['id', 'name']
          }
        }
      },
      required: ['categories']
    };

    validateSchema(req.body, categorySyncSchema);

    const request: CategorySyncRequest = req.body;
    const result = await marketplaceIntegration.syncCategories(request);

    logger.info('Categories synchronized successfully', {
      categoriesCount: request.categories.length,
      synchronized: result.synchronized_categories.length,
      errors: result.errors.length,
      requestId: req.headers['x-request-id']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Send analytics event
 * POST /api/integration/analytics/events
 */
router.post('/analytics/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event, data } = req.body;
    
    if (!event || typeof event !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Event name is required and must be a string'
        }
      });
      return;
    }

    const success = await marketplaceIntegration.sendAnalyticsEvent(event, data || {});

    res.json({
      success: true,
      data: { sent: success }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get marketplace statistics
 * GET /api/integration/stats
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await marketplaceIntegration.getMarketplaceStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Start plugin publishing workflow
 * POST /api/integration/plugins/publish/workflow
 */
router.post('/plugins/publish/workflow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plugin_path, user_id, options } = req.body;

    if (!plugin_path || !user_id) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Plugin path and user ID are required'
        }
      });
      return;
    }

    const result = await pluginPublishingService.startPublishingWorkflow(
      plugin_path,
      user_id,
      options || {}
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get publishing workflow status
 * GET /api/integration/plugins/publish/workflow/:workflowId
 */
router.get('/plugins/publish/workflow/:workflowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;

    if (!workflowId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Workflow ID is required'
        }
      });
      return;
    }

    const status = await pluginPublishingService.getWorkflowStatus(workflowId);

    if (!status) {
      res.status(404).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.RESOURCE_NOT_FOUND,
          message: 'Workflow not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user publishing workflows
 * GET /api/integration/plugins/publish/workflows/user/:userId
 */
router.get('/plugins/publish/workflows/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'User ID is required'
        }
      });
      return;
    }

    const workflows = await pluginPublishingService.getUserWorkflows(userId);

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Track plugin analytics event
 * POST /api/integration/analytics/track
 */
router.post('/analytics/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event_type, plugin_id, user_id, session_id, data, source, version } = req.body;

    if (!event_type) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Event type is required'
        }
      });
      return;
    }

    await pluginAnalyticsService.trackEvent({
      event_type,
      plugin_id,
      user_id,
      session_id,
      data: data || {},
      source: source || 'panel',
      version
    });

    res.json({
      success: true,
      data: { tracked: true }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generate plugin analytics report
 * GET /api/integration/analytics/report/:pluginId
 */
router.get('/analytics/report/:pluginId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pluginId } = req.params;
    const { start_date, end_date } = req.query;

    if (!pluginId) {
      res.status(400).json({
        success: false,
        error: {
          code: MarketplaceErrorCode.VALIDATION_ERROR,
          message: 'Plugin ID is required'
        }
      });
      return;
    }

    const startDate = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const report = await pluginAnalyticsService.generatePluginReport(pluginId, startDate, endDate);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get top performing plugins
 * GET /api/integration/analytics/top-plugins
 */
router.get('/analytics/top-plugins', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { metric, limit, period } = req.query;

    const topPlugins = await pluginAnalyticsService.getTopPlugins(
      (metric as 'downloads' | 'installs' | 'rating' | 'revenue') || 'downloads',
      limit ? parseInt(limit as string) : 10,
      (period as 'day' | 'week' | 'month') || 'month'
    );

    res.json({
      success: true,
      data: topPlugins
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Query analytics events
 * GET /api/integration/analytics/events
 */
router.get('/analytics/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plugin_id, user_id, event_type, start_date, end_date, limit, offset } = req.query;

    const events = pluginAnalyticsService.queryEvents({
      plugin_id: plugin_id as string,
      user_id: user_id as string,
      event_type: event_type as string,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

export default router;
