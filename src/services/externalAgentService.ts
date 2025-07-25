import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

export interface AgentCommand {
  action: string;
  serverId?: string;
  payload?: any;
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface AgentStatus {
  online: boolean;
  version?: string;
  uptime?: number;
  serverCount?: number;
  lastSeen?: Date;
}

export interface ExternalAgent {
  id: string;
  nodeId: string;
  nodeUuid: string;
  baseUrl: string;
  apiKey: string;
  isOnline: boolean;
  lastSeen?: Date;
  version?: string;
}

export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  extension?: string;
}

export interface FileListResponse {
  path: string;
  files: FileInfo[];
}

/**
 * Service for communicating with external agent processes
 * Agents are separate projects that run on nodes and manage game servers
 */
export class ExternalAgentService {
  private static instance: ExternalAgentService;
  private agents: Map<string, ExternalAgent> = new Map();
  private httpClients: Map<string, AxiosInstance> = new Map();

  private constructor() {
    this.initializeAgents();
  }

  public static getInstance(): ExternalAgentService {
    if (!ExternalAgentService.instance) {
      ExternalAgentService.instance = new ExternalAgentService();
    }
    return ExternalAgentService.instance;
  }

  /**
   * Initialize agents from database/configuration
   * This should load agent connection details from the nodes table
   */
  private async initializeAgents(): Promise<void> {
    try {
      // TODO: Load agent configurations from database
      // For now, this is a placeholder for the agent discovery/registration system
      logger.info('External agent service initialized');
    } catch (error) {
      logger.error('Failed to initialize external agents:', error);
    }
  }

