import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { User } from '../types';
import DatabaseService from './database';
import ExternalAgentService from './externalAgentService';

interface JWTPayload {
  user: User;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  user: User;
}

export class SocketService {
  private static io: SocketIOServer;
  private static connectedClients: Map<string, Socket> = new Map();

  public static initialize(io: SocketIOServer): void {
    this.io = io;

    // Authentication middleware for socket connections
    io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        (socket as AuthenticatedSocket).user = decoded.user;
        next();
      } catch {
        next(new Error('Authentication error'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const user = (socket as AuthenticatedSocket).user;
      logger.info(`User ${user.username} connected via WebSocket`);

      // Store the connection
      this.connectedClients.set(user.id, socket);

      // Join user to their personal room
      socket.join(`user:${user.id}`);

      // Join user to server rooms they have access to
      this.joinUserToServerRooms(socket, user);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${user.username} disconnected`);
        this.connectedClients.delete(user.id);
      });

      // Handle server console commands (legacy)
      socket.on('server:command', (data) => {
        this.handleServerCommand(socket, data);
      });

      // Handle modern console interaction
      socket.on('console:join', (data) => {
        this.handleConsoleJoin(socket, data);
      });

      socket.on('console:leave', (data) => {
        this.handleConsoleLeave(socket, data);
      });

      socket.on('console:command:input', (data) => {
        this.handleConsoleInput(socket, data);
      });

      socket.on('console:command:execute', (data) => {
        this.handleConsoleExecute(socket, data);
      });

      socket.on('console:command:backspace', (data) => {
        this.handleConsoleBackspace(socket, data);
      });

      socket.on('console:command:interrupt', (data) => {
        this.handleConsoleInterrupt(socket, data);
      });

      // Handle monitoring subscriptions
      socket.on('join:monitoring', () => {
        socket.join('monitoring');
        logger.info(`User ${user.username} joined monitoring updates`);
      });

      socket.on('leave:monitoring', () => {
        socket.leave('monitoring');
        logger.info(`User ${user.username} left monitoring updates`);
      });

      // Handle file operations
      socket.on('server:file:read', (data) => {
        this.handleFileRead(socket, data);
      });

      socket.on('server:file:write', (data) => {
        this.handleFileWrite(socket, data);
      });
    });
  }

  private static async joinUserToServerRooms(socket: Socket, user: User): Promise<void> {
    try {
      // Get user's servers from database and join rooms
      const db = await DatabaseService.getInstance();
      const userServers = await db.server.findMany({
        where: {
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        select: {
          uuid: true,
          name: true
        }
      });

      // Join socket to server-specific rooms for real-time updates
      for (const server of userServers) {
        socket.join(`server:${server.uuid}`);
        logger.debug(`User ${user.username} joined room for server: ${server.name}`);
      }
      
      logger.debug(`User ${user.username} joined ${userServers.length} server rooms`);
    } catch (error) {
      logger.error(`Failed to join user ${user.username} to server rooms:`, error);
    }
  }

  private static async handleServerCommand(socket: Socket, data: { serverId: string; command: string }): Promise<void> {
    const { serverId, command } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // Validate user has access to server
      const db = DatabaseService.getInstance();
      const server = await db.server.findFirst({
        where: {
          uuid: serverId,
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        include: {
          node: true
        }
      });

      if (!server) {
        logger.warn(`User ${user.username} attempted to send command to unauthorized server ${serverId}`);
        socket.emit('server:command:error', { error: 'Server not found or unauthorized' });
        return;
      }

      // Validate command is not empty
      if (!command || command.trim().length === 0) {
        socket.emit('server:command:error', { error: 'Command cannot be empty' });
        return;
      }

      // Send command to agent via ExternalAgentService
      const agentService = ExternalAgentService.getInstance();
      await agentService.sendServerCommand(server.nodeId, serverId, command);
      
      logger.info(`User ${user.username} sent command to server ${server.name} (${serverId}): ${command}`);

      // Broadcast command to server room for real-time updates
      this.io.to(`server:${serverId}`).emit('server:output', {
        type: 'command',
        data: command,
        timestamp: new Date(),
        user: user.username
      });

    } catch (error) {
      logger.error(`Failed to send command to server ${serverId}:`, error);
      socket.emit('server:command:error', { error: 'Failed to send command' });
    }
  }

  private static async handleConsoleJoin(socket: Socket, data: { serverId: string }): Promise<void> {
    const { serverId } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // Validate user has access to server
      const db = DatabaseService.getInstance();
      const server = await db.server.findFirst({
        where: {
          uuid: serverId,
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        include: {
          node: true
        }
      });

      if (!server) {
        logger.warn(`User ${user.username} attempted to access unauthorized server ${serverId}`);
        socket.emit('console:connection', { connected: false, error: 'Server not found or unauthorized' });
        return;
      }

      logger.info(`User ${user.username} joined console for server ${server.name} (${serverId})`);
      
      // Join server-specific console room
      socket.join(`console:${serverId}`);
      
      // Notify successful connection
      socket.emit('console:connection', { connected: true });
      
      // Send welcome message with server info
      socket.emit('console:output', {
        message: `Connected to ${server.name} console`,
        timestamp: new Date().toISOString(),
        type: 'info'
      });

      // Try to get recent console history from agent
      try {
        const { ExternalAgentService } = await import('./externalAgentService');
        const agentService = ExternalAgentService.getInstance();
        
        const logsResult = await agentService.getServerLogs(server.node.uuid, serverId, 50);
        if (logsResult.success && logsResult.data?.logs) {
          // Send recent logs to console
          const logs = Array.isArray(logsResult.data.logs) ? logsResult.data.logs : [];
          logs.forEach((log: string) => {
            socket.emit('console:output', {
              message: log,
              timestamp: new Date().toISOString(),
              type: 'log'
            });
          });
        }
      } catch (error) {
        logger.error(`Failed to get console history for server ${serverId}:`, error);
      }

    } catch (error) {
      logger.error(`Failed to join console for server ${serverId}:`, error);
      socket.emit('console:connection', { connected: false, error: 'Failed to connect to console' });
    }
  }

  private static handleConsoleLeave(socket: Socket, data: { serverId: string }): void {
    const { serverId } = data;
    const user = (socket as unknown as { user: User }).user;

    logger.info(`User ${user.username} left console for server ${serverId}`);
    socket.leave(`console:${serverId}`);
  }

  private static handleConsoleInput(socket: Socket, data: { serverId: string; data: string }): void {
    const { serverId, data: inputData } = data;

    // Store input character for command building on agent side
    logger.debug(`Console input for server ${serverId}: ${inputData}`);
    
    // Echo the input back to the terminal so user sees what they're typing
    socket.emit('console:output', {
      message: inputData,
      timestamp: new Date().toISOString(),
      type: 'input'
    });
  }

  private static async handleConsoleExecute(socket: Socket, data: { serverId: string }): Promise<void> {
    const { serverId } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // Get server and validate access
      const db = DatabaseService.getInstance();
      const server = await db.server.findFirst({
        where: {
          uuid: serverId,
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        include: {
          node: true
        }
      });

      if (!server) {
        socket.emit('console:command:response', {
          success: false,
          error: 'Server not found or unauthorized'
        });
        return;
      }

      // For now, just acknowledge - in a real implementation, this would send the accumulated
      // command line to the external agent for execution
      logger.info(`User ${user.username} executed command on server ${server.name}`);
      
      socket.emit('console:command:response', {
        success: true,
        message: 'Command sent to server'
      });

      // In the future, this would:
      // 1. Get the current command line from session storage
      // 2. Send it to external agent via ExternalAgentService.sendServerCommand()
      // 3. Handle the response and any real-time output from the agent

    } catch (error) {
      logger.error(`Failed to execute command on server ${serverId}:`, error);
      socket.emit('console:command:response', {
        success: false,
        error: 'Failed to execute command'
      });
    }
  }

  private static handleConsoleBackspace(socket: Socket, data: { serverId: string }): void {
    const { serverId } = data;

    logger.debug(`Console backspace for server ${serverId}`);
    
    // Echo backspace to terminal for local display
    socket.emit('console:output', {
      message: '\b \b',
      timestamp: new Date().toISOString(),
      type: 'control'
    });
  }

  private static async handleConsoleInterrupt(socket: Socket, data: { serverId: string }): Promise<void> {
    const { serverId } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // Get server and validate access
      const db = DatabaseService.getInstance();
      const server = await db.server.findFirst({
        where: {
          uuid: serverId,
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        include: {
          node: true
        }
      });

      if (!server) {
        return;
      }

      logger.info(`User ${user.username} sent interrupt to server ${server.name}`);
      
      // In the future, this would send interrupt signal to external agent
      // For now, just acknowledge locally
      socket.emit('console:output', {
        message: '^C',
        timestamp: new Date().toISOString(),
        type: 'warning'
      });

    } catch (error) {
      logger.error(`Failed to send interrupt to server ${serverId}:`, error);
    }
  }

  private static async handleFileRead(socket: Socket, data: { serverId: string; path: string }): Promise<void> {
    const { serverId, path } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // Validate user has access to server and file
      const db = DatabaseService.getInstance();
      const server = await db.server.findFirst({
        where: {
          uuid: serverId,
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        include: {
          node: true
        }
      });

      if (!server) {
        logger.warn(`User ${user.username} attempted to read file from unauthorized server ${serverId}`);
        socket.emit('file:read:error', { error: 'Server not found or unauthorized' });
        return;
      }

      // Validate file path
      if (!path || path.trim().length === 0) {
        socket.emit('file:read:error', { error: 'File path cannot be empty' });
        return;
      }

      // Additional path validation to prevent directory traversal
      if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
        socket.emit('file:read:error', { error: 'Invalid file path' });
        return;
      }

      // Read file from agent
      const agentService = ExternalAgentService.getInstance();
      const response = await agentService.readFile(server.nodeId, serverId, path);
      
      logger.info(`User ${user.username} read file: ${path} from server ${server.name} (${serverId})`);

      // Send file content back to client
      socket.emit('file:read:response', {
        path,
        content: response.data,
        success: response.success
      });

    } catch (error) {
      logger.error(`Failed to read file ${path} from server ${serverId}:`, error);
      socket.emit('file:read:error', { error: 'Failed to read file' });
    }
  }

  private static async handleFileWrite(socket: Socket, data: { serverId: string; path: string; content: string }): Promise<void> {
    const { serverId, path, content } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // Validate user has access to server and file
      const db = DatabaseService.getInstance();
      const server = await db.server.findFirst({
        where: {
          uuid: serverId,
          OR: [
            { userId: user.id },
            { subusers: { some: { userId: user.id } } }
          ]
        },
        include: {
          node: true
        }
      });

      if (!server) {
        logger.warn(`User ${user.username} attempted to write file to unauthorized server ${serverId}`);
        socket.emit('file:write:error', { error: 'Server not found or unauthorized' });
        return;
      }

      // Validate file path
      if (!path || path.trim().length === 0) {
        socket.emit('file:write:error', { error: 'File path cannot be empty' });
        return;
      }

      // Additional path validation to prevent directory traversal
      if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
        socket.emit('file:write:error', { error: 'Invalid file path' });
        return;
      }

      // Validate content size (prevent extremely large files)
      if (content && content.length > 10 * 1024 * 1024) { // 10MB limit
        socket.emit('file:write:error', { error: 'File content too large (max 10MB)' });
        return;
      }

      // Write file via agent
      const agentService = ExternalAgentService.getInstance();
      const response = await agentService.writeFile(server.nodeId, serverId, path, content || '');
      
      logger.info(`User ${user.username} wrote file: ${path} to server ${server.name} (${serverId}) (${(content || '').length} chars)`);

      // Send response back to client
      socket.emit('file:write:response', {
        path,
        success: response.success,
        message: response.message
      });

    } catch (error) {
      logger.error(`Failed to write file ${path} to server ${serverId}:`, error);
      socket.emit('file:write:error', { error: 'Failed to write file' });
    }
  }

  public static emitToUser(userId: string, event: string, data: unknown): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public static emitToServer(serverId: string, event: string, data: unknown): void {
    this.io.to(`server:${serverId}`).emit(event, data);
  }

  public static emitToAll(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  public static getConnectedUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  public static broadcastMonitoring(event: string, data: unknown): void {
    // Check if WebSocket server is initialized
    if (!this.io) {
      logger.warn('WebSocket server not initialized, skipping broadcast:', event);
      return;
    }
    this.io.to('monitoring').emit(event, data);
  }

  public static emitMetricsUpdate(metrics: Record<string, unknown>): void {
    // Check if WebSocket server is initialized
    if (!this.io) {
      return; // Silently skip if not initialized
    }
    this.broadcastMonitoring('metrics:update', {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  public static emitServerStatusUpdate(statusData: unknown): void {
    // Check if WebSocket server is initialized
    if (!this.io) {
      return; // Silently skip if not initialized
    }
    this.broadcastMonitoring('server:status', statusData);
  }
}

export default SocketService;
