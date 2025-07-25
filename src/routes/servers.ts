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
