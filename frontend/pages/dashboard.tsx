import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { serversApi, monitoringApi, healthApi } from '@/lib/api';
import {
  ServerIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalServers: number;
  runningServers: number;
  totalUsers: number;
  systemUptime: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    runningServers: 0,
    totalUsers: 0,
    systemUptime: '0h 0m',
  });
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load servers
      const serversResponse = await serversApi.getAll();
      if (serversResponse.data.success) {
        const serverList = serversResponse.data.data || [];
        setServers(serverList);
        
        setStats(prev => ({
          ...prev,
          totalServers: serverList.length,
          runningServers: serverList.filter(s => s.status === 'running').length,
        }));
      }
      
      // Load health info
      const healthResponse = await healthApi.check();
      if (healthResponse.data.uptime) {
        const uptimeHours = Math.floor(healthResponse.data.uptime / 3600);
        const uptimeMinutes = Math.floor((healthResponse.data.uptime % 3600) / 60);
        setStats(prev => ({
          ...prev,
          systemUptime: `${uptimeHours}h ${uptimeMinutes}m`,
        }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      running: { label: 'Running', color: 'text-green-400' },
      offline: { label: 'Offline', color: 'text-red-400' },
      starting: { label: 'Starting', color: 'text-yellow-400' },
      stopping: { label: 'Stopping', color: 'text-orange-400' },
      crashed: { label: 'Crashed', color: 'text-red-500' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-400' };
  };

  return (
    <ProtectedRoute>
      <Layout title="Dashboard">
        <div className="space-y-6">
        {/* Welcome Message */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-400 mt-1">
                Here's what's happening with your servers.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="status-indicator status-online" />
                <span className="text-sm text-gray-400">Panel Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Servers */}
          <div className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Servers</p>
                <p className="text-2xl font-bold text-white">{stats.totalServers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <ServerIcon className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-400 text-sm">
                {stats.runningServers} running
              </span>
            </div>
          </div>

          {/* Running Servers */}
          <div className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Running Servers</p>
                <p className="text-2xl font-bold text-white">{stats.runningServers}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-400 text-sm">
                {((stats.runningServers / Math.max(stats.totalServers, 1)) * 100).toFixed(0)}% uptime
              </span>
            </div>
          </div>

          {/* System Uptime */}
          <div className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Uptime</p>
                <p className="text-2xl font-bold text-white">{stats.systemUptime}</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-400 text-sm">Healthy</span>
            </div>
          </div>

          {/* Users */}
          <div className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-green-400 text-sm">Online now</span>
            </div>
          </div>
        </div>

        {/* Recent Servers */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Recent Servers</h3>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-32"></div>
                      <div className="h-3 bg-white/5 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-white/10 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {servers.slice(0, 5).map((server) => {
                const statusInfo = formatStatus(server.status);
                return (
                  <div
                    key={server.id}
                    className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-white">{server.name}</p>
                        <p className="text-sm text-gray-400">
                          {server.user?.username} • {server.node?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })}
              
              {servers.length === 0 && (
                <div className="text-center py-8">
                  <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No servers found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create your first server to get started
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white">System health check completed</span>
              </div>
              <span className="text-sm text-gray-400">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white">Server backup completed</span>
              </div>
              <span className="text-sm text-gray-400">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-white">User {user?.username} logged in</span>
              </div>
              <span className="text-sm text-gray-400">Just now</span>
            </div>
          </div>
        </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}