import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { altsApi, ctrlsApi } from '@/lib/api';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Ctrl {
  id: string;
  name: string;
  description?: string;
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
  ctrlId: string;
  ctrl?: Ctrl;
  variables?: AltVariable[];
}

export default function AltEditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [alt, setAlt] = useState<Alt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    author: '',
    startup: '',
    configStop: '',
    scriptInstall: '',
    scriptEntry: '',
    scriptContainer: '',
    copyScriptFrom: '',
    forceOutgoingIp: false,
    dockerImages: '{}',
    configFiles: '{}',
    configStartup: '{}',
    configLogs: '{}',
    features: '{}',
    fileDenylist: '{}',
  });

  const [variables, setVariables] = useState<AltVariable[]>([]);
  const [newVariable, setNewVariable] = useState({
    name: '',
    description: '',
    envVariable: '',
    defaultValue: '',
    userViewable: true,
    userEditable: true,
    rules: '',
  });

  useEffect(() => {
    if (id) {
      loadAlt();
    }
  }, [id]);

  const loadAlt = async () => {
    try {
      setLoading(true);
      const response = await altsApi.getById(id as string);
      if (response.data.success && response.data.data) {
        const altData = response.data.data;
        setAlt(altData);
        setVariables(altData.variables || []);
        
        // Populate form
        setFormData({
          name: altData.name || '',
          description: altData.description || '',
          author: altData.author || '',
          startup: altData.startup || '',
          configStop: altData.configStop || '',
          scriptInstall: altData.scriptInstall || '',
          scriptEntry: altData.scriptEntry || '',
          scriptContainer: altData.scriptContainer || '',
          copyScriptFrom: altData.copyScriptFrom || '',
          forceOutgoingIp: altData.forceOutgoingIp || false,
          dockerImages: JSON.stringify(altData.dockerImages || {}, null, 2),
          configFiles: JSON.stringify(altData.configFiles || {}, null, 2),
          configStartup: JSON.stringify(altData.configStartup || {}, null, 2),
          configLogs: JSON.stringify(altData.configLogs || {}, null, 2),
          features: JSON.stringify(altData.features || {}, null, 2),
          fileDenylist: JSON.stringify(altData.fileDenylist || {}, null, 2),
        });
      }
    } catch (error) {
      console.error('Failed to load Alt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!alt) return;

    try {
      setSaving(true);
      
      // Parse JSON fields
      const updateData = {
        ...formData,
        dockerImages: JSON.parse(formData.dockerImages),
        configFiles: JSON.parse(formData.configFiles),
        configStartup: JSON.parse(formData.configStartup),
        configLogs: JSON.parse(formData.configLogs),
        features: JSON.parse(formData.features),
        fileDenylist: JSON.parse(formData.fileDenylist),
      };

      const response = await altsApi.update(alt.id, updateData);
      if (response.data.success) {
        setUnsavedChanges(false);
        // Show success message
      }
    } catch (error) {
      console.error('Failed to save Alt:', error);
      alert('Failed to save Alt. Please check JSON syntax.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!alt) return;

    try {
      const response = await altsApi.export(alt.id);
      if (response.data.success) {
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${alt.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export Alt:', error);
    }
  };

  const handleAddVariable = () => {
    if (!newVariable.name || !newVariable.envVariable) return;

    const variable: AltVariable = {
      id: `temp-${Date.now()}`,
      ...newVariable,
    };

    setVariables([...variables, variable]);
    setNewVariable({
      name: '',
      description: '',
      envVariable: '',
      defaultValue: '',
      userViewable: true,
      userEditable: true,
      rules: '',
    });
    setUnsavedChanges(true);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
    setUnsavedChanges(true);
  };

  const handleUpdateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-panel-primary mx-auto mb-4"></div>
            <p className="text-white">Loading configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!alt) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Configuration Not Found</h2>
            <p className="text-gray-400 mb-4">The requested Alt configuration could not be found.</p>
            <button
              onClick={() => router.push('/ctrls')}
              className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Configurations
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'scripts', name: 'Scripts', icon: DocumentArrowUpIcon },
    { id: 'config', name: 'Configuration', icon: DocumentArrowDownIcon },
    { id: 'variables', name: 'Variables', icon: PlusIcon },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/ctrls')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">{alt.name}</h1>
                  <p className="text-gray-400">by {alt.author} • {alt.ctrl?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {unsavedChanges && (
                  <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>Unsaved changes</span>
                  </div>
                )}
                
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Export</span>
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="border-b border-white/10">
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-panel-primary border-b-2 border-panel-primary bg-panel-primary/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleUpdateFormData('name', e.target.value)}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Author *
                      </label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => handleUpdateFormData('author', e.target.value)}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleUpdateFormData('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white focus:outline-none focus:border-panel-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Startup Command *
                    </label>
                    <textarea
                      value={formData.startup}
                      onChange={(e) => handleUpdateFormData('startup', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                      placeholder="java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="forceOutgoingIp"
                      checked={formData.forceOutgoingIp}
                      onChange={(e) => handleUpdateFormData('forceOutgoingIp', e.target.checked)}
                      className="mr-2 h-4 w-4 text-panel-primary rounded border-gray-300 focus:ring-panel-primary"
                    />
                    <label htmlFor="forceOutgoingIp" className="text-sm text-gray-300">
                      Force outgoing IP
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'scripts' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Install Script
                    </label>
                    <textarea
                      value={formData.scriptInstall}
                      onChange={(e) => handleUpdateFormData('scriptInstall', e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                      placeholder="#!/bin/bash&#10;# Installation script"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Entry Script *
                      </label>
                      <input
                        type="text"
                        value={formData.scriptEntry}
                        onChange={(e) => handleUpdateFormData('scriptEntry', e.target.value)}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder="./start.sh"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Container Script *
                      </label>
                      <input
                        type="text"
                        value={formData.scriptContainer}
                        onChange={(e) => handleUpdateFormData('scriptContainer', e.target.value)}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder="./entrypoint.sh"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Stop Command
                      </label>
                      <input
                        type="text"
                        value={formData.configStop}
                        onChange={(e) => handleUpdateFormData('configStop', e.target.value)}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder="stop"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Copy Script From
                      </label>
                      <input
                        type="text"
                        value={formData.copyScriptFrom}
                        onChange={(e) => handleUpdateFormData('copyScriptFrom', e.target.value)}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder="another-alt-uuid"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Docker Images
                      </label>
                      <textarea
                        value={formData.dockerImages}
                        onChange={(e) => handleUpdateFormData('dockerImages', e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder='{"java8": "openjdk:8-jre-slim"}'
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Config Files
                      </label>
                      <textarea
                        value={formData.configFiles}
                        onChange={(e) => handleUpdateFormData('configFiles', e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder='{"server.properties": {"parser": "properties"}}'
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Config Startup
                      </label>
                      <textarea
                        value={formData.configStartup}
                        onChange={(e) => handleUpdateFormData('configStartup', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder='{"done": "Server started"}'
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Config Logs
                      </label>
                      <textarea
                        value={formData.configLogs}
                        onChange={(e) => handleUpdateFormData('configLogs', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder='{"custom": true, "location": "logs/latest.log"}'
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Features
                      </label>
                      <textarea
                        value={formData.features}
                        onChange={(e) => handleUpdateFormData('features', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder='{"fastdl": false, "eula": true}'
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        File Deny List
                      </label>
                      <textarea
                        value={formData.fileDenylist}
                        onChange={(e) => handleUpdateFormData('fileDenylist', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-panel-primary"
                        placeholder='["*.log", "temp/*"]'
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'variables' && (
                <div className="space-y-6">
                  {/* Add Variable Form */}
                  <div className="bg-panel-surface/30 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Add Variable</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Variable Name"
                        value={newVariable.name}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 bg-panel-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-panel-primary"
                      />
                      <input
                        type="text"
                        placeholder="Environment Variable"
                        value={newVariable.envVariable}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, envVariable: e.target.value }))}
                        className="px-3 py-2 bg-panel-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-panel-primary"
                      />
                      <input
                        type="text"
                        placeholder="Default Value"
                        value={newVariable.defaultValue}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, defaultValue: e.target.value }))}
                        className="px-3 py-2 bg-panel-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-panel-primary"
                      />
                      <button
                        onClick={handleAddVariable}
                        disabled={!newVariable.name || !newVariable.envVariable}
                        className="px-4 py-2 bg-panel-primary hover:bg-panel-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                      >
                        Add Variable
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <textarea
                        placeholder="Description"
                        value={newVariable.description}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="px-3 py-2 bg-panel-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-panel-primary"
                      />
                      <input
                        type="text"
                        placeholder="Validation Rules"
                        value={newVariable.rules}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, rules: e.target.value }))}
                        className="px-3 py-2 bg-panel-surface border border-white/20 rounded text-white text-sm focus:outline-none focus:border-panel-primary"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={newVariable.userViewable}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, userViewable: e.target.checked }))}
                          className="mr-2 h-4 w-4 text-panel-primary rounded border-gray-300"
                        />
                        User Viewable
                      </label>
                      <label className="flex items-center text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={newVariable.userEditable}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, userEditable: e.target.checked }))}
                          className="mr-2 h-4 w-4 text-panel-primary rounded border-gray-300"
                        />
                        User Editable
                      </label>
                    </div>
                  </div>

                  {/* Variables List */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Variables ({variables.length})
                    </h3>
                    
                    {variables.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No variables defined for this Alt.</p>
                        <p className="text-sm mt-1">Add variables above to configure server options.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {variables.map((variable, index) => (
                          <div key={variable.id} className="bg-panel-surface/50 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                                  <div>
                                    <p className="text-sm font-medium text-white">{variable.name}</p>
                                    <p className="text-xs text-gray-400">Name</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-mono text-gray-300">{variable.envVariable}</p>
                                    <p className="text-xs text-gray-400">Environment Variable</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-300">{variable.defaultValue || '(empty)'}</p>
                                    <p className="text-xs text-gray-400">Default Value</p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                      variable.userViewable ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {variable.userViewable ? 'Viewable' : 'Hidden'}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                      variable.userEditable ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {variable.userEditable ? 'Editable' : 'Read-only'}
                                    </span>
                                  </div>
                                </div>
                                
                                {variable.description && (
                                  <p className="text-sm text-gray-400 mb-2">{variable.description}</p>
                                )}
                                
                                {variable.rules && (
                                  <p className="text-xs font-mono text-gray-500">Rules: {variable.rules}</p>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleRemoveVariable(index)}
                                className="ml-4 p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
