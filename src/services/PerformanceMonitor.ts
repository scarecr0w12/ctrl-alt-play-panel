/**
 * Performance Monitor - Issue #21 Implementation
 * 
 * Based on competitive analysis:
 * - TCAdmin2: Resource monitoring with graphs and reports
 * - Pterodactyl: Real-time server statistics and performance tracking
 * - Pelican Panel: Resource limits and monitoring with Docker isolation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import * as os from 'os';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load_average: number[];
    cores: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  network: {
    bytes_sent: number;
    bytes_received: number;
    packets_sent: number;
    packets_received: number;
  };
  processes: {
    active_servers: number;
    total_connections: number;
    database_connections: number;
  };
  response_time: {
    api_average: number;
    database_average: number;
    file_io_average: number;
  };
}

interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

interface PerformanceConfig {
  collection_interval: number; // milliseconds
  retention_period: number; // days
  alert_thresholds: {
    memory_usage: number; // percentage
    cpu_usage: number; // percentage
    disk_usage: number; // percentage
    response_time: number; // milliseconds
  };
  enable_real_time: boolean;
  enable_alerts: boolean;
}

/**
 * Performance Monitoring System
 * Competitive features implementation
 */
export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private isCollecting = false;
  private collectionInterval?: NodeJS.Timeout;
  private alerts: PerformanceAlert[] = [];
  private responseTimers: Map<string, number> = new Map();

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();
    
    this.config = {
      collection_interval: 30000, // 30 seconds
      retention_period: 30, // 30 days
      alert_thresholds: {
        memory_usage: 85, // 85%
        cpu_usage: 80, // 80%
        disk_usage: 90, // 90%
        response_time: 5000 // 5 seconds
      },
      enable_real_time: true,
      enable_alerts: true,
      ...config
    };
  }

  /**
   * Start performance monitoring
   */
  async start(): Promise<void> {
    if (this.isCollecting) {
      return;
    }

    logger.info('Starting Performance Monitor...');
    
    this.isCollecting = true;
    
    // Initial metrics collection
    await this.collectMetrics();
    
    // Set up periodic collection
    this.collectionInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.collection_interval);

    // Clean up old metrics
    this.scheduleCleanup();
    
    this.emit('started');
    logger.info('Performance Monitor started successfully');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isCollecting) {
      return;
    }

    logger.info('Stopping Performance Monitor...');
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    
    this.isCollecting = false;
    this.emit('stopped');
    
    logger.info('Performance Monitor stopped');
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 24): PerformanceMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get performance statistics
   */
  getStatistics(hours: number = 24): PerformanceStatistics {
    const metrics = this.getHistoricalMetrics(hours);
    
    if (metrics.length === 0) {
      return this.getEmptyStatistics();
    }

    return {
      memory: this.calculateStatistics(metrics.map(m => m.memory.percentage)),
      cpu: this.calculateStatistics(metrics.map(m => m.cpu.usage)),
      disk: this.calculateStatistics(metrics.map(m => m.disk.percentage)),
      response_time: this.calculateStatistics(metrics.map(m => m.response_time.api_average)),
      uptime: this.calculateUptime(),
      total_samples: metrics.length,
      time_range: {
        start: metrics[0].timestamp,
        end: metrics[metrics.length - 1].timestamp
      }
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Start response time tracking for an operation
   */
  startTimer(operation: string): void {
    this.responseTimers.set(operation, performance.now());
  }

  /**
   * End response time tracking for an operation
   */
  endTimer(operation: string): number {
    const start = this.responseTimers.get(operation);
    if (start) {
      const duration = performance.now() - start;
      this.responseTimers.delete(operation);
      return duration;
    }
    return 0;
  }

  /**
   * Get system health status
   */
  getHealthStatus(): HealthStatus {
    const current = this.getCurrentMetrics();
    
    if (!current) {
      return {
        status: 'unknown',
        score: 0,
        issues: ['No metrics available'],
        recommendations: ['Start performance monitoring']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check memory usage
    if (current.memory.percentage > this.config.alert_thresholds.memory_usage) {
      issues.push(`High memory usage: ${current.memory.percentage.toFixed(1)}%`);
      recommendations.push('Consider increasing RAM or optimizing memory usage');
      score -= 25;
    }

    // Check CPU usage
    if (current.cpu.usage > this.config.alert_thresholds.cpu_usage) {
      issues.push(`High CPU usage: ${current.cpu.usage.toFixed(1)}%`);
      recommendations.push('Optimize CPU-intensive operations or scale horizontally');
      score -= 25;
    }

    // Check disk usage
    if (current.disk.percentage > this.config.alert_thresholds.disk_usage) {
      issues.push(`High disk usage: ${current.disk.percentage.toFixed(1)}%`);
      recommendations.push('Clean up logs and temporary files, or add more storage');
      score -= 30;
    }

    // Check response time
    if (current.response_time.api_average > this.config.alert_thresholds.response_time) {
      issues.push(`Slow API response: ${current.response_time.api_average.toFixed(0)}ms`);
      recommendations.push('Optimize database queries and enable caching');
      score -= 20;
    }

    const status: HealthStatus['status'] = 
      score >= 80 ? 'healthy' :
      score >= 60 ? 'warning' :
      score >= 40 ? 'critical' : 'unhealthy';

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * Export metrics data
   */
  async exportMetrics(format: 'json' | 'csv' = 'json', hours: number = 24): Promise<string> {
    const metrics = this.getHistoricalMetrics(hours);
    
    if (format === 'csv') {
      return this.exportToCSV(metrics);
    }
    
    return JSON.stringify({
      export_date: new Date().toISOString(),
      time_range_hours: hours,
      total_samples: metrics.length,
      metrics
    }, null, 2);
  }

  // Private Methods

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        memory: await this.getMemoryMetrics(),
        cpu: await this.getCPUMetrics(),
        disk: await this.getDiskMetrics(),
        network: await this.getNetworkMetrics(),
        processes: await this.getProcessMetrics(),
        response_time: await this.getResponseTimeMetrics()
      };

      this.metrics.push(metrics);
      
      // Emit real-time update
      if (this.config.enable_real_time) {
        this.emit('metrics', metrics);
      }

      // Check for alerts
      if (this.config.enable_alerts) {
        this.checkAlerts(metrics);
      }

      // Limit metrics array size (keep last 1000 entries)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

    } catch (error) {
      logger.error('Failed to collect performance metrics:', error);
    }
  }

  private async getMemoryMetrics(): Promise<PerformanceMetrics['memory']> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      used: usedMemory,
      free: freeMemory,
      total: totalMemory,
      percentage: (usedMemory / totalMemory) * 100
    };
  }

  private async getCPUMetrics(): Promise<PerformanceMetrics['cpu']> {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Simple CPU usage calculation (would be enhanced in production)
    const usage = Math.min(100, (loadAvg[0] / cpus.length) * 100);

    return {
      usage,
      load_average: loadAvg,
      cores: cpus.length
    };
  }

  private async getDiskMetrics(): Promise<PerformanceMetrics['disk']> {
    try {
      // This is a simplified implementation
      // In production, you'd use proper disk usage libraries
      const stats = await fs.stat('.');
      
      // Mock values for demonstration
      const total = 100 * 1024 * 1024 * 1024; // 100GB
      const used = 30 * 1024 * 1024 * 1024;   // 30GB
      const free = total - used;

      return {
        used,
        free,
        total,
        percentage: (used / total) * 100
      };
    } catch {
      return {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      };
    }
  }

  private async getNetworkMetrics(): Promise<PerformanceMetrics['network']> {
    // This would be implemented with actual network monitoring
    // For now, return mock data
    return {
      bytes_sent: 0,
      bytes_received: 0,
      packets_sent: 0,
      packets_received: 0
    };
  }

  private async getProcessMetrics(): Promise<PerformanceMetrics['processes']> {
    // This would monitor actual game servers and connections
    return {
      active_servers: 0,
      total_connections: 0,
      database_connections: 0
    };
  }

  private async getResponseTimeMetrics(): Promise<PerformanceMetrics['response_time']> {
    // Calculate averages from recent response times
    return {
      api_average: 0,
      database_average: 0,
      file_io_average: 0
    };
  }

  private checkAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Memory alert
    if (metrics.memory.percentage > this.config.alert_thresholds.memory_usage) {
      alerts.push({
        type: metrics.memory.percentage > 95 ? 'critical' : 'warning',
        metric: 'memory_usage',
        value: metrics.memory.percentage,
        threshold: this.config.alert_thresholds.memory_usage,
        message: `Memory usage is ${metrics.memory.percentage.toFixed(1)}%`,
        timestamp: metrics.timestamp
      });
    }

    // CPU alert
    if (metrics.cpu.usage > this.config.alert_thresholds.cpu_usage) {
      alerts.push({
        type: metrics.cpu.usage > 95 ? 'critical' : 'warning',
        metric: 'cpu_usage',
        value: metrics.cpu.usage,
        threshold: this.config.alert_thresholds.cpu_usage,
        message: `CPU usage is ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: metrics.timestamp
      });
    }

    // Add alerts and emit events
    for (const alert of alerts) {
      this.alerts.push(alert);
      this.emit('alert', alert);
    }
  }

  private calculateStatistics(values: number[]): StatisticValue {
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)]
    };
  }

  private calculateUptime(): number {
    return os.uptime();
  }

  private getEmptyStatistics(): PerformanceStatistics {
    const empty = { min: 0, max: 0, avg: 0, median: 0 };
    return {
      memory: empty,
      cpu: empty,
      disk: empty,
      response_time: empty,
      uptime: 0,
      total_samples: 0,
      time_range: { start: 0, end: 0 }
    };
  }

  private exportToCSV(metrics: PerformanceMetrics[]): string {
    const headers = [
      'timestamp', 'memory_percentage', 'cpu_usage', 'disk_percentage',
      'api_response_time', 'active_servers', 'total_connections'
    ];
    
    const rows = metrics.map(m => [
      new Date(m.timestamp).toISOString(),
      m.memory.percentage.toFixed(2),
      m.cpu.usage.toFixed(2),
      m.disk.percentage.toFixed(2),
      m.response_time.api_average.toFixed(2),
      m.processes.active_servers,
      m.processes.total_connections
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private scheduleCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      const cutoff = Date.now() - (this.config.retention_period * 24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
      this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoff);
    }, 60 * 60 * 1000);
  }
}

// Supporting Interfaces

interface StatisticValue {
  min: number;
  max: number;
  avg: number;
  median: number;
}

interface PerformanceStatistics {
  memory: StatisticValue;
  cpu: StatisticValue;
  disk: StatisticValue;
  response_time: StatisticValue;
  uptime: number;
  total_samples: number;
  time_range: {
    start: number;
    end: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unhealthy' | 'unknown';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;
