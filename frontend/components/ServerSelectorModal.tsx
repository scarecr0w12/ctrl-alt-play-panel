import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, ServerIcon } from '@heroicons/react/24/outline';
import { serversApi } from '@/lib/api';

interface Server {
  id: string;
  name: string;
  status: string;
  game: string;
  players: {
    online: number;
    max: number;
  };
}

interface ServerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerSelect: (serverId: string, serverName: string) => void;
  excludeServerIds?: string[];
}

export default function ServerSelectorModal({
  isOpen,
  onClose,
  onServerSelect,
  excludeServerIds = [],
}: ServerSelectorModalProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadServers();
    }
  }, [isOpen]);

  const loadServers = async () => {
    setLoading(true);
    try {
      const response = await serversApi.getAll();
      const serversData = response.data.data || response.data;
      setServers(Array.isArray(serversData) ? serversData : []);
    } catch (error) {
      console.error('Failed to load servers:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServerSelect = (server: Server) => {
    onServerSelect(server.id, server.name);
    onClose();
  };

  // Filter servers based on search and game type
  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame = selectedGame === 'all' || server.game === selectedGame;
    const notExcluded = !excludeServerIds.includes(server.id);
    return matchesSearch && matchesGame && notExcluded;
  });

  // Get unique game types
  const gameTypes = ['all', ...Array.from(new Set(servers.map(s => s.game)))];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-500';
      case 'starting':
        return 'bg-yellow-500';
      case 'stopping':
        return 'bg-orange-500';
      case 'stopped':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Add Console</h2>
            <p className="text-gray-400 text-sm mt-1">
              Select a server to open its console
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary"
              />
            </div>

            {/* Game Filter */}
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="bg-panel-surface border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-panel-primary"
            >
              {gameTypes.map(game => (
                <option key={game} value={game}>
                  {game === 'all' ? 'All Games' : game.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Server List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panel-primary"></div>
              <span className="ml-3 text-gray-400">Loading servers...</span>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-8">
              <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery || selectedGame !== 'all' 
                  ? 'No servers match your filters' 
                  : 'No servers available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredServers.map(server => (
                <div
                  key={server.id}
                  onClick={() => handleServerSelect(server)}
                  className="p-4 bg-panel-surface hover:bg-panel-light rounded-lg cursor-pointer transition-colors border border-transparent hover:border-panel-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ServerIcon className="h-6 w-6 text-panel-primary" />
                      <div>
                        <h3 className="text-white font-medium">{server.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span className="capitalize">{server.game}</span>
                          <span>•</span>
                          <span>{server.players.online}/{server.players.max} players</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                      <span className="text-sm text-gray-400">
                        {getStatusText(server.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>
              {filteredServers.length} server{filteredServers.length !== 1 ? 's' : ''} available
            </span>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}