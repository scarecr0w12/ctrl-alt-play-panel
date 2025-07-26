import { logger } from '../utils/logger';
import DatabaseService from './database';

export interface ServerAgentMapping {
  serverId: string;
  nodeUuid: string;
  serverName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service to manage the mapping between servers and their corresponding agents
 * This determines which agent should handle operations for each server
 */
export class ServerAgentMappingService {
  private static instance: ServerAgentMappingService;
  private mappings: Map<string, ServerAgentMapping> = new Map();

  private constructor() {
    this.initializeMappings();
  }

  public static getInstance(): ServerAgentMappingService {
    if (!ServerAgentMappingService.instance) {
      ServerAgentMappingService.instance = new ServerAgentMappingService();
    }
    return ServerAgentMappingService.instance;
  }

  /**
   * Initialize mappings from database
   */
  private async initializeMappings(): Promise<void> {
    try {
      // Load server-to-agent mappings from database
      const db = DatabaseService.getInstance();
      const servers = await db.server.findMany({
        where: {
          nodeId: { not: '' }
        },
        include: {
          node: {
            select: {
              uuid: true,
              name: true
            }
          }
        }
      });

      // Initialize mappings
      for (const server of servers) {
        if (server.nodeId && server.node) {
          this.mappings.set(server.uuid, {
            serverId: server.uuid,
            nodeUuid: server.node.uuid,
            serverName: server.name,
            isActive: server.status !== 'OFFLINE',
            createdAt: server.createdAt,
            updatedAt: server.updatedAt
          });
        }
      }

      logger.info(`Server-Agent mapping service initialized with ${servers.length} mappings`);
    } catch (error) {
      logger.error('Failed to initialize server-agent mappings:', error);
    }
  }

  /**
   * Add or update a server-to-agent mapping
   */
  public addMapping(mapping: ServerAgentMapping): void {
    this.mappings.set(mapping.serverId, {
      ...mapping,
      updatedAt: new Date()
    });
    logger.info(`Added server-agent mapping: ${mapping.serverId} -> ${mapping.nodeUuid}`);
  }

  /**
   * Remove a server-to-agent mapping
   */
  public removeMapping(serverId: string): void {
    if (this.mappings.delete(serverId)) {
      logger.info(`Removed server-agent mapping for server ${serverId}`);
    }
  }

  /**
   * Get the agent UUID for a server
   */
  public getAgentForServer(serverId: string): string | null {
    const mapping = this.mappings.get(serverId);
    if (mapping && mapping.isActive) {
      return mapping.nodeUuid;
    }
    return null;
  }

  /**
   * Get all servers for a specific agent
   */
  public getServersForAgent(nodeUuid: string): ServerAgentMapping[] {
    return Array.from(this.mappings.values()).filter(
      mapping => mapping.nodeUuid === nodeUuid && mapping.isActive
    );
  }

  /**
   * Get all active mappings
   */
  public getAllMappings(): ServerAgentMapping[] {
    return Array.from(this.mappings.values()).filter(mapping => mapping.isActive);
  }

  /**
   * Check if a server has an active agent mapping
   */
  public hasAgentMapping(serverId: string): boolean {
    const mapping = this.mappings.get(serverId);
    return mapping ? mapping.isActive : false;
  }

  /**
   * Update mapping status
   */
  public updateMappingStatus(serverId: string, isActive: boolean): void {
    const mapping = this.mappings.get(serverId);
    if (mapping) {
      mapping.isActive = isActive;
      mapping.updatedAt = new Date();
      logger.info(`Updated mapping status for server ${serverId}: ${isActive ? 'active' : 'inactive'}`);
    }
  }

  /**
   * Validate that a server can be operated on (has active agent)
   */
  public validateServerAgent(serverId: string): { valid: boolean; nodeUuid?: string; error?: string } {
    const mapping = this.mappings.get(serverId);
    
    if (!mapping) {
      return {
        valid: false,
        error: `No agent mapping found for server ${serverId}`
      };
    }

    if (!mapping.isActive) {
      return {
        valid: false,
        error: `Server ${serverId} has inactive agent mapping`
      };
    }

    return {
      valid: true,
      nodeUuid: mapping.nodeUuid
    };
  }

  /**
   * Bulk load mappings from database result
   */
  public loadMappings(servers: any[]): void {
    for (const server of servers) {
      if (server.nodeId) {
        this.addMapping({
          serverId: server.id,
          nodeUuid: server.node?.uuid || server.nodeId,
          serverName: server.name,
          isActive: server.status !== 'deleted',
          createdAt: server.createdAt || new Date(),
          updatedAt: server.updatedAt || new Date()
        });
      }
    }
    logger.info(`Loaded ${servers.length} server-agent mappings`);
  }

  /**
   * Refresh mappings from database
   */
  public async refreshMappings(): Promise<void> {
    try {
      // Clear existing mappings
      this.mappings.clear();
      
      // Reload from database
      await this.initializeMappings();
      
      logger.info('Server-agent mappings refreshed from database');
    } catch (error) {
      logger.error('Failed to refresh server-agent mappings:', error);
    }
  }
}

export default ServerAgentMappingService;