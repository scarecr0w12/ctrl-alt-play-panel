/**
 * Real-time Console System
 * Inspired by Pterodactyl and Pelican Panel console interfaces
 * 
 * Features:
 * - WebSocket-based real-time communication
 * - Command history and auto-completion
 * - Multi-server console management
 * - Terminal-like interface with ANSI color support
 * - File operations integration
 * - Performance monitoring integration
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { logger } from '../utils/logger';

interface ConsoleMessage {
  id: string;
  timestamp: number;
  type: 'output' | 'input' | 'error' | 'system' | 'warning';
  content: string;
  server_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

interface ConsoleSession {
  id: string;
  server_id: string;
  user_id: string;
  created_at: number;
  last_activity: number;
  status: 'active' | 'idle' | 'disconnected';
  websocket?: WebSocket;
  command_history: string[];
  environment: Record<string, string>;
}

interface ServerConsole {
  server_id: string;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  process_id?: number;
  working_directory: string;
  environment: Record<string, string>;
  resource_usage: {
    memory: number;
    cpu: number;
    disk_io: number;
    network_io: number;
  };
}

interface ConsoleCommand {
  command: string;
  args: string[];
  working_directory?: string;
  environment?: Record<string, string>;
  timeout?: number;
}

/**
 * Real-time Console Manager
 * Handles WebSocket connections and command execution
 */
export class ConsoleManager extends EventEmitter {
  private sessions: Map<string, ConsoleSession> = new Map();
  private serverConsoles: Map<string, ServerConsole> = new Map();
  private commandHistory: Map<string, string[]> = new Map();
  private wsServer?: WebSocket.Server;
  private readonly maxHistorySize = 1000;
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor(private port: number = 8081) {
    super();
    this.setupCleanupInterval();
  }

  /**
   * Initialize the console system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Console Manager...');

    try {
      // Setup WebSocket server
      this.wsServer = new WebSocket.Server({ 
        port: this.port,
        perMessageDeflate: false
      });

      this.wsServer.on('connection', this.handleConnection.bind(this));
      this.wsServer.on('error', (error) => {
        logger.error('WebSocket server error:', error);
      });

      // Load existing server consoles
      await this.loadServerConsoles();

      logger.info(`Console Manager initialized on port ${this.port}`);
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Console Manager:', error);
      throw error;
    }
  }

  /**
   * Create a new console session
   */
  async createSession(serverId: string, userId: string): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const session: ConsoleSession = {
      id: sessionId,
      server_id: serverId,
      user_id: userId,
      created_at: Date.now(),
      last_activity: Date.now(),
      status: 'active',
      command_history: this.getCommandHistory(serverId),
      environment: await this.getServerEnvironment(serverId)
    };

    this.sessions.set(sessionId, session);
    
    // Initialize server console if not exists
    if (!this.serverConsoles.has(serverId)) {
      await this.initializeServerConsole(serverId);
    }

    this.emit('session-created', { sessionId, serverId, userId });
    logger.info(`Console session created: ${sessionId} for server ${serverId}`);

