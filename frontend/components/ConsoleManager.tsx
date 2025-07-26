import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { XTermConsole } from '@/components/Console';
import { Socket } from 'socket.io-client';

interface ConsoleTab {
  id: string;
  serverId: string;
  serverName: string;
  active: boolean;
  connected: boolean;
  unreadCount: number;
}

interface ConsoleManagerProps {
  socket: Socket | null;
  className?: string;
}

interface ConsoleSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  autoScroll: boolean;
  showTimestamp: boolean;
  filterLevel: 'all' | 'info' | 'warning' | 'error';
  bufferSize: number;
}

export default function ConsoleManager({ socket, className = '' }: ConsoleManagerProps) {
  const [consoleTabs, setConsoleTabs] = useState<ConsoleTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCommandTemplates, setShowCommandTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<ConsoleSettings>({
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    autoScroll: true,
    showTimestamp: true,
    filterLevel: 'all',
    bufferSize: 10000,
  });

  // Command templates for different server types
  const [commandTemplates] = useState({
    minecraft: [
      { name: 'List Players', command: 'list' },
      { name: 'Stop Server', command: 'stop' },
      { name: 'Save World', command: 'save-all' },
      { name: 'Game Mode Creative', command: 'gamemode creative @a' },
      { name: 'Game Mode Survival', command: 'gamemode survival @a' },
      { name: 'Weather Clear', command: 'weather clear' },
      { name: 'Time Day', command: 'time set day' },
      { name: 'Reload', command: 'reload' },
    ],
    rust: [
      { name: 'List Players', command: 'users' },
      { name: 'Save Server', command: 'save' },
      { name: 'Kick All', command: 'kickall' },
      { name: 'Server Info', command: 'serverinfo' },
      { name: 'Reload Config', command: 'config.reload' },
      { name: 'Weather Rain', command: 'weather.rain' },
      { name: 'Weather Clear', command: 'weather.clear' },
    ],
    csgo: [
      { name: 'List Players', command: 'users' },
      { name: 'Map Info', command: 'mapinfo' },
      { name: 'Change Map', command: 'changelevel de_dust2' },
      { name: 'Restart Round', command: 'mp_restartgame 1' },
      { name: 'Reload Config', command: 'exec server.cfg' },
    ],
  });

  // Console history
  const [consoleHistory, setConsoleHistory] = useState<Array<{
    id: string;
    serverId: string;
    command: string;
    timestamp: Date;
    response?: string;
  }>>([]);

  // Add new console tab
  const addConsoleTab = useCallback((serverId: string, serverName: string) => {
    const newTab: ConsoleTab = {
      id: `console-${serverId}-${Date.now()}`,
      serverId,
      serverName,
      active: false,
      connected: false,
      unreadCount: 0,
    };

    setConsoleTabs(prev => {
      const updated = prev.map(tab => ({ ...tab, active: false }));
      return [...updated, { ...newTab, active: true }];
    });
    
    setActiveTabId(newTab.id);
  }, []);

  // Remove console tab
  const removeConsoleTab = useCallback((tabId: string) => {
    setConsoleTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (tabId === activeTabId) {
        const nextActive = filtered[filtered.length - 1];
        setActiveTabId(nextActive?.id || null);
        if (nextActive) {
          // Update active state
          return filtered.map(tab => ({ 
            ...tab, 
            active: tab.id === nextActive.id 
          }));
        }
      }
      return filtered;
    });
  }, [activeTabId]);

  // Switch active tab
  const switchTab = useCallback((tabId: string) => {
    setConsoleTabs(prev => prev.map(tab => ({
      ...tab,
      active: tab.id === tabId,
      unreadCount: tab.id === tabId ? 0 : tab.unreadCount,
    })));
    setActiveTabId(tabId);
  }, []);

  // Execute command template
  const executeTemplate = useCallback((command: string) => {
    const activeTab = consoleTabs.find(tab => tab.id === activeTabId);
    if (activeTab && socket) {
      socket.emit('console:command:send', {
        serverId: activeTab.serverId,
        command
      });

      // Add to history
      const historyEntry = {
        id: `history-${Date.now()}`,
        serverId: activeTab.serverId,
        command,
        timestamp: new Date(),
      };
      setConsoleHistory(prev => [historyEntry, ...prev.slice(0, 99)]); // Keep last 100
    }
    setShowCommandTemplates(false);
  }, [activeTabId, consoleTabs, socket]);

  // Download console logs
  const downloadLogs = useCallback((tabId: string) => {
    const tab = consoleTabs.find(t => t.id === tabId);
    if (!tab) return;

    // Create mock log content (in real implementation, this would come from the console buffer)
    const logContent = `# Console Log for ${tab.serverName}\n# Generated: ${new Date().toISOString()}\n\n`;
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab.serverName}-console-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [consoleTabs]);

  // Handle socket events for tab management
  useEffect(() => {
    if (!socket) return;

    const handleServerAdded = (data: { serverId: string; serverName: string }) => {
      // Optionally auto-add console tabs for new servers
    };

    const handleConsoleOutput = (data: { serverId: string; message: string }) => {
      // Update unread count for inactive tabs
      setConsoleTabs(prev => prev.map(tab => ({
        ...tab,
        unreadCount: tab.serverId === data.serverId && !tab.active 
          ? tab.unreadCount + 1 
          : tab.unreadCount
      })));
    };

    socket.on('server:added', handleServerAdded);
    socket.on('console:output', handleConsoleOutput);

    return () => {
      socket.off('server:added', handleServerAdded);
      socket.off('console:output', handleConsoleOutput);
    };
  }, [socket]);

  const activeTab = consoleTabs.find(tab => tab.id === activeTabId);
  const filteredHistory = consoleHistory.filter(entry =>
    !searchQuery || 
    entry.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.response?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-panel-darker border-b border-white/10 p-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {consoleTabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group ${
                tab.active 
                  ? 'bg-panel-primary text-white' 
                  : 'bg-panel-surface hover:bg-panel-light text-gray-300'
              }`}
              onClick={() => switchTab(tab.id)}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  tab.connected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm whitespace-nowrap">{tab.serverName}</span>
                {tab.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                    {tab.unreadCount > 99 ? '99+' : tab.unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeConsoleTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-red-500 rounded p-0.5 transition-all"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          <button
            onClick={() => {
              // Show server selection modal (to be implemented)
              console.log('Add new console tab');
            }}
            className="flex items-center space-x-1 px-3 py-2 bg-panel-surface hover:bg-panel-light text-gray-300 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="text-sm">Add Console</span>
          </button>
        </div>

        {/* Console Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCommandTemplates(!showCommandTemplates)}
            className="p-2 bg-panel-surface hover:bg-panel-light text-gray-300 rounded-lg transition-colors"
            title="Command Templates"
          >
            <CommandLineIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 bg-panel-surface hover:bg-panel-light text-gray-300 rounded-lg transition-colors"
            title="Console History"
          >
            <ClockIcon className="h-4 w-4" />
          </button>
          
          {activeTab && (
            <button
              onClick={() => downloadLogs(activeTab.id)}
              className="p-2 bg-panel-surface hover:bg-panel-light text-gray-300 rounded-lg transition-colors"
              title="Download Logs"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-panel-surface hover:bg-panel-light text-gray-300 rounded-lg transition-colors"
            title="Console Settings"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Console Area */}
        <div className="flex-1 relative">
          {activeTab ? (
            <XTermConsole
              serverId={activeTab.serverId}
              socket={socket}
              connected={activeTab.connected}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-panel-darker">
              <div className="text-center">
                <CommandLineIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Console Open</h3>
                <p className="text-gray-400 mb-4">Select a server to open its console</p>
                <button
                  onClick={() => {
                    // Show server selection modal
                    console.log('Add console');
                  }}
                  className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add Console
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panels */}
        {(showHistory || showCommandTemplates || showSettings) && (
          <div className="w-80 bg-panel-darker border-l border-white/10 overflow-hidden">
            {showSettings && (
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold mb-4">Console Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Theme</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as 'dark' | 'light' }))}
                      className="w-full bg-panel-surface border border-white/20 rounded text-white p-2"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Font Size</label>
                    <input
                      type="range"
                      min="10"
                      max="20"
                      value={settings.fontSize}
                      onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{settings.fontSize}px</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">Auto Scroll</label>
                    <input
                      type="checkbox"
                      checked={settings.autoScroll}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoScroll: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">Show Timestamp</label>
                    <input
                      type="checkbox"
                      checked={settings.showTimestamp}
                      onChange={(e) => setSettings(prev => ({ ...prev, showTimestamp: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {showCommandTemplates && (
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold mb-4">Command Templates</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(commandTemplates).map(([gameType, commands]) => (
                    <div key={gameType}>
                      <h4 className="text-sm font-medium text-gray-300 mb-2 capitalize">{gameType}</h4>
                      {commands.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => executeTemplate(template.command)}
                          className="w-full text-left p-2 bg-panel-surface hover:bg-panel-light rounded text-sm text-white transition-colors mb-1"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{template.command}</div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showHistory && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Console History</h3>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-panel-surface border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredHistory.map(entry => (
                    <div key={entry.id} className="p-2 bg-panel-surface rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-gray-400">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => executeTemplate(entry.command)}
                          className="text-xs text-panel-primary hover:text-panel-primary/80"
                        >
                          Repeat
                        </button>
                      </div>
                      <div className="text-sm text-white font-mono">{entry.command}</div>
                      {entry.response && (
                        <div className="text-xs text-gray-400 mt-1">{entry.response}</div>
                      )}
                    </div>
                  ))}
                  
                  {filteredHistory.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      {searchQuery ? 'No matching commands found' : 'No command history yet'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}