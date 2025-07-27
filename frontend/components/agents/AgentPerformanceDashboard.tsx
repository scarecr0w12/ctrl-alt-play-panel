import React, { useState, useEffect } from 'react';
import {
  CpuChipIcon,
  CloudIcon,
  ComputerDesktopIcon,
  SignalIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AgentMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  uptime: number;
  loadAverage: number[];
  timestamp: Date;
}

interface MetricHistory {
  timestamp: Date;
  value: number;
}

interface AgentPerformanceDashboardProps {
  nodeUuid: string;
  metrics: AgentMetrics | null;
  isOnline: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  percentage?: number;
  warning?: boolean;
  description?: string;
}

function MetricCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color, 
  trend, 
  percentage, 
  warning,
  description 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return ArrowTrendingUpIcon;
    if (trend === 'down') return ArrowTrendingDownIcon;
    return null;
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className={`glass-card rounded-xl p-4 ${warning ? 'border border-yellow-500/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold text-white">
                {typeof value === 'number' ? value.toFixed(1) : value}
              </p>
              {unit && <span className="text-sm text-gray-400">{unit}</span>}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {(trend || warning) && (
          <div className="flex items-center space-x-1">
            {warning && (
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
            )}
            {TrendIcon && (
              <TrendIcon className={`w-4 h-4 ${
                trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`} />
            )}
          </div>
        )}
      </div>
      
      {percentage !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                percentage > 90 ? 'bg-red-400' :
                percentage > 70 ? 'bg-yellow-400' :
                'bg-green-400'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% used</p>
        </div>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AgentPerformanceDashboard({ 
  nodeUuid, 
  metrics, 
  isOnline,
  className = '' 
}: AgentPerformanceDashboardProps) {
  const [historicalData, setHistoricalData] = useState<Map<string, MetricHistory[]>>(new Map());

  useEffect(() => {
    if (metrics) {
      // Update historical data for trending
      setHistoricalData(prev => {
        const newData = new Map(prev);
        const timestamp = new Date();
        
        // Store last 20 data points for each metric
        const updateMetric = (key: string, value: number) => {
          const history = newData.get(key) || [];
          history.push({ timestamp, value });
          if (history.length > 20) history.shift();
          newData.set(key, history);
        };

        updateMetric('cpu', metrics.cpu);
        updateMetric('memory', metrics.memory.percentage);
        updateMetric('disk', metrics.disk.percentage);
        
        return newData;
      });
    }
  }, [metrics]);

  const getTrend = (metricKey: string): 'up' | 'down' | 'stable' => {
    const history = historicalData.get(metricKey);
    if (!history || history.length < 2) return 'stable';
    
    const recent = history.slice(-3);
    const avg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;
    const previous = history.slice(-6, -3);
    const prevAvg = previous.length > 0 ? 
      previous.reduce((sum, h) => sum + h.value, 0) / previous.length : avg;
    
    const diff = avg - prevAvg;
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  if (!isOnline) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <ComputerDesktopIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Agent Offline</h3>
          <p className="text-gray-400">
            Performance metrics are not available when the agent is offline.
          </p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`glass-card rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4 h-24"></div>
            ))}
          </div>
          <div className="bg-white/5 rounded-lg p-4 h-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu}
          unit="%"
          icon={CpuChipIcon}
          color="bg-blue-500/20"
          trend={getTrend('cpu')}
          percentage={metrics.cpu}
          warning={metrics.cpu > 85}
          description={`Load: ${metrics.loadAverage?.[0]?.toFixed(2) || 'N/A'}`}
        />
        
        <MetricCard
          title="Memory"
          value={formatBytes(metrics.memory.used)}
          icon={CloudIcon}
          color="bg-green-500/20"
          trend={getTrend('memory')}
          percentage={metrics.memory.percentage}
          warning={metrics.memory.percentage > 90}
          description={`${formatBytes(metrics.memory.total)} total`}
        />
        
        <MetricCard
          title="Disk Usage"
          value={formatBytes(metrics.disk.used)}
          icon={ComputerDesktopIcon}
          color="bg-purple-500/20"
          trend={getTrend('disk')}
          percentage={metrics.disk.percentage}
          warning={metrics.disk.percentage > 95}
          description={`${formatBytes(metrics.disk.total)} total`}
        />
        
        <MetricCard
          title="Uptime"
          value={formatUptime(metrics.uptime)}
          icon={ClockIcon}
          color="bg-orange-500/20"
          description={`Since ${new Date(Date.now() - metrics.uptime * 1000).toLocaleDateString()}`}
        />
      </div>

      {/* Network Activity */}
      {metrics.network && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-4">
            <SignalIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Network Activity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Bytes In</span>
                <span className="text-lg font-semibold text-green-400">
                  {formatBytes(metrics.network.bytesIn)}
                </span>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Bytes Out</span>
                <span className="text-lg font-semibold text-blue-400">
                  {formatBytes(metrics.network.bytesOut)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Load Average */}
      {metrics.loadAverage && metrics.loadAverage.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">System Load Average</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {['1m', '5m', '15m'].map((period, index) => (
              <div key={period} className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-400">{period}</p>
                <p className="text-xl font-bold text-white">
                  {metrics.loadAverage[index]?.toFixed(2) || '0.00'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Last updated: {metrics.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'Never'}
        </p>
      </div>
    </div>
  );
}
