import { Router, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest, requireAdmin } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { Node, AgentStatus } from '../types';
import { AgentService } from '../services/agent';

const router = Router();

// Get all nodes (Admin only)
router.get('/', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Get nodes from database
  const nodes: Node[] = [
    {
      id: 'node-1',
      name: 'Primary Node',
      fqdn: 'node1.example.com',
      scheme: 'https',
      port: 8080,
      publicPort: 8080,
      memory: 16384,
      disk: 102400,
      locationId: 'location-1',
      isPublic: true,
      isBehindProxy: false,
      isMaintenanceMode: false,
      daemonToken: 'secure-token-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ];

  // Get agent status for each node
  const agentService = AgentService.getInstance();
  const nodesWithStatus = nodes.map(node => ({
    ...node,
    agentStatus: agentService.getAgentStatus(node.id)
  }));

  res.json({
    success: true,
    data: nodesWithStatus,
    message: 'Nodes retrieved successfully'
  });
}));

// Get specific node by ID
router.get('/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // TODO: Get node from database
  if (id !== 'node-1') {
    throw createError('Node not found', 404);
  }

  const node = {
    id: 'node-1',
    name: 'Primary Node',
    fqdn: 'node1.example.com',
    scheme: 'https',
    port: 8080,
    publicPort: 8080,
    memory: 16384,
    disk: 102400,
    locationId: 'location-1',
    isPublic: true,
    isBehindProxy: false,
    isMaintenanceMode: false,
    daemonToken: 'secure-token-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  };

  // Get agent status
  const agentService = AgentService.getInstance();
  const nodeWithStatus = {
    ...node,
    agentStatus: agentService.getAgentStatus(node.id)
  };

  res.json({
    success: true,
    data: nodeWithStatus,
    message: 'Node retrieved successfully'
  });
}));

// Create new node (Admin only)
router.post('/', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, fqdn, scheme, port, publicPort, memory, disk, locationId } = req.body;

  if (!name || !fqdn || !scheme || !port || !memory || !disk) {
    throw createError('Required fields are missing', 400);
  }

  // TODO: Create node in database
  const newNode = {
    id: Math.random().toString(36).substring(7),
    name,
    fqdn,
    scheme,
    port,
    publicPort: publicPort || port,
    memory,
    disk,
    locationId: locationId || 'default',
    isPublic: true,
    isBehindProxy: false,
    isMaintenanceMode: false,
    daemonToken: Math.random().toString(36).substring(7),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  logger.info(`Admin ${req.user!.username} created new node: ${name}`);

  res.status(201).json({
    success: true,
    data: newNode,
    message: 'Node created successfully'
  });
}));

// Update node (Admin only)
router.patch('/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, fqdn, scheme, port, publicPort, memory, disk, isMaintenanceMode } = req.body;

  // TODO: Update node in database
  logger.info(`Admin ${req.user!.username} updated node: ${id}`);

  res.json({
    success: true,
    message: 'Node updated successfully'
  });
}));

// Delete node (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // TODO: Check if node has any servers before deletion
  // TODO: Delete node from database
  logger.info(`Admin ${req.user!.username} deleted node: ${id}`);

  res.json({
    success: true,
    message: 'Node deleted successfully'
  });
}));

// Get node statistics
router.get('/:id/stats', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // TODO: Get real stats from agent
  const stats = {
    cpu: {
      usage: 45.2,
      cores: 8
    },
    memory: {
      used: 8192,
      total: 16384,
      usage: 50.0
    },
    disk: {
      used: 51200,
      total: 102400,
      usage: 50.0
    },
    network: {
      rx: 1234567890,
      tx: 9876543210
    },
    uptime: 864000,
    loadAverage: [1.2, 1.5, 1.8]
  };

  res.json({
    success: true,
    data: stats,
    message: 'Node statistics retrieved successfully'
  });
}));

// Get servers on this node
router.get('/:id/servers', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // TODO: Get servers from database for this node
  const servers: any[] = [];

  res.json({
    success: true,
    data: servers,
    message: 'Node servers retrieved successfully'
  });
}));

export default router;
