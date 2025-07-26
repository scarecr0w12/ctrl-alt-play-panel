import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { analyticsApi, serversApi } from '@/lib/api';
import {
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ClockIcon,
  BuildingLibraryIcon,
  ChartPieIcon,
  TrendingUpIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
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
import 'chartjs-adapter-date-fns';

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

interface ResourceTrend {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  players: number;
}

interface ServerComparison {
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

interface AlertThreshold {
  id?: string;
  resourceType: 'cpu' | 'memory' | 'disk' | 'network';
  serverId?: string;
  warningThreshold: number;
  criticalThreshold: number;
  duration: number;
  enabled: boolean;
}

interface CapacityRecommendation {
  resourceType: 'cpu' | 'memory' | 'disk';
  currentUsage: number;
  predictedUsage: number;
  recommendedAction: 'upgrade' | 'optimize' | 'maintain';
  timeToThreshold: number;
  confidence: number;
  details: string;
}

interface ResourceAnalyticsDashboardProps {
  className?: string;
}

export default function ResourceAnalyticsDashboard({ className = '' }: ResourceAnalyticsDashboardProps) {
  const { connected } = useWebSocket();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'comparison' | 'alerts' | 'planning'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [trends, setTrends] = useState<ResourceTrend[]>([]);
  const [comparisons, setComparisons] = useState<ServerComparison[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [recommendations, setRecommendations] = useState<CapacityRecommendation[]>([]);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [servers, setServers] = useState<any[]>([]);

  // Overview data
  const [overview, setOverview] = useState<any>({
    summary: {
      avgCpu: 0,
      avgMemory: 0,
      avgDisk: 0,
      peakCpu: 0,
      peakMemory: 0,
      peakDisk: 0,
      totalPlayers: 0,
      alertsCount: 0,
      criticalAlerts: 0,
      recommendationsCount: 0
    },
    trends: [],
    alerts: [],
    recommendations: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch overview data
      const overviewResponse = await analyticsApi.getOverview(timeRange);
      if (overviewResponse.data.success) {
        setOverview(overviewResponse.data.data);
      }

      // Fetch servers list
      const serversResponse = await serversApi.getAll();
      if (serversResponse.data.success) {
        setServers(serversResponse.data.data || []);
      }

      // Fetch alert thresholds
      const thresholdsResponse = await analyticsApi.getThresholds();
      if (thresholdsResponse.data.success) {
        setThresholds(thresholdsResponse.data.data || []);
      }

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchTrends = useCallback(async () => {
    if (activeTab !== 'trends') return;
    
    setLoading(true);
    try {
      const params: any = {
        interval: timeRange === '30d' ? 'day' : 'hour',
      };

      if (timeRange !== '1h') {
        const now = new Date();
        const start = new Date();
        
        switch (timeRange) {
          case '6h':
            start.setHours(now.getHours() - 6);
            break;
          case '24h':
            start.setDate(now.getDate() - 1);
            break;
          case '7d':
            start.setDate(now.getDate() - 7);
            break;
          case '30d':
            start.setDate(now.getDate() - 30);
            break;
        }
        
        params.startDate = start.toISOString();
        params.endDate = now.toISOString();
      }

      const response = await analyticsApi.getTrends(params);
      if (response.data.success) {
        setTrends(response.data.data.trends || []);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, timeRange]);

  const fetchComparisons = useCallback(async () => {
    if (activeTab !== 'comparison' || selectedServers.length === 0) return;
    
    setLoading(true);
    try {
      const response = await analyticsApi.compareServers({
        serverIds: selectedServers,
      });

      if (response.data.success) {
        setComparisons(response.data.data.comparisons || []);
      }
    } catch (error) {
      console.error('Failed to fetch comparisons:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedServers]);

  const fetchRecommendations = useCallback(async () => {
    if (activeTab !== 'planning') return;
    
    setLoading(true);
    try {
      const response = await analyticsApi.getRecommendations();
      if (response.data.success) {
        setRecommendations(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleExportData = async () => {
    try {
      const exportServers = selectedServers.length > 0 ? selectedServers : servers.map(s => s.id);
      
      const response = await analyticsApi.exportData({
        serverIds: exportServers,
        format: 'json',
        includeGraphs: false,
      });

      // Create download link safely
      if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#ffffff' }
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

  const trendChartData = {
    labels: trends.map(t => t.timestamp),
    datasets: [
      {
        label: 'CPU %',
        data: trends.map(t => t.cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
      },
      {
        label: 'Memory %',
        data: trends.map(t => t.memory),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
      },
      {
        label: 'Disk %',
        data: trends.map(t => t.disk),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: false,
      },
    ],
  };

  const formatUptime = (hours: number): string => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upgrade': return 'text-red-400';
      case 'optimize': return 'text-yellow-400';
      case 'maintain': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'trends', name: 'Trends', icon: TrendingUpIcon },
    { id: 'comparison', name: 'Comparison', icon: BuildingLibraryIcon },
    { id: 'alerts', name: 'Alerts', icon: BellAlertIcon },
    { id: 'planning', name: 'Planning', icon: ChartPieIcon },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Resource Analytics</h2>
          <p className="text-gray-400 mt-1">Advanced server resource monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm text-gray-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
        {(['1h', '6h', '24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg CPU</p>
                  <p className="text-2xl font-bold text-white">{overview.summary.avgCpu.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Peak: {overview.summary.peakCpu.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CpuChipIcon className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Memory</p>
                  <p className="text-2xl font-bold text-white">{overview.summary.avgMemory.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Peak: {overview.summary.peakMemory.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CircleStackIcon className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Disk</p>
                  <p className="text-2xl font-bold text-white">{overview.summary.avgDisk.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Peak: {overview.summary.peakDisk.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <ServerIcon className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-white">{overview.summary.alertsCount}</p>
                  <p className="text-xs text-red-400">Critical: {overview.summary.criticalAlerts}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Trends Chart */}
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Resource Trends ({timeRange})</h3>
            <div className="h-64">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>

          {/* Recent Alerts and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {overview.alerts.slice(0, 5).map((alert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="text-white text-sm">{alert.message}</p>
                      <p className="text-gray-400 text-xs">{alert.server?.name || 'System'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
                {overview.alerts.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No active alerts</p>
                )}
              </div>
            </div>

            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Capacity Recommendations</h3>
              <div className="space-y-3">
                {overview.recommendations.slice(0, 3).map((rec: CapacityRecommendation, index: number) => (
                  <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{rec.resourceType.toUpperCase()}</span>
                      <span className={`text-xs ${getActionColor(rec.recommendedAction)}`}>
                        {rec.recommendedAction.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">{rec.details}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-gray-500">Current: {rec.currentUsage.toFixed(1)}%</span>
                      <span className="text-gray-500">Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
                {overview.recommendations.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No recommendations available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Trends Analysis</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="h-96">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Server Selection */}
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Select Servers to Compare</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {servers.map((server) => (
                <label key={server.id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={selectedServers.includes(server.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServers([...selectedServers, server.id]);
                      } else {
                        setSelectedServers(selectedServers.filter(id => id !== server.id));
                      }
                    }}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-white">{server.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    server.status === 'RUNNING' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {server.status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Comparison Results */}
          {comparisons.length > 0 && (
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Server Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 pb-3">Server</th>
                      <th className="text-right text-gray-400 pb-3">Avg CPU</th>
                      <th className="text-right text-gray-400 pb-3">Peak CPU</th>
                      <th className="text-right text-gray-400 pb-3">Avg Memory</th>
                      <th className="text-right text-gray-400 pb-3">Peak Memory</th>
                      <th className="text-right text-gray-400 pb-3">Avg Disk</th>
                      <th className="text-right text-gray-400 pb-3">Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((comp, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-3 text-white">{comp.serverName}</td>
                        <td className="py-3 text-right text-blue-400">{comp.avgCpu.toFixed(1)}%</td>
                        <td className="py-3 text-right text-blue-300">{comp.peakCpu.toFixed(1)}%</td>
                        <td className="py-3 text-right text-green-400">{comp.avgMemory.toFixed(1)}%</td>
                        <td className="py-3 text-right text-green-300">{comp.peakMemory.toFixed(1)}%</td>
                        <td className="py-3 text-right text-purple-400">{comp.avgDisk.toFixed(1)}%</td>
                        <td className="py-3 text-right text-gray-300">{formatUptime(comp.uptime * 24)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="glass-card">
          <h3 className="text-lg font-semibold text-white mb-4">Alert Management</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {thresholds.map((threshold, index) => (
              <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-white font-medium mb-3">{threshold.resourceType.toUpperCase()} Alerts</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Warning Threshold</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={threshold.warningThreshold}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        min="0"
                        max="100"
                        readOnly
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Critical Threshold</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={threshold.criticalThreshold}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        min="0"
                        max="100"
                        readOnly
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={threshold.duration}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      min="1"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Enabled</span>
                    <div className={`w-10 h-6 rounded-full ${threshold.enabled ? 'bg-green-500' : 'bg-gray-600'} relative transition-colors`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${threshold.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Capacity Planning Recommendations</h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{rec.resourceType.toUpperCase()} Analysis</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(rec.recommendedAction)} bg-opacity-20`}>
                        {rec.recommendedAction.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{rec.details}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Current Usage</span>
                        <p className="text-white font-medium">{rec.currentUsage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Predicted (30d)</span>
                        <p className="text-white font-medium">{rec.predictedUsage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Time to Threshold</span>
                        <p className="text-white font-medium">
                          {rec.timeToThreshold === Infinity ? '∞' : `${Math.round(rec.timeToThreshold)}d`}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Confidence</span>
                        <p className="text-white font-medium">{(rec.confidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No recommendations available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Gather more historical data to generate capacity planning recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}