import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all nodes (Admin only)
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const nodes = await prisma.node.findMany({
    include: {
      _count: {
        select: {
          servers: true,
          allocations: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: nodes,
    message: 'Nodes retrieved successfully'
  });
}));

// Get specific node by ID
router.get('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const node = await prisma.node.findUnique({
    where: { id },
    include: {
      servers: {
        select: {
          id: true,
          name: true,
          status: true,
          user: {
            select: {
              username: true
            }
          }
        }
      },
      allocations: true,
      _count: {
        select: {
          servers: true,
          allocations: true
        }
      }
    }
  });

  if (!node) {
    throw createError('Node not found', 404);
  }

  res.json({
    success: true,
    data: node,
    message: 'Node retrieved successfully'
  });
}));

// Create new node (Admin only)
router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    fqdn, 
    scheme, 
    port, 
    publicPort, 
    memory, 
    disk, 
    locationId,
    isPublic,
    isBehindProxy,
    daemonToken 
  } = req.body;

  if (!name || !fqdn || !locationId) {
    throw createError('Name, FQDN, and location are required', 400);
  }

  const node = await prisma.node.create({
    data: {
      name,
      fqdn,
      scheme: scheme || 'https',
      port: port || 8080,
      publicPort: publicPort || 8080,
      memory: memory || 0,
      disk: disk || 0,
      locationId,
      isPublic: isPublic || false,
      isBehindProxy: isBehindProxy || false,
      isMaintenanceMode: false,
      daemonToken: daemonToken || `daemon-${Date.now()}`
    }
  });

  logger.info(`New node created: ${node.name}`);

  res.status(201).json({
    success: true,
    data: node,
    message: 'Node created successfully'
  });
}));

// Update node (Admin only)
router.patch('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedNode = await prisma.node.update({
    where: { id },
    data: updateData
  });

  logger.info(`Node updated: ${updatedNode.name}`);

  res.json({
    success: true,
    data: updatedNode,
    message: 'Node updated successfully'
  });
}));

// Delete node (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if node has any servers
  const nodeWithServers = await prisma.node.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          servers: true
        }
      }
    }
  });

  if (!nodeWithServers) {
    throw createError('Node not found', 404);
  }

  if (nodeWithServers._count.servers > 0) {
    throw createError('Cannot delete node with existing servers', 400);
  }

  await prisma.node.delete({
    where: { id }
  });

  logger.info(`Node deleted: ${id}`);

  res.json({
    success: true,
    message: 'Node deleted successfully'
  });
}));

// Get node stats (Admin only)
router.get('/:id/stats', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Mock stats - in production this would come from the agent
  const stats = {
    cpu: Math.random() * 100,
    memory: {
      used: Math.random() * 16384,
      total: 16384
    },
    disk: {
      used: Math.random() * 102400,
      total: 102400
    },
    network: {
      rx: Math.random() * 1000,
      tx: Math.random() * 500
    },
    uptime: Math.floor(Math.random() * 86400) + 3600,
    servers: await prisma.server.count({
      where: { nodeId: id }
    })
  };

  res.json({
    success: true,
    data: stats
  });
}));

// Get node servers (Admin only)
router.get('/:id/servers', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const servers = await prisma.server.findMany({
    where: { nodeId: id },
    include: {
      user: {
        select: {
          username: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: servers
  });
}));

export default router;
