import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/permissions';
import { ExternalAgentService } from '../services/externalAgentService';
import { AgentDiscoveryService } from '../services/agentDiscoveryService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all registered agents
 * GET /api/agents
 */
router.get('/', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const agentDiscoveryService = AgentDiscoveryService.getInstance();
    const agents = agentDiscoveryService.getAgentStatuses();

    return res.json({
      success: true,
      data: agents,
      meta: {
        total: agents.length,
        online: agents.filter(agent => agent.isOnline).length,
        offline: agents.filter(agent => !agent.isOnline).length
      }
    });
  } catch (error) {
    logger.error('Failed to get agents:', error);
    return res.status(500).json({ error: 'Failed to get agents' });
  }
});

/**
 * Get agent status for a specific node
 * GET /api/agents/:nodeUuid/status
 */
router.get('/:nodeUuid/status', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    const externalAgentService = ExternalAgentService.getInstance();

    const status = await externalAgentService.getAgentStatus(nodeUuid);
    
    if (!status) {
      return res.status(404).json({ error: 'Agent not found or not registered' });
    }

    return res.json({
      success: true,
      data: {
        nodeUuid,
        status
      }
    });
  } catch (error) {
    logger.error('Failed to get agent status:', error);
    return res.status(500).json({ error: 'Failed to get agent status' });
  }
});

/**
 * Manually register an agent
 * POST /api/agents/register
 */
router.post('/register', authenticateToken, requirePermission('agents.manage'), async (req, res) => {
  try {
    const { nodeUuid, baseUrl, apiKey } = req.body;

    if (!nodeUuid || !baseUrl) {
      return res.status(400).json({ error: 'nodeUuid and baseUrl are required' });
    }

    const agentDiscoveryService = AgentDiscoveryService.getInstance();
    const success = await agentDiscoveryService.registerAgent(nodeUuid, baseUrl, apiKey);

    if (success) {
      return res.json({
        success: true,
        message: 'Agent registered successfully',
        data: { nodeUuid, baseUrl }
      });
    } else {
      return res.status(400).json({ error: 'Failed to register agent - could not connect' });
    }
  } catch (error) {
    logger.error('Failed to register agent:', error);
    return res.status(500).json({ error: 'Failed to register agent' });
  }
});

/**
 * Unregister an agent
 * DELETE /api/agents/:nodeUuid
 */
router.delete('/:nodeUuid', authenticateToken, requirePermission('agents.manage'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    
    const agentDiscoveryService = AgentDiscoveryService.getInstance();
    agentDiscoveryService.unregisterAgent(nodeUuid);

    return res.json({
      success: true,
      message: 'Agent unregistered successfully',
      data: { nodeUuid }
    });
  } catch (error) {
    logger.error('Failed to unregister agent:', error);
    return res.status(500).json({ error: 'Failed to unregister agent' });
  }
});

/**
 * Force agent discovery
 * POST /api/agents/discover
 */
router.post('/discover', authenticateToken, requirePermission('agents.manage'), async (req, res) => {
  try {
    const agentDiscoveryService = AgentDiscoveryService.getInstance();
    await agentDiscoveryService.forceDiscovery();

    return res.json({
      success: true,
      message: 'Agent discovery completed'
    });
  } catch (error) {
    logger.error('Failed to force agent discovery:', error);
    return res.status(500).json({ error: 'Failed to force agent discovery' });
  }
});

/**
 * Send command to agent
 * POST /api/agents/:nodeUuid/command
 */
router.post('/:nodeUuid/command', authenticateToken, requirePermission('agents.manage'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    const command = req.body;

    const externalAgentService = ExternalAgentService.getInstance();
    const result = await externalAgentService.sendCommand(nodeUuid, command);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to send command to agent:', error);
    return res.status(500).json({ error: 'Failed to send command to agent' });
  }
});

/**
 * Health check for all agents
 * GET /api/agents/health
 */
router.get('/health/all', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const externalAgentService = ExternalAgentService.getInstance();
    const healthResults = await externalAgentService.healthCheckAll();

    const results = Array.from(healthResults.entries()).map(([nodeUuid, status]) => ({
      nodeUuid,
      status
    }));

    return res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        online: results.filter(r => r.status.online).length,
        offline: results.filter(r => !r.status.online).length
      }
    });
  } catch (error) {
    logger.error('Failed to perform health check:', error);
    return res.status(500).json({ error: 'Failed to perform health check' });
  }
});

/**
 * Get agent configuration
 * GET /api/agents/:nodeUuid/config
 */
