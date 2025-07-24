import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            servers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get specific user by ID
router.get('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          servers: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
    message: 'User retrieved successfully'
  });
}));

// Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName, role } = req.body;

  if (!email || !username || !password || !firstName || !lastName) {
    throw createError('All fields are required', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { username: username }
      ]
    }
  });

  if (existingUser) {
    throw createError('User with this email or username already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  // Create user in database
  const newUser = await prisma.user.create({
    data: {
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role: role || 'USER',
      isActive: true
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  logger.info(`New user created by admin: ${newUser.username}`);

  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
}));

// Update user (Admin only)
router.patch('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, username, firstName, lastName, role, isActive, password } = req.body;

  const updateData: any = {};

  if (email) updateData.email = email;
  if (username) updateData.username = username;
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (role) updateData.role = role;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (password) {
    updateData.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  logger.info(`User updated by admin: ${updatedUser.username}`);

  res.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  });
}));

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if user has any servers
  const userWithServers = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          servers: true
        }
      }
    }
  });

  if (!userWithServers) {
    throw createError('User not found', 404);
  }

  if (userWithServers._count.servers > 0) {
    throw createError('Cannot delete user with existing servers', 400);
  }

  await prisma.user.delete({
    where: { id }
  });

  logger.info(`User deleted by admin: ${id}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// Get user's servers
router.get('/:id/servers', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Users can only see their own servers unless they're admin
  if (user.role !== 'ADMIN' && user.id !== id) {
    throw createError('Access denied', 403);
  }

  const servers = await prisma.server.findMany({
    where: { userId: id },
    include: {
      node: {
        select: {
          id: true,
          name: true,
          fqdn: true
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
