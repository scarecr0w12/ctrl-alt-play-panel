import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission,
  requireResourceOwnership 
} from '../middlewares/permissions';
import { ExternalAgentService } from '../services/externalAgentService';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get all servers for the authenticated user
 * GET /api/servers
 */
router.get('/', authenticateToken, requirePermission('servers.view'), async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get servers based on user permissions
    // If user has servers.view permission, they can see servers they own
    // If user has servers.manage permission, they can see all servers
    const canManageAll = await require('../services/permissionService').permissionService
      .hasPermission(user.id, 'servers.manage');
    
    const whereClause = canManageAll 
      ? {} // User with manage permission can see all servers
      : { userId: user.id }; // Regular users see only their servers

    const servers = await prisma.server.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, username: true }
        },
        node: {
          select: { id: true, name: true }
        }
      }
    });

    const serversWithStats = servers.map((server: any) => ({
      id: server.id,
      uuid: server.uuid,
      name: server.name,
      description: server.description,
      status: server.status,
      node: server.node,
      memory: server.memory,
      disk: server.disk,
      cpu: server.cpu,
      createdAt: server.createdAt
    }));

    return res.json({
      success: true,
      data: serversWithStats
    });
  } catch (error) {
    console.error('Failed to get servers:', error);
    return res.status(500).json({ error: 'Failed to get servers' });
  }
});

/**
 * Get server details
 * GET /api/servers/:id
 */
