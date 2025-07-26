import { PrismaClient } from '@prisma/client';
import { ExternalAgentService } from './externalAgentService';
import { MonitoringService, SystemMetrics } from './monitoringService';

const prisma = new PrismaClient();

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  interval: 'minute' | 'hour' | 'day' | 'week';
}

export interface ResourceTrend {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  players: number;
}

export interface ServerComparison {
  serverId: string;
  serverName: string;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgPlayers: number;
  peakCpu: number;
  peakMemory: number;
  peakDisk: number;
  uptime: number;
}

export interface AlertThreshold {
  id?: string;
  resourceType: 'cpu' | 'memory' | 'disk' | 'network';
  serverId?: string; // null for global thresholds
  warningThreshold: number;
  criticalThreshold: number;
  duration: number; // in minutes
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CapacityRecommendation {
  resourceType: 'cpu' | 'memory' | 'disk';
  currentUsage: number;
  predictedUsage: number;
  recommendedAction: 'upgrade' | 'optimize' | 'maintain';
  timeToThreshold: number; // in days
  confidence: number; // 0-1
  details: string;
}

export interface AnalyticsExport {
  timeRange: AnalyticsTimeRange;
  servers: string[];
  format: 'json' | 'csv' | 'pdf';
  includeGraphs: boolean;
}

export class ResourceAnalyticsService {
  private monitoringService: MonitoringService;

  constructor() {
    this.monitoringService = new MonitoringService();
  }

  /**
   * Get historical resource trends with aggregated data
   */
  async getResourceTrends(
    serverId?: string,
    timeRange: AnalyticsTimeRange = this.getDefaultTimeRange()
  ): Promise<ResourceTrend[]> {
    try {
      const whereClause: any = {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      };

      if (serverId) {
        whereClause.serverId = serverId;
      }

      const metrics = await prisma.serverMetrics.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' },
      });

