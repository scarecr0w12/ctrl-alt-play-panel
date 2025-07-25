import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import Cookies from 'js-cookie';

interface MonitoringMetrics {
  cpu: number;
  memory: number;
  memoryUsed: number;
  memoryTotal: number;
  disk: number;
  diskUsed: number;
  diskTotal: number;
  network: {
    in: number;
    out: number;
  };
  players: number;
  uptime: number;
  timestamp: string;
}

interface ServerStatus {
  total: number;
  running: number;
  stopped: number;
}

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  metrics: MonitoringMetrics | null;
  serverStatus: ServerStatus | null;
  joinMonitoring: () => void;
  leaveMonitoring: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = Cookies.get('authToken');
    if (!token) {
      return;
    }

    // Create socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnected(false);
    });

    // Listen for monitoring updates
    newSocket.on('metrics:update', (data: any) => {
      console.log('📊 Received metrics update:', data);
      setMetrics({
        cpu: data.cpu || 0,
        memory: data.memory || 0,
        memoryUsed: data.memoryUsed || 0,
        memoryTotal: data.memoryTotal || 16384,
        disk: data.disk || 0,
        diskUsed: data.diskUsed || 0,
        diskTotal: data.diskTotal || 1000000,
        network: data.network || { in: 0, out: 0 },
        players: data.players || 0,
        uptime: data.uptime || 0,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    newSocket.on('server:status', (data: ServerStatus) => {
      console.log('🖥️ Received server status update:', data);
      setServerStatus(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  const joinMonitoring = () => {
    if (socket && connected) {
      console.log('📊 Joining monitoring updates');
      socket.emit('join:monitoring');
    }
  };

  const leaveMonitoring = () => {
    if (socket && connected) {
      console.log('📊 Leaving monitoring updates');
      socket.emit('leave:monitoring');
    }
  };

  const value: WebSocketContextType = {
    socket,
    connected,
    metrics,
    serverStatus,
    joinMonitoring,
    leaveMonitoring,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
