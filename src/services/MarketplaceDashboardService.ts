/**
 * Marketplace Dashboard Service
 * Provides data aggregation and dashboard functionality for marketplace integration
 */

import { marketplaceIntegration } from './MarketplaceIntegration';
import { pluginAnalyticsService } from './PluginAnalyticsService';
import { logger } from '../utils/logger';

export interface DashboardStats {
  overview: {
    total_plugins: number;
    total_downloads: number;
    total_revenue: number;
    active_users: number;
    plugin_rating_avg: number;
  };
  trends: {
    downloads_7d: number;
    downloads_30d: number;
    revenue_7d: number;
    revenue_30d: number;
    new_users_7d: number;
    new_users_30d: number;
  };
  top_plugins: Array<{
    plugin_id: string;
    name: string;
    downloads: number;
    rating: number;
    revenue: number;
  }>;
  recent_activity: Array<{
    type: 'download' | 'install' | 'purchase' | 'rating';
    plugin_id: string;
    plugin_name: string;
    user_id: string;
    timestamp: Date;
    value?: number;
  }>;
  categories: Array<{
    name: string;
    plugin_count: number;
    total_downloads: number;
  }>;
  user_engagement: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    avg_session_duration: number;
    bounce_rate: number;
  };
}

export interface PluginDashboard {
  plugin_id: string;
  basic_info: {
    name: string;
    version: string;
    author: string;
    category: string;
    status: string;
    published_date: Date;
  };
  performance: {
    total_downloads: number;
    total_installs: number;
    active_installations: number;
    rating_average: number;
    rating_count: number;
    revenue_total: number;
  };
  analytics: {
    downloads_trend: Array<{ date: string; count: number }>;
    usage_trend: Array<{ date: string; active_users: number }>;
    revenue_trend: Array<{ date: string; amount: number }>;
    error_rate: number;
    crash_rate: number;
  };
  user_feedback: Array<{
    user_id: string;
    username: string;
    rating: number;
    review: string;
    date: Date;
  }>;
  geographic_distribution: Record<string, number>;
  version_distribution: Record<string, number>;
}

export interface UserDashboard {
  user_id: string;
  marketplace_profile: {
    username: string;
    display_name: string;
    avatar_url?: string;
    member_since: Date;
    total_plugins: number;
    total_downloads: number;
    total_revenue: number;
    average_rating: number;
  };
  plugin_performance: Array<{
    plugin_id: string;
    name: string;
    downloads: number;
    rating: number;
    revenue: number;
    last_updated: Date;
  }>;
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  earnings: {
    total: number;
    this_month: number;
    last_month: number;
    pending: number;
    trend: Array<{ month: string; amount: number }>;
  };
}

