import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middlewares/auth';
import { AgentService } from '../services/agent';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get all servers for the authenticated user
 * GET /api/servers
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get servers based on user role
    const whereClause = user.role === 'admin' 
      ? {} // Admin can see all servers
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
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const whereClause = user.role === 'admin' 
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
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const whereClause = user.role === 'admin' 
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
 * Start server
 * POST /api/servers/:id/start
 */
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify server access
    const whereClause = user.role === 'admin' 
      ? { id }
      : { id, userId: user.id };

    const server = await prisma.server.findFirst({
      where: whereClause,
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get agent service
    const agentService = AgentService.getInstance();

    // Send start command to agent
    const result = await agentService.sendCommand(server.node.uuid, {
      action: 'start_server',
      serverId: server.uuid
    });

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
    console.error('Failed to start server:', error);
    return res.status(500).json({ error: 'Failed to start server' });
  }
});

/**
 * Stop server
 * POST /api/servers/:id/stop
 */
router.post('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { signal = 'SIGTERM', timeout = 30 } = req.body;

    // Verify server access
    const whereClause = user.role === 'admin' 
      ? { id }
      : { id, userId: user.id };

    const server = await prisma.server.findFirst({
      where: whereClause,
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get agent service
    const agentService = AgentService.getInstance();

    // Send stop command to agent
    const result = await agentService.sendCommand(server.node.uuid, {
      action: 'stop_server',
      serverId: server.uuid,
      payload: { signal, timeout }
    });

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
router.post('/:id/restart', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify server access
    const whereClause = user.role === 'admin' 
      ? { id }
      : { id, userId: user.id };

    const server = await prisma.server.findFirst({
      where: whereClause,
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get agent service
    const agentService = AgentService.getInstance();

    // Send restart command to agent
    const result = await agentService.sendCommand(server.node.uuid, {
      action: 'restart_server',
      serverId: server.uuid
    });

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
router.post('/:id/kill', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify server access (admin only for kill command)
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can force kill servers' });
    }

    const server = await prisma.server.findFirst({
      where: { id },
      include: { node: true }
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get agent service
    const agentService = AgentService.getInstance();

    // Send kill command to agent
    const result = await agentService.sendCommand(server.node.uuid, {
      action: 'stop_server',
      serverId: server.uuid,
      payload: { signal: 'SIGKILL', timeout: 5 }
    });

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