      // Aggregate data based on interval
      return this.aggregateMetrics(metrics, timeRange.interval);
    } catch (error) {
      console.error('Failed to get resource trends:', error);
      return [];
    }
  }

  /**
   * Compare multiple servers' performance
   */
  async compareServers(
    serverIds: string[],
    timeRange: AnalyticsTimeRange = this.getDefaultTimeRange()
  ): Promise<ServerComparison[]> {
    try {
      const comparisons: ServerComparison[] = [];

      for (const serverId of serverIds) {
        const server = await prisma.server.findUnique({
          where: { id: serverId },
          select: { name: true, createdAt: true },
        });

        if (!server) continue;

        const metrics = await prisma.serverMetrics.findMany({
          where: {
            serverId,
            timestamp: {
              gte: timeRange.start,
              lte: timeRange.end,
            },
          },
        });

        if (metrics.length === 0) continue;

        const avgCpu = metrics.reduce((sum: number, m: any) => sum + m.cpu, 0) / metrics.length;
        const avgMemory = metrics.reduce((sum: number, m: any) => sum + m.memory, 0) / metrics.length;
        const avgDisk = metrics.reduce((sum: number, m: any) => sum + m.disk, 0) / metrics.length;
        const avgPlayers = metrics.reduce((sum: number, m: any) => sum + m.players, 0) / metrics.length;

        const peakCpu = Math.max(...metrics.map((m: any) => m.cpu));
        const peakMemory = Math.max(...metrics.map((m: any) => m.memory));
        const peakDisk = Math.max(...metrics.map((m: any) => m.disk));

        const uptime = (Date.now() - server.createdAt.getTime()) / (1000 * 60 * 60 * 24); // days

        comparisons.push({
          serverId,
          serverName: server.name,
          avgCpu: Math.round(avgCpu * 100) / 100,
          avgMemory: Math.round(avgMemory * 100) / 100,
          avgDisk: Math.round(avgDisk * 100) / 100,
          avgPlayers: Math.round(avgPlayers),
          peakCpu: Math.round(peakCpu * 100) / 100,
          peakMemory: Math.round(peakMemory * 100) / 100,
          peakDisk: Math.round(peakDisk * 100) / 100,
          uptime: Math.round(uptime * 100) / 100,
        });
      }

      return comparisons;
    } catch (error) {
      console.error('Failed to compare servers:', error);
      return [];
    }
  }

  /**
   * Get or create alert thresholds
   */
  async getAlertThresholds(serverId?: string): Promise<AlertThreshold[]> {
    try {
      // For now, return default thresholds since we don't have a thresholds table
      // In a real implementation, this would query a thresholds table
      const defaultThresholds: AlertThreshold[] = [
        {
          id: 'default-cpu',
          resourceType: 'cpu',
          serverId,
          warningThreshold: 70,
          criticalThreshold: 85,
          duration: 5,
          enabled: true,
        },
        {
          id: 'default-memory',
          resourceType: 'memory',
          serverId,
          warningThreshold: 80,
          criticalThreshold: 90,
          duration: 5,
          enabled: true,
        },
        {
          id: 'default-disk',
          resourceType: 'disk',
          serverId,
          warningThreshold: 75,
          criticalThreshold: 85,
          duration: 10,
          enabled: true,
        },
      ];

      return defaultThresholds;
    } catch (error) {
      console.error('Failed to get alert thresholds:', error);
      return [];
    }
  }

  /**
   * Update alert thresholds
   */
  async updateAlertThreshold(threshold: AlertThreshold): Promise<boolean> {
    try {
      // For now, just validate the threshold
      // In a real implementation, this would update the thresholds table
      if (threshold.warningThreshold >= threshold.criticalThreshold) {
        throw new Error('Warning threshold must be less than critical threshold');
      }

      if (threshold.warningThreshold < 0 || threshold.criticalThreshold > 100) {
        throw new Error('Thresholds must be between 0 and 100');
      }

      console.log('Alert threshold updated:', threshold);
      return true;
    } catch (error) {
      console.error('Failed to update alert threshold:', error);
      return false;
    }
  }

  /**
   * Generate capacity planning recommendations
   */
  async getCapacityRecommendations(serverId?: string): Promise<CapacityRecommendation[]> {
    try {
      const timeRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        end: new Date(),
        interval: 'day' as const,
      };

      const trends = await this.getResourceTrends(serverId, timeRange);
      if (trends.length < 7) {
        return []; // Not enough data for recommendations
      }

      const recommendations: CapacityRecommendation[] = [];

      // Analyze CPU trend
      const cpuTrend = this.calculateTrend(trends.map(t => t.cpu));
      const currentCpu = trends[trends.length - 1]?.cpu || 0;
      
      if (cpuTrend.slope > 0) {
        const daysToThreshold = this.calculateDaysToThreshold(currentCpu, cpuTrend, 80);
        recommendations.push({
          resourceType: 'cpu',
          currentUsage: currentCpu,
          predictedUsage: currentCpu + (cpuTrend.slope * 30),
          recommendedAction: daysToThreshold < 30 ? 'upgrade' : 'maintain',
          timeToThreshold: daysToThreshold,
          confidence: cpuTrend.confidence,
          details: this.generateRecommendationDetails('cpu', currentCpu, cpuTrend, daysToThreshold),
        });
      }

      // Analyze Memory trend
      const memoryTrend = this.calculateTrend(trends.map(t => t.memory));
      const currentMemory = trends[trends.length - 1]?.memory || 0;
      
      if (memoryTrend.slope > 0) {
        const daysToThreshold = this.calculateDaysToThreshold(currentMemory, memoryTrend, 85);
        recommendations.push({
          resourceType: 'memory',
          currentUsage: currentMemory,
          predictedUsage: currentMemory + (memoryTrend.slope * 30),
          recommendedAction: daysToThreshold < 30 ? 'upgrade' : 'maintain',
          timeToThreshold: daysToThreshold,
          confidence: memoryTrend.confidence,
          details: this.generateRecommendationDetails('memory', currentMemory, memoryTrend, daysToThreshold),
        });
      }

      // Analyze Disk trend
      const diskTrend = this.calculateTrend(trends.map(t => t.disk));
      const currentDisk = trends[trends.length - 1]?.disk || 0;
      
      if (diskTrend.slope > 0) {
        const daysToThreshold = this.calculateDaysToThreshold(currentDisk, diskTrend, 80);
        recommendations.push({
          resourceType: 'disk',
          currentUsage: currentDisk,
          predictedUsage: currentDisk + (diskTrend.slope * 30),
          recommendedAction: daysToThreshold < 60 ? 'upgrade' : 'maintain',
          timeToThreshold: daysToThreshold,
          confidence: diskTrend.confidence,
          details: this.generateRecommendationDetails('disk', currentDisk, diskTrend, daysToThreshold),
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to generate capacity recommendations:', error);
      return [];
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(exportConfig: AnalyticsExport): Promise<Buffer | string> {
    try {
      const data: any = {
        metadata: {
          exportedAt: new Date().toISOString(),
          timeRange: exportConfig.timeRange,
          servers: exportConfig.servers,
        },
        trends: [],
        comparisons: [],
      };

      // Get trends for each server
      for (const serverId of exportConfig.servers) {
        const trends = await this.getResourceTrends(serverId, exportConfig.timeRange);
        data.trends.push({ serverId, trends });
      }

      // Get server comparisons
      if (exportConfig.servers.length > 1) {
        data.comparisons = await this.compareServers(exportConfig.servers, exportConfig.timeRange);
      }

      switch (exportConfig.format) {
        case 'json':
          return JSON.stringify(data, null, 2);
        
        case 'csv':
          return this.convertToCSV(data);
        
        case 'pdf':
          // For PDF, return JSON for now - would need PDF library integration
          return JSON.stringify(data, null, 2);
        
        default:
          return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw error;
    }
  }

  /**
   * Get alerts based on current thresholds
   */
  async getActiveAlerts(serverId?: string): Promise<any[]> {
    try {
      const whereClause: any = {
        acknowledged: false,
      };

      if (serverId) {
        whereClause.serverId = serverId;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        include: {
          server: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return alerts;
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  // Helper methods
  private getDefaultTimeRange(): AnalyticsTimeRange {
    return {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date(),
      interval: 'hour',
    };
  }

  private aggregateMetrics(metrics: any[], interval: string): ResourceTrend[] {
    // Simple aggregation - in a real implementation, this would be more sophisticated
    const aggregated: ResourceTrend[] = [];
    const intervalMs = this.getIntervalMs(interval);
    
    if (metrics.length === 0) return aggregated;

    let currentBucket = Math.floor(metrics[0].timestamp.getTime() / intervalMs) * intervalMs;
    let bucketMetrics: any[] = [];

    for (const metric of metrics) {
      const metricBucket = Math.floor(metric.timestamp.getTime() / intervalMs) * intervalMs;
      
      if (metricBucket === currentBucket) {
        bucketMetrics.push(metric);
      } else {
        if (bucketMetrics.length > 0) {
          aggregated.push(this.aggregateBucket(bucketMetrics, new Date(currentBucket)));
        }
        currentBucket = metricBucket;
        bucketMetrics = [metric];
      }
    }

    // Add the last bucket
    if (bucketMetrics.length > 0) {
      aggregated.push(this.aggregateBucket(bucketMetrics, new Date(currentBucket)));
    }

    return aggregated;
  }

  private aggregateBucket(metrics: any[], timestamp: Date): ResourceTrend {
    const count = metrics.length;
    return {
      timestamp,
      cpu: metrics.reduce((sum, m) => sum + m.cpu, 0) / count,
      memory: metrics.reduce((sum, m) => sum + m.memory, 0) / count,
      disk: metrics.reduce((sum, m) => sum + m.disk, 0) / count,
      networkIn: metrics.reduce((sum, m) => sum + m.networkIn, 0) / count,
      networkOut: metrics.reduce((sum, m) => sum + m.networkOut, 0) / count,
      players: Math.round(metrics.reduce((sum, m) => sum + m.players, 0) / count),
    };
  }

  private getIntervalMs(interval: string): number {
    switch (interval) {
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  private calculateTrend(values: number[]): { slope: number; confidence: number } {
    if (values.length < 2) return { slope: 0, confidence: 0 };

    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Simple confidence calculation based on data consistency
    const avgValue = sumY / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / n;
    const confidence = Math.max(0, Math.min(1, 1 - (variance / (avgValue * avgValue))));

    return { slope, confidence };
  }

  private calculateDaysToThreshold(current: number, trend: any, threshold: number): number {
    if (trend.slope <= 0) return Infinity;
    return Math.max(0, (threshold - current) / trend.slope);
  }

  private generateRecommendationDetails(
    resourceType: string,
    current: number,
    trend: any,
    daysToThreshold: number
  ): string {
    if (daysToThreshold < 30) {
      return `${resourceType.toUpperCase()} usage is trending upward and may reach capacity in ${Math.round(daysToThreshold)} days. Consider upgrading resources.`;
    } else if (daysToThreshold < 90) {
      return `${resourceType.toUpperCase()} usage is gradually increasing. Monitor and plan for potential upgrade in the next quarter.`;
    } else {
      return `${resourceType.toUpperCase()} usage is stable. Current capacity should be sufficient for the foreseeable future.`;
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be more sophisticated in a real implementation
    let csv = 'Server,Timestamp,CPU,Memory,Disk,NetworkIn,NetworkOut,Players\n';
    
    for (const serverData of data.trends) {
      for (const trend of serverData.trends) {
        csv += `${serverData.serverId},${trend.timestamp},${trend.cpu},${trend.memory},${trend.disk},${trend.networkIn},${trend.networkOut},${trend.players}\n`;
      }
    }
    
    return csv;
  }
}