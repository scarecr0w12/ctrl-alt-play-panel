import { useState, useEffect, useCallback } from 'react';
import { nodesApi } from '../lib/api';
import toast from 'react-hot-toast';

export interface Node {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  fqdn: string;
  scheme: string;
  port: number;
  publicPort: number;
  memory: number;
  memoryOverallocate?: number;
  disk: number;
  diskOverallocate?: number;
  uploadSize: number;
  locationId: string;
  isPublic: boolean;
  isBehindProxy: boolean;
  isMaintenanceMode: boolean;
  daemonToken: string;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    shortCode: string;
  };
  _count?: {
    servers: number;
    allocations: number;
  };
  servers?: Array<{
    id: string;
    name: string;
    status: string;
    user: {
      username: string;
    };
  }>;
}

export interface CreateNodeData {
  name: string;
  fqdn: string;
  scheme?: string;
  port?: number;
  publicPort?: number;
  memory?: number;
  disk?: number;
  locationId: string;
  isPublic?: boolean;
  isBehindProxy?: boolean;
  daemonToken?: string;
  description?: string;
}

export interface UpdateNodeData {
  name?: string;
  description?: string;
  fqdn?: string;
  scheme?: string;
  port?: number;
  publicPort?: number;
  memory?: number;
  memoryOverallocate?: number;
  disk?: number;
  diskOverallocate?: number;
  uploadSize?: number;
  locationId?: string;
  isPublic?: boolean;
  isBehindProxy?: boolean;
  isMaintenanceMode?: boolean;
}

export interface NodeStats {
  cpu: number;
  memory: {
    used: number;
    total: number;
  };
  disk: {
    used: number;
    total: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: number;
  servers: number;
}

export const useNodes = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await nodesApi.getAll();
      setNodes(response.data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch nodes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNode = useCallback(async (nodeData: CreateNodeData): Promise<Node> => {
    setError(null);
    try {
      const response = await nodesApi.create(nodeData);
      const newNode = response.data.data;
      setNodes(prev => [newNode, ...prev]);
      return newNode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create node';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateNode = useCallback(async (nodeId: string, nodeData: UpdateNodeData): Promise<Node> => {
    setError(null);
    try {
      const response = await nodesApi.update(nodeId, nodeData);
      const updatedNode = response.data.data;
      setNodes(prev => prev.map(node => 
        node.id === nodeId ? updatedNode : node
      ));
      return updatedNode;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update node';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteNode = useCallback(async (nodeId: string): Promise<void> => {
    setError(null);
    try {
      await nodesApi.delete(nodeId);
      setNodes(prev => prev.filter(node => node.id !== nodeId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete node';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const getNodeStats = useCallback(async (nodeId: string): Promise<NodeStats> => {
    setError(null);
    try {
      const response = await nodesApi.getStats(nodeId);
      return response.data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch node stats';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const getNodeServers = useCallback(async (nodeId: string) => {
    setError(null);
    try {
      const response = await nodesApi.getServers(nodeId);
      return response.data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch node servers';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  return {
    nodes,
    loading,
    error,
    fetchNodes,
    createNode,
    updateNode,
    deleteNode,
    getNodeStats,
    getNodeServers
  };
};

export default useNodes;