router.get('/:nodeUuid/config', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    const agentDiscoveryService = AgentDiscoveryService.getInstance();
    const agents = agentDiscoveryService.getAgentStatuses();
    const agent = agents.find(a => a.nodeUuid === nodeUuid);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get node info for configuration
    const db = await import('../services/database').then(m => m.default.getInstance());
    const node = await db.node.findFirst({ where: { uuid: nodeUuid } });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    return res.json({
      success: true,
      data: {
        agent,
        node: {
          id: node.id,
          uuid: node.uuid,
          name: node.name,
          fqdn: node.fqdn,
          scheme: node.scheme,
          port: node.port,
          memory: node.memory,
          memoryOverallocate: node.memoryOverallocate,
          disk: node.disk,
          diskOverallocate: node.diskOverallocate,
          isMaintenanceMode: node.isMaintenanceMode
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get agent config:', error);
    return res.status(500).json({ error: 'Failed to get agent config' });
  }
});

/**
 * Update agent configuration
 * PUT /api/agents/:nodeUuid/config
 */
router.put('/:nodeUuid/config', authenticateToken, requirePermission('agents.manage'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    const { baseUrl, apiKey } = req.body;

    const agentDiscoveryService = AgentDiscoveryService.getInstance();
    
    // Unregister old configuration
    agentDiscoveryService.unregisterAgent(nodeUuid);
    
    // Register with new configuration
    const success = await agentDiscoveryService.registerAgent(nodeUuid, baseUrl, apiKey);

    if (success) {
      return res.json({
        success: true,
        message: 'Agent configuration updated successfully'
      });
    } else {
      return res.status(400).json({ error: 'Failed to update agent configuration' });
    }
  } catch (error) {
    logger.error('Failed to update agent config:', error);
    return res.status(500).json({ error: 'Failed to update agent config' });
  }
});

/**
 * Get servers assigned to agent
 * GET /api/agents/:nodeUuid/servers
 */
router.get('/:nodeUuid/servers', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    
    const db = await import('../services/database').then(m => m.default.getInstance());
    const node = await db.node.findFirst({ where: { uuid: nodeUuid } });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const servers = await db.server.findMany({
      where: { nodeId: node.id },
      include: {
        alt: {
          include: {
            ctrl: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: servers.map((server: any) => ({
        id: server.id,
        uuid: server.uuid,
        name: server.name,
        status: server.status,
        memory: server.memory,
        disk: server.disk,
        cpu: server.cpu,
        altName: server.alt.name,
        ctrlName: server.alt.ctrl.name,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Failed to get agent servers:', error);
    return res.status(500).json({ error: 'Failed to get agent servers' });
  }
});

/**
 * Test agent connection and diagnostics
 * POST /api/agents/:nodeUuid/test
 */
router.post('/:nodeUuid/test', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    const externalAgentService = ExternalAgentService.getInstance();
    
    const startTime = Date.now();
    const status = await externalAgentService.getAgentStatus(nodeUuid);
    const responseTime = Date.now() - startTime;

    if (!status) {
      return res.json({
        success: true,
        data: {
          connected: false,
          responseTime: null,
          error: 'Agent not reachable',
          diagnostics: {
            agentRegistered: false,
            networkReachable: false,
            apiResponding: false
          }
        }
      });
    }

    return res.json({
      success: true,
      data: {
        connected: status.online,
        responseTime,
        status,
        diagnostics: {
          agentRegistered: true,
          networkReachable: true,
          apiResponding: status.online,
          version: status.version,
          uptime: status.uptime,
          serverCount: status.serverCount
        }
      }
    });
  } catch (error) {
    logger.error('Failed to test agent:', error);
    return res.json({
      success: true,
      data: {
        connected: false,
        responseTime: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics: {
          agentRegistered: false,
          networkReachable: false,
          apiResponding: false
        }
      }
    });
  }
});

/**
 * Get agent performance metrics
 * GET /api/agents/:nodeUuid/metrics
 */
router.get('/:nodeUuid/metrics', authenticateToken, requirePermission('agents.view'), async (req, res) => {
  try {
    const { nodeUuid } = req.params;
    const externalAgentService = ExternalAgentService.getInstance();
    
    // Try to get metrics from the agent
    const result = await externalAgentService.sendCommand(nodeUuid, {
      action: 'get_system_metrics',
      payload: {}
    });

    if (result.success) {
      return res.json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to get metrics from agent',
        details: result.error 
      });
    }
  } catch (error) {
    logger.error('Failed to get agent metrics:', error);
    return res.status(500).json({ error: 'Failed to get agent metrics' });
  }
});

export default router;