export class MarketplaceDashboardService {
  /**
   * Get comprehensive marketplace dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.info('Generating marketplace dashboard statistics');

      // Get marketplace stats
      const marketplaceStats = await marketplaceIntegration.getMarketplaceStats();

      // Get top plugins from analytics
      const topPlugins = await pluginAnalyticsService.getTopPlugins('downloads', 5, 'month');

      // Get recent activity from analytics events
      const recentEvents = pluginAnalyticsService.queryEvents({
        limit: 20
      });

      // Calculate trends
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const events7d = pluginAnalyticsService.queryEvents({
        start_date: sevenDaysAgo,
        end_date: now
      });

      const events30d = pluginAnalyticsService.queryEvents({
        start_date: thirtyDaysAgo,
        end_date: now
      });

      const downloads7d = events7d.filter(e => e.event_type === 'plugin_download').length;
      const downloads30d = events30d.filter(e => e.event_type === 'plugin_download').length;

      const dashboard: DashboardStats = {
        overview: {
          total_plugins: marketplaceStats.totalPlugins,
          total_downloads: marketplaceStats.totalDownloads,
          total_revenue: 0, // Would calculate from purchase events
          active_users: new Set(events7d.map(e => e.user_id)).size,
          plugin_rating_avg: 4.2 // Would calculate from rating events
        },
        trends: {
          downloads_7d: downloads7d,
          downloads_30d: downloads30d,
          revenue_7d: 0, // Would calculate from purchase events
          revenue_30d: 0,
          new_users_7d: 0, // Would track user registration events
          new_users_30d: 0
        },
        top_plugins: topPlugins.map(plugin => ({
          plugin_id: plugin.plugin_id,
          name: `Plugin ${plugin.plugin_id}`, // Would fetch actual names
          downloads: plugin.value,
          rating: 4.0, // Would calculate actual ratings
          revenue: 0 // Would calculate actual revenue
        })),
        recent_activity: recentEvents.slice(0, 10).map(event => ({
          type: this.mapEventTypeToActivityType(event.event_type),
          plugin_id: event.plugin_id || 'unknown',
          plugin_name: `Plugin ${event.plugin_id}`, // Would fetch actual names
          user_id: event.user_id || 'anonymous',
          timestamp: event.timestamp,
          value: event.data.rating as number
        })),
        categories: marketplaceStats.categories.map(cat => ({
          name: cat.name,
          plugin_count: cat.count,
          total_downloads: 0 // Would calculate per category
        })),
        user_engagement: {
          daily_active_users: new Set(
            events7d.filter(e => e.event_type === 'plugin_usage_session').map(e => e.user_id)
          ).size,
          weekly_active_users: new Set(
            events7d.filter(e => e.event_type === 'plugin_usage_session').map(e => e.user_id)
          ).size,
          monthly_active_users: new Set(
            events30d.filter(e => e.event_type === 'plugin_usage_session').map(e => e.user_id)
          ).size,
          avg_session_duration: this.calculateAverageSessionDuration(events30d),
          bounce_rate: 0.2 // Would calculate actual bounce rate
        }
      };

      logger.info('Dashboard statistics generated successfully', {
        totalPlugins: dashboard.overview.total_plugins,
        activeUsers: dashboard.overview.active_users,
        recentEvents: dashboard.recent_activity.length
      });

      return dashboard;

    } catch (error) {
      logger.error('Failed to generate dashboard statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get detailed plugin dashboard
   */
  async getPluginDashboard(pluginId: string): Promise<PluginDashboard> {
    try {
      logger.info('Generating plugin dashboard', { pluginId });

      // Get plugin analytics
      const analytics = await pluginAnalyticsService.getPluginAnalytics(pluginId);

      // Generate analytics report for last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const report = await pluginAnalyticsService.generatePluginReport(pluginId, startDate, endDate);

      // Get plugin events
      const events = pluginAnalyticsService.queryEvents({
        plugin_id: pluginId,
        start_date: startDate,
        end_date: endDate
      });

      const ratingEvents = events.filter(e => e.event_type === 'plugin_rating');

      const dashboard: PluginDashboard = {
        plugin_id: pluginId,
        basic_info: {
          name: `Plugin ${pluginId}`, // Would fetch actual plugin info
          version: '1.0.0',
          author: 'Plugin Author',
          category: 'utility',
          status: 'published',
          published_date: new Date()
        },
        performance: {
          total_downloads: analytics.analytics.downloads.total,
          total_installs: report.metrics.total_installs,
          active_installations: report.metrics.active_installations,
          rating_average: report.metrics.ratings.average,
          rating_count: report.metrics.ratings.count,
          revenue_total: report.metrics.revenue
        },
        analytics: {
          downloads_trend: report.trends.downloads_trend,
          usage_trend: report.trends.usage_trend,
          revenue_trend: report.trends.revenue_trend,
          error_rate: report.metrics.performance.error_rate,
          crash_rate: report.metrics.performance.crash_rate
        },
        user_feedback: ratingEvents.map(event => ({
          user_id: event.user_id || 'anonymous',
          username: `User ${event.user_id}`, // Would fetch actual usernames
          rating: event.data.rating as number || 0,
          review: event.data.review as string || '',
          date: event.timestamp
        })),
        geographic_distribution: report.demographics.by_country,
        version_distribution: report.demographics.by_panel_version
      };

      logger.info('Plugin dashboard generated successfully', {
        pluginId,
        downloads: dashboard.performance.total_downloads,
        rating: dashboard.performance.rating_average
      });

      return dashboard;

    } catch (error) {
      logger.error('Failed to generate plugin dashboard', {
        pluginId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user/developer dashboard
   */
  async getUserDashboard(userId: string): Promise<UserDashboard> {
    try {
      logger.info('Generating user dashboard', { userId });

      // Get user events
      const events = pluginAnalyticsService.queryEvents({
        user_id: userId,
        limit: 100
      });

      // Get user's plugins (would query actual plugin database)
      const userPlugins = Array.from(new Set(events.map(e => e.plugin_id).filter(Boolean)));

      const dashboard: UserDashboard = {
        user_id: userId,
        marketplace_profile: {
          username: `user_${userId}`, // Would fetch actual username
          display_name: `User ${userId}`,
          avatar_url: undefined,
          member_since: new Date(),
          total_plugins: userPlugins.length,
          total_downloads: events.filter(e => e.event_type === 'plugin_download').length,
          total_revenue: 0, // Would calculate from purchase events
          average_rating: 4.0 // Would calculate actual average rating
        },
        plugin_performance: userPlugins.map(pluginId => ({
          plugin_id: pluginId!,
          name: `Plugin ${pluginId}`,
          downloads: events.filter(e => e.plugin_id === pluginId && e.event_type === 'plugin_download').length,
          rating: 4.0, // Would calculate actual rating
          revenue: 0, // Would calculate actual revenue
          last_updated: new Date()
        })),
        recent_activity: events.slice(0, 10).map(event => ({
          type: event.event_type,
          description: this.generateActivityDescription(event),
          timestamp: event.timestamp
        })),
        earnings: {
          total: 0, // Would calculate from actual purchase events
          this_month: 0,
          last_month: 0,
          pending: 0,
          trend: [] // Would generate actual earnings trend
        }
      };

      logger.info('User dashboard generated successfully', {
        userId,
        totalPlugins: dashboard.marketplace_profile.total_plugins,
        totalDownloads: dashboard.marketplace_profile.total_downloads
      });

      return dashboard;

    } catch (error) {
      logger.error('Failed to generate user dashboard', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get marketplace health metrics
   */
  async getHealthMetrics(): Promise<{
    api_status: 'healthy' | 'degraded' | 'down';
    response_time: number;
    error_rate: number;
    sync_status: {
      users_synced: number;
      last_sync: Date;
      sync_errors: number;
    };
    service_status: {
      marketplace_integration: boolean;
      user_sync: boolean;
      analytics: boolean;
      publishing: boolean;
    };
  }> {
    try {
      const startTime = Date.now();
      
      // Test marketplace connection
      const isHealthy = await marketplaceIntegration.testConnection();
      const responseTime = Date.now() - startTime;

      // Get recent events to calculate error rate
      const recentEvents = pluginAnalyticsService.queryEvents({
        start_date: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        limit: 1000
      });

      const errorEvents = recentEvents.filter(e => e.event_type === 'plugin_error');
      const errorRate = recentEvents.length > 0 ? errorEvents.length / recentEvents.length : 0;

      return {
        api_status: isHealthy ? 'healthy' : 'down',
        response_time: responseTime,
        error_rate: errorRate,
        sync_status: {
          users_synced: 0, // Would track actual sync count
          last_sync: new Date(),
          sync_errors: 0
        },
        service_status: {
          marketplace_integration: isHealthy,
          user_sync: true, // Would check actual service status
          analytics: true,
          publishing: true
        }
      };

    } catch (error) {
      logger.error('Failed to get health metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        api_status: 'down',
        response_time: -1,
        error_rate: 1,
        sync_status: {
          users_synced: 0,
          last_sync: new Date(),
          sync_errors: 1
        },
        service_status: {
          marketplace_integration: false,
          user_sync: false,
          analytics: false,
          publishing: false
        }
      };
    }
  }

  // Helper methods

  private mapEventTypeToActivityType(eventType: string): 'download' | 'install' | 'purchase' | 'rating' {
    switch (eventType) {
      case 'plugin_download':
        return 'download';
      case 'plugin_install_success':
        return 'install';
      case 'plugin_purchase':
        return 'purchase';
      case 'plugin_rating':
        return 'rating';
      default:
        return 'download';
    }
  }

  private calculateAverageSessionDuration(events: Array<{ event_type: string; data: Record<string, unknown> }>): number {
    const sessionEvents = events.filter(e => e.event_type === 'plugin_usage_session');
    
    if (sessionEvents.length === 0) return 0;
    
    const totalDuration = sessionEvents.reduce((sum, event) => {
      return sum + ((event.data.duration_ms as number) || 0);
    }, 0);
    
    return totalDuration / sessionEvents.length;
  }

  private generateActivityDescription(event: { event_type: string; plugin_id?: string; data: Record<string, unknown> }): string {
    switch (event.event_type) {
      case 'plugin_download':
        return `Downloaded plugin ${event.plugin_id}`;
      case 'plugin_install_success':
        return `Successfully installed plugin ${event.plugin_id}`;
      case 'plugin_install_failure':
        return `Failed to install plugin ${event.plugin_id}`;
      case 'plugin_rating':
        return `Rated plugin ${event.plugin_id} with ${event.data.rating} stars`;
      case 'plugin_error':
        return `Error in plugin ${event.plugin_id}: ${event.data.error_message}`;
      default:
        return `Activity in plugin ${event.plugin_id}`;
    }
  }
}

/**
 * Default marketplace dashboard service instance
 */
export const marketplaceDashboardService = new MarketplaceDashboardService();
