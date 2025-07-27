import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  WifiIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

interface DiscoveryCandidate {
  nodeUuid: string;
  nodeName: string;
  baseUrl: string;
  status: 'discovering' | 'found' | 'failed' | 'registered';
  lastChecked: Date;
  agentInfo?: {
    version: string;
    nodeId: string;
    capabilities: string[];
    connected: boolean;
  };
  error?: string;
}

interface DiscoveryConfig {
  enabled: boolean;
  interval: number; // in minutes
  ports: number[];
  protocols: string[];
  timeout: number; // in seconds
}

interface AgentDiscoveryProps {
  onRegisterAgent: (nodeUuid: string, baseUrl: string, apiKey?: string) => Promise<boolean>;
  className?: string;
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  enabled: true,
  interval: 5,
  ports: [8080, 8081, 3001, 8000],
  protocols: ['http', 'https'],
  timeout: 5,
};

export default function AgentDiscovery({ onRegisterAgent, className = '' }: AgentDiscoveryProps) {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [config, setConfig] = useState<DiscoveryConfig>(DEFAULT_CONFIG);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [lastDiscovery, setLastDiscovery] = useState<Date | null>(null);
  const [autoDiscoveryTimer, setAutoDiscoveryTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-discovery effect
  useEffect(() => {
    if (config.enabled && config.interval > 0) {
      const timer = setInterval(() => {
        runDiscovery();
      }, config.interval * 60 * 1000);
      
      setAutoDiscoveryTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      if (autoDiscoveryTimer) {
        clearInterval(autoDiscoveryTimer);
        setAutoDiscoveryTimer(null);
      }
    }
  }, [config.enabled, config.interval]);

  const runDiscovery = async () => {
    setIsDiscovering(true);
    setLastDiscovery(new Date());
    
    try {
      const response = await fetch('/api/agents/discover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Get discovery results
        const candidatesResponse = await fetch('/api/agents/discovery-candidates', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (candidatesResponse.ok) {
          const data = await candidatesResponse.json();
          if (data.success) {
            setCandidates(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRegisterCandidate = async (candidate: DiscoveryCandidate) => {
    const success = await onRegisterAgent(candidate.nodeUuid, candidate.baseUrl);
    
    if (success) {
      setCandidates(prev => prev.map(c => 
        c.nodeUuid === candidate.nodeUuid 
          ? { ...c, status: 'registered' }
          : c
      ));
    }
  };

  const handleConfigUpdate = (newConfig: Partial<DiscoveryConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getStatusIcon = (status: DiscoveryCandidate['status']) => {
    switch (status) {
      case 'discovering':
        return ClockIcon;
      case 'found':
        return CheckCircleIcon;
      case 'failed':
        return XCircleIcon;
      case 'registered':
        return CheckCircleIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const getStatusColor = (status: DiscoveryCandidate['status']) => {
    switch (status) {
      case 'discovering':
        return 'text-yellow-400';
      case 'found':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'registered':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Discovery Controls */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Agent Discovery</h3>
              <p className="text-sm text-gray-400">
                Automatically discover agents on your network nodes
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Discovery Settings"
            >
              <CogIcon className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleConfigUpdate({ enabled: !config.enabled })}
              className={`p-2 rounded-lg transition-colors ${
                config.enabled 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              }`}
              title={config.enabled ? 'Disable Auto-Discovery' : 'Enable Auto-Discovery'}
            >
              {config.enabled ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
            
            <button
              onClick={runDiscovery}
              disabled={isDiscovering}
              className="btn-primary disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
              {isDiscovering ? 'Discovering...' : 'Discover Now'}
            </button>
          </div>
        </div>

        {/* Discovery Configuration */}
        {showConfig && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-4">
            <h4 className="text-sm font-semibold text-white">Discovery Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Interval (minutes)</label>
                <input
                  type="number"
                  value={config.interval}
                  onChange={(e) => handleConfigUpdate({ interval: parseInt(e.target.value) || 5 })}
                  className="input-field w-full text-sm"
                  min="1"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Timeout (seconds)</label>
                <input
                  type="number"
                  value={config.timeout}
                  onChange={(e) => handleConfigUpdate({ timeout: parseInt(e.target.value) || 5 })}
                  className="input-field w-full text-sm"
                  min="1"
                  max="30"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ports (comma-separated)</label>
                <input
                  type="text"
                  value={config.ports.join(', ')}
                  onChange={(e) => {
                    const ports = e.target.value
                      .split(',')
                      .map(p => parseInt(p.trim()))
                      .filter(p => !isNaN(p) && p > 0 && p < 65536);
                    handleConfigUpdate({ ports });
                  }}
                  className="input-field w-full text-sm"
                  placeholder="8080, 8081, 3001"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Protocols</label>
                <select
                  multiple
                  value={config.protocols}
                  onChange={(e) => {
                    const protocols = Array.from(e.target.selectedOptions, option => option.value);
                    handleConfigUpdate({ protocols });
                  }}
                  className="input-field w-full text-sm h-16"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Discovery Status */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="text-gray-400">
                Auto-discovery {config.enabled ? 'enabled' : 'disabled'}
              </span>
            </div>
            
            {config.enabled && (
              <span className="text-gray-400">
                Every {config.interval} minutes
              </span>
            )}
          </div>
          
          {lastDiscovery && (
            <span className="text-gray-400">
              Last discovery: {formatRelativeTime(lastDiscovery)}
            </span>
          )}
        </div>
      </div>

      {/* Discovery Results */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Discovery Results</h3>
            <span className="text-sm text-gray-400">
              {candidates.length} candidates found
            </span>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="p-8 text-center">
            <WifiIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Agents Discovered</h3>
            <p className="text-gray-400 mb-4">
              No agents have been discovered yet. Run a discovery scan to find available agents.
            </p>
            <button
              onClick={runDiscovery}
              disabled={isDiscovering}
              className="btn-primary disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Start Discovery
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {candidates.map((candidate) => {
              const StatusIcon = getStatusIcon(candidate.status);
              const statusColor = getStatusColor(candidate.status);

              return (
                <div key={candidate.nodeUuid} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center`}>
                        <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                      </div>
                      
                      <div>
                        <h4 className="text-white font-medium">{candidate.nodeName}</h4>
                        <p className="text-sm text-gray-400">{candidate.baseUrl}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full bg-white/5 ${statusColor}`}>
                            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(candidate.lastChecked)}
                          </span>
                          {candidate.agentInfo?.version && (
                            <span className="text-xs text-gray-500">
                              v{candidate.agentInfo.version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {candidate.agentInfo && (
                        <button
                          className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4 text-blue-400" />
                        </button>
                      )}
                      
                      {candidate.status === 'found' && (
                        <button
                          onClick={() => handleRegisterCandidate(candidate)}
                          className="btn-sm btn-primary"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Register
                        </button>
                      )}
                    </div>
                  </div>

                  {candidate.error && (
                    <div className="mt-3 p-2 bg-red-500/10 rounded-lg">
                      <p className="text-sm text-red-400">
                        {candidate.error}
                      </p>
                    </div>
                  )}

                  {candidate.agentInfo && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Node ID:</span>
                          <span className="text-white ml-2">{candidate.agentInfo.nodeId}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Connected:</span>
                          <span className={`ml-2 ${candidate.agentInfo.connected ? 'text-green-400' : 'text-red-400'}`}>
                            {candidate.agentInfo.connected ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Version:</span>
                          <span className="text-white ml-2">{candidate.agentInfo.version}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Capabilities:</span>
                          <span className="text-white ml-2">{candidate.agentInfo.capabilities.length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
