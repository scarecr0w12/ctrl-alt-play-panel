import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useAgents } from '@/hooks/useAgents';
import { ExternalAgent, agentsApi } from '@/lib/api';
import {
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CogIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  CloudIcon,
  SignalIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

interface RegisterAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (nodeUuid: string, baseUrl: string, apiKey?: string) => Promise<boolean>;
}

interface ConfigureAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: ExternalAgent | null;
  onSave: (nodeUuid: string, config: { baseUrl: string; apiKey?: string }) => Promise<boolean>;
}

interface AgentServersModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: ExternalAgent | null;
}

interface AgentDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: ExternalAgent | null;
}

interface AgentMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: ExternalAgent | null;
}

function RegisterAgentModal({ isOpen, onClose, onRegister }: RegisterAgentModalProps) {
  const [nodeUuid, setNodeUuid] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nodeUuid || !baseUrl) {
      setError('Node UUID and Base URL are required');
      return;
    }

    setLoading(true);
    try {
      const success = await onRegister(nodeUuid, baseUrl, apiKey || undefined);
      if (success) {
        setNodeUuid('');
        setBaseUrl('');
        setApiKey('');
        onClose();
      } else {
        setError('Failed to register agent - check connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Register New Agent</h3>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Node UUID *
            </label>
            <input
              type="text"
              value={nodeUuid}
              onChange={(e) => setNodeUuid(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., node-uuid-123"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base URL *
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="input-field w-full"
              placeholder="http://192.168.1.100:8080"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key (optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input-field w-full"
              placeholder="Optional authentication key"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfigureAgentModal({ isOpen, onClose, agent, onSave }: ConfigureAgentModalProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (agent) {
      setBaseUrl(agent.baseUrl || '');
      setApiKey(''); // Don't pre-fill API key for security
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    
    setError('');
    setLoading(true);
    try {
      const success = await onSave(agent.nodeUuid, { baseUrl, apiKey: apiKey || undefined });
      if (success) {
        onClose();
      } else {
        setError('Failed to update configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Configure Agent</h3>
        <p className="text-sm text-gray-400 mb-4">Agent: {agent.nodeUuid}</p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base URL *
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="input-field w-full"
              placeholder="http://192.168.1.100:8080"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key (leave empty to keep current)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input-field w-full"
              placeholder="New API key (optional)"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentServersModal({ isOpen, onClose, agent }: AgentServersModalProps) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen && agent) {
      loadServers();
    }
  }, [isOpen, agent]);

  const loadServers = async () => {
    if (!agent) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await agentsApi.getServers(agent.nodeUuid);
      if (response.data.success) {
        setServers(response.data.data);
      } else {
        setError('Failed to load servers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Servers</h3>
            <p className="text-sm text-gray-400">Servers running on {agent.nodeUuid}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8">
              <ComputerDesktopIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No servers found on this agent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server: any) => (
                <div key={server.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        server.status === 'RUNNING' ? 'bg-green-400' :
                        server.status === 'STOPPED' ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`}></div>
                      <div>
                        <h4 className="text-white font-medium">{server.name}</h4>
                        <p className="text-sm text-gray-400">{server.ctrlName} • {server.altName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{server.status}</p>
                      <p className="text-xs text-gray-400">
                        {server.memory}MB • {server.disk}MB • {server.cpu}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentDiagnosticsModal({ isOpen, onClose, agent }: AgentDiagnosticsModalProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen && agent) {
      runDiagnostics();
    }
  }, [isOpen, agent]);

  const runDiagnostics = async () => {
    if (!agent) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await agentsApi.testConnection(agent.nodeUuid);
      if (response.data.success) {
        setDiagnostics(response.data.data);
      } else {
        setError('Failed to run diagnostics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnostics failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Diagnostics</h3>
            <p className="text-sm text-gray-400">{agent.nodeUuid}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Running diagnostics...</span>
          </div>
        ) : diagnostics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${diagnostics.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-white">Connection</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {diagnostics.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <SignalIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Response Time</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {diagnostics.responseTime ? `${diagnostics.responseTime}ms` : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Diagnostic Results</h4>
              {Object.entries(diagnostics.diagnostics || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      typeof value === 'boolean' ? (value ? 'bg-green-400' : 'bg-red-400') : 'bg-blue-400'
                    }`}></div>
                    <span className="text-white">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center pt-4">
              <button
                onClick={runDiagnostics}
                className="btn-secondary"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Run Again
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AgentMetricsModal({ isOpen, onClose, agent }: AgentMetricsModalProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen && agent) {
      loadMetrics();
    }
  }, [isOpen, agent]);

  const loadMetrics = async () => {
    if (!agent) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await agentsApi.getMetrics(agent.nodeUuid);
      if (response.data.success) {
        setMetrics(response.data.data);
      } else {
        setError('Failed to load metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Metrics</h3>
            <p className="text-sm text-gray-400">{agent.nodeUuid}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading metrics...</span>
          </div>
        ) : metrics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CpuChipIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">CPU Usage</span>
                </div>
                <p className="text-lg font-semibold text-white mt-1">
                  {metrics.cpu ? `${metrics.cpu.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CloudIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">Memory</span>
                </div>
                <p className="text-lg font-semibold text-white mt-1">
                  {metrics.memory ? `${(metrics.memory / 1024 / 1024 / 1024).toFixed(1)}GB` : 'N/A'}
                </p>
              </div>
            </div>
            
            {metrics.disk && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <ComputerDesktopIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">Disk Usage</span>
                </div>
                <p className="text-lg font-semibold text-white mt-1">
                  {(metrics.disk.used / 1024 / 1024 / 1024).toFixed(1)}GB / {(metrics.disk.total / 1024 / 1024 / 1024).toFixed(1)}GB
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-400 h-2 rounded-full"
                    style={{ width: `${(metrics.disk.used / metrics.disk.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMetrics}
                className="btn-secondary"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const { isAdmin } = useAuth();
  const {
    agents,
    healthStatuses,
    loading,
    error,
    refreshAgents,
    forceDiscovery,
    registerAgent,
    unregisterAgent,
  } = useAgents();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showServersModal, setShowServersModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ExternalAgent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleUnregister = async (nodeUuid: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to unregister this agent?')) return;
    
    setActionLoading(nodeUuid);
    try {
      await unregisterAgent(nodeUuid);
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceDiscovery = async () => {
    setActionLoading('discovery');
    try {
      await forceDiscovery();
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigureAgent = (agent: ExternalAgent) => {
    setSelectedAgent(agent);
    setShowConfigModal(true);
  };

  const handleViewServers = (agent: ExternalAgent) => {
    setSelectedAgent(agent);
    setShowServersModal(true);
  };

  const handleDiagnostics = (agent: ExternalAgent) => {
    setSelectedAgent(agent);
    setShowDiagnosticsModal(true);
  };

  const handleViewMetrics = (agent: ExternalAgent) => {
    setSelectedAgent(agent);
    setShowMetricsModal(true);
  };

  const handleSaveConfig = async (nodeUuid: string, config: { baseUrl: string; apiKey?: string }) => {
    try {
      const response = await agentsApi.updateConfig(nodeUuid, config);
      if (response.data.success) {
        await refreshAgents();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const getAgentStatus = (agent: ExternalAgent) => {
    const health = healthStatuses.get(agent.nodeUuid);
    
    if (health?.status.online) {
      return {
        label: 'Online',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        icon: CheckCircleIcon,
      };
    } else if (agent.isOnline) {
      return {
        label: 'Checking...',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        icon: ClockIcon,
      };
    } else {
      return {
        label: 'Offline',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        icon: XCircleIcon,
      };
    }
  };

  const formatLastSeen = (lastSeen: string | Date) => {
    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <PermissionGuard adminOnly>
      <Layout title="Agent Management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">External Agents</h1>
              <p className="text-gray-400 mt-1">
                Manage node agents for distributed server control
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleForceDiscovery}
                disabled={actionLoading === 'discovery'}
                className="flex items-center space-x-2 btn-secondary disabled:opacity-50"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span>{actionLoading === 'discovery' ? 'Discovering...' : 'Discover'}</span>
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center space-x-2 btn-primary"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Register Agent</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <ServerIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Agents</p>
                  <p className="text-2xl font-bold text-white">{agents.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Online</p>
                  <p className="text-2xl font-bold text-white">
                    {Array.from(healthStatuses.values()).filter(h => h.status.online).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Offline</p>
                  <p className="text-2xl font-bold text-white">
                    {agents.length - Array.from(healthStatuses.values()).filter(h => h.status.online).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-red-500">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-400">{error}</span>
                <button
                  onClick={refreshAgents}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Agents List */}
          <div className="glass-card rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4 p-4 border-b border-white/10">
                        <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/10 rounded w-48"></div>
                          <div className="h-3 bg-white/5 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : agents.length === 0 ? (
              <div className="p-12 text-center">
                <ServerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Agents Found</h3>
                <p className="text-gray-400 mb-6">
                  No external agents are currently registered. Agents help manage servers on remote nodes.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleForceDiscovery}
                    className="btn-secondary"
                    disabled={actionLoading === 'discovery'}
                  >
                    {actionLoading === 'discovery' ? 'Discovering...' : 'Discover Agents'}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setShowRegisterModal(true)}
                      className="btn-primary"
                    >
                      Register Agent
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {agents.map((agent) => {
                  const status = getAgentStatus(agent);
                  const health = healthStatuses.get(agent.nodeUuid);
                  const StatusIcon = status.icon;

                  return (
                    <div key={agent.nodeUuid} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${status.bgColor} rounded-lg flex items-center justify-center`}>
                            <StatusIcon className={`w-6 h-6 ${status.color}`} />
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {agent.nodeUuid}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {agent.baseUrl}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                {status.label}
                              </span>
                              {health?.status.version && (
                                <span className="text-xs text-gray-500">
                                  v{health.status.version}
                                </span>
                              )}
                              {health?.status.responseTime && (
                                <span className="text-xs text-gray-500">
                                  {health.status.responseTime}ms
                                </span>
                              )}
                              {health?.status.serverCount !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {health.status.serverCount} servers
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                Last seen {formatLastSeen(agent.lastSeen || new Date())}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewServers(agent)}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Servers"
                          >
                            <ComputerDesktopIcon className="w-4 h-4 text-blue-400" />
                          </button>
                          
                          <button
                            onClick={() => handleViewMetrics(agent)}
                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="View Metrics"
                          >
                            <ChartBarIcon className="w-4 h-4 text-green-400" />
                          </button>
                          
                          <button
                            onClick={() => handleDiagnostics(agent)}
                            className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Run Diagnostics"
                          >
                            <WrenchScrewdriverIcon className="w-4 h-4 text-yellow-400" />
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleConfigureAgent(agent)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Configure Agent"
                            >
                              <CogIcon className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleUnregister(agent.nodeUuid)}
                              disabled={actionLoading === agent.nodeUuid}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Unregister Agent"
                            >
                              <TrashIcon className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {health?.status.error && (
                        <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                          <p className="text-sm text-red-400">
                            Error: {health.status.error}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Register Agent Modal */}
        <RegisterAgentModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onRegister={registerAgent}
        />

        {/* Configure Agent Modal */}
        <ConfigureAgentModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          agent={selectedAgent}
          onSave={handleSaveConfig}
        />

        {/* Agent Servers Modal */}
        <AgentServersModal
          isOpen={showServersModal}
          onClose={() => setShowServersModal(false)}
          agent={selectedAgent}
        />

        {/* Agent Diagnostics Modal */}
        <AgentDiagnosticsModal
          isOpen={showDiagnosticsModal}
          onClose={() => setShowDiagnosticsModal(false)}
          agent={selectedAgent}
        />

        {/* Agent Metrics Modal */}
        <AgentMetricsModal
          isOpen={showMetricsModal}
          onClose={() => setShowMetricsModal(false)}
          agent={selectedAgent}
        />
      </Layout>
    </PermissionGuard>
  );
}
