import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middlewares/auth';

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

export default router;
