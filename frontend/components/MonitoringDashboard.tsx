import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface SystemMetrics {
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

interface ServerMetrics {
  serverId: string;
  serverName: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'CRASHED';
  cpu: number;
  memory: number;
  players: number;
  maxPlayers: number;
  uptime: number;
}

interface MonitoringDashboardProps {
  className?: string;
}

export default function MonitoringDashboard({ className = '' }: MonitoringDashboardProps) {
  const { connected, metrics } = useWebSocket();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    memoryUsed: 0,
    memoryTotal: 16384,
    disk: 0,
    diskUsed: 0,
    diskTotal: 1000000,
    network: { in: 0, out: 0 },
    uptime: 0,
    timestamp: new Date(),
  });
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Update metrics when WebSocket data changes
  useEffect(() => {
    if (metrics) {
      setSystemMetrics(prev => ({
        ...prev,
        cpu: metrics.cpu || 0,
        memory: metrics.memory || 0,
        memoryUsed: metrics.memoryUsed || 0,
        memoryTotal: metrics.memoryTotal || 16384,
        disk: metrics.disk || 0,
        diskUsed: metrics.diskUsed || 0,
        diskTotal: metrics.diskTotal || 1000000,
        network: metrics.network || { in: 0, out: 0 },
        uptime: metrics.uptime || 0,
        timestamp: new Date(),
      }));

      // Update historical data for charts
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });

      setCpuHistory(prev => {
        const newHistory = [...prev, metrics.cpu || 0];
        return newHistory.slice(-20); // Keep last 20 data points
      });

      setMemoryHistory(prev => {
        const newHistory = [...prev, metrics.memory || 0];
        return newHistory.slice(-20);
      });

      setTimeLabels(prev => {
        const newLabels = [...prev, timeLabel];
        return newLabels.slice(-20);
      });

      // Check for alerts
      checkAlerts(metrics);
    }
  }, [metrics]);

  const checkAlerts = (metrics: any) => {
    const newAlerts: string[] = [];
    
    if (metrics.cpu > 80) {
      newAlerts.push(`High CPU usage: ${metrics.cpu.toFixed(1)}%`);
    }
    if (metrics.memory > 85) {
      newAlerts.push(`High memory usage: ${metrics.memory.toFixed(1)}%`);
    }
    if (metrics.disk > 90) {
      newAlerts.push(`High disk usage: ${metrics.disk.toFixed(1)}%`);
    }
    
    setAlerts(newAlerts);
  };

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#ffffff' }
      },
      title: {
        display: true,
        text: 'System Performance',
        color: '#ffffff'
      },
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
    },
  };

  const lineChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'CPU %',
        data: cpuHistory,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'Memory %',
        data: memoryHistory,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#ffffff' }
      },
    },
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm text-gray-300">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="glass-card border border-red-500/20 bg-red-500/10">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">System Alerts</h3>
          </div>
          <div className="space-y-1">
            {alerts.map((alert, index) => (
              <p key={index} className="text-red-300 text-sm">{alert}</p>
            ))}
          </div>
        </div>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">CPU Usage</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.cpu.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <CpuChipIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 bg-gray-700/50 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemMetrics.cpu > 80 ? 'bg-red-500' : 
                systemMetrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(systemMetrics.cpu, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.memory.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">
                {formatBytes(systemMetrics.memoryUsed * 1024 * 1024)} / {formatBytes(systemMetrics.memoryTotal * 1024 * 1024)}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CircleStackIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="mt-4 bg-gray-700/50 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemMetrics.memory > 85 ? 'bg-red-500' : 
                systemMetrics.memory > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(systemMetrics.memory, 100)}%` }}
            />
          </div>
        </div>

        {/* Disk Usage */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Disk Usage</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.disk.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">
                {formatBytes(systemMetrics.diskUsed)} / {formatBytes(systemMetrics.diskTotal)}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <ServerIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 bg-gray-700/50 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemMetrics.disk > 90 ? 'bg-red-500' : 
                systemMetrics.disk > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(systemMetrics.disk, 100)}%` }}
            />
          </div>
        </div>

        {/* System Uptime */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">System Uptime</p>
              <p className="text-2xl font-bold text-white">{formatUptime(systemMetrics.uptime)}</p>
              <p className="text-xs text-gray-500">Since last restart</p>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <SignalIcon className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Resource Distribution */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Distribution</h3>
          <div className="h-64">
            <Doughnut 
              data={{
                labels: ['CPU', 'Memory', 'Disk'],
                datasets: [{
                  data: [systemMetrics.cpu, systemMetrics.memory, systemMetrics.disk],
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                  ],
                  borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(139, 92, 246)',
                  ],
                  borderWidth: 2,
                }]
              }}
              options={doughnutOptions}
            />
          </div>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Network Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Network In</p>
              <p className="text-xl font-bold text-green-400">{formatBytes(systemMetrics.network.in)}/s</p>
            </div>
            <div className="text-green-400">↓</div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Network Out</p>
              <p className="text-xl font-bold text-blue-400">{formatBytes(systemMetrics.network.out)}/s</p>
            </div>
            <div className="text-blue-400">↑</div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {systemMetrics.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}
