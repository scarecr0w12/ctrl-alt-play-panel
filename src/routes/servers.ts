import { Router, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { ServerService, CreateServerData, UpdateServerData } from '../services/serverService';
import { AgentService } from '../services/agent';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const agentService = AgentService.getInstance();
const serverService = new ServerService(prisma, agentService);

// Get all servers with filtering and pagination
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = Math.min(parseInt(req.query.per_page as string) || 50, 100);

  // Extract filters from query parameters
  const filters: any = {};

  if (req.query.uuid) filters.uuid = req.query.uuid as string;
  if (req.query.name) filters.name = req.query.name as string;
  if (req.query.description) filters.description = req.query.description as string;
  if (req.query.image) filters.image = req.query.image as string;
  if (req.query.external_id) filters.externalId = req.query.external_id as string;

  // Non-admin users can only see their own servers
  if (user.role !== 'ADMIN') {
    filters.userId = user.id;
  }

  const result = await serverService.getServers(filters, page, perPage);

  res.json({
    success: true,
    data: result.data,
    meta: {
      pagination: result.pagination
    },
    message: 'Servers retrieved successfully'
  });
}));

// Create a new server
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;

  // Validate required fields
  const {
    name,
    description,
    eggId,
    nodeId,
    memory,
    disk,
    cpu,
    swap = 0,
    io = 500,
    threads,
    image,
    startup,
    environment = {},
    databaseLimit = 0,
    allocationLimit = 0,
    backupLimit = 0,
    externalId,
    skipScripts = false,
    oomKiller = true,
    allocation,
    additionalAllocations = []
  } = req.body;

  if (!name || !eggId || !nodeId || !memory || !disk || !cpu || !image || !startup || !allocation) {
    throw createError('Missing required fields', 400);
  }

  const serverData: CreateServerData = {
    name,
    description,
    userId: user.id,
    eggId,
    nodeId,
    memory,
    disk,
    cpu,
    swap,
    io,
    threads,
    image,
    startup,
    environment,
    databaseLimit,
    allocationLimit,
    backupLimit,
    externalId,
    skipScripts,
    oomKiller,
    allocation,
    additionalAllocations
  };

  const server = await serverService.createServer(serverData);

  res.status(201).json({
    success: true,
    data: server,
    message: 'Server created successfully'
  });
}));

// Get specific server by ID/UUID
router.get('/:identifier', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const user = req.user!;

  const server = await serverService.getServer(identifier);

  // Check if user has access to this server
  if (user.role !== 'ADMIN' && server.userId !== user.id) {
    // Check if user is a subuser
    const subuser = await prisma.subuser.findFirst({
      where: {
        userId: user.id,
        serverId: server.id
      }
    });

    if (!subuser) {
      throw createError('Server not found', 404);
    }
  }

  res.json({
    success: true,
    data: server,
    message: 'Server retrieved successfully'
  });
}));

// Update a server
router.patch('/:identifier', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const user = req.user!;

  // Check permissions
  const server = await serverService.getServer(identifier);
  if (user.role !== 'ADMIN' && server.userId !== user.id) {
    throw createError('Forbidden', 403);
  }

  const updateData: UpdateServerData = {
    name: req.body.name,
    description: req.body.description,
    memory: req.body.memory,
    disk: req.body.disk,
    cpu: req.body.cpu,
    swap: req.body.swap,
    io: req.body.io,
    threads: req.body.threads,
    image: req.body.image,
    startup: req.body.startup,
    environment: req.body.environment,
    databaseLimit: req.body.databaseLimit,
    allocationLimit: req.body.allocationLimit,
    backupLimit: req.body.backupLimit,
    oomKiller: req.body.oomKiller
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof UpdateServerData] === undefined) {
      delete updateData[key as keyof UpdateServerData];
    }
  });

  const updatedServer = await serverService.updateServer(identifier, updateData);

  res.json({
    success: true,
    data: updatedServer,
    message: 'Server updated successfully'
  });
}));

// Delete a server
router.delete('/:identifier', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const { force } = req.query;
  const user = req.user!;

  // Check permissions
  const server = await serverService.getServer(identifier);
  if (user.role !== 'ADMIN' && server.userId !== user.id) {
    throw createError('Forbidden', 403);
  }

  await serverService.deleteServer(identifier, force === 'true');

  res.status(204).send();
}));

// Server power actions
router.post('/:identifier/power', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const { action } = req.body;
  const user = req.user!;

  if (!action || !['start', 'stop', 'restart', 'kill'].includes(action)) {
    throw createError('Invalid power action', 400);
  }

  const server = await serverService.getServer(identifier);

  // Check permissions
  if (user.role !== 'ADMIN' && server.userId !== user.id) {
    const subuser = await prisma.subuser.findFirst({
      where: {
        userId: user.id,
        serverId: server.id
      }
    });

    if (!subuser) {
      throw createError('Forbidden', 403);
    }

    // Check if subuser has power permission
    const permissions = subuser.permissions as string[];
    if (!permissions.includes('control.start') && action === 'start') {
      throw createError('Forbidden', 403);
    }
    if (!permissions.includes('control.stop') && ['stop', 'restart', 'kill'].includes(action)) {
      throw createError('Forbidden', 403);
    }
    if (!permissions.includes('control.restart') && action === 'restart') {
      throw createError('Forbidden', 403);
    }
  }

  // Send power action to agent
  try {
    await agentService.sendPowerAction(server.nodeId, server.uuid, action);

    res.json({
      success: true,
      message: `Server ${action} signal sent successfully`
    });
  } catch (error) {
    logger.error(`Failed to send ${action} signal to server ${server.uuid}:`, error);
    throw createError(`Failed to ${action} server`, 500);
  }
}));

// Suspend server
router.post('/:identifier/suspend', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const user = req.user!;

  // Only admins can suspend servers
  if (user.role !== 'ADMIN') {
    throw createError('Forbidden', 403);
  }

  const server = await serverService.suspendServer(identifier);

  res.json({
    success: true,
    data: server,
    message: 'Server suspended successfully'
  });
}));

// Unsuspend server
router.post('/:identifier/unsuspend', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const user = req.user!;

  // Only admins can unsuspend servers
  if (user.role !== 'ADMIN') {
    throw createError('Forbidden', 403);
  }

  const server = await serverService.unsuspendServer(identifier);

  res.json({
    success: true,
    data: server,
    message: 'Server unsuspended successfully'
  });
}));

// Reinstall server
router.post('/:identifier/reinstall', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const user = req.user!;

  const server = await serverService.getServer(identifier);

  // Check permissions
  if (user.role !== 'ADMIN' && server.userId !== user.id) {
    throw createError('Forbidden', 403);
  }

  const updatedServer = await serverService.reinstallServer(identifier);

  res.json({
    success: true,
    data: updatedServer,
    message: 'Server reinstall initiated successfully'
  });
}));

export default router;
    throw createError('Failed to send start command to agent', 500);
