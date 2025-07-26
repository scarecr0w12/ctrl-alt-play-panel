import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ConsoleManager from '@/components/ConsoleManager';
import ServerSelectorModal from '@/components/ServerSelectorModal';
import { useNotification } from '@/contexts/NotificationContext';
import { io, Socket } from 'socket.io-client';
import {
  CommandLineIcon,
  ServerIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function ConsolePage() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [showServerSelector, setShowServerSelector] = useState(false);
  const [consoleManagerRef, setConsoleManagerRef] = useState<any>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const socketInstance = io(process.env.NODE_ENV === 'production' 
      ? 'https://dev-panel.thecgn.net' 
      : 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      },
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      addNotification('success', 'Connected to console server');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      addNotification('warning', 'Disconnected from console server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      addNotification('error', 'Failed to connect to console server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, addNotification]);

  const handleAddConsole = (serverId: string, serverName: string) => {
    if (consoleManagerRef?.addConsoleTab) {
      consoleManagerRef.addConsoleTab(serverId, serverName);
      addNotification('info', `Opened console for ${serverName}`);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400">Please log in to access the console.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface">
        <div className="max-w-7xl mx-auto p-6 h-screen flex flex-col">
          
          {/* Header */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-panel-primary/20 rounded-lg flex items-center justify-center">
                  <CommandLineIcon className="w-6 h-6 text-panel-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Server Console Management</h1>
                  <p className="text-gray-400">Real-time console access for all your servers</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-sm text-gray-400">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                
                <button
                  onClick={() => setShowServerSelector(true)}
                  className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <ServerIcon className="h-4 w-4" />
                  <span>Add Console</span>
                </button>
              </div>
            </div>
          </div>

          {/* Console Manager */}
          <div className="glass-card rounded-xl flex-1 overflow-hidden">
            <ConsoleManager
              socket={socket}
              className="h-full"
              ref={setConsoleManagerRef}
            />
          </div>

          {/* Connection Status Footer */}
          {!connected && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Connection Lost</span>
                <span className="text-gray-400">
                  - Console functionality is limited while disconnected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Server Selector Modal */}
        <ServerSelectorModal
          isOpen={showServerSelector}
          onClose={() => setShowServerSelector(false)}
          onServerSelect={handleAddConsole}
          excludeServerIds={[]} // TODO: Get active console server IDs
        />
      </div>
    </Layout>
  );
}
