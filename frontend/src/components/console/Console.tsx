/**
 * Real-time Console Component
 * Frontend implementation for the console system
 * Inspired by Pterodactyl and Pelican Panel interfaces
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Play, Square, RotateCcw, Settings, Download } from 'lucide-react';

interface ConsoleMessage {
  id: string;
  timestamp: number;
  type: 'output' | 'input' | 'error' | 'system' | 'warning';
  content: string;
  server_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

interface ConsoleProps {
  serverId: string;
  sessionId?: string;
  className?: string;
}

export type { ConsoleMessage, ConsoleProps };

export const Console: React.FC<ConsoleProps> = ({ 
  serverId, 
  sessionId, 
  className = '' 
}) => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [command, setCommand] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'starting' | 'stopping'>('offline');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [resourceUsage, setResourceUsage] = useState({
    memory: 0,
    cpu: 0,
    disk_io: 0,
    network_io: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:8081`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Console WebSocket connected');
        
        // Join session if provided
        if (sessionId) {
          ws.send(JSON.stringify({
            type: 'join_session',
            sessionId
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Console WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('Console WebSocket error:', error);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [sessionId]);

  const handleWebSocketMessage = (data: unknown) => {
    const message = data as { type: string; [key: string]: unknown };

    switch (message.type) {
      case 'console_message': {
        const consoleMessage = message.message as ConsoleMessage;
        setMessages(prev => [...prev, consoleMessage]);
        
        // Update resource usage if included
        if (consoleMessage.metadata?.resource_usage) {
          setResourceUsage(consoleMessage.metadata.resource_usage as typeof resourceUsage);
        }
        break;
      }

      case 'server_status': {
        setServerStatus(message.status as typeof serverStatus);
        break;
      }

      case 'session_joined': {
        const sessionData = message.session as {
          command_history: string[];
          server_status: string;
        };
        setCommandHistory(sessionData.command_history || []);
        setServerStatus(sessionData.server_status as typeof serverStatus);
        break;
      }

      case 'error': {
        console.error('Console error:', message.message);
        break;
      }

      case 'pong': {
        // Handle ping/pong for connection health
        break;
      }
    }
  };

  const executeCommand = useCallback(() => {
    if (!command.trim() || !isConnected || !wsRef.current) {
      return;
    }

    // Send command to backend
    wsRef.current.send(JSON.stringify({
      type: 'execute_command',
      sessionId,
      command: command.trim()
    }));

    // Update command history
    setCommandHistory(prev => {
      const newHistory = [...prev, command.trim()];
      return newHistory.slice(-100); // Keep last 100 commands
    });

    // Clear input and reset history index
    setCommand('');
    setHistoryIndex(-1);
  }, [command, isConnected, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        executeCommand();
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 
            ? commandHistory.length - 1 
            : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex] || '');
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setCommand('');
          } else {
            setHistoryIndex(newIndex);
            setCommand(commandHistory[newIndex] || '');
          }
        }
        break;

      case 'Tab':
        e.preventDefault();
        // TODO: Implement command auto-completion
        break;
    }
  };

  const getMessageClassName = (type: ConsoleMessage['type']) => {
    const baseClasses = 'font-mono text-sm leading-relaxed whitespace-pre-wrap break-words';
    
    switch (type) {
      case 'input':
        return `${baseClasses} text-blue-400 font-medium`;
      case 'output':
        return `${baseClasses} text-gray-300`;
      case 'error':
        return `${baseClasses} text-red-400`;
      case 'system':
        return `${baseClasses} text-yellow-400`;
      case 'warning':
        return `${baseClasses} text-orange-400`;
      default:
        return `${baseClasses} text-gray-300`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusColor = (status: typeof serverStatus) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'starting': return 'text-yellow-400';
      case 'stopping': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const handleServerAction = (action: 'start' | 'stop' | 'restart') => {
    if (!isConnected || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'execute_command',
      sessionId,
      command: action
    }));
  };

  const exportLogs = () => {
    const logContent = messages
      .map(msg => `[${formatTimestamp(msg.timestamp)}] ${msg.content}`)
      .join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${serverId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Console Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Console</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Status:</span>
            <span className={`text-sm font-medium ${getStatusColor(serverStatus)}`}>
              {serverStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Resource Usage Indicators */}
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>CPU: {resourceUsage.cpu.toFixed(1)}%</span>
            <span>RAM: {resourceUsage.memory.toFixed(1)}%</span>
          </div>

          {/* Server Control Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleServerAction('start')}
              disabled={serverStatus === 'online' || serverStatus === 'starting'}
              className="p-2 text-green-400 hover:bg-green-400/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Start Server"
            >
              <Play className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleServerAction('stop')}
              disabled={serverStatus === 'offline' || serverStatus === 'stopping'}
              className="p-2 text-red-400 hover:bg-red-400/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Stop Server"
            >
              <Square className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleServerAction('restart')}
              disabled={serverStatus === 'offline'}
              className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Restart Server"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={exportLogs}
              className="p-2 text-gray-400 hover:bg-gray-400/10 rounded"
              title="Export Logs"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              className="p-2 text-gray-400 hover:bg-gray-400/10 rounded"
              title="Console Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="h-96 overflow-y-auto p-4 bg-black">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Console ready. Type a command below to get started.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-2 mb-1">
              <span className="text-gray-500 text-xs mt-1 min-w-[60px]">
                {formatTimestamp(message.timestamp)}
              </span>
              <div className={getMessageClassName(message.type)}>
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Command Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-blue-400 font-mono">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            disabled={!isConnected || serverStatus === 'offline'}
            className="flex-1 bg-transparent text-white font-mono text-sm border-none outline-none placeholder-gray-500 disabled:opacity-50"
          />
          {command && (
            <button
              onClick={executeCommand}
              disabled={!isConnected}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute
            </button>
          )}
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Use ↑↓ arrows to navigate command history • Tab for auto-completion • Enter to execute
        </div>
      </div>
    </div>
  );
};

export default Console;
