import { useWebSocket } from '../contexts/WebSocketContext';

/**
 * Hook to use socket connection from WebSocketContext
 * Alias for useWebSocket for compatibility
 */
export function useSocket() {
  const { socket, connected } = useWebSocket();
  
  return {
    socket,
    connected
  };
}

export default useSocket;