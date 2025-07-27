import React, { useState, useEffect } from 'react';
import {
  ComputerDesktopIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CpuChipIcon,
  CloudIcon,
  SignalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ServerInfo {
  id: string;
  name: string;
  ctrlName: string;
  altName: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'ERROR';
  memory: number;
  disk: number;
  cpu: number;
  players: {
    online: number;
    max: number;
  };
  version: string;
  port: number;
  uptime: number;
  lastSeen: Date;
}

interface AgentServerManagementProps {
  nodeUuid: string;
  agentName: string;
  isOnline: boolean;
  className?: string;
}

interface ServerActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: ServerInfo | null;
  action: 'start' | 'stop' | 'restart' | 'view' | 'configure';
  onConfirm: (serverId: string, action: string) => Promise<boolean>;
}

function ServerActionModal({ isOpen, onClose, server, action, onConfirm }: ServerActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!server) return;
    
    setLoading(true);
    setError('');
    
    try {
      const success = await onConfirm(server.id, action);
      if (success) {
        onClose();
      } else {
        setError(`Failed to ${action} server`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} server`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !server) return null;

  const getActionInfo = () => {
    switch (action) {
      case 'start':
        return {
          title: 'Start Server',
          description: `Are you sure you want to start "${server.name}"?`,
          confirmText: 'Start Server',
          confirmClass: 'btn-primary',
          icon: PlayIcon,
          iconColor: 'text-green-400',
        };
      case 'stop':
        return {
          title: 'Stop Server',
          description: `Are you sure you want to stop "${server.name}"? This will disconnect all players.`,
          confirmText: 'Stop Server',
          confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
          icon: StopIcon,
          iconColor: 'text-red-400',
        };
      case 'restart':
        return {
          title: 'Restart Server',
          description: `Are you sure you want to restart "${server.name}"? This will temporarily disconnect all players.`,
          confirmText: 'Restart Server',
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: ArrowPathIcon,
          iconColor: 'text-yellow-400',
        };
      default:
        return {
          title: 'Server Action',
          description: '',
          confirmText: 'Confirm',
          confirmClass: 'btn-primary',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-gray-400',
        };
    }
  };

  const actionInfo = getActionInfo();
  const ActionIcon = actionInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center`}>
            <ActionIcon className={`w-5 h-5 ${actionInfo.iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-white">{actionInfo.title}</h3>
        </div>
        
        <p className="text-gray-400 mb-6">{actionInfo.description}</p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${actionInfo.confirmClass}`}
          >
            {loading ? 'Processing...' : actionInfo.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServerCard({ server, onAction }: { server: ServerInfo; onAction: (server: ServerInfo, action: string) => void }) {
  const getStatusIcon = () => {
    switch (server.status) {
      case 'RUNNING':
        return { icon: CheckCircleIcon, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'STOPPED':
        return { icon: XCircleIcon, color: 'text-red-400', bg: 'bg-red-400/10' };
      case 'STARTING':
      case 'STOPPING':
        return { icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
      case 'ERROR':
        return { icon: ExclamationTriangleIcon, color: 'text-red-400', bg: 'bg-red-400/10' };
      default:
        return { icon: XCircleIcon, color: 'text-gray-400', bg: 'bg-gray-400/10' };
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const statusInfo = getStatusIcon();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${statusInfo.bg} rounded-lg flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
          <div>
            <h4 className="font-semibold text-white">{server.name}</h4>
            <p className="text-sm text-gray-400">{server.ctrlName} • {server.altName}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                {server.status}
              </span>
              {server.status === 'RUNNING' && (
                <span className="text-xs text-gray-500">
                  Up {formatUptime(server.uptime)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {server.status === 'STOPPED' && (
            <button
              onClick={() => onAction(server, 'start')}
              className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
              title="Start Server"
            >
              <PlayIcon className="w-4 h-4 text-green-400" />
            </button>
          )}
          
          {server.status === 'RUNNING' && (
            <>
              <button
                onClick={() => onAction(server, 'restart')}
                className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors"
                title="Restart Server"
              >
                <ArrowPathIcon className="w-4 h-4 text-yellow-400" />
              </button>
              <button
                onClick={() => onAction(server, 'stop')}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Stop Server"
              >
                <StopIcon className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
          
          <button
            onClick={() => onAction(server, 'view')}
            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4 text-blue-400" />
          </button>
          
          <button
            onClick={() => onAction(server, 'configure')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Configure"
          >
            <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <CpuChipIcon className="w-3 h-3 text-blue-400" />
              <span className="text-gray-400">CPU</span>
            </div>
            <span className="text-white font-medium">{server.cpu}%</span>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <CloudIcon className="w-3 h-3 text-green-400" />
              <span className="text-gray-400">RAM</span>
            </div>
            <span className="text-white font-medium">{server.memory}MB</span>
          </div>
        </div>
      </div>

      {/* Players and Port */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Players</span>
            <span className="text-white font-medium">
              {server.players.online}/{server.players.max}
            </span>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Port</span>
            <span className="text-white font-medium">{server.port}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentServerManagement({ nodeUuid, agentName, isOnline, className = '' }: AgentServerManagementProps) {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: 'start' | 'stop' | 'restart' | 'view' | 'configure';
  }>({ isOpen: false, action: 'view' });

  useEffect(() => {
    if (isOnline) {
      loadServers();
    }
  }, [isOnline, nodeUuid]);

  const loadServers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/agents/${nodeUuid}/servers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServers(data.data);
        } else {
          setError('Failed to load servers');
        }
      } else {
        setError('Failed to communicate with agent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const handleServerAction = (server: ServerInfo, action: string) => {
    setSelectedServer(server);
    setActionModal({ 
      isOpen: true, 
      action: action as 'start' | 'stop' | 'restart' | 'view' | 'configure' 
    });
  };

  const executeServerAction = async (serverId: string, action: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${nodeUuid}/servers/${serverId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Reload servers to get updated status
          await loadServers();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Server action failed:', error);
      return false;
    }
  };

  const closeModal = () => {
    setActionModal({ isOpen: false, action: 'view' });
    setSelectedServer(null);
  };

  if (!isOnline) {
    return (
      <div className={`glass-card rounded-xl p-8 text-center ${className}`}>
        <ComputerDesktopIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Agent Offline</h3>
        <p className="text-gray-400">
          Cannot manage servers when the agent is offline. Check agent connection.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <ComputerDesktopIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Server Management</h3>
            <p className="text-sm text-gray-400">
              Manage servers running on {agentName}
            </p>
          </div>
        </div>
        
        <button
          onClick={loadServers}
          disabled={loading}
          className="btn-secondary disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
            <button
              onClick={loadServers}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Servers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/10 rounded w-32"></div>
                  <div className="h-3 bg-white/5 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-white/5 rounded"></div>
                <div className="h-8 bg-white/5 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <ComputerDesktopIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Servers Found</h3>
          <p className="text-gray-400 mb-6">
            This agent doesn't have any servers configured or they're not responding.
          </p>
          <button
            onClick={loadServers}
            className="btn-primary"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh Servers
          </button>
        </div>
      ) : (
        <>
          {/* Server Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <ComputerDesktopIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-white">{servers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Running</p>
                  <p className="text-xl font-bold text-white">
                    {servers.filter(s => s.status === 'RUNNING').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Stopped</p>
                  <p className="text-xl font-bold text-white">
                    {servers.filter(s => s.status === 'STOPPED').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <SignalIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Players</p>
                  <p className="text-xl font-bold text-white">
                    {servers.reduce((sum, s) => sum + s.players.online, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Servers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map(server => (
              <ServerCard
                key={server.id}
                server={server}
                onAction={handleServerAction}
              />
            ))}
          </div>
        </>
      )}

      {/* Action Modal */}
      <ServerActionModal
        isOpen={actionModal.isOpen}
        onClose={closeModal}
        server={selectedServer}
        action={actionModal.action}
        onConfirm={executeServerAction}
      />
    </div>
  );
}
