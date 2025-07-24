import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all Ctrls (Server categories)
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const ctrls = await prisma.ctrl.findMany({
    include: {
      alts: {
        select: {
          id: true,
          name: true,
          description: true,
          author: true
        }
      },
      _count: {
        select: {
          alts: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: ctrls
  });
}));

// Get specific Ctrl by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ctrl = await prisma.ctrl.findUnique({
    where: { id },
    include: {
      alts: {
        include: {
          variables: true,
          _count: {
            select: {
              servers: true
            }
          }
        }
      }
    }
  });

  if (!ctrl) {
    throw createError('Ctrl not found', 404);
  }

  res.json({
    success: true,
    data: ctrl
  });
}));

// Create new Ctrl (Admin only)
router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    throw createError('Name is required', 400);
  }

  // Check if Ctrl already exists
  const existingCtrl = await prisma.ctrl.findUnique({
    where: { name }
  });

  if (existingCtrl) {
    throw createError('Ctrl with this name already exists', 409);
  }

  const ctrl = await prisma.ctrl.create({
    data: {
      name,
      description
    }
  });

  logger.info(`New Ctrl created: ${ctrl.name}`);

  res.status(201).json({
    success: true,
    data: ctrl,
    message: 'Ctrl created successfully'
  });
}));

// Update Ctrl (Admin only)
router.patch('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const updatedCtrl = await prisma.ctrl.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description })
    }
  });

  logger.info(`Ctrl updated: ${updatedCtrl.name}`);

  res.json({
    success: true,
    data: updatedCtrl,
    message: 'Ctrl updated successfully'
  });
}));

// Delete Ctrl (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if Ctrl has any Alts
  const ctrlWithAlts = await prisma.ctrl.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          alts: true
        }
      }
    }
  });

  if (!ctrlWithAlts) {
    throw createError('Ctrl not found', 404);
  }

  if (ctrlWithAlts._count.alts > 0) {
    throw createError('Cannot delete Ctrl with existing Alts', 400);
  }

  await prisma.ctrl.delete({
    where: { id }
  });

  logger.info(`Ctrl deleted: ${id}`);

  res.json({
    success: true,
    message: 'Ctrl deleted successfully'
  });
}));

// Get Alts for a specific Ctrl
router.get('/:id/alts', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const alts = await prisma.alt.findMany({
    where: { ctrlId: id },
    include: {
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

export default router;
