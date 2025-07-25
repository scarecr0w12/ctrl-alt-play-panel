import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { serversApi } from '@/lib/api';
import {
  ArrowLeftIcon,
  ServerIcon,
  CogIcon,
  PlayIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Ctrl {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  alts?: Alt[];
  _count?: {
    alts: number;
  };
}

interface AltVariable {
  id: string;
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  userViewable: boolean;
  userEditable: boolean;
  rules: string;
}

interface Alt {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  author: string;
  dockerImages: any;
  startup: string;
  configFiles: any;
  configStartup: any;
  configLogs: any;
  configStop?: string;
  scriptInstall?: string;
  scriptEntry: string;
  scriptContainer: string;
  copyScriptFrom?: string;
  features?: any;
  fileDenylist?: any;
  forceOutgoingIp: boolean;
  createdAt: string;
  updatedAt: string;
  ctrlId: string;
  ctrl?: Ctrl;
  variables?: AltVariable[];
  _count?: {
    servers: number;
  };
}

export default function CreateServerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [ctrls, setCtrls] = useState<Ctrl[]>([]);
  const [selectedCtrl, setSelectedCtrl] = useState<Ctrl | null>(null);
  const [alts, setAlts] = useState<Alt[]>([]);
  const [selectedAlt, setSelectedAlt] = useState<Alt | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Server configuration
  const [serverConfig, setServerConfig] = useState({
    name: '',
    description: '',
    memory: 1024,
    disk: 10240,
    ports: '',
    environment: {} as Record<string, string>,
  });

  useEffect(() => {
    loadCtrls();
  }, []);

  useEffect(() => {
    if (selectedCtrl) {
      loadAlts(selectedCtrl.id);
    }
  }, [selectedCtrl]);

  useEffect(() => {
    if (selectedAlt) {
      // Initialize environment variables with defaults
      const env: Record<string, string> = {};
      selectedAlt.variables?.forEach(variable => {
        if (variable.userViewable) {
          env[variable.envVariable] = variable.defaultValue;
        }
      });
      setServerConfig(prev => ({ ...prev, environment: env }));
    }
  }, [selectedAlt]);

  const loadCtrls = async () => {
    try {
      setLoading(true);
      const response = await serversApi.getCategories();
      if (response.data.success) {
        setCtrls(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load Ctrls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlts = async (ctrlId: string) => {
    try {
      const response = await serversApi.getTemplates(ctrlId);
      if (response.data.success) {
        setAlts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load Alts:', error);
    }
  };

  const handleCreateServer = async () => {
    if (!selectedAlt) return;

    try {
      setCreating(true);
      
      const response = await serversApi.create({
        name: serverConfig.name,
        description: serverConfig.description,
        altId: selectedAlt.id,
        nodeId: 'default', // TODO: Add node selection
        memory: serverConfig.memory,
        disk: serverConfig.disk,
        cpu: 100, // Default CPU limit
      });

      if (response.data.success) {
        router.push(`/servers/${response.data.data?.id}`);
      }
    } catch (error) {
      console.error('Failed to create server:', error);
      alert('Failed to create server. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Choose a Category</h2>
            
            {ctrls.length === 0 ? (
              <div className="text-center py-12">
                <CogIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Categories Available</h3>
                <p className="text-gray-400 mb-4">
                  No server categories have been configured yet.
                </p>
                <button
                  onClick={() => router.push('/ctrls')}
                  className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Manage Categories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ctrls.map((ctrl) => (
                  <div
                    key={ctrl.id}
                    onClick={() => {
                      setSelectedCtrl(ctrl);
                      setStep(2);
                    }}
                    className={`glass-card rounded-lg p-6 cursor-pointer transition-all hover:scale-105 border-2 ${
                      selectedCtrl?.id === ctrl.id ? 'border-panel-primary' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-panel-primary/20 rounded-lg flex items-center justify-center">
                        <CogIcon className="w-5 h-5 text-panel-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{ctrl.name}</h3>
                        <p className="text-sm text-gray-400">{ctrl._count?.alts || 0} configurations</p>
                      </div>
                    </div>
                    
                    {ctrl.description && (
                      <p className="text-sm text-gray-300">{ctrl.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={() => setStep(1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white">Choose a Configuration</h2>
                <p className="text-gray-400">Category: {selectedCtrl?.name}</p>
              </div>
            </div>
            
            {alts.length === 0 ? (
              <div className="text-center py-12">
                <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Configurations Available</h3>
                <p className="text-gray-400 mb-4">
                  No server configurations found in this category.
                </p>
                <button
                  onClick={() => router.push('/ctrls')}
                  className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Import Configurations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setSelectedAlt(alt);
                      setStep(3);
                    }}
                    className={`glass-card rounded-lg p-6 cursor-pointer transition-all hover:scale-105 border-2 ${
                      selectedAlt?.id === alt.id ? 'border-panel-primary' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{alt.name}</h3>
                        <p className="text-sm text-gray-400">by {alt.author}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{alt._count?.servers || 0} servers</p>
                        <p className="text-xs text-gray-400">{alt.variables?.filter(v => v.userViewable).length || 0} variables</p>
                      </div>
                    </div>
                    
                    {alt.description && (
                      <p className="text-sm text-gray-300 mb-3">{alt.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Updated {new Date(alt.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400">Ready</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <button
                onClick={() => setStep(2)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white">Configure Server</h2>
                <p className="text-gray-400">Using: {selectedAlt?.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Settings */}
              <div className="space-y-6">
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Server Name *
                      </label>
                      <input
                        type="text"
                        value={serverConfig.name}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Awesome Server"
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={serverConfig.description}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional server description"
                        rows={3}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Resource Limits</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Memory (MB)
                      </label>
                      <input
                        type="number"
                        value={serverConfig.memory}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, memory: parseInt(e.target.value) }))}
                        min="512"
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Disk Space (MB)
                      </label>
                      <input
                        type="number"
                        value={serverConfig.disk}
                        onChange={(e) => setServerConfig(prev => ({ ...prev, disk: parseInt(e.target.value) }))}
                        min="1024"
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ports (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={serverConfig.ports}
                      onChange={(e) => setServerConfig(prev => ({ ...prev, ports: e.target.value }))}
                      placeholder="25565, 25575"
                      className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                    />
                  </div>
                </div>
              </div>
              
              {/* Environment Variables */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Environment Variables</h3>
                
                {selectedAlt?.variables?.filter(v => v.userViewable).length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No configurable variables</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedAlt?.variables
                      ?.filter(variable => variable.userViewable)
                      .map((variable) => (
                        <div key={variable.id} className="bg-panel-surface/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <label className="block text-sm font-medium text-white">
                                {variable.name}
                                {!variable.userEditable && (
                                  <span className="text-xs text-gray-400 ml-2">(read-only)</span>
                                )}
                              </label>
                              {variable.description && (
                                <p className="text-xs text-gray-400 mt-1">{variable.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <input
                            type="text"
                            value={serverConfig.environment[variable.envVariable] || ''}
                            onChange={(e) => {
                              if (variable.userEditable) {
                                setServerConfig(prev => ({
                                  ...prev,
                                  environment: {
                                    ...prev.environment,
                                    [variable.envVariable]: e.target.value,
                                  },
                                }));
                              }
                            }}
                            disabled={!variable.userEditable}
                            className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-panel-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder={variable.defaultValue}
                          />
                          
                          {variable.rules && (
                            <p className="text-xs text-gray-500 mt-1 font-mono">{variable.rules}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateServer}
                disabled={creating || !serverConfig.name.trim()}
                className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                <span>{creating ? 'Creating...' : 'Create Server'}</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-panel-primary mx-auto mb-4"></div>
            <p className="text-white">Loading configurations...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface">
        <div className="max-w-6xl mx-auto p-6">
          
          {/* Header */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/servers')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Server</h1>
                  <p className="text-gray-400">Set up a new game server using pre-configured templates</p>
                </div>
              </div>
              
              {/* Progress Steps */}
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum 
                        ? 'bg-panel-primary text-white' 
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-8 h-0.5 ${
                        step > stepNum ? 'bg-panel-primary' : 'bg-gray-600'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="glass-card rounded-xl p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
