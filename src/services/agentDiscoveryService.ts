import { ExternalAgentService, ExternalAgent } from './externalAgentService';
import DatabaseService from './database';
import { logger } from '../utils/logger';

/**
 * Service for discovering and registering external agents
 * Handles agent registration, health checks, and discovery
 */
export class AgentDiscoveryService {
  private static instance: AgentDiscoveryService;
  private externalAgentService: ExternalAgentService;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.externalAgentService = ExternalAgentService.getInstance();
  }

  public static getInstance(): AgentDiscoveryService {
    if (!AgentDiscoveryService.instance) {
      AgentDiscoveryService.instance = new AgentDiscoveryService();
    }
    return AgentDiscoveryService.instance;
  }

  /**
   * Start the agent discovery and health check services
   */
  public async start(): Promise<void> {
    logger.info('Starting agent discovery service...');
    
    // Initial discovery
    await this.discoverAgents();
    
    // Set up periodic discovery (every 5 minutes)
    this.discoveryInterval = setInterval(async () => {
      await this.discoverAgents();
    }, 5 * 60 * 1000);

    // Set up health checks (every 30 seconds)
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30 * 1000);

    logger.info('Agent discovery service started');
  }

  /**
   * Stop the agent discovery service
   */
  public stop(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('Agent discovery service stopped');
  }

  /**
   * Discover and register agents from nodes in the database
   */
  private async discoverAgents(): Promise<void> {
    try {
      logger.info('Starting agent discovery...');
      
      const db = DatabaseService.getInstance();
      const nodes = await db.node.findMany();

      for (const node of nodes) {
        // Check if agent is already registered
        const agents = this.externalAgentService.getAgents();
        const existingAgent = agents.find(agent => agent.nodeUuid === node.uuid);

        if (!existingAgent) {
          // Try to discover agent on this node
          await this.tryDiscoverAgent(node);
        }
      }
    } catch (error) {
      logger.error('Failed to discover agents:', error);
    }
  }

  /**
   * Try to discover an agent on a specific node
   */
  private async tryDiscoverAgent(node: any): Promise<void> {
    try {
      // Construct potential agent health URLs for the Go agent
      const potentialUrls = [
        `${node.scheme}://${node.fqdn}:8081`, // Default Go agent health port
        `${node.scheme}://${node.fqdn}:${node.port + 1}`, // Standard agent port offset
        `${node.scheme}://${node.fqdn}:${node.port + 100}`, // Alternative port offset
        `${node.scheme}://${node.fqdn}:8080`, // Common agent port
        `${node.scheme}://${node.fqdn}:3001`, // Development agent port
      ];

      for (const baseUrl of potentialUrls) {
        try {
          // Try to ping the agent health endpoint (Go agent uses /health)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const healthInfo = await response.json() as any;
            
            // Check if this is our Go-based ctrl-alt-play-agent
            if (healthInfo && (healthInfo.nodeId || healthInfo.status === 'healthy')) {
              // Found a ctrl-alt-play-agent! Register it
              const agent: ExternalAgent = {
                id: `agent-${node.uuid}`,
                nodeId: node.id,
                nodeUuid: node.uuid,
                baseUrl,
                apiKey: node.daemonToken, // Use daemon token as API key
                isOnline: healthInfo.status === 'healthy' && healthInfo.connected !== false,
                lastSeen: new Date(),
                version: healthInfo.version || 'unknown'
              };

              this.externalAgentService.registerAgent(agent);
              logger.info(`Discovered and registered Go agent for node ${node.name} at ${baseUrl}`);
              logger.info(`Agent details: NodeID=${healthInfo.nodeId}, Version=${healthInfo.version}, Connected=${healthInfo.connected}`);
              break; // Found agent on this node, stop trying other URLs
            }
          }
        } catch (error) {
          // This URL didn't work, try the next one
          continue;
        }
      }
    } catch (error) {
      logger.warn(`Failed to discover agent for node ${node.name}:`, error);
    }
  }

  /**
   * Perform health checks on all registered agents
   */
  private async performHealthChecks(): Promise<void> {
    try {
      await this.externalAgentService.healthCheckAll();
    } catch (error) {
      logger.error('Failed to perform agent health checks:', error);
    }
  }

  /**
   * Manually register an agent
   */
  public async registerAgent(nodeUuid: string, baseUrl: string, apiKey?: string): Promise<boolean> {
    try {
      // Get node info from database
      const db = DatabaseService.getInstance();
      const node = await db.node.findFirst({
        where: { uuid: nodeUuid }
      });

      if (!node) {
        logger.error(`Node not found: ${nodeUuid}`);
        return false;
      }

      // Create agent registration
      const agent: ExternalAgent = {
        id: `agent-${nodeUuid}`,
        nodeId: node.id,
        nodeUuid,
        baseUrl,
        apiKey: apiKey || node.daemonToken,
        isOnline: false,
        lastSeen: undefined,
        version: undefined
      };

      // Test the connection
      const status = await this.externalAgentService.getAgentStatus(nodeUuid);
      if (status && status.online) {
        agent.isOnline = true;
        agent.lastSeen = new Date();
        agent.version = status.version;

        this.externalAgentService.registerAgent(agent);
        logger.info(`Manually registered agent for node ${nodeUuid} at ${baseUrl}`);
        return true;
      } else {
        logger.warn(`Failed to connect to agent at ${baseUrl}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to register agent for node ${nodeUuid}:`, error);
      return false;
    }
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(nodeUuid: string): void {
    this.externalAgentService.unregisterAgent(nodeUuid);
    logger.info(`Unregistered agent for node ${nodeUuid}`);
  }

  /**
   * Get status of all registered agents
   */
  public getAgentStatuses(): ExternalAgent[] {
    return this.externalAgentService.getAgents();
  }

  /**
   * Force rediscovery of agents
   */
  public async forceDiscovery(): Promise<void> {
    logger.info('Forcing agent rediscovery...');
    await this.discoverAgents();
  }
}

export default AgentDiscoveryService;