router.get('/:id', authenticateToken, requireAnyPermission(['servers.view', 'servers.manage']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if user can manage all servers or just their own
    const canManageAll = await require('../services/permissionService').permissionService
      .hasPermission(user.id, 'servers.manage');

    const whereClause = canManageAll 
      ? { id }
      : { id, userId: user.id };

    const server = await prisma.server.findFirst({
      where: whereClause,
      include: {
        node: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    return res.json({
      success: true,
      data: server
    });
  } catch (error) {
    console.error('Failed to get server:', error);
    return res.status(500).json({ error: 'Failed to get server' });
  }
});

/**
 * Get server status
 * GET /api/servers/:id/status
 */
router.get('/:id/status', authenticateToken, requireAnyPermission(['servers.view', 'servers.manage']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if user can manage all servers or just their own
    const canManageAll = await require('../services/permissionService').permissionService
      .hasPermission(user.id, 'servers.manage');

    const whereClause = canManageAll 
      ? { id }
      : { id, userId: user.id };

    const server = await prisma.server.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        memory: true,
        disk: true,
        cpu: true
      }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get latest metrics if available
    const latestMetrics = await prisma.serverMetrics.findFirst({
      where: { serverId: id },
      orderBy: { timestamp: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        server,
        metrics: latestMetrics ? {
          cpu: latestMetrics.cpu,
          memory: latestMetrics.memory,
          disk: latestMetrics.disk,
          networkIn: latestMetrics.networkIn,
          networkOut: latestMetrics.networkOut,
          players: latestMetrics.players,
          timestamp: latestMetrics.timestamp
        } : null
      }
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    return res.status(500).json({ error: 'Failed to get server status' });
  }
});

/**
 * Create a new server
 * POST /api/servers
 */
router.post('/', authenticateToken, requirePermission('servers.create'), async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      name,
      description,
      nodeId,
      altId,
      memory,
      disk,
      cpu,
      swap,
      io,
      environment = {},
      skipScripts = false
    } = req.body;

    // Validate required fields
    if (!name || !nodeId || !altId || !memory || !disk || !cpu) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'name, nodeId, altId, memory, disk, and cpu are required'
      });
    }

    // Verify node exists and is accessible
    const node = await prisma.node.findUnique({
      where: { id: nodeId }
    });

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Verify alt (template) exists
    const alt = await prisma.alt.findUnique({
      where: { id: altId },
      include: {
        variables: true,
        ctrl: true
      }
    });

    if (!alt) {
      return res.status(404).json({ error: 'Server template (Alt) not found' });
    }

    // Check if external agent is available for this node
    const externalAgentService = ExternalAgentService.getInstance();
    const isAgentAvailable = externalAgentService.isAgentAvailable(node.uuid);

    if (!isAgentAvailable) {
      return res.status(503).json({ 
        error: 'Node agent is offline',
        details: 'Cannot create server on a node with offline agent'
      });
    }

    // Generate unique identifiers
    const serverUuid = require('crypto').randomBytes(16).toString('hex');
    const serverUuidShort = serverUuid.substring(0, 8);

    // Get default Docker image from alt
    let dockerImage = 'ubuntu:20.04'; // fallback default
    if (alt.dockerImages && typeof alt.dockerImages === 'object') {
      const images = alt.dockerImages as Record<string, string>;
      const imageKeys = Object.keys(images);
      if (imageKeys.length > 0) {
        dockerImage = images[imageKeys[0]];
      }
    }

    // Create server in database
    const server = await prisma.server.create({
      data: {
        uuid: serverUuid,
        uuidShort: serverUuidShort,
        name,
        description: description || null,
        status: 'INSTALLING',
        skipScripts,
        memory: parseInt(memory),
        disk: parseInt(disk),
        cpu: parseInt(cpu),
        swap: parseInt(swap) || 0,
        io: parseInt(io) || 500,
        image: dockerImage,
        startup: alt.startup,
        environment: environment || {},
        userId: user.id,
        nodeId,
        altId,
        databaseLimit: 0,
        allocationLimit: 1,
        backupLimit: 0
      },
      include: {
        node: true,
        alt: {
          include: {
            variables: true,
            ctrl: true
          }
        }
      }
    });

    // Create server variables from alt template
    if (alt.variables && alt.variables.length > 0) {
      const serverVariables = alt.variables.map((variable: any) => ({
        serverId: server.id,
        altVariableId: variable.id,
        variableValue: environment[variable.envVariable] || variable.defaultValue
      }));

      await prisma.serverVariable.createMany({
        data: serverVariables
      });
    }

    // Send create command to external agent
    try {
      const createResult = await externalAgentService.sendCommand(node.uuid, {
        action: 'create_server',
        serverId: server.uuid,
        payload: {
          name: server.name,
          image: server.image,
          startup: server.startup,
          environment: server.environment,
          limits: {
            memory: server.memory,
            disk: server.disk,
            cpu: server.cpu,
            swap: server.swap,
            io: server.io
          },
          skipScripts: server.skipScripts
        }
      });

      if (!createResult.success) {
        // If agent creation fails, mark server as failed but keep in database for debugging
        await prisma.server.update({
          where: { id: server.id },
          data: { status: 'INSTALL_FAILED' }
        });

        return res.status(500).json({
          error: 'Failed to create server on agent',
          details: createResult.error,
          serverId: server.id
        });
      }

      // Log the server creation
      logger.info(`Server created successfully`, {
        serverId: server.id,
        serverUuid: server.uuid,
        userId: user.id,
        nodeId,
        altId
      });

      return res.status(201).json({
        success: true,
        message: 'Server created successfully',
        data: {
          id: server.id,
          uuid: server.uuid,
          name: server.name,
          status: server.status,
          node: server.node,
          alt: server.alt
        }
      });

    } catch (error) {
      // If there's an error communicating with the agent, mark server as failed
      await prisma.server.update({
        where: { id: server.id },
        data: { status: 'INSTALL_FAILED' }
      });

      logger.error('Failed to communicate with agent during server creation:', error);
      
      return res.status(500).json({
        error: 'Failed to communicate with agent',
        details: error instanceof Error ? error.message : 'Unknown error',
        serverId: server.id
      });
    }

  } catch (error) {
    logger.error('Failed to create server:', error);
    return res.status(500).json({ 
      error: 'Failed to create server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available nodes for server creation
 * GET /api/servers/nodes
 */
router.get('/nodes', authenticateToken, requirePermission('servers.create'), async (req, res) => {
  try {
    const nodes = await prisma.node.findMany({
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        memory: true,
        memoryOverallocate: true,
        disk: true,
        diskOverallocate: true,
        isPublic: true,
        isMaintenanceMode: true,
        location: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      where: {
        isPublic: true,
        isMaintenanceMode: false
      }
    });

    // Check agent availability for each node
    const externalAgentService = ExternalAgentService.getInstance();
    const nodesWithStatus = nodes.map((node: any) => ({
      ...node,
      agentOnline: externalAgentService.isAgentAvailable(node.uuid)
    }));

    return res.json({
      success: true,
      data: nodesWithStatus
    });
  } catch (error) {
    logger.error('Failed to get nodes:', error);
    return res.status(500).json({ error: 'Failed to get nodes' });
  }
});

/**
 * Get available server templates (Alts)
 * GET /api/servers/templates
 */
router.get('/templates', authenticateToken, requirePermission('servers.create'), async (req, res) => {
  try {
    const { ctrlId } = req.query;

    const whereClause = ctrlId ? { ctrlId: ctrlId as string } : {};

    const alts = await prisma.alt.findMany({
      where: whereClause,
      include: {
        ctrl: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        variables: {
          select: {
            id: true,
            name: true,
            description: true,
            envVariable: true,
            defaultValue: true,
            userViewable: true,
            userEditable: true,
            rules: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({
      success: true,
      data: alts
    });
  } catch (error) {
    logger.error('Failed to get server templates:', error);
    return res.status(500).json({ error: 'Failed to get server templates' });
  }
});

/**
 * Get available template categories (Ctrls)
 * GET /api/servers/categories
 */
router.get('/categories', authenticateToken, requirePermission('servers.create'), async (req, res) => {
  try {
    const ctrls = await prisma.ctrl.findMany({
      include: {
        _count: {
          select: {
            alts: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({
      success: true,
      data: ctrls
    });
  } catch (error) {
    logger.error('Failed to get template categories:', error);
    return res.status(500).json({ error: 'Failed to get template categories' });
  }
});

/**
 * Start a server
 * POST /api/servers/:id/start
 */
router.post('/:id/start', authenticateToken, requireAnyPermission(['servers.start', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify server access - resource ownership middleware already checked this
    const server = await prisma.server.findFirst({
      where: { id },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get external agent service
    const externalAgentService = ExternalAgentService.getInstance();

    // Send start command to external agent
    const result = await externalAgentService.startServer(server.node.uuid, server.uuid);

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to start server',
        details: result.error 
      });
    }

    // Update server status in database
    await prisma.server.update({
      where: { id },
      data: { status: 'STARTING' }
    });

    return res.json({
      success: true,
      message: 'Server start command sent',
      data: { serverId: id, status: 'STARTING' }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    return res.status(500).json({ error: 'Failed to start server' });
  }
});

/**
 * Stop server
 * POST /api/servers/:id/stop
 */
router.post('/:id/stop', authenticateToken, requireAnyPermission(['servers.stop', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { signal = 'SIGTERM', timeout = 30 } = req.body;

    // Verify server access - resource ownership middleware already checked this
    const server = await prisma.server.findFirst({
      where: { id },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get external agent service
    const externalAgentService = ExternalAgentService.getInstance();

    // Send stop command to external agent
    const result = await externalAgentService.stopServer(server.node.uuid, server.uuid, signal, timeout);

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to stop server',
        details: result.error 
      });
    }

    // Update server status in database
    await prisma.server.update({
      where: { id },
      data: { status: 'STOPPING' }
    });

    return res.json({
      success: true,
      message: 'Server stop command sent',
      data: { serverId: id, status: 'STOPPING' }
    });
  } catch (error) {
    console.error('Failed to stop server:', error);
    return res.status(500).json({ error: 'Failed to stop server' });
  }
});

/**
 * Restart server
 * POST /api/servers/:id/restart
 */
router.post('/:id/restart', authenticateToken, requireAnyPermission(['servers.restart', 'servers.manage']), requireResourceOwnership('server'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify server access - resource ownership middleware already checked this
    const server = await prisma.server.findFirst({
      where: { id },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get external agent service
    const externalAgentService = ExternalAgentService.getInstance();

    // Send restart command to external agent
    const result = await externalAgentService.restartServer(server.node.uuid, server.uuid);

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to restart server',
        details: result.error 
      });
    }

    // Update server status in database
    await prisma.server.update({
      where: { id },
      data: { status: 'STARTING' }
    });

    return res.json({
      success: true,
      message: 'Server restart command sent',
      data: { serverId: id, status: 'STARTING' }
    });
  } catch (error) {
    console.error('Failed to restart server:', error);
    return res.status(500).json({ error: 'Failed to restart server' });
  }
});

/**
 * Kill server (force stop)
 * POST /api/servers/:id/kill
 */
router.post('/:id/kill', authenticateToken, requirePermission('servers.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Find server (only users with manage permission can access this endpoint)
    const server = await prisma.server.findFirst({
      where: { id },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get external agent service
    const externalAgentService = ExternalAgentService.getInstance();

    // Send kill command to external agent
    const result = await externalAgentService.killServer(server.node.uuid, server.uuid);

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to kill server',
        details: result.error 
      });
    }

    // Update server status in database
    await prisma.server.update({
      where: { id },
      data: { status: 'OFFLINE' }
    });

    return res.json({
      success: true,
      message: 'Server kill command sent',
      data: { serverId: id, status: 'OFFLINE' }
    });
  } catch (error) {
    console.error('Failed to kill server:', error);
    return res.status(500).json({ error: 'Failed to kill server' });
  }
});

export default router;
