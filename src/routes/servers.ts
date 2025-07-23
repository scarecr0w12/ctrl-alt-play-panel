import { Router, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { Server, ServerStatus } from '../types';
import { AgentService } from '../services/agent';

const router = Router();

// Get all servers for the authenticated user
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  // TODO: Get servers from database based on user permissions
  // For now, return mock data
  const servers: Server[] = [
    {
      id: '1',
      uuid: 'server-uuid-1',
      name: 'Minecraft Server',
      description: 'My awesome Minecraft server',
      userId: user.id,
      nodeId: 'node-1',
      eggId: 'minecraft-java',
      status: ServerStatus.RUNNING,
      memory: 2048,
      disk: 10240,
      cpu: 100,
      swap: 0,
      io: 500,
      image: 'minecraft:java17',
      startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar',
      environment: {
        SERVER_MEMORY: '2048',
        SERVER_PORT: '25565'
      },
      limits: {
        memory: 2048,
        swap: 0,
        disk: 10240,
        io: 500,
        cpu: 100,
        oomKiller: true
      },
      feature_limits: {
        databases: 1,
        allocations: 1,
        backups: 2
      },
      allocation: {
        id: 'alloc-1',
        ip: '0.0.0.0',
        port: 25565,
        serverId: '1',
        nodeId: 'node-1',
        isPrimary: true
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ];

  res.json({
    success: true,
    data: servers,
    message: 'Servers retrieved successfully'
  });
}));

// Get specific server by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  // TODO: Get server from database and check user permissions
  if (id !== '1') {
    throw createError('Server not found', 404);
  }

  const server = {
    id: '1',
    uuid: 'server-uuid-1',
    name: 'Minecraft Server',
    description: 'My awesome Minecraft server',
    userId: user.id,
    nodeId: 'node-1',
    status: ServerStatus.RUNNING,
    // ... other server properties
  };

  res.json({
    success: true,
    data: server,
    message: 'Server retrieved successfully'
  });
}));

// Start server
router.post('/:id/start', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  // TODO: Check user permissions and get server details
  const nodeId = 'node-1'; // Get from server data

  const agentService = AgentService.getInstance();
  const success = await agentService.startServer(nodeId, id);

  if (!success) {
    throw createError('Failed to send start command to agent', 500);
  }

  logger.info(`User ${user.username} started server ${id}`);

  res.json({
    success: true,
    message: 'Server start command sent successfully'
  });
}));

// Stop server
router.post('/:id/stop', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const nodeId = 'node-1'; // Get from server data

  const agentService = AgentService.getInstance();
  const success = await agentService.stopServer(nodeId, id);

  if (!success) {
    throw createError('Failed to send stop command to agent', 500);
  }

  logger.info(`User ${user.username} stopped server ${id}`);

  res.json({
    success: true,
    message: 'Server stop command sent successfully'
  });
}));

// Restart server
router.post('/:id/restart', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const nodeId = 'node-1'; // Get from server data

  const agentService = AgentService.getInstance();
  const success = await agentService.restartServer(nodeId, id);

  if (!success) {
    throw createError('Failed to send restart command to agent', 500);
  }

  logger.info(`User ${user.username} restarted server ${id}`);

  res.json({
    success: true,
    message: 'Server restart command sent successfully'
  });
}));

// Send command to server
router.post('/:id/command', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { command } = req.body;
  const user = req.user!;

  if (!command) {
    throw createError('Command is required', 400);
  }

  const nodeId = 'node-1'; // Get from server data

  const agentService = AgentService.getInstance();
  const success = await agentService.executeServerCommand(nodeId, id, command);

  if (!success) {
    throw createError('Failed to send command to agent', 500);
  }

  logger.info(`User ${user.username} executed command on server ${id}: ${command}`);

  res.json({
    success: true,
    message: 'Command sent successfully'
  });
}));

// Get server statistics
router.get('/:id/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // TODO: Get real stats from agent
  const stats = {
    memory: {
      current: 1536,
      limit: 2048
    },
    cpu: {
      current: 45.2,
      cores: 4
    },
    disk: {
      current: 5120,
      limit: 10240
    },
    network: {
      rx: 12345678,
      tx: 87654321
    },
    uptime: 86400
  };

  res.json({
    success: true,
    data: stats,
    message: 'Server statistics retrieved successfully'
  });
}));

// Update server settings
router.patch('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, startup, environment } = req.body;
  const user = req.user!;

  // TODO: Update server in database
  logger.info(`User ${user.username} updated server ${id} settings`);

  res.json({
    success: true,
    message: 'Server updated successfully'
  });
}));

// Delete server
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  // TODO: Delete server from database and clean up resources
  logger.info(`User ${user.username} deleted server ${id}`);

  res.json({
    success: true,
    message: 'Server deleted successfully'
  });
}));

export default router;
