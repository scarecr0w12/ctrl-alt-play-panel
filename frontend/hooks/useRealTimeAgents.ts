import { useState, useEffect, useCallback, useRef } from 'react';
import { ExternalAgent, AgentHealthStatus } from '@/lib/api';

interface AgentEvent {
  type: 'agent_status_update' | 'agent_connected' | 'agent_disconnected' | 'agent_metrics_update';
  nodeUuid: string;
  data: any;
}

interface UseRealTimeAgentsReturn {
  agents: ExternalAgent[];
  healthStatuses: Map<string, AgentHealthStatus>;
  metricsData: Map<string, any>;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: Date | null;
  isRealTimeEnabled: boolean;
  toggleRealTime: () => void;
  forceUpdate: () => void;
}

export function useRealTimeAgents(): UseRealTimeAgentsReturn {
  const [agents, setAgents] = useState<ExternalAgent[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, AgentHealthStatus>>(new Map());
  const [metricsData, setMetricsData] = useState<Map<string, any>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (!isRealTimeEnabled) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/agents`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Agent WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send authentication token
        const token = localStorage.getItem('token');
        if (token && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'authenticate',
            token
          }));
        }

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: AgentEvent = JSON.parse(event.data);
          handleAgentEvent(message);
          setLastUpdate(new Date());
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Agent WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt to reconnect if enabled and not too many attempts
        if (isRealTimeEnabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          setConnectionStatus('reconnecting');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Agent WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to connect to Agent WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  }, [isRealTimeEnabled]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  const handleAgentEvent = useCallback((event: AgentEvent) => {
    const { type, nodeUuid, data } = event;

    switch (type) {
      case 'agent_status_update':
        setHealthStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(nodeUuid, data);
          return newMap;
        });
        break;

      case 'agent_connected':
        setAgents(prev => prev.map(agent => 
          agent.nodeUuid === nodeUuid 
            ? { ...agent, isOnline: true, lastSeen: new Date() }
            : agent
        ));
        break;

      case 'agent_disconnected':
        setAgents(prev => prev.map(agent => 
          agent.nodeUuid === nodeUuid 
            ? { ...agent, isOnline: false }
            : agent
        ));
        break;

      case 'agent_metrics_update':
        setMetricsData(prev => {
          const newMap = new Map(prev);
          newMap.set(nodeUuid, data);
          return newMap;
        });
        break;

      default:
        console.log('Unknown agent event type:', type);
    }
  }, []);

  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(prev => {
      const newState = !prev;
      if (newState) {
        connectWebSocket();
      } else {
        disconnectWebSocket();
      }
      return newState;
    });
  }, [connectWebSocket, disconnectWebSocket]);

  const forceUpdate = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request_update',
        request: 'all'
      }));
    }
  }, []);

  // Connect/disconnect based on real-time status
  useEffect(() => {
    if (isRealTimeEnabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isRealTimeEnabled, connectWebSocket, disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    agents,
    healthStatuses,
    metricsData,
    connectionStatus,
    lastUpdate,
    isRealTimeEnabled,
    toggleRealTime,
    forceUpdate,
  };
}
