import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { Node, Agent, AgentStatus, AgentSystemInfo } from '../types';

export interface AgentConnection {
  nodeId: string;
  websocket: WebSocket;
  lastHeartbeat: Date;
  status: AgentStatus;
  systemInfo?: AgentSystemInfo;
}

export interface AgentMessage {
  type: string;
  data: any;
  messageId?: string;
  timestamp: Date;
}

export interface ServerCreateData {
  serverId: string;
  image: string;
  startup: string;
  environment: Record<string, any>;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
  };
}

export interface ServerUpdateData {
  limits?: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
  };
  environment?: Record<string, any>;
  startup?: string;
}

export class AgentService extends EventEmitter {
  private static instance: AgentService;
  private connections: Map<string, AgentConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public static async initialize(): Promise<AgentService> {
    if (!this.instance) {
      this.instance = new AgentService();
      await this.instance.start();
    }
    return this.instance;
  }

  public static getInstance(): AgentService {
    if (!this.instance) {
      throw new Error('AgentService not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  public async start(): Promise<void> {
    // Start WebSocket server for agent connections
    this.startWebSocketServer();

    // Start heartbeat checker
    this.startHeartbeatChecker();

    logger.info('Agent service started');
  }

  private startWebSocketServer(): void {
    const wss = new WebSocket.Server({
      port: parseInt(process.env.AGENT_PORT || '8080'),
      verifyClient: this.verifyAgent.bind(this)
    });

    wss.on('connection', (ws: WebSocket, req) => {
      const nodeId = this.extractNodeIdFromRequest(req);

      if (!nodeId) {
        ws.close(1008, 'Invalid node ID');
        return;
      }

      this.handleAgentConnection(nodeId, ws);
    });

    logger.info(`Agent WebSocket server listening on port ${process.env.AGENT_PORT || '8080'}`);
  }

  private verifyAgent(info: any): boolean {
    // TODO: Implement proper agent authentication
    const token = info.req.headers.authorization;
    return token === `Bearer ${process.env.AGENT_SECRET}`;
  }

  private extractNodeIdFromRequest(req: any): string | null {
    // Extract node ID from query parameters or headers
    return req.url?.split('nodeId=')[1]?.split('&')[0] || null;
  }

  private handleAgentConnection(nodeId: string, ws: WebSocket): void {
    logger.info(`Agent connected for node: ${nodeId}`);

    const connection: AgentConnection = {
      nodeId,
      websocket: ws,
      lastHeartbeat: new Date(),
      status: AgentStatus.ONLINE
    };

    this.connections.set(nodeId, connection);

    ws.on('message', (data: WebSocket.Data) => {
      this.handleAgentMessage(nodeId, data);
    });

    ws.on('close', () => {
      logger.info(`Agent disconnected for node: ${nodeId}`);
      const conn = this.connections.get(nodeId);
      if (conn) {
        conn.status = AgentStatus.OFFLINE;
      }
    });

    ws.on('error', (error) => {
      logger.error(`Agent error for node ${nodeId}:`, error);
      const conn = this.connections.get(nodeId);
      if (conn) {
        conn.status = AgentStatus.ERROR;
      }
    });

    // Send initial system info request
    this.sendToAgent(nodeId, { type: 'system_info_request' });
  }

  private handleAgentMessage(nodeId: string, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.connections.get(nodeId);

      if (!connection) {
        return;
      }

      switch (message.type) {
        case 'heartbeat':
          connection.lastHeartbeat = new Date();
          connection.status = AgentStatus.ONLINE;
          break;

        case 'system_info':
          this.handleSystemInfo(nodeId, message.data);
          break;

        case 'server_status':
          this.handleServerStatus(nodeId, message.data);
          break;

        case 'server_output':
          this.handleServerOutput(nodeId, message.data);
          break;

        case 'file_content':
          this.handleFileContent(nodeId, message.data);
          break;

        default:
          logger.warn(`Unknown message type from agent ${nodeId}: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Failed to parse agent message from ${nodeId}:`, error);
    }
  }

  private handleSystemInfo(nodeId: string, systemInfo: AgentSystemInfo): void {
    logger.debug(`Received system info from node ${nodeId}:`, systemInfo);
    this.emit('system_info', { nodeId, systemInfo });
  }

  private handleServerStatus(nodeId: string, serverStatus: any): void {
    logger.debug(`Received server status from node ${nodeId}:`, serverStatus);
    this.emit('server_status', { nodeId, serverStatus });
  }

  private handleServerOutput(nodeId: string, output: any): void {
    this.emit('server_output', { nodeId, output });
  }

  private handleFileContent(nodeId: string, fileData: any): void {
    this.emit('file_content', { nodeId, fileData });
  }

  public sendToAgent(nodeId: string, message: any): boolean {
    const connection = this.connections.get(nodeId);

    if (!connection || !connection.websocket || connection.status !== AgentStatus.ONLINE) {
      logger.warn(`Cannot send message to offline agent: ${nodeId}`);
      return false;
    }

    try {
      connection.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Failed to send message to agent ${nodeId}:`, error);
      return false;
    }
  }

  /**
   * Send command to agent and return promise-based response
   */
  public async sendCommand(nodeId: string, command: any): Promise<{ success: boolean; error?: string; data?: any }> {
    const connection = this.connections.get(nodeId);

    if (!connection || !connection.websocket || connection.status !== AgentStatus.ONLINE) {
      return {
        success: false,
        error: `Agent ${nodeId} is not online`
      };
    }

    try {
      // Generate unique message ID for request tracking
      const messageId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message = {
        id: messageId,
        type: 'command',
        timestamp: new Date().toISOString(),
        agentId: nodeId,
        ...command
      };

      // Send the command
      connection.websocket.send(JSON.stringify(message));
      
      // For now, return success immediately
      // TODO: Implement proper request/response tracking with timeouts
      return {
        success: true,
        data: { messageId, command: command.action }
      };
    } catch (error) {
      logger.error(`Failed to send command to agent ${nodeId}:`, error);
      return {
        success: false,
        error: `Failed to send command: ${error}`
      };
    }
  }

  public async executeServerCommand(nodeId: string, serverId: string, command: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'server_command',
      data: {
        serverId,
        command
      }
    });
  }

  public async startServer(nodeId: string, serverId: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'server_start',
      data: { serverId }
    });
  }

  public async stopServer(nodeId: string, serverId: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'server_stop',
      data: { serverId }
    });
  }

  public async restartServer(nodeId: string, serverId: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'server_restart',
      data: { serverId }
    });
  }

  public async readFile(nodeId: string, serverId: string, path: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'file_read',
      data: {
        serverId,
        path
      }
    });
  }

  public async writeFile(nodeId: string, serverId: string, path: string, content: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'file_write',
      data: {
        serverId,
        path,
        content
      }
    });
  }

  /**
   * Create a new server on an agent
   */
  public async createServer(nodeFqdn: string, data: ServerCreateData): Promise<boolean> {
    // For now, find by FQDN - in production this would be a proper lookup
    const nodeId = Array.from(this.connections.keys()).find(id =>
      this.connections.get(id)?.status === AgentStatus.ONLINE
    );

    if (!nodeId) {
      throw new Error(`No online agent found for node ${nodeFqdn}`);
    }

    return this.sendToAgent(nodeId, {
      type: 'server_create',
      data
    });
  }

  /**
   * Update a server on an agent
   */
  public async updateServer(nodeFqdn: string, serverId: string, data: ServerUpdateData): Promise<boolean> {
    const nodeId = Array.from(this.connections.keys()).find(id =>
      this.connections.get(id)?.status === AgentStatus.ONLINE
    );

    if (!nodeId) {
      throw new Error(`No online agent found for node ${nodeFqdn}`);
    }

    return this.sendToAgent(nodeId, {
      type: 'server_update',
      data: {
        serverId,
        ...data
      }
    });
  }

  /**
   * Delete a server on an agent
   */
  public async deleteServer(nodeFqdn: string, serverId: string): Promise<boolean> {
    const nodeId = Array.from(this.connections.keys()).find(id =>
      this.connections.get(id)?.status === AgentStatus.ONLINE
    );

    if (!nodeId) {
      throw new Error(`No online agent found for node ${nodeFqdn}`);
    }

    return this.sendToAgent(nodeId, {
      type: 'server_delete',
      data: { serverId }
    });
  }

  /**
   * Suspend a server on an agent
   */
  public async suspendServer(nodeFqdn: string, serverId: string): Promise<boolean> {
    const nodeId = Array.from(this.connections.keys()).find(id =>
      this.connections.get(id)?.status === AgentStatus.ONLINE
    );

    if (!nodeId) {
      throw new Error(`No online agent found for node ${nodeFqdn}`);
    }

    return this.sendToAgent(nodeId, {
      type: 'server_suspend',
      data: { serverId }
    });
  }

  /**
   * Unsuspend a server on an agent
   */
  public async unsuspendServer(nodeFqdn: string, serverId: string): Promise<boolean> {
    const nodeId = Array.from(this.connections.keys()).find(id =>
      this.connections.get(id)?.status === AgentStatus.ONLINE
    );

    if (!nodeId) {
      throw new Error(`No online agent found for node ${nodeFqdn}`);
    }

    return this.sendToAgent(nodeId, {
      type: 'server_unsuspend',
      data: { serverId }
    });
  }

  /**
   * Reinstall a server on an agent
   */
  public async reinstallServer(nodeFqdn: string, serverId: string): Promise<boolean> {
    const nodeId = Array.from(this.connections.keys()).find(id =>
      this.connections.get(id)?.status === AgentStatus.ONLINE
    );

    if (!nodeId) {
      throw new Error(`No online agent found for node ${nodeFqdn}`);
    }

    return this.sendToAgent(nodeId, {
      type: 'server_reinstall',
      data: { serverId }
    });
  }

  /**
   * Send power action to a server
   */
  public async sendPowerAction(nodeId: string, serverId: string, action: string): Promise<boolean> {
    return this.sendToAgent(nodeId, {
      type: 'server_power',
      data: { serverId, action }
    });
  }

  public getAgentStatus(nodeId: string): AgentStatus {
    const connection = this.connections.get(nodeId);
    return connection?.status || AgentStatus.OFFLINE;
  }

  public getConnectedAgents(): string[] {
    return Array.from(this.connections.keys()).filter(nodeId =>
      this.connections.get(nodeId)?.status === AgentStatus.ONLINE
    );
  }

  private startHeartbeatChecker(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const heartbeatTimeout = 60000; // 1 minute

      for (const [nodeId, connection] of this.connections) {
        const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();

        if (timeSinceHeartbeat > heartbeatTimeout && connection.status === AgentStatus.ONLINE) {
          logger.warn(`Agent ${nodeId} heartbeat timeout`);
          connection.status = AgentStatus.OFFLINE;
          this.emit('agent_offline', { nodeId });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  public async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all agent connections
    for (const connection of this.connections.values()) {
      if (connection.websocket) {
        connection.websocket.close();
      }
    }

    this.connections.clear();
    logger.info('Agent service shut down');
  }
}

export default AgentService;
