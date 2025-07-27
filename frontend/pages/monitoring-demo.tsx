import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type MetricType = 'cpu' | 'memory' | 'disk' | 'network' | 'players';

export default function MonitoringDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'servers' | 'alerts' | 'export'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('cpu');
  const [selectedServers, setSelectedServers] = useState<string[]>(['1', '2']);
  const [chartData, setChartData] = useState<any>(null);
  
  // Mock data
  const systemMetrics = {
    cpu: 45.2,
    memory: 68.1,
    memoryUsed: 11000,
    memoryTotal: 16384,
    disk: 32.7,
    diskUsed: 327000000,
    diskTotal: 1000000000,
    network: { in: 1245000, out: 987000 },
    uptime: 432000,
    timestamp: new Date(),
  };

  const servers = [
    {
      id: '1',
      name: 'web-server-01',
      status: 'running',
      cpu: 42.1,
      memory: 65.3,
      players: 24,
      maxPlayers: 32,
      uptime: 345600,
      node: 'node-us-east-1',
    },
    {
      id: '2',
      name: 'game-server-02',
      status: 'running',
      cpu: 78.4,
      memory: 82.1,
      players: 18,
      maxPlayers: 20,
      uptime: 187200,
      node: 'node-us-west-1',
    },
    {
      id: '3',
      name: 'api-server-03',
      status: 'stopped',
      cpu: 0,
      memory: 0,
      players: 0,
      maxPlayers: 0,
      uptime: 0,
      node: 'node-eu-central-1',
    },
  ];

  const alerts = [
    {
      id: '1',
      type: 'warning' as const,
      message: 'High CPU usage detected on game-server-02',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      acknowledged: false,
      source: 'System Monitor',
    },
    {
      id: '2',
      type: 'critical' as const,
      message: 'Memory usage exceeded 85% threshold on game-server-02',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      acknowledged: false,
      source: 'Memory Monitor',
    },
    {
      id: '3',
      type: 'info' as const,
      message: 'Backup completed successfully for web-server-01',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      acknowledged: true,
      source: 'Backup Service',
    },
  ];

  // Generate mock historical data
  useEffect(() => {
    const generateMockData = () => {
      const now = new Date();
      const points = 20;
      const labels = [];
      const cpuData = [];
      const memoryData = [];
      const networkInData = [];
      const networkOutData = [];

      for (let i = points; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 5 * 60 * 1000));
        labels.push(time.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
        
        cpuData.push(Math.random() * 80 + 10);
        memoryData.push(Math.random() * 70 + 20);
        networkInData.push(Math.random() * 10 + 5);
        networkOutData.push(Math.random() * 8 + 3);
      }

      let datasets: any[] = [];
      
      if (selectedMetric === 'cpu') {
        datasets = [{
          label: 'CPU Usage (%)',
          data: cpuData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        }];
      } else if (selectedMetric === 'memory') {
        datasets = [{
          label: 'Memory Usage (%)',
          data: memoryData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        }];
      } else if (selectedMetric === 'network') {
        datasets = [
          {
            label: 'Network In (MB/s)',
            data: networkInData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
          },
          {
            label: 'Network Out (MB/s)',
            data: networkOutData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          }
        ];
      }

      setChartData({ labels, datasets });
    };

    generateMockData();
  }, [selectedMetric]);

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

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      running: 'text-green-400',
      stopped: 'text-red-400',
      starting: 'text-yellow-400',
      stopping: 'text-orange-400',
      crashed: 'text-red-500',
    };
    return statusMap[status] || 'text-gray-400';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <CheckCircleIcon className="w-5 h-5 text-blue-400" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#ffffff' }
      },
      title: {
        display: true,
        text: `${selectedMetric.toUpperCase()} Metrics - ${timeRange.toUpperCase()}`,
        color: '#ffffff'
      },
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Advanced Monitoring Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Comprehensive system and server analytics dashboard
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-300">Real-time Connected</span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'System Overview', icon: ChartBarIcon },
              { id: 'servers', label: 'Server Comparison', icon: ServerIcon },
              { id: 'alerts', label: 'Alert Management', icon: ExclamationTriangleIcon },
              { id: 'export', label: 'Data Export', icon: ArrowDownTrayIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CPU Usage */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:scale-105 transition-transform duration-200 relative">
                <div className="absolute top-3 right-3">
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">CPU Usage</p>
                    <p className="text-2xl font-bold text-white">{systemMetrics.cpu.toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <CpuChipIcon className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="bg-white/10 rounded-full h-2">
                    <div 
                      className="rounded-full h-2 transition-all duration-500 bg-blue-500"
                      style={{ width: `${Math.min(systemMetrics.cpu, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:scale-105 transition-transform duration-200 relative">
                <div className="absolute top-3 right-3">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Memory Usage</p>
                    <p className="text-2xl font-bold text-white">{systemMetrics.memory.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(systemMetrics.memoryUsed * 1024 * 1024)} / {formatBytes(systemMetrics.memoryTotal * 1024 * 1024)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <CircleStackIcon className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="bg-white/10 rounded-full h-2">
                    <div 
                      className="rounded-full h-2 transition-all duration-500 bg-green-500"
                      style={{ width: `${Math.min(systemMetrics.memory, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Active Servers */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Servers</p>
                    <p className="text-2xl font-bold text-white">
                      {servers.filter(s => s.status === 'running').length}
                    </p>
                    <p className="text-xs text-gray-500">of {servers.length} total</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <ServerIcon className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex space-x-1">
                    {servers.slice(0, 5).map((server, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-2 rounded-full ${
                          server.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* System Uptime */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">System Uptime</p>
                    <p className="text-2xl font-bold text-white">{formatUptime(systemMetrics.uptime)}</p>
                    <p className="text-xs text-gray-500">Since last restart</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Data Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Historical Performance</h3>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                    className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cpu">CPU Usage</option>
                    <option value="memory">Memory Usage</option>
                    <option value="disk">Disk Usage</option>
                    <option value="network">Network I/O</option>
                    <option value="players">Player Count</option>
                  </select>
                </div>
                <div className="h-80">
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </div>
              </div>

              {/* Resource Distribution */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Current Resource Distribution</h3>
                <div className="h-80">
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
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: { color: '#ffffff' }
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Resource Optimization Suggestions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Resource Optimization Suggestions</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Moderate CPU Usage Detected</p>
                    <p className="text-gray-300 text-sm mt-1">
                      CPU usage is at a moderate level. Monitor for peak usage times and consider load balancing.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Memory Usage Within Normal Range</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Memory usage is healthy. Consider implementing memory caching for better performance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Disk Usage Optimal</p>
                    <p className="text-gray-300 text-sm mt-1">
                      Disk usage is low. Good opportunity to implement regular backups and log rotation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'servers' && (
          <div className="space-y-6">
            {/* Server Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Multi-Server Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className={`border border-gray-600 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedServers.includes(server.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'hover:border-gray-500 hover:bg-gray-800/50'
                    }`}
                    onClick={() => {
                      setSelectedServers(prev =>
                        prev.includes(server.id)
                          ? prev.filter(id => id !== server.id)
                          : [...prev, server.id]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{server.name}</p>
                        <p className="text-sm text-gray-400">{server.node}</p>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                        {server.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">CPU</p>
                        <p className="text-white font-medium">{server.cpu.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Memory</p>
                        <p className="text-white font-medium">{server.memory.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Players</p>
                        <p className="text-white font-medium">{server.players}/{server.maxPlayers}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Chart */}
            {selectedServers.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Server Performance Comparison</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: selectedServers.map(id => servers.find(s => s.id === id)?.name || id),
                      datasets: [
                        {
                          label: 'CPU Usage (%)',
                          data: selectedServers.map(id => servers.find(s => s.id === id)?.cpu || 0),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderColor: 'rgb(59, 130, 246)',
                          borderWidth: 1,
                        },
                        {
                          label: 'Memory Usage (%)',
                          data: selectedServers.map(id => servers.find(s => s.id === id)?.memory || 0),
                          backgroundColor: 'rgba(16, 185, 129, 0.8)',
                          borderColor: 'rgb(16, 185, 129)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#ffffff' }
                        },
                        title: {
                          display: true,
                          text: 'Server Resource Usage Comparison',
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
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Alert Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Alerts</p>
                    <p className="text-2xl font-bold text-white">{alerts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-600/20 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Unacknowledged</p>
                    <p className="text-2xl font-bold text-red-400">
                      {alerts.filter(a => !a.acknowledged).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                    <XCircleIcon className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Critical Alerts</p>
                    <p className="text-2xl font-bold text-red-400">
                      {alerts.filter(a => a.type === 'critical').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Alert List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                  Acknowledge All
                </button>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.acknowledged
                        ? 'border-gray-600 bg-gray-800/50'
                        : alert.type === 'critical'
                        ? 'border-red-500/50 bg-red-500/10'
                        : alert.type === 'warning'
                        ? 'border-yellow-500/50 bg-yellow-500/10'
                        : 'border-blue-500/50 bg-blue-500/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <p className={`font-medium ${
                            alert.acknowledged ? 'text-gray-400' : 'text-white'
                          }`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>{alert.source}</span>
                            <span>{alert.timestamp.toLocaleString()}</span>
                            {alert.acknowledged && (
                              <span className="text-green-400">✓ Acknowledged</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors duration-200">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Export Options */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Data Export</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Export Historical Data</h4>
                  <p className="text-gray-400 text-sm">
                    Export system metrics, server performance data, and alerts for the selected time range.
                  </p>
                  <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Export JSON</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Current Data Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Range:</span>
                      <span className="text-white">{timeRange.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data Points:</span>
                      <span className="text-white">144</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Servers:</span>
                      <span className="text-white">{servers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Alerts:</span>
                      <span className="text-white">{alerts.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Status Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-400">Real-time Updates</span>
              </div>
              <span className="text-gray-400">
                Last updated: {systemMetrics.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                Monitoring {servers.length} servers
              </span>
              <span className="text-gray-400">
                {alerts.filter(a => !a.acknowledged).length} unacknowledged alerts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}