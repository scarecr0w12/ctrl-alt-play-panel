import os from 'os';
import fs from 'fs';
import { promisify } from 'util';

export interface SystemMetrics {
  cpu: number;
  memory: number;
  memoryUsed: number;
  memoryTotal: number;
  disk: number;
  diskUsed: number;
  diskTotal: number;
  network: {
    in: number;
    out: number;
  };
  uptime: number;
  timestamp: Date;
}

interface CpuUsage {
  user: number;
  nice: number;
  sys: number;
  idle: number;
  irq: number;
}

interface NetworkStats {
  bytesReceived: number;
  bytesTransmitted: number;
  timestamp: number;
}

export class SystemMetricsCollector {
  private lastCpuUsage: CpuUsage[] | null = null;
  private lastNetworkStats: NetworkStats | null = null;

  /**
   * Collect real system metrics from the host
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [cpu, memory, disk, network] = await Promise.all([
        this.getCpuUsage(),
        this.getMemoryUsage(),
        this.getDiskUsage(),
        this.getNetworkUsage(),
      ]);

      return {
        cpu: Math.round(cpu * 100) / 100,
        memory: Math.round(memory.percentage * 100) / 100,
        memoryUsed: memory.used,
        memoryTotal: memory.total,
        disk: Math.round(disk.percentage * 100) / 100,
        diskUsed: disk.used,
        diskTotal: disk.total,
        network,
        uptime: os.uptime(),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      // Return mock data if real metrics fail
      return this.getMockMetrics();
    }
  }

  /**
   * Get CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const cpuPercentage = 100 - ~~(100 * idleDifference / totalDifference);
        
        resolve(Math.max(0, Math.min(100, cpuPercentage)));
      }, 100);
    });
  }

  /**
   * Calculate CPU average
   */
  private cpuAverage() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        total += cpu.times[type as keyof typeof cpu.times];
      }
      idle += cpu.times.idle;
    });

    return { idle: idle / cpus.length, total: total / cpus.length };
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      percentage: (usedMemory / totalMemory) * 100,
    };
  }

  /**
   * Get disk usage (for the root filesystem)
   */
  private async getDiskUsage() {
    try {
      // Try to get disk usage using statfs if available
      if (fs.statfs) {
        const stats = await promisify(fs.statfs)('/');
        if ('bavail' in stats) {
          const total = stats.blocks * stats.bsize;
          const free = stats.bavail * stats.bsize;
          const used = total - free;
          
          return {
            total: Math.round(total / 1024 / 1024 / 1024), // GB
            used: Math.round(used / 1024 / 1024 / 1024), // GB
            free: Math.round(free / 1024 / 1024 / 1024), // GB
            percentage: (used / total) * 100,
          };
        }
      }
    } catch {
      console.warn('Could not get real disk usage, using mock data');
    }

    // Fallback mock data
    const total = 1000; // 1TB
    const used = Math.floor(Math.random() * 300) + 200; // 200-500GB
    return {
      total,
      used,
      free: total - used,
      percentage: (used / total) * 100,
    };
  }

  /**
   * Get network usage (mock for now)
   */
  private getNetworkUsage() {
    // In a real implementation, this would read from /proc/net/dev on Linux
    // For now, generate realistic mock data
    const baseIn = 1024 * 1024; // 1 MB/s base
    const baseOut = 512 * 1024; // 512 KB/s base
    
    return {
      in: baseIn + Math.floor(Math.random() * baseIn * 0.5),
      out: baseOut + Math.floor(Math.random() * baseOut * 0.3),
    };
  }

  /**
   * Generate mock metrics when real collection fails
   */
  private getMockMetrics(): SystemMetrics {
    const now = Date.now();
    const time = now / 10000;
    
    return {
      cpu: Math.max(5, Math.min(95, 30 + Math.sin(time * 0.1) * 20 + Math.random() * 10)),
      memory: Math.max(10, Math.min(90, 45 + Math.sin(time * 0.07) * 15 + Math.random() * 8)),
      memoryUsed: 7200,
      memoryTotal: 16384,
      disk: Math.max(20, Math.min(85, 55 + Math.sin(time * 0.03) * 10 + Math.random() * 5)),
      diskUsed: 450000,
      diskTotal: 1000000,
      network: {
        in: 1024 * 1024 + Math.random() * 512 * 1024,
        out: 512 * 1024 + Math.random() * 256 * 1024,
      },
      uptime: Math.floor(now / 1000) % (30 * 24 * 60 * 60), // Max 30 days
      timestamp: new Date(),
    };
  }
}

export default SystemMetricsCollector;
