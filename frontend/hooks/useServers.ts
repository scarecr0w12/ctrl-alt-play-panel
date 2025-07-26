import { useState, useEffect, useCallback } from 'react';
import { serversApi } from '../lib/api';
import toast from 'react-hot-toast';

export interface Server {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  nodeId: string;
  altId: string;
  memory: number;
  disk: number;
  cpu: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerStats {
  memory: {
    used: number;
    total: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
  };
}

export const useServers = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await serversApi.getAll();
      setServers(response.data.data || response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch servers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const startServer = async (id: string) => {
    try {
      await serversApi.start(id);
      toast.success('Server started successfully');
      await fetchServers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start server';
      toast.error(errorMessage);
    }
  };

  const stopServer = async (id: string, signal = 'SIGTERM', timeout = 30) => {
    try {
      await serversApi.stop(id, signal, timeout);
      toast.success('Server stopped successfully');
      await fetchServers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop server';
      toast.error(errorMessage);
    }
  };

  const restartServer = async (id: string) => {
    try {
      await serversApi.restart(id);
      toast.success('Server restarted successfully');
      await fetchServers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restart server';
      toast.error(errorMessage);
    }
  };

  const killServer = async (id: string) => {
    try {
      await serversApi.kill(id);
      toast.success('Server killed successfully');
      await fetchServers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to kill server';
      toast.error(errorMessage);
    }
  };

  return {
    servers,
    loading,
    error,
    refetch: fetchServers,
    startServer,
    stopServer,
    restartServer,
    killServer,
  };
};

export const useServer = (serverId: string) => {
  const [server, setServer] = useState<Server | null>(null);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServer = useCallback(async () => {
    if (!serverId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await serversApi.getById(serverId);
      setServer(response.data.data || response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch server';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  const fetchServerStatus = useCallback(async () => {
    if (!serverId) return;
    
    try {
      const response = await serversApi.getStatus(serverId);
      setStats(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch server status:', err);
    }
  }, [serverId]);

  useEffect(() => {
    fetchServer();
  }, [fetchServer]);

  useEffect(() => {
    if (serverId) {
      // Initial fetch
      fetchServerStatus();
      
      // Poll for status updates every 10 seconds
      const interval = setInterval(fetchServerStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [serverId, fetchServerStatus]);

  return {
    server,
    stats,
    loading,
    error,
    refetch: fetchServer,
    refetchStatus: fetchServerStatus,
  };
};
