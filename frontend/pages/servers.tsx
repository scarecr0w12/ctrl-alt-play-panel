import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import Layout from '@/components/Layout';
import ProtectedRoute, { PermissionGuard } from '@/components/PermissionGuard';
import { serversApi } from '@/lib/api';
import {
  ServerIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

interface Server {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  status: 'installing' | 'install_failed' | 'suspended' | 'offline' | 'starting' | 'running' | 'stopping' | 'crashed';
  memory: number;
  disk: number;
  cpu: number;
  user: {
    username: string;
  };
  node: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

function ServersPage() {
  const { isAdmin } = useAuth();
  const { hasPermission } = usePermissions();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await serversApi.getAll();
      if (response.data.success) {
        setServers(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart' | 'kill') => {
    try {
      setActionLoading(serverId);
      
      let response;
      switch (action) {
        case 'start':
          response = await serversApi.start(serverId);
          break;
        case 'stop':
          response = await serversApi.stop(serverId);
          break;
        case 'restart':
          response = await serversApi.restart(serverId);
          break;
        case 'kill':
          response = await serversApi.kill(serverId);
          break;
      }

      if (response.data.success) {
        // Refresh servers list
        await loadServers();
      }
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      running: { label: 'Running', color: 'text-green-400', bgColor: 'bg-green-400/10' },
      offline: { label: 'Offline', color: 'text-red-400', bgColor: 'bg-red-400/10' },
      starting: { label: 'Starting', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
      stopping: { label: 'Stopping', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
      crashed: { label: 'Crashed', color: 'text-red-500', bgColor: 'bg-red-500/10' },
      installing: { label: 'Installing', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
      install_failed: { label: 'Install Failed', color: 'text-red-600', bgColor: 'bg-red-600/10' },
      suspended: { label: 'Suspended', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-400', bgColor: 'bg-gray-400/10' };
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const formatDisk = (bytes: number) => {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const canStart = (status: string) => ['offline', 'crashed', 'stopping'].includes(status);
  const canStop = (status: string) => ['running', 'starting'].includes(status);
  const canRestart = (status: string) => ['running'].includes(status);

  return (
    <Layout title="Servers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Servers</h1>
            <p className="text-gray-400 mt-1">Manage your game servers</p>
          </div>
          
          {isAdmin && (
            <button className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>Create Server</span>
            </button>
          )}
        </div>

        {/* Servers List */}
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-white/10 rounded w-32"></div>
                          <div className="h-3 bg-white/5 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-white/10 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Server
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Node
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {servers.map((server) => {
                    const statusInfo = formatStatus(server.status);
                    return (
                      <tr key={server.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                              <ServerIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{server.name}</p>
                              <p className="text-sm text-gray-400">{server.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div>
                            <p>RAM: {formatMemory(server.memory)}</p>
                            <p>Disk: {formatDisk(server.disk)}</p>
                            <p>CPU: {server.cpu}%</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {server.user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {server.node.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Quick Actions */}
                            <PermissionGuard permission="servers.start">
                              {canStart(server.status) && (
                                <button
                                  onClick={() => handleServerAction(server.id, 'start')}
                                  disabled={actionLoading === server.id}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Start Server"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                              )}
                            </PermissionGuard>
                            
                            <PermissionGuard permission="servers.stop">
                              {canStop(server.status) && (
                                <button
                                  onClick={() => handleServerAction(server.id, 'stop')}
                                  disabled={actionLoading === server.id}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Stop Server"
                                >
                                  <StopIcon className="w-4 h-4" />
                                </button>
                              )}
                            </PermissionGuard>
                            
                            <PermissionGuard permission="servers.restart">
                              {canRestart(server.status) && (
                                <button
                                  onClick={() => handleServerAction(server.id, 'restart')}
                                  disabled={actionLoading === server.id}
                                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Restart Server"
                                >
                                  <ArrowPathIcon className="w-4 h-4" />
                                </button>
                              )}
                            </PermissionGuard>

                            {/* More Actions Menu */}
                            <Menu as="div" className="relative">
                              <Menu.Button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </Menu.Button>
                              <Menu.Items className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg ring-1 ring-white/10 focus:outline-none z-10">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ? 'bg-white/10' : ''
                                        } group flex items-center w-full px-4 py-2 text-sm text-white`}
                                      >
                                        View Console
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ? 'bg-white/10' : ''
                                        } group flex items-center w-full px-4 py-2 text-sm text-white`}
                                      >
                                        Manage Files
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ? 'bg-white/10' : ''
                                        } group flex items-center w-full px-4 py-2 text-sm text-white`}
                                      >
                                        View Metrics
                                      </button>
                                    )}
                                  </Menu.Item>
                                  {isAdmin && (
                                    <>
                                      <div className="border-t border-white/10 my-1"></div>
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            className={`${
                                              active ? 'bg-red-600/10' : ''
                                            } group flex items-center w-full px-4 py-2 text-sm text-red-400`}
                                          >
                                            <TrashIcon className="w-4 h-4 mr-2" />
                                            Delete Server
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </>
                                  )}
                                </div>
                              </Menu.Items>
                            </Menu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {servers.length === 0 && (
                <div className="text-center py-12">
                  <ServerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No servers found</h3>
                  <p className="text-gray-400 mb-6">
                    {isAdmin 
                      ? "Create your first server to get started with game hosting."
                      : "You don't have any servers yet. Contact an administrator to get started."
                    }
                  </p>
                  {isAdmin && (
                    <button className="btn-primary">
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Create Server
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Wrap the component with permission protection
const ProtectedServersPage = () => {
  return (
    <ProtectedRoute permission="servers.view">
      <ServersPage />
    </ProtectedRoute>
  );
};

export default ProtectedServersPage;
