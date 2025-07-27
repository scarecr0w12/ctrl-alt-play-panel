/**
 * Plugin Analytics Service
 * Advanced analytics tracking and reporting for plugins
 */

import { marketplaceIntegration } from './MarketplaceIntegration';
import { logger } from '../utils/logger';
import { PluginAnalytics } from '../types/marketplace';

export interface AnalyticsEvent {
  event_type: string;
  plugin_id?: string;
  user_id?: string;
  session_id?: string;
  timestamp: Date;
  data: Record<string, unknown>;
  source: 'panel' | 'marketplace' | 'api';
  version?: string;
}

export interface AnalyticsQuery {
  plugin_id?: string;
  user_id?: string;
  event_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export interface AnalyticsReport {
  plugin_id: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    total_downloads: number;
    unique_downloads: number;
    total_installs: number;
    active_installations: number;
    revenue: number;
    ratings: {
      average: number;
      count: number;
      distribution: Record<string, number>;
    };
    usage: {
      daily_active_users: number;
      weekly_active_users: number;
      monthly_active_users: number;
      session_duration_avg: number;
    };
    performance: {
      load_time_avg: number;
      error_rate: number;
      crash_rate: number;
    };
  };
  trends: {
    downloads_trend: Array<{ date: string; count: number }>;
    usage_trend: Array<{ date: string; active_users: number }>;
    revenue_trend: Array<{ date: string; amount: number }>;
  };
  demographics: {
    by_country: Record<string, number>;
    by_panel_version: Record<string, number>;
    by_user_type: Record<string, number>;
  };
}

