/**
 * Marketplace Integration Service
 * Handles communication with the marketplace system
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { serviceJWT } from '../utils/serviceJWT';
import {
  MarketplaceConfig,
  MarketplaceResponse,
  UserSyncRequest,
  UserSyncResponse,
  PluginPublishRequest,
  PluginPublishResponse,
  PluginAnalytics,
  PluginSearchQuery,
  PluginSearchResult,
  CategorySyncRequest,
  CategorySyncResponse,
  MarketplaceError,
  MarketplaceErrorCode,
  MarketplaceUser
} from '../types/marketplace';
import { logger } from '../utils/logger';

export class MarketplaceIntegration {
  private client?: AxiosInstance;
  private config: MarketplaceConfig;
  private isEnabled: boolean = false;
  private retryCount = 0;

  constructor(config?: Partial<MarketplaceConfig>) {
    this.config = {
      base_url: process.env.MARKETPLACE_API_URL || 'https://marketplace.ctrl-alt-play.com/api/v1',
      api_version: 'v1',
      service_id: process.env.SERVICE_ID || 'panel-system',
      api_key: process.env.MARKETPLACE_API_KEY || '',
      jwt_secret: process.env.MARKETPLACE_JWT_SECRET || '',
      timeout: 30000,
      retry_attempts: 3,
      retry_delay: 1000,
      ...config
    };

    // Log warning but don't fail if marketplace credentials aren't configured
    if (!this.config.api_key || !this.config.jwt_secret) {
      console.warn('Marketplace API key and JWT secret not configured. Marketplace integration will be disabled.');
      this.isEnabled = false;
      return;
    }
    
    this.isEnabled = true;

    this.client = axios.create({
      baseURL: this.config.base_url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `Panel-Integration/${this.config.api_version}`
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for authentication and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor - add authentication headers
    this.client.interceptors.request.use(
      (config) => {
        const authHeaders = serviceJWT.createAuthHeaders(
          this.config.api_key,
          ['user:read', 'user:write', 'item:read', 'item:write', 'analytics:read']
        );

        Object.assign(config.headers, authHeaders);

        // Add request ID for tracking
        if (!config.headers['X-Request-ID']) {
          config.headers['X-Request-ID'] = crypto.randomUUID();
        }

        logger.debug('Marketplace API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId: config.headers['X-Request-ID']
        });

        return config;
      },
      (error) => {
        logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and responses
    this.client.interceptors.response.use(
      (response: AxiosResponse<MarketplaceResponse>) => {
        logger.debug('Marketplace API response', {
          status: response.status,
          requestId: response.config.headers?.['X-Request-ID'],
          success: response.data.success
        });

        if (!response.data.success) {
          throw new MarketplaceError(
            response.data.error?.code as MarketplaceErrorCode || MarketplaceErrorCode.INTERNAL_ERROR,
            response.data.error?.message || 'Unknown marketplace error',
            response.data.error?.details,
            response.data.error?.request_id
          );
        }

        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'] as string;

        if (error.response) {
          // Server responded with error status
          const data = error.response.data as MarketplaceResponse;
          
          logger.warn('Marketplace API error response', {
            status: error.response.status,
            requestId,
            error: data.error
          });

          throw new MarketplaceError(
            data.error?.code as MarketplaceErrorCode || MarketplaceErrorCode.INTERNAL_ERROR,
            data.error?.message || `HTTP ${error.response.status}`,
            data.error?.details,
            requestId
          );
        } else if (error.request) {
          // Request made but no response
          logger.error('Marketplace API network error', {
            requestId,
            error: error.message,
            code: error.code
          });

          // Retry logic for network errors
          if (this.retryCount < this.config.retry_attempts) {
            this.retryCount++;
            await this.delay(this.config.retry_delay * this.retryCount);
            
            logger.info('Retrying marketplace request', {
              attempt: this.retryCount,
              maxAttempts: this.config.retry_attempts,
              requestId
            });

            return this.client.request(error.config!);
          }

          throw new MarketplaceError(
            MarketplaceErrorCode.SERVICE_UNAVAILABLE,
            'Marketplace service is unavailable',
            { originalError: error.message },
            requestId
          );
        } else {
          // Something else happened
          logger.error('Marketplace API unknown error', {
            requestId,
            error: error.message
          });

          throw new MarketplaceError(
            MarketplaceErrorCode.INTERNAL_ERROR,
            'Unknown error occurred',
            { originalError: error.message },
            requestId
          );
        }
      }
    );
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to marketplace
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.success;
    } catch (error) {
      logger.error('Marketplace connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Synchronize user data with marketplace
   */
  async syncUser(request: UserSyncRequest): Promise<UserSyncResponse> {
    try {
      const response = await this.client.post<MarketplaceResponse<UserSyncResponse>>(
        '/integration/users/sync',
        request
      );

      logger.info('User synchronized with marketplace', {
        userId: request.user_id,
        action: request.action,
        marketplaceUserId: response.data.data?.marketplace_user_id
      });

      return response.data.data!;
    } catch (error) {
      logger.error('User synchronization failed', {
        userId: request.user_id,
        action: request.action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user profile from marketplace
   */
  async getUserProfile(userId: string): Promise<MarketplaceUser> {
    try {
      const response = await this.client.get<MarketplaceResponse<MarketplaceUser>>(
        `/integration/users/${userId}`
      );

      return response.data.data!;
    } catch (error) {
      logger.error('Failed to get user profile from marketplace', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Publish plugin to marketplace
   */
  async publishPlugin(request: PluginPublishRequest): Promise<PluginPublishResponse> {
    try {
      const response = await this.client.post<MarketplaceResponse<PluginPublishResponse>>(
        '/integration/plugins/publish',
        request
      );

      logger.info('Plugin published to marketplace', {
        panelItemId: request.panel_item_id,
        marketplaceItemId: response.data.data?.marketplace_item_id,
        status: response.data.data?.status
      });

      return response.data.data!;
    } catch (error) {
      logger.error('Plugin publishing failed', {
        panelItemId: request.panel_item_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update published plugin
   */
  async updatePlugin(marketplaceItemId: string, updateData: Partial<PluginPublishRequest>): Promise<PluginPublishResponse> {
    try {
      const response = await this.client.put<MarketplaceResponse<PluginPublishResponse>>(
        `/integration/plugins/${marketplaceItemId}`,
        updateData
      );

      logger.info('Plugin updated in marketplace', {
        marketplaceItemId,
        status: response.data.data?.status
      });

      return response.data.data!;
    } catch (error) {
      logger.error('Plugin update failed', {
        marketplaceItemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Unpublish plugin from marketplace
   */
  async unpublishPlugin(marketplaceItemId: string): Promise<boolean> {
    try {
      await this.client.delete(`/integration/plugins/${marketplaceItemId}`);

      logger.info('Plugin unpublished from marketplace', {
        marketplaceItemId
      });

      return true;
    } catch (error) {
      logger.error('Plugin unpublishing failed', {
        marketplaceItemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Search marketplace plugins
   */
  async searchPlugins(query: PluginSearchQuery): Promise<PluginSearchResult> {
    try {
      const response = await this.client.get<MarketplaceResponse<PluginSearchResult>>(
        '/integration/plugins/search',
        { params: query }
      );

      logger.debug('Plugin search completed', {
        query: query.q,
        resultsCount: response.data.data?.items.length,
        total: response.data.data?.pagination.total
      });

      return response.data.data!;
    } catch (error) {
      logger.error('Plugin search failed', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get plugin analytics
   */
  async getPluginAnalytics(pluginId: string): Promise<PluginAnalytics> {
    try {
      const response = await this.client.get<MarketplaceResponse<PluginAnalytics>>(
        `/integration/analytics/plugins/${pluginId}`
      );

      return response.data.data!;
    } catch (error) {
      logger.error('Failed to get plugin analytics', {
        pluginId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<PluginAnalytics[]> {
    try {
      const response = await this.client.get<MarketplaceResponse<PluginAnalytics[]>>(
        `/integration/analytics/users/${userId}`
      );

      return response.data.data!;
    } catch (error) {
      logger.error('Failed to get user analytics', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Synchronize categories
   */
  async syncCategories(request: CategorySyncRequest): Promise<CategorySyncResponse> {
    try {
      const response = await this.client.post<MarketplaceResponse<CategorySyncResponse>>(
        '/integration/categories/sync',
        request
      );

      logger.info('Categories synchronized with marketplace', {
        categoriesCount: request.categories.length,
        synchronized: response.data.data?.synchronized_categories.length,
        errors: response.data.data?.errors.length
      });

      return response.data.data!;
    } catch (error) {
      logger.error('Category synchronization failed', {
        categoriesCount: request.categories.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send analytics event
   */
  async sendAnalyticsEvent(event: string, data: Record<string, unknown>): Promise<boolean> {
    try {
      await this.client.post('/integration/analytics/events', {
        event,
        data,
        timestamp: new Date().toISOString(),
        source: 'panel-system'
      });

      logger.debug('Analytics event sent', { event, data });
      return true;
    } catch (error) {
      logger.error('Failed to send analytics event', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalPlugins: number;
    totalDownloads: number;
    totalDevelopers: number;
    categories: Array<{ name: string; count: number }>;
  }> {
    try {
      const response = await this.client.get<MarketplaceResponse<{
        totalPlugins: number;
        totalDownloads: number;
        totalDevelopers: number;
        categories: Array<{ name: string; count: number }>;
      }>>('/integration/stats');

      return response.data.data!;
    } catch (error) {
      logger.error('Failed to get marketplace stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

/**
 * Default marketplace integration instance
 * Temporarily disabled until marketplace credentials are configured
 */
// export const marketplaceIntegration = new MarketplaceIntegration();
export const marketplaceIntegration = null;
