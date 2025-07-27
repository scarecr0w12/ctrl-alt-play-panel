/**
 * Performance Dashboard Component
 * Real-time performance monitoring with widgets
 * Inspired by competitive panel systems
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Users,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Eye,
  Settings
} from 'lucide-react';

interface PerformanceMetrics {
  timestamp: number;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  disk_usage: number;
  disk_total: number;
  network_in: number;
  network_out: number;
  active_connections: number;
  response_time: number;
  uptime: number;
}

interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  server_id?: string;
}

interface DashboardProps {
  serverId?: string;
  className?: string;
}

export type { PerformanceMetrics, AlertData, DashboardProps };

const PerformanceWidget: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
  className?: string;
}> = ({ title, value, unit, icon, trend, percentage, className = '' }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getPercentageColor = (pct?: number) => {
    if (!pct) return 'text-gray-400';
    if (pct < 50) return 'text-green-400';
    if (pct < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white">{value}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
        
        {percentage !== undefined && (
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentage < 50 ? 'bg-green-500' : 
                  percentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${getPercentageColor(percentage)}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertsWidget: React.FC<{ alerts: AlertData[] }> = ({ alerts }) => {
  const getAlertIcon = (type: AlertData['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <Eye className="w-4 h-4 text-blue-400" />;
    }
  };

  const getAlertColor = (type: AlertData['type']) => {
    switch (type) {
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
        <span className="text-sm text-gray-400">{alerts.length} active</span>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No alerts at this time
          </div>
        ) : (
          alerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const NetworkChart: React.FC<{ 
  data: { timestamp: number; in: number; out: number }[] 
}> = ({ data }) => {
  const maxValue = Math.max(...data.flatMap(d => [d.in, d.out]));
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Network Activity</h3>
      
      <div className="h-32 flex items-end space-x-1">
        {data.slice(-20).map((point, index) => {
          const inHeight = (point.in / maxValue) * 100;
          const outHeight = (point.out / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col justify-end space-y-1">
              <div
                className="bg-green-500 rounded-t"
                style={{ height: `${inHeight}%`, minHeight: '2px' }}
                title={`In: ${(point.in / 1024 / 1024).toFixed(2)} MB/s`}
              />
              <div
                className="bg-blue-500 rounded-t"
                style={{ height: `${outHeight}%`, minHeight: '2px' }}
                title={`Out: ${(point.out / 1024 / 1024).toFixed(2)} MB/s`}
              />
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-400">Incoming</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-400">Outgoing</span>
        </div>
      </div>
    </div>
  );
};

export const PerformanceDashboard: React.FC<DashboardProps> = ({
  serverId,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [networkHistory, setNetworkHistory] = useState<{ timestamp: number; in: number; out: number }[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:8082`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Performance Dashboard WebSocket connected');
        
        if (serverId) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            serverId
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'subscribe_global'
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing performance data:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Performance Dashboard WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('Performance Dashboard WebSocket error:', error);
      };
    };

    connectWebSocket();
  }, [serverId]);

  const handleWebSocketMessage = (data: unknown) => {
    const message = data as { type: string; [key: string]: unknown };

    switch (message.type) {
      case 'metrics_update': {
        const newMetrics = message.metrics as PerformanceMetrics;
        setMetrics(newMetrics);
        
        // Update network history
        setNetworkHistory(prev => {
          const newHistory = [...prev, {
            timestamp: newMetrics.timestamp,
            in: newMetrics.network_in,
            out: newMetrics.network_out
          }];
          return newHistory.slice(-50); // Keep last 50 data points
        });
        break;
      }

      case 'alert': {
        const alert = message.alert as AlertData;
        setAlerts(prev => {
          const newAlerts = [alert, ...prev];
          return newAlerts.slice(0, 20); // Keep latest 20 alerts
        });
        break;
      }

      case 'alerts_list': {
        const alertsList = message.alerts as AlertData[];
        setAlerts(alertsList);
        break;
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getMemoryUsage = () => {
    if (!metrics) return { used: 0, total: 0, percentage: 0 };
    const used = metrics.memory_total - metrics.memory_usage;
    const percentage = (used / metrics.memory_total) * 100;
    return { used, total: metrics.memory_total, percentage };
  };

  const getDiskUsage = () => {
    if (!metrics) return { used: 0, total: 0, percentage: 0 };
    const percentage = (metrics.disk_usage / metrics.disk_total) * 100;
    return { used: metrics.disk_usage, total: metrics.disk_total, percentage };
  };

  if (!metrics) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 p-8 ${className}`}>
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">
            {isConnected ? 'Loading performance data...' : 'Connecting to performance monitor...'}
          </p>
        </div>
      </div>
    );
  }

  const memoryUsage = getMemoryUsage();
  const diskUsage = getDiskUsage();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PerformanceWidget
          title="CPU Usage"
          value={metrics.cpu_usage.toFixed(1)}
          unit="%"
          percentage={metrics.cpu_usage}
          icon={<Cpu className="w-5 h-5 text-blue-400" />}
          trend={metrics.cpu_usage > 80 ? 'up' : metrics.cpu_usage < 20 ? 'down' : 'stable'}
        />

        <PerformanceWidget
          title="Memory Usage"
          value={formatBytes(memoryUsage.used)}
          unit={`/ ${formatBytes(memoryUsage.total)}`}
          percentage={memoryUsage.percentage}
          icon={<MemoryStick className="w-5 h-5 text-green-400" />}
          trend={memoryUsage.percentage > 80 ? 'up' : 'stable'}
        />

        <PerformanceWidget
          title="Disk Usage"
          value={formatBytes(diskUsage.used)}
          unit={`/ ${formatBytes(diskUsage.total)}`}
          percentage={diskUsage.percentage}
          icon={<HardDrive className="w-5 h-5 text-yellow-400" />}
          trend={diskUsage.percentage > 90 ? 'up' : 'stable'}
        />

        <PerformanceWidget
          title="Uptime"
          value={formatUptime(metrics.uptime)}
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          trend="stable"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PerformanceWidget
          title="Response Time"
          value={metrics.response_time.toFixed(0)}
          unit="ms"
          icon={<Zap className="w-5 h-5 text-orange-400" />}
          trend={metrics.response_time > 1000 ? 'up' : metrics.response_time < 100 ? 'down' : 'stable'}
        />

        <PerformanceWidget
          title="Active Connections"
          value={metrics.active_connections}
          icon={<Users className="w-5 h-5 text-cyan-400" />}
        />

        <PerformanceWidget
          title="Network I/O"
          value={`${formatBytes(metrics.network_in)}/s`}
          unit={`↓ ${formatBytes(metrics.network_out)}/s ↑`}
          icon={<Network className="w-5 h-5 text-pink-400" />}
        />
      </div>

      {/* Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetworkChart data={networkHistory} />
        <AlertsWidget alerts={alerts} />
      </div>

      {/* Additional Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">System Information</h3>
          <button className="p-2 text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-gray-400">Last Updated:</span>
            <p className="text-white font-medium">
              {new Date(metrics.timestamp).toLocaleString()}
            </p>
          </div>
          
          <div>
            <span className="text-gray-400">Server ID:</span>
            <p className="text-white font-medium">{serverId || 'Global'}</p>
          </div>
          
          <div>
            <span className="text-gray-400">Monitoring Status:</span>
            <p className="text-green-400 font-medium">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
