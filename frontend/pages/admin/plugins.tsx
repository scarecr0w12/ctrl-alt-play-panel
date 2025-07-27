import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlusIcon, 
  CogIcon, 
  TrashIcon, 
  PlayIcon, 
  StopIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'UPDATING';
  permissions: Record<string, boolean>;
  autoUpdate: boolean;
  versionLocked: boolean;
  installedAt: string;
  lastUpdated?: string;
}

interface PluginFormData {
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: {
    routes: boolean;
    database: boolean;
    filesystem: boolean;
    network: boolean;
  };
}

const PluginsAdminPage = () => {
  const { user } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState<PluginFormData>({
    name: '',
    version: '1.0.0',
    author: user?.username || '',
    description: '',
    permissions: {
      routes: false,
      database: false,
      filesystem: false,
      network: false
    }
  });

  // Fetch plugins
  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plugins');
      if (!response.ok) throw new Error('Failed to fetch plugins');
      const data = await response.json();
      setPlugins(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plugins');
    } finally {
      setLoading(false);
    }
  };

  // Enable plugin
  const enablePlugin = async (pluginName: string) => {
    try {
      const response = await fetch(`/api/plugins/${pluginName}/enable`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to enable plugin');
      await fetchPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable plugin');
    }
  };

  // Disable plugin
  const disablePlugin = async (pluginName: string) => {
    try {
      const response = await fetch(`/api/plugins/${pluginName}/disable`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to disable plugin');
      await fetchPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable plugin');
    }
  };

  // Uninstall plugin
  const uninstallPlugin = async (pluginName: string) => {
    if (!confirm(`Are you sure you want to uninstall "${pluginName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/plugins/${pluginName}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to uninstall plugin');
      await fetchPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to uninstall plugin');
    }
  };

  const getStatusIcon = (status: Plugin['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'INACTIVE':
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
      case 'ERROR':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'UPDATING':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: Plugin['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'INACTIVE':
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
      case 'ERROR':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      case 'UPDATING':
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You need to be logged in to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Plugin Management - Ctrl+Alt+Play</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Plugin Management</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    Manage and configure plugins for your game panel
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/admin/marketplace'}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <MagnifyingGlassIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Browse Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/admin/plugin-guide'}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <DocumentCheckIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Development Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Install Plugin
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <span className="sr-only">Dismiss</span>
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plugins Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          {[
            { name: 'Total Plugins', value: plugins.length, color: 'blue' },
            { name: 'Active', value: plugins.filter(p => p.status === 'ACTIVE').length, color: 'green' },
            { name: 'Inactive', value: plugins.filter(p => p.status === 'INACTIVE').length, color: 'gray' },
            { name: 'Errors', value: plugins.filter(p => p.status === 'ERROR').length, color: 'red' },
          ].map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-md bg-${stat.color}-500 flex items-center justify-center`}>
                      <span className="text-sm font-medium text-white">{stat.value}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Plugins List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Installed Plugins</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage your installed plugins and their configurations.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : plugins.length === 0 ? (
            <div className="text-center py-12">
              <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by installing your first plugin.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Install Plugin
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {plugins.map((plugin) => (
                <li key={plugin.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0 mr-4">
                        {getStatusIcon(plugin.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {plugin.name}
                          </p>
                          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(plugin.status)}`}>
                            {plugin.status}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-500">
                            v{plugin.version} by {plugin.author}
                          </p>
                          {plugin.description && (
                            <span className="mx-2 text-gray-300">•</span>
                          )}
                          {plugin.description && (
                            <p className="text-sm text-gray-500 truncate">
                              {plugin.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlugin(plugin);
                          setShowDetails(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <InformationCircleIcon className="h-5 w-5" />
                      </button>
                      {plugin.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => disablePlugin(plugin.name)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <StopIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => enablePlugin(plugin.name)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => uninstallPlugin(plugin.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Plugin Details Modal */}
        {showDetails && selectedPlugin && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedPlugin.name} Details
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Version</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlugin.version}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Author</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlugin.author}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(selectedPlugin.status)}`}>
                      {selectedPlugin.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Installed</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPlugin.installedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {selectedPlugin.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlugin.description}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <div className="mt-2 space-y-1">
                    {Object.entries(selectedPlugin.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {key}: {value ? 'Granted' : 'Denied'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedPlugin(null);
                  }}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Install Plugin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Install Plugin</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Use the CLI tools to create and install plugins.
                </p>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">CLI Commands</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="font-mono bg-gray-800 text-green-400 p-2 rounded">
                        npm run plugin:create my-plugin
                      </div>
                      <div className="font-mono bg-gray-800 text-green-400 p-2 rounded">
                        npm run plugin:install ./plugins/my-plugin
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      <DocumentCheckIcon className="h-5 w-5 inline mr-1" />
                      Documentation
                    </h4>
                    <p className="text-sm text-blue-800">
                      See the Plugin SDK documentation for detailed development guide.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    fetchPlugins();
                  }}
                  className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Refresh Plugins
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PluginsAdminPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  };
};