    return sessionId;
  }

  /**
   * Execute command in server console
   */
  async executeCommand(
    sessionId: string, 
    command: ConsoleCommand
  ): Promise<ConsoleMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const serverConsole = this.serverConsoles.get(session.server_id);
    if (!serverConsole) {
      throw new Error(`Server console for ${session.server_id} not available`);
    }

    // Update session activity
    session.last_activity = Date.now();
    session.status = 'active';

    // Add to command history
    session.command_history.push(command.command);
    this.addToCommandHistory(session.server_id, command.command);

    // Create command message
    const inputMessage: ConsoleMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      type: 'input',
      content: `$ ${command.command}`,
      server_id: session.server_id,
      user_id: session.user_id,
      metadata: {
        working_directory: serverConsole.working_directory,
        environment: command.environment || {}
      }
    };

    // Broadcast input to all sessions for this server
    this.broadcastToServer(session.server_id, inputMessage);

    try {
      // Execute the command (this would integrate with actual process execution)
      const result = await this.executeServerCommand(session.server_id, command);
      
      // Create output message
      const outputMessage: ConsoleMessage = {
        id: this.generateMessageId(),
        timestamp: Date.now(),
        type: result.success ? 'output' : 'error',
        content: result.output,
        server_id: session.server_id,
        user_id: session.user_id,
        metadata: {
          exit_code: result.exit_code,
          execution_time: result.execution_time
        }
      };

      // Broadcast output to all sessions for this server
      this.broadcastToServer(session.server_id, outputMessage);

      return outputMessage;

    } catch (error) {
      const errorMessage: ConsoleMessage = {
        id: this.generateMessageId(),
        timestamp: Date.now(),
        type: 'error',
        content: `Error executing command: ${error instanceof Error ? error.message : String(error)}`,
        server_id: session.server_id,
        user_id: session.user_id
      };

      this.broadcastToServer(session.server_id, errorMessage);
      return errorMessage;
    }
  }

  /**
   * Get server console status and information
   */
  getServerConsole(serverId: string): ServerConsole | undefined {
    return this.serverConsoles.get(serverId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ConsoleSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'active'
    );
  }

  /**
   * Get sessions for a specific server
   */
  getServerSessions(serverId: string): ConsoleSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.server_id === serverId
    );
  }

  /**
   * Close a console session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Close WebSocket if connected
    if (session.websocket) {
      session.websocket.close();
    }

    // Update status
    session.status = 'disconnected';

    // Remove from active sessions after delay
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 60000); // Keep for 1 minute for cleanup

    this.emit('session-closed', { sessionId, serverId: session.server_id });
    logger.info(`Console session closed: ${sessionId}`);
  }

  /**
   * Start a server console
   */
  async startServerConsole(serverId: string): Promise<void> {
    const serverConsole = this.serverConsoles.get(serverId);
    if (!serverConsole) {
      throw new Error(`Server console for ${serverId} not found`);
    }

    if (serverConsole.status === 'online') {
      return;
    }

    try {
      serverConsole.status = 'starting';
      
      // This would integrate with actual server process management
      await this.startServerProcess(serverId);
      
      serverConsole.status = 'online';
      
      // Broadcast status update
      this.broadcastServerStatus(serverId, 'started');
      
      logger.info(`Server console started: ${serverId}`);
      
    } catch (error) {
      serverConsole.status = 'offline';
      logger.error(`Failed to start server console ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a server console
   */
  async stopServerConsole(serverId: string): Promise<void> {
    const serverConsole = this.serverConsoles.get(serverId);
    if (!serverConsole) {
      throw new Error(`Server console for ${serverId} not found`);
    }

    if (serverConsole.status === 'offline') {
      return;
    }

    try {
      serverConsole.status = 'stopping';
      
      // This would integrate with actual server process management
      await this.stopServerProcess(serverId);
      
      serverConsole.status = 'offline';
      serverConsole.process_id = undefined;
      
      // Broadcast status update
      this.broadcastServerStatus(serverId, 'stopped');
      
      logger.info(`Server console stopped: ${serverId}`);
      
    } catch (error) {
      logger.error(`Failed to stop server console ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Get server resource usage
   */
  getServerResourceUsage(serverId: string): ServerConsole['resource_usage'] | null {
    const serverConsole = this.serverConsoles.get(serverId);
    return serverConsole?.resource_usage || null;
  }

  /**
   * Update server resource usage (called by performance monitor)
   */
  updateServerResourceUsage(
    serverId: string, 
    usage: ServerConsole['resource_usage']
  ): void {
    const serverConsole = this.serverConsoles.get(serverId);
    if (serverConsole) {
      serverConsole.resource_usage = usage;
      
      // Broadcast resource update to connected sessions
      this.broadcastToServer(serverId, {
        id: this.generateMessageId(),
        timestamp: Date.now(),
        type: 'system',
        content: `Resource update: Memory ${usage.memory.toFixed(1)}% | CPU ${usage.cpu.toFixed(1)}%`,
        server_id: serverId,
        metadata: { resource_usage: usage }
      });
    }
  }

  // Private Methods

  private handleConnection(ws: WebSocket): void {
    logger.info('New WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleWebSocketMessage(ws, message);
      } catch (error) {
        logger.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket connection error:', error);
    });
  }

  private async handleWebSocketMessage(ws: WebSocket, message: unknown): Promise<void> {
    const msg = message as { type: string; sessionId?: string; [key: string]: unknown };

    switch (msg.type) {
      case 'join_session':
        await this.handleJoinSession(ws, msg.sessionId as string);
        break;
        
      case 'execute_command':
        await this.handleExecuteCommand(ws, msg);
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${msg.type}`
        }));
    }
  }

  private async handleJoinSession(ws: WebSocket, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found'
      }));
      return;
    }

    // Associate WebSocket with session
    session.websocket = ws;
    session.last_activity = Date.now();
    session.status = 'active';

    // Send session info
    ws.send(JSON.stringify({
      type: 'session_joined',
      session: {
        id: session.id,
        server_id: session.server_id,
        command_history: session.command_history.slice(-50), // Last 50 commands
        server_status: this.serverConsoles.get(session.server_id)?.status || 'unknown'
      }
    }));

    logger.info(`WebSocket joined session: ${sessionId}`);
  }

  private async handleExecuteCommand(ws: WebSocket, message: unknown): Promise<void> {
    const msg = message as { 
      sessionId: string; 
      command: string; 
      args?: string[];
      working_directory?: string;
    };

    if (!msg.sessionId || !msg.command) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Missing sessionId or command'
      }));
      return;
    }

    try {
      const command: ConsoleCommand = {
        command: msg.command,
        args: msg.args || [],
        working_directory: msg.working_directory
      };

      await this.executeCommand(msg.sessionId, command);

    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  private handleDisconnection(ws: WebSocket): void {
    // Find and update session status
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.websocket === ws) {
        session.websocket = undefined;
        session.status = 'idle';
        logger.info(`WebSocket disconnected from session: ${sessionId}`);
        break;
      }
    }
  }

  private broadcastToServer(serverId: string, message: ConsoleMessage): void {
    const sessions = this.getServerSessions(serverId);
    
    for (const session of sessions) {
      if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.websocket.send(JSON.stringify({
          type: 'console_message',
          message
        }));
      }
    }
  }

  private broadcastServerStatus(serverId: string, status: string): void {
    const sessions = this.getServerSessions(serverId);
    
    for (const session of sessions) {
      if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.websocket.send(JSON.stringify({
          type: 'server_status',
          server_id: serverId,
          status
        }));
      }
    }
  }

  private async loadServerConsoles(): Promise<void> {
    // This would load from database in production
    // For now, create mock consoles
    logger.info('Loading server consoles...');
  }

  private async initializeServerConsole(serverId: string): Promise<void> {
    const serverConsole: ServerConsole = {
      server_id: serverId,
      status: 'offline',
      working_directory: `/servers/${serverId}`,
      environment: await this.getServerEnvironment(serverId),
      resource_usage: {
        memory: 0,
        cpu: 0,
        disk_io: 0,
        network_io: 0
      }
    };

    this.serverConsoles.set(serverId, serverConsole);
  }

  private async getServerEnvironment(serverId: string): Promise<Record<string, string>> {
    // This would fetch from server configuration
    return {
      SERVER_ID: serverId,
      NODE_ENV: 'production'
    };
  }

  private async executeServerCommand(
    serverId: string, 
    command: ConsoleCommand
  ): Promise<{ success: boolean; output: string; exit_code: number; execution_time: number }> {
    const startTime = Date.now();
    
    // This would integrate with actual command execution
    // For now, return mock response
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const executionTime = Date.now() - startTime;
    
    // Mock command responses
    const responses: Record<string, string> = {
      'help': 'Available commands: start, stop, restart, status, players, save-all',
      'status': 'Server is running. Players online: 0/20',
      'players': 'No players currently online',
      'save-all': 'Saved the game',
      'stop': 'Stopping server...',
      'start': 'Starting server...'
    };

    const output = responses[command.command] || `Command executed: ${command.command}`;

    return {
      success: true,
      output,
      exit_code: 0,
      execution_time: executionTime
    };
  }

  private async startServerProcess(serverId: string): Promise<void> {
    // This would start the actual server process
    logger.info(`Starting server process for ${serverId}`);
  }

  private async stopServerProcess(serverId: string): Promise<void> {
    // This would stop the actual server process
    logger.info(`Stopping server process for ${serverId}`);
  }

  private getCommandHistory(serverId: string): string[] {
    return this.commandHistory.get(serverId) || [];
  }

  private addToCommandHistory(serverId: string, command: string): void {
    let history = this.commandHistory.get(serverId) || [];
    history.push(command);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history = history.slice(-this.maxHistorySize);
    }
    
    this.commandHistory.set(serverId, history);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupCleanupInterval(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.last_activity > this.sessionTimeout) {
          this.closeSession(sessionId);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Export singleton instance
export const consoleManager = new ConsoleManager();

export default ConsoleManager;
