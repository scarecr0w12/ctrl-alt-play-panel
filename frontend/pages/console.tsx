import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ComputerDesktopIcon, 
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ServerIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

// Dynamic import for XTermConsole to avoid SSR issues
const XTermConsole = dynamic(() => import('../components/Console').then(mod => mod.XTermConsole), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black rounded-lg">
      <div className="text-white">Loading console...</div>
    </div>
  )
});

interface Server {
  id: string;
  uuid: string;
  name: string;
  status: string;
  node: {
    id: string;
    name: string;
    uuid: string;
  };
}

interface ConsoleTab {
  serverId: string;
  serverName: string;
  serverUuid: string;
  nodeUuid: string;
  connected: boolean;
  active: boolean;
}

export default function ConsolePage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { socket, connected: socketConnected } = useSocket();
  
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [consoleTabs, setConsoleTabs] = useState<ConsoleTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showServerSelection, setShowServerSelection] = useState(false);

  // Load user's servers
  const loadServers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/servers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setServers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
      toast.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      loadServers();
    }
  }, [user, token, loadServers]);

  // Handle server selection from URL query
  useEffect(() => {
    const { serverId } = router.query;
    if (serverId && typeof serverId === 'string' && servers.length > 0) {
      const server = servers.find(s => s.id === serverId);
      if (server && !consoleTabs.find(tab => tab.serverId === serverId)) {
        openConsoleTab(server);
      }
    }
  }, [router.query, servers]);

  // Open a new console tab
  const openConsoleTab = (server: Server) => {
    // Check if tab already exists
    const existingTab = consoleTabs.find(tab => tab.serverId === server.id);
    if (existingTab) {
      setActiveTabId(server.id);
      return;
    }

    // Create new tab
    const newTab: ConsoleTab = {
      serverId: server.id,
      serverName: server.name,
      serverUuid: server.uuid,
      nodeUuid: server.node.uuid,
      connected: false,
      active: true
    };

    setConsoleTabs(prev => {
      const updated = prev.map(tab => ({ ...tab, active: false }));
      return [...updated, newTab];
    });
    setActiveTabId(server.id);
    setShowServerSelection(false);

    // Update URL
    router.push(`/console?serverId=${server.id}`, undefined, { shallow: true });
  };

  // Close console tab
  const closeConsoleTab = (serverId: string) => {
    setConsoleTabs(prev => {
      const filtered = prev.filter(tab => tab.serverId !== serverId);
      
      // If closing active tab, switch to another tab
      if (activeTabId === serverId) {
        const newActiveTab = filtered.length > 0 ? filtered[filtered.length - 1] : null;
        setActiveTabId(newActiveTab?.serverId || null);
        
        if (newActiveTab) {
          router.push(`/console?serverId=${newActiveTab.serverId}`, undefined, { shallow: true });
        } else {
          router.push('/console', undefined, { shallow: true });
        }
      }
      
      return filtered;
    });
  };

  // Switch active tab
  const switchTab = (serverId: string) => {
    setConsoleTabs(prev => 
      prev.map(tab => ({ 
        ...tab, 
        active: tab.serverId === serverId 
      }))
    );
    setActiveTabId(serverId);
    router.push(`/console?serverId=${serverId}`, undefined, { shallow: true });
  };

  // Server action handlers
  const handleServerAction = async (action: string, serverId: string) => {
    try {
      const response = await axios.post(`/api/servers/${serverId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || `Server ${action} command sent`);
      } else {
        toast.error(response.data.error || `Failed to ${action} server`);
      }
    } catch (error: any) {
      console.error(`Failed to ${action} server:`, error);
      toast.error(error.response?.data?.error || `Failed to ${action} server`);
    }
  };

  const activeTab = consoleTabs.find(tab => tab.serverId === activeTabId);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading servers...</span>
        </div>
      </Layout>
    );
  }

  // Demo: Show the console UI with mock data for screenshot
  const showDemo = process.env.NODE_ENV === 'development' && servers.length === 0;
  if (showDemo) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ComputerDesktopIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Server Console</h1>
                  <p className="text-gray-600">Real-time server console access and management</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowServerSelection(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Open Console
              </button>
            </div>
          </div>

          {/* Demo Console */}
          <div className="bg-white shadow rounded-lg">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button className="group inline-flex items-center py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                  <ServerIcon className="h-4 w-4 mr-2" />
                  Minecraft Server
                  <div className="ml-2 w-2 h-2 rounded-full bg-green-400" />
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </button>
                <button className="group inline-flex items-center py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                  <ServerIcon className="h-4 w-4 mr-2" />
                  Valheim Server
                  <div className="ml-2 w-2 h-2 rounded-full bg-green-400" />
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </button>
              </nav>
            </div>

            {/* Console Content */}
            <div className="p-6">
              {/* Console Controls */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm text-gray-600">Socket Connected</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-sm text-gray-600">Minecraft Server</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700">
                    <PlayIcon className="h-3 w-3 mr-1" />
                    Start
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700">
                    <StopIcon className="h-3 w-3 mr-1" />
                    Stop
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700">
                    <ArrowPathIcon className="h-3 w-3 mr-1" />
                    Restart
                  </button>
                </div>
              </div>

              {/* Terminal Console */}
              <div className="bg-black rounded-lg p-4 text-green-400 font-mono text-sm" style={{ height: '600px' }}>
                <div className="space-y-1">
                  <div className="text-green-400">╔═══════════════════════════════════════════════════════════════════════════════╗</div>
                  <div className="text-green-400">║                          CTRL+ALT+PLAY Server Console                        ║</div>
                  <div className="text-green-400">╚═══════════════════════════════════════════════════════════════════════════════╝</div>
                  <div></div>
                  <div className="text-cyan-400">[12:00:01] Connected to Minecraft Server console</div>
                  <div className="text-gray-400">[12:00:02] Server startup complete. Ready for connections.</div>
                  <div className="text-gray-400">[12:00:03] Player1 joined the game</div>
                  <div className="text-gray-400">[12:00:04] &lt;Player1&gt; Hello world!</div>
                  <div className="text-yellow-400">[12:00:05] AutoSave completed in 2.1s</div>
                  <div className="text-cyan-400">[12:00:06] Server running on version 1.20.1</div>
                  <div className="text-gray-400">[12:00:07] Memory usage: 2.1GB / 4.0GB</div>
                  <div className="text-gray-400">[12:00:08] Players online: 1/20</div>
                  <div></div>
                  <div className="flex">
                    <span className="text-green-400">$ </span>
                    <span className="bg-green-400 text-black w-2 h-5 animate-pulse ml-1"></span>
                  </div>
                </div>
                
                {/* Console controls overlay */}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
                    Clear
                  </button>
                  <button className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
                    Fit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ComputerDesktopIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Server Console</h1>
                <p className="text-gray-600">Real-time server console access and management</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowServerSelection(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Open Console
            </button>
          </div>
        </div>

        {/* Console Tabs */}
        {consoleTabs.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {consoleTabs.map((tab) => (
                  <button
                    key={tab.serverId}
                    onClick={() => switchTab(tab.serverId)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      tab.serverId === activeTabId
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ServerIcon className="h-4 w-4 mr-2" />
                    {tab.serverName}
                    <div className={`ml-2 w-2 h-2 rounded-full ${tab.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeConsoleTab(tab.serverId);
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </button>
                ))}
              </nav>
            </div>

            {/* Active Console */}
            {activeTab && (
              <div className="p-6">
                {/* Console Controls */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-gray-600">
                      {socketConnected ? 'Socket Connected' : 'Socket Disconnected'}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-600">{activeTab.serverName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleServerAction('start', activeTab.serverId)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                    >
                      <PlayIcon className="h-3 w-3 mr-1" />
                      Start
                    </button>
                    <button
                      onClick={() => handleServerAction('stop', activeTab.serverId)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                    >
                      <StopIcon className="h-3 w-3 mr-1" />
                      Stop
                    </button>
                    <button
                      onClick={() => handleServerAction('restart', activeTab.serverId)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <ArrowPathIcon className="h-3 w-3 mr-1" />
                      Restart
                    </button>
                  </div>
                </div>

                {/* Terminal Console */}
                <div className="bg-black rounded-lg" style={{ height: '600px' }}>
                  <XTermConsole
                    serverId={activeTab.serverUuid}
                    socket={socket}
                    connected={socketConnected}
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Console Tabs */}
        {consoleTabs.length === 0 && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No console sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a server to open a console session.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowServerSelection(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Open Console
              </button>
            </div>
          </div>
        )}

        {/* Server Selection Modal */}
        {showServerSelection && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Select Server</h3>
                  <button
                    onClick={() => setShowServerSelection(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {servers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No servers available</p>
                  ) : (
                    servers.map((server) => (
                      <button
                        key={server.id}
                        onClick={() => openConsoleTab(server)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{server.name}</p>
                            <p className="text-sm text-gray-500">{server.node.name}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              server.status === 'RUNNING' 
                                ? 'bg-green-100 text-green-800'
                                : server.status === 'STOPPED' || server.status === 'OFFLINE'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {server.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
