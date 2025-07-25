import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import Layout from '@/components/Layout';
import { serversApi } from '@/lib/api';
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CommandLineIcon,
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

interface ConsoleMessage {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warning' | 'command';
}

export default function ConsolePage() {
  const { user } = useAuth();
  const { socket, connected } = useWebSocket();
  const router = useRouter();
  const { serverId } = router.query;
  
  const [server, setServer] = useState<any>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    players: 0,
    status: 'unknown'
  });
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serverId && typeof serverId === 'string') {
      loadServerData(serverId);
    }
  }, [serverId]);

  useEffect(() => {
    if (socket && server && connected) {
      // Join server console room
      socket.emit('console:join', { serverId: server.id });

      // Listen for console output
      socket.on('console:output', (data: { message: string; timestamp: string }) => {
        addConsoleMessage(data.message, 'info');
      });

      // Listen for server metrics
      socket.on('server:metrics', (data: any) => {
        if (data.serverId === server.id) {
          setMetrics({
            cpu: data.cpu || 0,
            memory: data.memory || 0,
            players: data.players || 0,
            status: data.status || 'unknown'
          });
        }
      });

      return () => {
        socket.off('console:output');
        socket.off('server:metrics');
        socket.emit('console:leave', { serverId: server.id });
      };
    }
  }, [socket, server, connected]);

  useEffect(() => {
    // Auto-scroll console to bottom
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleMessages]);

  const loadServerData = async (serverId: string) => {
    try {
      setLoading(true);
      const response = await serversApi.getById(serverId);
      if (response.data.success && response.data.data) {
        setServer(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load server:', error);
    } finally {
      setLoading(false);
    }
  };

  const addConsoleMessage = (message: string, type: 'info' | 'error' | 'warning' | 'command' = 'info') => {
    setConsoleMessages(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message,
      type
    }]);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !server || !socket) return;

    // Add command to console
    addConsoleMessage(`> ${command}`, 'command');

    // Send command to server
    socket.emit('console:command', {
      serverId: server.id,
      command: command.trim()
    });

    setCommand('');
  };

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!server) return;

    try {
      addConsoleMessage(`Executing ${action} command...`, 'info');
      
      switch (action) {
        case 'start':
          await serversApi.start(server.id);
          break;
        case 'stop':
          await serversApi.stop(server.id);
          break;
        case 'restart':
          await serversApi.restart(server.id);
          break;
      }
    } catch (error) {
      addConsoleMessage(`Failed to ${action} server: ${error}`, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'text-green-400';
      case 'starting': return 'text-yellow-400';
      case 'stopping': return 'text-orange-400';
      case 'offline':
      case 'stopped': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMessageTypeStyle = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'command': return 'text-blue-400 font-semibold';
      default: return 'text-gray-300';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading server console...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!server) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <ServerIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Server Not Found</h2>
            <p className="text-gray-400">The requested server could not be found.</p>
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
                  <CommandLineIcon className="w-6 h-6 text-panel-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{server.name}</h1>
                  <p className="text-gray-400">Console & Monitoring</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${server.status === 'RUNNING' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                  {server.status}
                </span>
                {connected && (
                  <div className="flex items-center space-x-1 ml-4">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">CPU Usage</p>
                  <p className="text-2xl font-bold text-white">{metrics.cpu.toFixed(1)}%</p>
                </div>
                <CpuChipIcon className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Memory</p>
                  <p className="text-2xl font-bold text-white">{metrics.memory}MB</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Players</p>
                  <p className="text-2xl font-bold text-white">{metrics.players}</p>
                </div>
                <ServerIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Status</p>
                  <p className={`text-2xl font-bold ${getStatusColor(metrics.status)}`}>
                    {metrics.status}
                  </p>
                </div>
                <div className={`h-8 w-8 rounded-full ${server.status === 'RUNNING' ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
            </div>
          </div>

          {/* Console and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Console */}
            <div className="lg:col-span-3 glass-card rounded-xl overflow-hidden">
              <div className="bg-panel-darker p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Console Output</h3>
              </div>
              
              <div 
                ref={consoleRef}
                className="h-96 overflow-y-auto bg-black/50 p-4 font-mono text-sm"
              >
                {consoleMessages.map((msg, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`ml-2 ${getMessageTypeStyle(msg.type)}`}>
                      {msg.message}
                    </span>
                  </div>
                ))}
                {consoleMessages.length === 0 && (
                  <div className="text-gray-400 text-center py-8">
                    Console output will appear here...
                  </div>
                )}
              </div>
              
              <form onSubmit={handleCommand} className="p-4 bg-panel-darker border-t border-white/10">
                <div className="flex space-x-2">
                  <span className="text-gray-400 font-mono">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter console command..."
                    className="flex-1 bg-transparent text-white font-mono outline-none"
                    disabled={!connected || server.status !== 'RUNNING'}
                  />
                </div>
              </form>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Server Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleServerAction('start')}
                    disabled={server.status === 'RUNNING'}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>Start</span>
                  </button>
                  
                  <button
                    onClick={() => handleServerAction('stop')}
                    disabled={server.status !== 'RUNNING'}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <StopIcon className="h-4 w-4" />
                    <span>Stop</span>
                  </button>
                  
                  <button
                    onClick={() => handleServerAction('restart')}
                    disabled={server.status !== 'RUNNING'}
                    className="w-full flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Restart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
