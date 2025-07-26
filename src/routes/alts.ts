import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all Alts (Server configurations)
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { ctrlId } = req.query;

  const alts = await prisma.alt.findMany({
    where: ctrlId ? { ctrlId: ctrlId as string } : undefined,
    include: {
      ctrl: {
        select: {
          id: true,
          name: true
        }
      },
      variables: true,
      _count: {
        select: {
          servers: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: alts
  });
}));

// Get specific Alt by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const alt = await prisma.alt.findUnique({
    where: { id },
    include: {
      ctrl: true,
      variables: true,
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
      }
    }
  });

  if (!alt) {
    throw createError('Alt not found', 404);
  }

  res.json({
    success: true,
    data: alt
  });
}));

// Create new Alt (Admin only)
router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    description, 
    author, 
    ctrlId, 
    dockerImages, 
    startup, 
    configFiles, 
    configStartup, 
    configLogs, 
    configStop,
    scriptInstall,
    scriptEntry,
    scriptContainer,
    variables 
  } = req.body;

  if (!name || !ctrlId || !author || !startup) {
    throw createError('Name, Ctrl ID, author, and startup command are required', 400);
  }

  // Check if Ctrl exists
  const ctrl = await prisma.ctrl.findUnique({
    where: { id: ctrlId }
  });

  if (!ctrl) {
    throw createError('Ctrl not found', 404);
  }

  const alt = await prisma.alt.create({
    data: {
      name,
      description,
      author,
      ctrlId,
      dockerImages: dockerImages || {},
      startup,
      configFiles: configFiles || {},
      configStartup: configStartup || {},
      configLogs: configLogs || {},
      configStop,
      scriptInstall,
      scriptEntry: scriptEntry || 'bash',
      scriptContainer: scriptContainer || 'alpine:3.4',
      variables: {
        create: variables || []
      }
    },
    include: {
      variables: true
    }
  });

  logger.info(`New Alt created: ${alt.name} in Ctrl: ${ctrl.name}`);

  res.status(201).json({
    success: true,
    data: alt,
    message: 'Alt created successfully'
  });
}));

// Update Alt (Admin only)
router.patch('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove variables from update data if present - handle separately
  // variables is destructured but not used to prevent it from being passed to Prisma update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variables, ...altUpdateData } = updateData;

  const updatedAlt = await prisma.alt.update({
    where: { id },
    data: altUpdateData,
    include: {
      variables: true
    }
  });

  logger.info(`Alt updated: ${updatedAlt.name}`);

  res.json({
    success: true,
    data: updatedAlt,
    message: 'Alt updated successfully'
  });
}));

// Delete Alt (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if Alt has any servers
  const altWithServers = await prisma.alt.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          servers: true
        }
      }
    }
  });

  if (!altWithServers) {
    throw createError('Alt not found', 404);
  }

  if (altWithServers._count.servers > 0) {
    throw createError('Cannot delete Alt with existing servers', 400);
  }

  await prisma.alt.delete({
    where: { id }
  });

  logger.info(`Alt deleted: ${id}`);

  res.json({
    success: true,
    message: 'Alt deleted successfully'
  });
}));

// Get Alt variables
router.get('/:id/variables', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const variables = await prisma.altVariable.findMany({
    where: { altId: id },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: variables
  });
}));

// Add variable to Alt (Admin only)
router.post('/:id/variables', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, envVariable, defaultValue, userViewable, userEditable, rules } = req.body;

  if (!name || !envVariable) {
    throw createError('Name and environment variable are required', 400);
  }

  const variable = await prisma.altVariable.create({
    data: {
      name,
      description: description || '',
      envVariable,
      defaultValue: defaultValue || '',
      userViewable: userViewable !== false,
      userEditable: userEditable !== false,
      rules: rules || 'required|string',
      altId: id
    }
  });

  res.status(201).json({
    success: true,
    data: variable,
    message: 'Variable added successfully'
  });
}));

export default router;
