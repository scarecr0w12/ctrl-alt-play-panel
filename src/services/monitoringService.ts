import { PrismaClient } from '@prisma/client';
import { ExternalAgentService } from './externalAgentService';
import { SocketService } from './socket';
import SystemMetricsCollector from './systemMetricsCollector';

const prisma = new PrismaClient();

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  players: number;
  timestamp: Date;
}

export interface SystemMetrics extends ResourceMetrics {
  serverId: string;
  nodeId: string;
}

export class MonitoringService {
  private externalAgentService: ExternalAgentService;
  private systemCollector: SystemMetricsCollector;

  constructor() {
    this.systemCollector = new SystemMetricsCollector();
    this.externalAgentService = ExternalAgentService.getInstance();
  }

  /**
   * Collect resource metrics from a specific server
   */
  async collectServerMetrics(serverId: string): Promise<ResourceMetrics | null> {
    try {
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: { node: true }
      });

      if (!server) {
        throw new Error('Server not found');
      }

      // Get metrics from external agent
      const metricsResponse = await this.externalAgentService.getServerMetrics(server.node.uuid, serverId);
      
      if (!metricsResponse.success) {
        console.warn(`Failed to get metrics for server ${serverId}:`, metricsResponse.error);
        return null;
      }

      const metrics = metricsResponse.data;

      // Store metrics in database
      await this.storeMetrics(serverId, server.nodeId, metrics);

