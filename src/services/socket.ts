import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { User } from '../types';

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        (socket as any).user = decoded.user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as User;
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

      // Handle server console commands
      socket.on('server:command', (data) => {
        this.handleServerCommand(socket, data);
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
    // TODO: Get user's servers from database and join rooms
    // For now, just log the action
    logger.debug(`Joining user ${user.username} to their server rooms`);
  }

  private static handleServerCommand(socket: Socket, data: any): void {
    const { serverId, command } = data;
    const user = (socket as any).user as User;

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

  private static handleFileRead(socket: Socket, data: any): void {
    const { serverId, path } = data;
    const user = (socket as any).user as User;

    // TODO: Validate user has access to server and file
    // TODO: Read file from agent
    logger.info(`User ${user.username} requested file read: ${path} on server ${serverId}`);
  }

  private static handleFileWrite(socket: Socket, data: any): void {
    const { serverId, path, content } = data;
    const user = (socket as any).user as User;

    // TODO: Validate user has access to server and file
    // TODO: Write file via agent
    logger.info(`User ${user.username} requested file write: ${path} on server ${serverId}`);
  }

  public static emitToUser(userId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public static emitToServer(serverId: string, event: string, data: any): void {
    this.io.to(`server:${serverId}`).emit(event, data);
  }

  public static emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public static getConnectedUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  public static broadcastMonitoring(event: string, data: any): void {
    this.io.to('monitoring').emit(event, data);
  }

  public static emitMetricsUpdate(metrics: any): void {
    this.broadcastMonitoring('metrics:update', {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  public static emitServerStatusUpdate(statusData: any): void {
    this.broadcastMonitoring('server:status', statusData);
  }
}

export default SocketService;