  /**
   * Register a new external agent
   */
  public registerAgent(agent: ExternalAgent): void {
    this.agents.set(agent.nodeUuid, agent);
    
    // Create HTTP client for this agent
    const client = axios.create({
      baseURL: agent.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${agent.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.httpClients.set(agent.nodeUuid, client);
    logger.info(`Registered external agent for node ${agent.nodeUuid} at ${agent.baseUrl}`);
  }

  /**
   * Remove an agent registration
   */
  public unregisterAgent(nodeUuid: string): void {
    this.agents.delete(nodeUuid);
    this.httpClients.delete(nodeUuid);
    logger.info(`Unregistered external agent for node ${nodeUuid}`);
  }

  /**
   * Get agent status
   */
  public async getAgentStatus(nodeUuid: string): Promise<AgentStatus | null> {
    const client = this.httpClients.get(nodeUuid);
    if (!client) {
      logger.warn(`No agent client found for node ${nodeUuid}`);
      return null;
    }

    try {
      const response: AxiosResponse<AgentStatus> = await client.get('/api/status');
      const agent = this.agents.get(nodeUuid);
      if (agent) {
        agent.isOnline = true;
        agent.lastSeen = new Date();
        agent.version = response.data.version;
      }
      return response.data;
    } catch (error) {
      logger.error(`Failed to get status from agent ${nodeUuid}:`, error);
      const agent = this.agents.get(nodeUuid);
      if (agent) {
        agent.isOnline = false;
      }
      return { online: false };
    }
  }

  /**
   * Send command to external agent
   */
  public async sendCommand(nodeUuid: string, command: AgentCommand): Promise<AgentResponse> {
    const client = this.httpClients.get(nodeUuid);
    if (!client) {
      return {
        success: false,
        error: `No agent registered for node ${nodeUuid}`
      };
    }

    try {
      logger.info(`Sending command to agent ${nodeUuid}:`, command);
      const response: AxiosResponse<AgentResponse> = await client.post('/api/command', command);
      
      // Update agent status
      const agent = this.agents.get(nodeUuid);
      if (agent) {
        agent.isOnline = true;
        agent.lastSeen = new Date();
      }

      return response.data;
    } catch (error) {
      logger.error(`Failed to send command to agent ${nodeUuid}:`, error);
      
      // Mark agent as offline if request failed
      const agent = this.agents.get(nodeUuid);
      if (agent) {
        agent.isOnline = false;
      }

      return {
        success: false,
        error: `Failed to communicate with agent: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a server via external agent
   */
  public async createServer(nodeUuid: string, serverId: string, serverConfig: any): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'create_server',
      serverId,
      payload: serverConfig
    });
  }

  /**
   * Start a server via external agent
   */
  public async startServer(nodeUuid: string, serverId: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'start_server',
      serverId,
      payload: {}
    });
  }

  /**
   * Stop a server via external agent
   */
  public async stopServer(nodeUuid: string, serverId: string, signal: string = 'SIGTERM', timeout: number = 30): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'stop_server',
      serverId,
      payload: { signal, timeout }
    });
  }

  /**
   * Restart a server via external agent
   */
  public async restartServer(nodeUuid: string, serverId: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'restart_server',
      serverId,
      payload: {}
    });
  }

  /**
   * Kill a server via external agent
   */
  public async killServer(nodeUuid: string, serverId: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'kill_server',
      serverId,
      payload: {}
    });
  }

  /**
   * Get server status from external agent
   */
  public async getServerStatus(nodeUuid: string, serverId: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'get_server_status',
      serverId,
      payload: {}
    });
  }

  /**
   * Get server logs from external agent
   */
  public async getServerLogs(nodeUuid: string, serverId: string, lines: number = 100): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'get_server_logs',
      serverId,
      payload: { lines }
    });
  }

  /**
   * Send command to server via external agent
   */
  public async sendServerCommand(nodeUuid: string, serverId: string, command: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'send_server_command',
      serverId,
      payload: { command }
    });
  }

  /**
   * Get all registered agents
   */
  public getAgents(): ExternalAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Check if agent is available for a node
   */
  public isAgentAvailable(nodeUuid: string): boolean {
    const agent = this.agents.get(nodeUuid);
    return agent ? agent.isOnline : false;
  }

  /**
   * Install a mod via external agent
   */
  public async installMod(nodeUuid: string, serverId: string, modData: any): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'install_mod',
      serverId,
      payload: modData
    });
  }

  /**
   * Get server metrics from external agent
   */
  public async getServerMetrics(nodeUuid: string, serverId: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'get_server_metrics',
      serverId,
      payload: {}
    });
  }

  // =====================================================
  // FILE MANAGEMENT METHODS VIA EXTERNAL AGENTS
  // =====================================================

  /**
   * List files in a directory via external agent
   */
  public async listFiles(nodeUuid: string, serverId: string, path: string = '/'): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'list_files',
      serverId,
      payload: { path }
    });
  }

  /**
   * Read file content via external agent
   */
  public async readFile(nodeUuid: string, serverId: string, filePath: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'read_file',
      serverId,
      payload: { path: filePath }
    });
  }

  /**
   * Write file content via external agent
   */
  public async writeFile(nodeUuid: string, serverId: string, filePath: string, content: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'write_file',
      serverId,
      payload: { path: filePath, content }
    });
  }

  /**
   * Create directory via external agent
   */
  public async createDirectory(nodeUuid: string, serverId: string, path: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'create_directory',
      serverId,
      payload: { path }
    });
  }

  /**
   * Delete file or directory via external agent
   */
  public async deleteFile(nodeUuid: string, serverId: string, path: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'delete_file',
      serverId,
      payload: { path }
    });
  }

  /**
   * Rename/move file or directory via external agent
   */
  public async renameFile(nodeUuid: string, serverId: string, oldPath: string, newPath: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'rename_file',
      serverId,
      payload: { oldPath, newPath }
    });
  }

  /**
   * Download file via external agent (returns file data)
   */
  public async downloadFile(nodeUuid: string, serverId: string, filePath: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'download_file',
      serverId,
      payload: { path: filePath }
    });
  }

  /**
   * Upload file via external agent
   */
  public async uploadFile(nodeUuid: string, serverId: string, filePath: string, fileData: string | Buffer): Promise<AgentResponse> {
    // Convert Buffer to base64 for transmission
    const content = Buffer.isBuffer(fileData) ? fileData.toString('base64') : fileData;
    const isBase64 = Buffer.isBuffer(fileData);

    return this.sendCommand(nodeUuid, {
      action: 'upload_file',
      serverId,
      payload: { 
        path: filePath, 
        content,
        encoding: isBase64 ? 'base64' : 'utf8'
      }
    });
  }

  /**
   * Get file information via external agent
   */
  public async getFileInfo(nodeUuid: string, serverId: string, filePath: string): Promise<AgentResponse> {
    return this.sendCommand(nodeUuid, {
      action: 'get_file_info',
      serverId,
      payload: { path: filePath }
    });
  }

  /**
   * Health check for all registered agents
   */
  public async healthCheckAll(): Promise<Map<string, AgentStatus>> {
    const results = new Map<string, AgentStatus>();
    
    for (const [nodeUuid] of this.agents) {
      const status = await this.getAgentStatus(nodeUuid);
      if (status) {
        results.set(nodeUuid, status);
      }
    }
    
    return results;
  }
}

export default ExternalAgentService;