      // Emit real-time metrics update
      SocketService.emitMetricsUpdate({
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        players: metrics.players,
        serverId,
        nodeId: server.nodeId
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to collect metrics for server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * Collect metrics from all active servers
   */
  async collectAllServerMetrics(): Promise<void> {
    const activeServers = await prisma.server.findMany({
      where: {
        status: { in: ['RUNNING', 'STARTING'] }
      },
      include: { node: true }
    });

    const promises = activeServers.map((server: any) =>
      this.collectServerMetrics(server.id)
    );

    await Promise.allSettled(promises);

    // Emit aggregated stats update
    await this.emitAggregatedStats();
  }

  /**
   * Get aggregated stats for dashboard
   */
  async getAggregatedStats(): Promise<any> {
    const servers = await prisma.server.findMany();
    const runningServers = servers.filter((s: any) => s.status === 'RUNNING').length;
    const stoppedServers = servers.filter((s: any) => ['OFFLINE', 'STOPPED', 'CRASHED'].includes(s.status)).length;

    // Get latest metrics for aggregate calculations
    const latestMetrics = await prisma.serverMetrics.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { timestamp: 'desc' },
      take: servers.length
    });

    const avgCpu = latestMetrics.length > 0 
      ? latestMetrics.reduce((sum: number, m: any) => sum + m.cpu, 0) / latestMetrics.length 
      : 0;
    
    const totalMemory = latestMetrics.length > 0 
      ? latestMetrics.reduce((sum: number, m: any) => sum + m.memory, 0) 
      : 0;
    
    const totalPlayers = latestMetrics.length > 0 
      ? latestMetrics.reduce((sum: number, m: any) => sum + m.players, 0) 
      : 0;

    return {
      total: servers.length,
      running: runningServers,
      stopped: stoppedServers,
      cpu: Math.round(avgCpu),
      memory: Math.round(totalMemory),
      memoryTotal: 16384, // 16GB in MB - this should come from node specs
      players: totalPlayers,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Emit aggregated stats via WebSocket
   */
  async emitAggregatedStats(): Promise<void> {
    try {
      const stats = await this.getAggregatedStats();
      SocketService.emitMetricsUpdate(stats);
      SocketService.emitServerStatusUpdate({
        total: stats.total,
        running: stats.running,
        stopped: stats.stopped
      });
    } catch (error) {
      console.error('Failed to emit aggregated stats:', error);
    }
  }

  /**
   * Collect and emit system metrics
   */
  async collectAndEmitSystemMetrics(): Promise<void> {
    try {
      const systemMetrics = await this.systemCollector.collectSystemMetrics();
      
      // Add server statistics
      const serverStats = await this.getAggregatedStats();
      
      // Combine system metrics with server stats
      const combinedMetrics = {
        cpu: systemMetrics.cpu,
        memory: systemMetrics.memory,
        memoryUsed: systemMetrics.memoryUsed,
        memoryTotal: systemMetrics.memoryTotal,
        disk: systemMetrics.disk,
        diskUsed: systemMetrics.diskUsed,
        diskTotal: systemMetrics.diskTotal,
        network: systemMetrics.network,
        players: serverStats.players,
        uptime: systemMetrics.uptime,
        timestamp: systemMetrics.timestamp.toISOString()
      };

      // Emit via WebSocket
      SocketService.emitMetricsUpdate(combinedMetrics);
      
      console.log('📊 System metrics emitted:', {
        cpu: `${systemMetrics.cpu.toFixed(1)}%`,
        memory: `${systemMetrics.memory.toFixed(1)}%`,
        disk: `${systemMetrics.disk.toFixed(1)}%`,
        players: serverStats.players
      });
      
    } catch (error) {
      console.error('Failed to collect and emit system metrics:', error);
    }
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(serverId: string, nodeId: string, metrics: ResourceMetrics): Promise<void> {
    await prisma.serverMetrics.create({
      data: {
        serverId,
        nodeId,
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        networkIn: metrics.network.in,
        networkOut: metrics.network.out,
        players: metrics.players,
        timestamp: metrics.timestamp
      }
    });
  }

  /**
   * Get historical metrics for a server
   */
  async getServerMetricsHistory(
    serverId: string,
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<SystemMetrics[]> {
    const timeRanges = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };

    const hoursAgo = timeRanges[timeRange];
    const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const metrics = await prisma.serverMetrics.findMany({
      where: {
        serverId,
        timestamp: { gte: startTime }
      },
      orderBy: { timestamp: 'asc' }
    });

    return metrics.map((metric: any) => ({
      serverId: metric.serverId,
      nodeId: metric.nodeId,
      cpu: metric.cpu,
      memory: metric.memory,
      disk: metric.disk,
      network: {
        in: metric.networkIn,
        out: metric.networkOut
      },
      players: metric.players,
      timestamp: metric.timestamp
    }));
  }

  /**
   * Get current resource usage for a server
   */
  async getCurrentServerMetrics(serverId: string): Promise<ResourceMetrics | null> {
    const latestMetric = await prisma.serverMetrics.findFirst({
      where: { serverId },
      orderBy: { timestamp: 'desc' }
    });

    if (!latestMetric) {
      return null;
    }

    return {
      cpu: latestMetric.cpu,
      memory: latestMetric.memory,
      disk: latestMetric.disk,
      network: {
        in: latestMetric.networkIn,
        out: latestMetric.networkOut
      },
      players: latestMetric.players,
      timestamp: latestMetric.timestamp
    };
  }

  /**
   * Get aggregated node metrics (simplified for now)
   */
  async getNodeMetrics(nodeId: string, timeRange: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<any> {
    try {
      const timeRanges = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168
      };

      const hoursAgo = timeRanges[timeRange];
      const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      // For now, return mock aggregated data
      // TODO: Implement proper aggregation when MongoDB features are available
      const mockData = [
        {
          _id: '2025-01-01 12:00',
          avgCpu: Math.random() * 100,
          avgMemory: Math.random() * 100,
          avgDisk: Math.random() * 100,
          totalNetworkIn: Math.random() * 1000,
          totalNetworkOut: Math.random() * 1000,
          totalPlayers: Math.floor(Math.random() * 100),
          serverCount: Math.floor(Math.random() * 10) + 1
        }
      ];

      return mockData;
    } catch (error) {
      console.error(`Failed to get node metrics for ${nodeId}:`, error);
      return [];
    }
  }

  /**
   * Check for resource alerts
   */
  async checkResourceAlerts(): Promise<void> {
    const servers = await prisma.server.findMany({
      where: { status: 'RUNNING' },
      include: { node: true }
    });

    for (const server of servers) {
      const metrics = await this.getCurrentServerMetrics(server.id);

      if (!metrics) continue;

      // Check CPU usage
      if (metrics.cpu > 80) {
        await this.createAlert(server.id, 'HIGH_CPU', `CPU usage at ${metrics.cpu}%`);
      }

      // Check memory usage
      if (metrics.memory > 90) {
        await this.createAlert(server.id, 'HIGH_MEMORY', `Memory usage at ${metrics.memory}%`);
      }

      // Check disk usage
      if (metrics.disk > 85) {
        await this.createAlert(server.id, 'HIGH_DISK', `Disk usage at ${metrics.disk}%`);
      }
    }
  }

  /**
   * Create an alert
   */
  private async createAlert(serverId: string, type: string, message: string): Promise<void> {
    await prisma.alert.create({
      data: {
        serverId,
        type,
        message,
        severity: this.getAlertSeverity(type),
        acknowledged: false
      }
    });
  }

  /**
   * Get alert severity based on type
   */
  private getAlertSeverity(type: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      'HIGH_CPU': 'HIGH',
      'HIGH_MEMORY': 'CRITICAL',
      'HIGH_DISK': 'HIGH',
      'SERVER_DOWN': 'CRITICAL',
      'HIGH_NETWORK': 'MEDIUM'
    };

    return severityMap[type] || 'LOW';
  }

  /**
   * Generate PNG graph for metrics (simplified version)
   */
  async generateMetricsGraph(
    serverId: string,
    metric: 'cpu' | 'memory' | 'players',
    timeRange: '1h' | '6h' | '24h' | '7d' = '24h'
  ): Promise<Buffer> {
    const metrics = await this.getServerMetricsHistory(serverId, timeRange);

    // In a real implementation, you would use a charting library like Chart.js or D3
    // For now, we'll return a placeholder
    const graphData = {
      labels: metrics.map(m => m.timestamp.toISOString()),
      data: metrics.map(m => m[metric]),
      metric,
      timeRange
    };

    // This would generate an actual PNG using a charting library
    return Buffer.from(JSON.stringify(graphData));
  }
}
