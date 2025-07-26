import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { nodesApi, serversApi, altsApi } from '@/lib/api';
import {
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  CogIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

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

interface AltVariable {
  id: string;
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  userViewable: boolean;
  userEditable: boolean;
  rules: string;
  createdAt: string;
  updatedAt: string;
  altId: string;
}

export default function CtrlsPage() {
  const { user } = useAuth();
  const [ctrls, setCtrls] = useState<Ctrl[]>([]);
  const [selectedCtrl, setSelectedCtrl] = useState<Ctrl | null>(null);
  const [alts, setAlts] = useState<Alt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCtrl, setShowCreateCtrl] = useState(false);
  const [showImportAlt, setShowImportAlt] = useState(false);
  const [newCtrlName, setNewCtrlName] = useState('');
  const [newCtrlDescription, setNewCtrlDescription] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    loadCtrls();
  }, []);

  useEffect(() => {
    if (selectedCtrl) {
      loadAlts(selectedCtrl.id);
    }
  }, [selectedCtrl]);

  const loadCtrls = async () => {
    try {
      setLoading(true);
      const response = await nodesApi.getAll();
      if (response.data.success) {
        setCtrls(response.data.data || []);
        if (response.data.data && response.data.data.length > 0 && !selectedCtrl) {
          setSelectedCtrl(response.data.data[0]);
        }
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

  const handleCreateCtrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCtrlName.trim()) return;

    try {
      const response = await nodesApi.create({
        name: newCtrlName.trim(),
        description: newCtrlDescription.trim() || undefined,
      });

      if (response.data.success) {
        await loadCtrls();
        setNewCtrlName('');
        setNewCtrlDescription('');
        setShowCreateCtrl(false);
      }
    } catch (error) {
      console.error('Failed to create Ctrl:', error);
    }
  };

  const handleDeleteCtrl = async (ctrlId: string, ctrlName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${ctrlName}"? This will also delete all associated server configurations.`)) {
      return;
    }

    try {
      await nodesApi.delete(ctrlId);
      await loadCtrls();
      if (selectedCtrl?.id === ctrlId) {
        setSelectedCtrl(ctrls.find(c => c.id !== ctrlId) || null);
      }
    } catch (error) {
      console.error('Failed to delete Ctrl:', error);
    }
  };

  const handleImportAlt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || !selectedCtrl) return;

    try {
      const fileContent = await importFile.text();
      const eggData = JSON.parse(fileContent);

      // Import the Alt using the new API endpoint
      const response = await altsApi.import(selectedCtrl.id, eggData);
      
      if (response.data.success) {
        await loadAlts(selectedCtrl.id);
        setImportFile(null);
        setShowImportAlt(false);
        alert(`Successfully imported Alt: ${response.data.data.name}`);
      }
    } catch (error) {
      console.error('Failed to import Alt:', error);
      alert('Failed to import Alt. Please check the file format.');
    }
  };

  const handleExportAlt = async (altId: string, altName: string) => {
    try {
      // Export the Alt using the new API endpoint
      const response = await altsApi.export(altId);
      
      if (response.data) {
        // Create and download the file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${altName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export Alt:', error);
      alert('Failed to export Alt.');
    }
  };
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${altName.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Alt:', error);
    }
  };

  const handleCloneAlt = async (altId: string, newName: string) => {
    try {
      const response = await altsApi.clone(altId, newName);
      
      if (response.data.success && selectedCtrl) {
        await loadAlts(selectedCtrl.id);
        alert(`Successfully cloned Alt as: ${newName}`);
      }
    } catch (error) {
      console.error('Failed to clone Alt:', error);
      alert('Failed to clone Alt.');
    }
  };

  const handleDeleteAlt = async (altId: string, altName: string) => {
    if (!confirm(`Are you sure you want to delete the configuration "${altName}"?`)) {
      return;
    }

    try {
      // Template delete functionality would need to be implemented
      // await serversApi.deleteTemplate(altId);
      if (selectedCtrl) {
        await loadAlts(selectedCtrl.id);
      }
    } catch (error) {
      console.error('Failed to delete Alt:', error);
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
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-panel-primary/20 rounded-lg flex items-center justify-center">
                  <CogIcon className="w-6 h-6 text-panel-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Server Configurations</h1>
                  <p className="text-gray-400">Manage server categories (Ctrls) and configurations (Alts)</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateCtrl(true)}
                  className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Category</span>
                </button>
                
                {selectedCtrl && (
                  <button
                    onClick={() => setShowImportAlt(true)}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <DocumentArrowUpIcon className="h-4 w-4" />
                    <span>Import Alt</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="bg-panel-darker p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Categories (Ctrls)</h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {ctrls.length === 0 ? (
                    <div className="p-6 text-center">
                      <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No categories found</p>
                      <button
                        onClick={() => setShowCreateCtrl(true)}
                        className="mt-2 text-panel-primary hover:text-panel-primary/80 text-sm"
                      >
                        Create your first category
                      </button>
                    </div>
                  ) : (
                    ctrls.map((ctrl) => (
                      <div
                        key={ctrl.id}
                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                          selectedCtrl?.id === ctrl.id ? 'bg-panel-primary/20' : 'hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedCtrl(ctrl)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FolderIcon className="h-5 w-5 text-panel-primary" />
                            <div>
                              <p className="font-medium text-white">{ctrl.name}</p>
                              <p className="text-xs text-gray-400">
                                {ctrl._count?.alts || 0} configuration(s)
                              </p>
                            </div>
                          </div>
                          
                          <Menu as="div" className="relative">
                            <Menu.Button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 mt-1 w-32 bg-panel-surface border border-white/20 rounded-lg shadow-lg z-10">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`w-full text-left px-3 py-2 text-sm ${
                                      active ? 'bg-white/10 text-white' : 'text-gray-300'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implement edit
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4 inline mr-2" />
                                    Edit
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`w-full text-left px-3 py-2 text-sm ${
                                      active ? 'bg-red-600 text-white' : 'text-red-400'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCtrl(ctrl.id, ctrl.name);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4 inline mr-2" />
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            </Menu.Items>
                          </Menu>
                        </div>
                        
                        {ctrl.description && (
                          <p className="text-xs text-gray-500 mt-1 ml-8">{ctrl.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Configurations Main Area */}
            <div className="lg:col-span-3">
              {selectedCtrl ? (
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="bg-panel-darker p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {selectedCtrl.name} Configurations
                        </h3>
                        <p className="text-sm text-gray-400">
                          Server configuration templates (Alts) for this category
                        </p>
                      </div>
                      <button
                        onClick={() => setShowImportAlt(true)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                      >
                        <DocumentArrowUpIcon className="h-4 w-4" />
                        <span>Import</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {alts.length === 0 ? (
                      <div className="text-center py-12">
                        <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Configurations</h3>
                        <p className="text-gray-400 mb-4">
                          No server configurations found in this category.
                        </p>
                        <button
                          onClick={() => setShowImportAlt(true)}
                          className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4" />
                          <span>Import Your First Alt</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {alts.map((alt) => (
                          <div key={alt.id} className="bg-panel-surface/50 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-white">{alt.name}</h4>
                                <p className="text-sm text-gray-400">by {alt.author}</p>
                                {alt.version && (
                                  <p className="text-xs text-panel-primary">v{alt.version}</p>
                                )}
                              </div>
                              
                              <Menu as="div" className="relative">
                                <Menu.Button className="p-1 hover:bg-white/10 rounded">
                                  <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
                                </Menu.Button>
                                <Menu.Items className="absolute right-0 mt-1 w-36 bg-panel-surface border border-white/20 rounded-lg shadow-lg z-10">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`w-full text-left px-3 py-2 text-sm ${
                                          active ? 'bg-white/10 text-white' : 'text-gray-300'
                                        }`}
                                        onClick={() => handleExportAlt(alt.id, alt.name)}
                                      >
                                        <DocumentArrowDownIcon className="h-4 w-4 inline mr-2" />
                                        Export
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`w-full text-left px-3 py-2 text-sm ${
                                          active ? 'bg-white/10 text-white' : 'text-gray-300'
                                        }`}
                                        onClick={() => {
                                          // TODO: Navigate to edit page
                                        }}
                                      >
                                        <PencilIcon className="h-4 w-4 inline mr-2" />
                                        Edit
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`w-full text-left px-3 py-2 text-sm ${
                                          active ? 'bg-white/10 text-white' : 'text-gray-300'
                                        }`}
                                        onClick={() => {
                                          const newName = prompt(`Clone "${alt.name}" as:`, `${alt.name} Copy`);
                                          if (newName) {
                                            handleCloneAlt(alt.id, newName);
                                          }
                                        }}
                                      >
                                        <ServerIcon className="h-4 w-4 inline mr-2" />
                                        Clone
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`w-full text-left px-3 py-2 text-sm ${
                                          active ? 'bg-red-600 text-white' : 'text-red-400'
                                        }`}
                                        onClick={() => handleDeleteAlt(alt.id, alt.name)}
                                      >
                                        <TrashIcon className="h-4 w-4 inline mr-2" />
                                        Delete
                                      </button>
                                    )}
                                  </Menu.Item>
                                </Menu.Items>
                              </Menu>
                            </div>
                            
                            {alt.description && (
                              <p className="text-sm text-gray-300 mb-3">{alt.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>{alt._count?.servers || 0} servers</span>
                              <span>{alt.variables?.length || 0} variables</span>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-xs text-gray-500">
                                Updated {new Date(alt.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-12 text-center">
                  <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Category</h3>
                  <p className="text-gray-400">
                    Choose a category from the sidebar to view its server configurations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Category Modal */}
        {showCreateCtrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Category</h3>
              
              <form onSubmit={handleCreateCtrl} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCtrlName}
                    onChange={(e) => setNewCtrlName(e.target.value)}
                    placeholder="e.g., Minecraft, Discord Bots, Web Servers"
                    className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCtrlDescription}
                    onChange={(e) => setNewCtrlDescription(e.target.value)}
                    placeholder="Optional description for this category"
                    rows={3}
                    className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCtrl(false);
                      setNewCtrlName('');
                      setNewCtrlDescription('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-panel-primary hover:bg-panel-primary/80 text-white rounded-lg transition-colors"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Alt Modal */}
        {showImportAlt && selectedCtrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass-card rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Import Alt to {selectedCtrl.name}
              </h3>
              
              <form onSubmit={handleImportAlt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Alt JSON File *
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-panel-primary file:text-white hover:file:bg-panel-primary/80"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Upload a Pterodactyl-compatible egg JSON file
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportAlt(false);
                      setImportFile(null);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Import Alt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
