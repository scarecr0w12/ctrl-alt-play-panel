import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { User } from '../types';
import DatabaseService from './database';

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

  private static handleServerCommand(socket: Socket, data: { serverId: string; command: string }): void {
    const { serverId, command } = data;
    const user = (socket as unknown as { user: User }).user;

    // TODO: Validate user has access to server
    // TODO: Send command to agent
    logger.info(`User ${user.username} sent command to server ${serverId}: ${command}`);

    // Broadcast command to server room
    this.io.to(`server:${serverId}`).emit('server:output', {
      type: 'command',
      data: command,
      timestamp: new Date()
    });
  }

  private static async handleConsoleJoin(socket: Socket, data: { serverId: string }): Promise<void> {
    const { serverId } = data;
    const user = (socket as unknown as { user: User }).user;

    try {
      // TODO: Validate user has access to server
      logger.info(`User ${user.username} joined console for server ${serverId}`);
      
      // Join server-specific console room
      socket.join(`console:${serverId}`);
      
      // Notify successful connection
      socket.emit('console:connection', { connected: true });
      
      // Send welcome message
      socket.emit('console:output', {
        message: `Connected to server ${serverId} console`,
        timestamp: new Date().toISOString(),
        type: 'info'
      });

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

    // TODO: Send input to external agent for the server
    logger.debug(`Console input for server ${serverId}: ${inputData}`);
    
    // Echo the input back to the terminal (for now)
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
      // TODO: Execute accumulated command on external agent
      logger.info(`User ${user.username} executed command on server ${serverId}`);
      
      // For now, just acknowledge execution
      socket.emit('console:command:response', {
        success: true,
        message: 'Command sent to server'
      });

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

    // TODO: Send backspace to external agent
    logger.debug(`Console backspace for server ${serverId}`);
    
    // Echo backspace to terminal
    socket.emit('console:output', {
      message: '\b \b',
      timestamp: new Date().toISOString(),
      type: 'control'
    });
  }

  private static handleConsoleInterrupt(socket: Socket, data: { serverId: string }): void {
    const { serverId } = data;
    const user = (socket as unknown as { user: User }).user;

    // TODO: Send interrupt signal to external agent
    logger.info(`User ${user.username} sent interrupt to server ${serverId}`);
    
    // Acknowledge interrupt
    socket.emit('console:output', {
      message: 'Interrupt signal sent',
      timestamp: new Date().toISOString(),
      type: 'warning'
    });
  }

  private static handleFileRead(socket: Socket, data: { serverId: string; path: string }): void {
    const { serverId, path } = data;
    const user = (socket as unknown as { user: User }).user;

    // TODO: Validate user has access to server and file
    // TODO: Read file from agent
    logger.info(`User ${user.username} requested file read: ${path} on server ${serverId}`);
  }

  private static handleFileWrite(socket: Socket, data: { serverId: string; path: string; content: string }): void {
    const { serverId, path, content } = data;
    const user = (socket as unknown as { user: User }).user;

    // TODO: Validate user has access to server and file
    // TODO: Write file via agent
    logger.info(`User ${user.username} requested file write: ${path} on server ${serverId} (${content.length} chars)`);
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
    this.io.to('monitoring').emit(event, data);
  }

  public static emitMetricsUpdate(metrics: Record<string, unknown>): void {
    this.broadcastMonitoring('metrics:update', {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  public static emitServerStatusUpdate(statusData: unknown): void {
    this.broadcastMonitoring('server:status', statusData);
  }
}

export default SocketService;
