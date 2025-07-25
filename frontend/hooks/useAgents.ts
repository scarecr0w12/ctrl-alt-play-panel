import { useState, useEffect, useCallback } from 'react';
import { agentsApi, AgentStatus, AgentHealthStatus, ExternalAgent } from '@/lib/api';

interface UseAgentsReturn {
  agents: ExternalAgent[];
  healthStatuses: Map<string, AgentHealthStatus>;
  loading: boolean;
  error: string | null;
  refreshAgents: () => Promise<void>;
  forceDiscovery: () => Promise<void>;
  registerAgent: (nodeUuid: string, baseUrl: string, apiKey?: string) => Promise<boolean>;
  unregisterAgent: (nodeUuid: string) => Promise<boolean>;
  checkHealth: () => Promise<void>;
}

export const useAgents = (autoRefresh = true, refreshInterval = 30000): UseAgentsReturn => {
  const [agents, setAgents] = useState<ExternalAgent[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, AgentHealthStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAgents = useCallback(async () => {
    try {
      setError(null);
      const response = await agentsApi.getAll();
      
      if (response.data.success && response.data.data) {
        setAgents(response.data.data);
      } else {
        setError('Failed to fetch agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await agentsApi.healthCheckAll();
      
      if (response.data.success && response.data.data) {
        const healthMap = new Map<string, AgentHealthStatus>();
        response.data.data.forEach((health: AgentHealthStatus) => {
          healthMap.set(health.nodeUuid, health);
        });
        setHealthStatuses(healthMap);
      }
    } catch (err) {
      console.error('Failed to check agent health:', err);
    }
  }, []);

  const forceDiscovery = useCallback(async () => {
    try {
      setError(null);
      await agentsApi.discover();
      
      // Refresh agents after discovery
      await refreshAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force discovery');
      console.error('Failed to force discovery:', err);
    }
  }, [refreshAgents]);

  const registerAgent = useCallback(async (nodeUuid: string, baseUrl: string, apiKey?: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await agentsApi.register({ 
        nodeUuid, 
        baseUrl, 
        apiKey: apiKey || '' 
      });
      
      if (response.data.success) {
        await refreshAgents();
        return true;
      } else {
        setError('Failed to register agent');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register agent');
      console.error('Failed to register agent:', err);
      return false;
    }
  }, [refreshAgents]);

  const unregisterAgent = useCallback(async (nodeUuid: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await agentsApi.unregister(nodeUuid);
      
      if (response.data.success) {
        await refreshAgents();
        return true;
      } else {
        setError('Failed to unregister agent');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unregister agent');
      console.error('Failed to unregister agent:', err);
      return false;
    }
  }, [refreshAgents]);

  // Initial load
  useEffect(() => {
    refreshAgents();
    checkHealth();
  }, [refreshAgents, checkHealth]);

  // Auto-refresh agents and health
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAgents();
      checkHealth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAgents, checkHealth]);

  return {
    agents,
    healthStatuses,
    loading,
    error,
    refreshAgents,
    forceDiscovery,
    registerAgent,
    unregisterAgent,
    checkHealth,
  };
};

export default useAgents;