export class PluginAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private readonly maxEvents = 10000;

  /**
   * Track a plugin analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date()
    };

    // Store locally
    this.events.push(analyticsEvent);

    // Keep only recent events in memory
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Send to marketplace
    try {
      await marketplaceIntegration.sendAnalyticsEvent(event.event_type, {
        plugin_id: event.plugin_id,
        user_id: event.user_id,
        session_id: event.session_id,
        source: event.source,
        version: event.version,
        ...event.data
      });

      logger.debug('Analytics event tracked', {
        event_type: event.event_type,
        plugin_id: event.plugin_id,
        user_id: event.user_id
      });
    } catch (error) {
      logger.warn('Failed to send analytics event to marketplace', {
        event_type: event.event_type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Track plugin download
   */
  async trackDownload(pluginId: string, userId: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.trackEvent({
      event_type: 'plugin_download',
      plugin_id: pluginId,
      user_id: userId,
      data: {
        download_source: 'panel',
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Track plugin installation
   */
  async trackInstallation(pluginId: string, userId: string, success: boolean, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.trackEvent({
      event_type: success ? 'plugin_install_success' : 'plugin_install_failure',
      plugin_id: pluginId,
      user_id: userId,
      data: {
        installation_method: 'panel',
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Track plugin activation/deactivation
   */
  async trackActivation(pluginId: string, userId: string, active: boolean, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.trackEvent({
      event_type: active ? 'plugin_activated' : 'plugin_deactivated',
      plugin_id: pluginId,
      user_id: userId,
      data: {
        activation_source: 'panel',
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Track plugin usage session
   */
  async trackUsageSession(
    pluginId: string, 
    userId: string, 
    sessionId: string,
    duration: number,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'plugin_usage_session',
      plugin_id: pluginId,
      user_id: userId,
      session_id: sessionId,
      data: {
        duration_ms: duration,
        session_type: 'user_session',
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Track plugin error
   */
  async trackError(
    pluginId: string, 
    userId: string, 
    error: Error, 
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'plugin_error',
      plugin_id: pluginId,
      user_id: userId,
      data: {
        error_message: error.message,
        error_stack: error.stack,
        error_type: error.name,
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Track plugin performance metrics
   */
  async trackPerformance(
    pluginId: string,
    userId: string,
    metrics: {
      load_time?: number;
      memory_usage?: number;
      cpu_usage?: number;
      response_time?: number;
    },
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'plugin_performance',
      plugin_id: pluginId,
      user_id: userId,
      data: {
        ...metrics,
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Track plugin rating/review
   */
  async trackRating(
    pluginId: string,
    userId: string,
    rating: number,
    review?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'plugin_rating',
      plugin_id: pluginId,
      user_id: userId,
      data: {
        rating,
        review,
        rating_source: 'panel',
        ...metadata
      },
      source: 'panel'
    });
  }

  /**
   * Get plugin analytics from marketplace
   */
  async getPluginAnalytics(pluginId: string): Promise<PluginAnalytics> {
    try {
      return await marketplaceIntegration.getPluginAnalytics(pluginId);
    } catch (error) {
      logger.error('Failed to fetch plugin analytics', {
        pluginId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user analytics from marketplace
   */
  async getUserAnalytics(userId: string): Promise<PluginAnalytics[]> {
    try {
      return await marketplaceIntegration.getUserAnalytics(userId);
    } catch (error) {
      logger.error('Failed to fetch user analytics', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate analytics report for a plugin
   */
  async generatePluginReport(pluginId: string, startDate: Date, endDate: Date): Promise<AnalyticsReport> {
    try {
      // Get basic analytics from marketplace
      const marketplaceAnalytics = await this.getPluginAnalytics(pluginId);

      // Filter local events for the date range
      const filteredEvents = this.events.filter(event => 
        event.plugin_id === pluginId &&
        event.timestamp >= startDate &&
        event.timestamp <= endDate
      );

      // Calculate metrics from local events
      const downloads = filteredEvents.filter(e => e.event_type === 'plugin_download').length;
      const installs = filteredEvents.filter(e => e.event_type === 'plugin_install_success').length;
      const errors = filteredEvents.filter(e => e.event_type === 'plugin_error').length;
      const usageSessions = filteredEvents.filter(e => e.event_type === 'plugin_usage_session');
      
      const uniqueUsers = new Set(filteredEvents.map(e => e.user_id)).size;
      const avgSessionDuration = usageSessions.length > 0 
        ? usageSessions.reduce((sum, e) => sum + ((e.data.duration_ms as number) || 0), 0) / usageSessions.length 
        : 0;

      // Generate daily trend data
      const dailyData = this.generateDailyTrends(filteredEvents, startDate, endDate);

      const report: AnalyticsReport = {
        plugin_id: pluginId,
        period: { start: startDate, end: endDate },
        metrics: {
          total_downloads: downloads,
          unique_downloads: uniqueUsers,
          total_installs: installs,
          active_installations: marketplaceAnalytics.analytics.downloads.total, // From marketplace
          revenue: 0, // Would calculate from purchase events
          ratings: {
            average: 0, // Would calculate from rating events
            count: 0,
            distribution: {}
          },
          usage: {
            daily_active_users: this.calculateDAU(filteredEvents),
            weekly_active_users: this.calculateWAU(filteredEvents),
            monthly_active_users: this.calculateMAU(filteredEvents),
            session_duration_avg: avgSessionDuration
          },
          performance: {
            load_time_avg: this.calculateAverageLoadTime(filteredEvents),
            error_rate: errors / Math.max(usageSessions.length, 1),
            crash_rate: 0 // Would calculate from crash events
          }
        },
        trends: {
          downloads_trend: dailyData.downloads,
          usage_trend: dailyData.usage,
          revenue_trend: dailyData.revenue
        },
        demographics: {
          by_country: this.calculateCountryDistribution(filteredEvents),
          by_panel_version: this.calculateVersionDistribution(filteredEvents),
          by_user_type: this.calculateUserTypeDistribution(filteredEvents)
        }
      };

      logger.info('Generated plugin analytics report', {
        pluginId,
        period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        totalEvents: filteredEvents.length
      });

      return report;

    } catch (error) {
      logger.error('Failed to generate plugin report', {
        pluginId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get top performing plugins
   */
  async getTopPlugins(
    metric: 'downloads' | 'installs' | 'rating' | 'revenue' = 'downloads',
    limit: number = 10,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<Array<{ plugin_id: string; value: number; rank: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const filteredEvents = this.events.filter(event =>
      event.timestamp >= startDate && event.timestamp <= endDate
    );

    const pluginMetrics = new Map<string, number>();

    filteredEvents.forEach(event => {
      if (!event.plugin_id) return;

      let value = 0;
      switch (metric) {
        case 'downloads':
          if (event.event_type === 'plugin_download') value = 1;
          break;
        case 'installs':
          if (event.event_type === 'plugin_install_success') value = 1;
          break;
        case 'rating':
          if (event.event_type === 'plugin_rating') value = event.data.rating as number || 0;
          break;
        case 'revenue':
          if (event.event_type === 'plugin_purchase') value = event.data.amount as number || 0;
          break;
      }

      if (value > 0) {
        pluginMetrics.set(event.plugin_id, (pluginMetrics.get(event.plugin_id) || 0) + value);
      }
    });

    return Array.from(pluginMetrics.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([plugin_id, value], index) => ({
        plugin_id,
        value,
        rank: index + 1
      }));
  }

  /**
   * Query events with filters
   */
  queryEvents(query: AnalyticsQuery): AnalyticsEvent[] {
    let filtered = this.events;

    if (query.plugin_id) {
      filtered = filtered.filter(e => e.plugin_id === query.plugin_id);
    }

    if (query.user_id) {
      filtered = filtered.filter(e => e.user_id === query.user_id);
    }

    if (query.event_type) {
      filtered = filtered.filter(e => e.event_type === query.event_type);
    }

    if (query.start_date) {
      filtered = filtered.filter(e => e.timestamp >= query.start_date!);
    }

    if (query.end_date) {
      filtered = filtered.filter(e => e.timestamp <= query.end_date!);
    }

    const offset = query.offset || 0;
    const limit = query.limit || filtered.length;

    return filtered.slice(offset, offset + limit);
  }

  // Helper methods for calculations

  private generateDailyTrends(events: AnalyticsEvent[], startDate: Date, endDate: Date) {
    const dailyData = {
      downloads: [] as Array<{ date: string; count: number }>,
      usage: [] as Array<{ date: string; active_users: number }>,
      revenue: [] as Array<{ date: string; amount: number }>
    };

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayEvents = events.filter(e => 
        e.timestamp.toISOString().split('T')[0] === dateStr
      );

      dailyData.downloads.push({
        date: dateStr,
        count: dayEvents.filter(e => e.event_type === 'plugin_download').length
      });

      dailyData.usage.push({
        date: dateStr,
        active_users: new Set(dayEvents.map(e => e.user_id)).size
      });

      dailyData.revenue.push({
        date: dateStr,
        amount: dayEvents
          .filter(e => e.event_type === 'plugin_purchase')
          .reduce((sum, e) => sum + ((e.data.amount as number) || 0), 0)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyData;
  }

  private calculateDAU(events: AnalyticsEvent[]): number {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayEvents = events.filter(e => 
      e.timestamp >= yesterday && 
      e.event_type === 'plugin_usage_session'
    );
    
    return new Set(dayEvents.map(e => e.user_id)).size;
  }

  private calculateWAU(events: AnalyticsEvent[]): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekEvents = events.filter(e => 
      e.timestamp >= weekAgo && 
      e.event_type === 'plugin_usage_session'
    );
    
    return new Set(weekEvents.map(e => e.user_id)).size;
  }

  private calculateMAU(events: AnalyticsEvent[]): number {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthEvents = events.filter(e => 
      e.timestamp >= monthAgo && 
      e.event_type === 'plugin_usage_session'
    );
    
    return new Set(monthEvents.map(e => e.user_id)).size;
  }

  private calculateAverageLoadTime(events: AnalyticsEvent[]): number {
    const performanceEvents = events.filter(e => 
      e.event_type === 'plugin_performance' && 
      e.data.load_time
    );
    
    if (performanceEvents.length === 0) return 0;
    
    const totalLoadTime = performanceEvents.reduce((sum, e) => 
      sum + ((e.data.load_time as number) || 0), 0
    );
    
    return totalLoadTime / performanceEvents.length;
  }

  private calculateCountryDistribution(events: AnalyticsEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    events.forEach(event => {
      const country = event.data.country as string || 'Unknown';
      distribution[country] = (distribution[country] || 0) + 1;
    });
    
    return distribution;
  }

  private calculateVersionDistribution(events: AnalyticsEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    events.forEach(event => {
      const version = event.version || 'Unknown';
      distribution[version] = (distribution[version] || 0) + 1;
    });
    
    return distribution;
  }

  private calculateUserTypeDistribution(events: AnalyticsEvent[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    events.forEach(event => {
      const userType = event.data.user_type as string || 'standard';
      distribution[userType] = (distribution[userType] || 0) + 1;
    });
    
    return distribution;
  }
}

/**
 * Default plugin analytics service instance
 */
export const pluginAnalyticsService = new PluginAnalyticsService();
