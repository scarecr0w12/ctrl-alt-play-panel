import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  authenticateToken, 
  requirePermission, 
  requireAnyPermission,
  requireAllPermissions 
} from '../middlewares/permissions';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', authenticateToken, requirePermission('users.view'), asyncHandler(async (req: Request, res: Response) => {
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
router.get('/:id', authenticateToken, requirePermission('users.view'), asyncHandler(async (req: Request, res: Response) => {
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
router.post('/', authenticateToken, requirePermission('users.create'), asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName, role } = req.body;

  if (!email || !username || !password || !firstName || !lastName) {
    throw createError('All fields are required', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
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
router.patch('/:id', authenticateToken, requirePermission('users.edit'), asyncHandler(async (req: Request, res: Response) => {
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
router.delete('/:id', authenticateToken, requirePermission('users.delete'), asyncHandler(async (req: Request, res: Response) => {
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
router.get('/:id/servers', authenticateToken, requireAnyPermission(['users.view', 'servers.view']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  // Check if user can manage all servers or just their own
  const canManageAll = await require('../services/permissionService').permissionService
    .hasPermission(user.id, 'servers.manage');

  // Users can only see their own servers unless they have manage permission
  if (!canManageAll && user.id !== id) {
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

// Get user statistics (Admin only)
router.get('/stats', authenticateToken, requirePermission('users.view'), asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersByRole,
    recentSignups,
    recentActivity
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    }),
    prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  const roleStats = usersByRole.reduce((acc, item) => {
    acc[item.role] = item._count.role;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: {
        USER: roleStats.USER || 0,
        MODERATOR: roleStats.MODERATOR || 0,
        ADMIN: roleStats.ADMIN || 0
      },
      recentSignups,
      recentActivity
    }
  });
}));

// Get user activity (Admin only)
router.get('/activity', authenticateToken, requirePermission('users.view'), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Note: This would require an audit/activity log table in a real implementation
  // For now, we'll return mock data or empty array
  const activities: any[] = [];
  const total = 0;

  res.json({
    success: true,
    data: {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

// Bulk delete users (Admin only)
router.delete('/bulk', authenticateToken, requirePermission('users.delete'), asyncHandler(async (req: Request, res: Response) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createError('User IDs array is required', 400);
  }

  // Check if any users have servers
  const usersWithServers = await prisma.user.findMany({
    where: { 
      id: { in: userIds },
      servers: { some: {} }
    },
    select: { id: true, username: true }
  });

  if (usersWithServers.length > 0) {
    throw createError(
      `Cannot delete users with existing servers: ${usersWithServers.map(u => u.username).join(', ')}`, 
      400
    );
  }

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } }
  });

  logger.info(`Bulk deleted ${deletedUsers.count} users`);

  res.json({
    success: true,
    data: { deletedCount: deletedUsers.count },
    message: `Successfully deleted ${deletedUsers.count} user(s)`
  });
}));

// Bulk update user roles (Admin only)
router.patch('/bulk/role', authenticateToken, requirePermission('users.edit'), asyncHandler(async (req: Request, res: Response) => {
  const { userIds, role } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createError('User IDs array is required', 400);
  }

  if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
    throw createError('Invalid role', 400);
  }

  const updatedUsers = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { role }
  });

  logger.info(`Bulk updated role for ${updatedUsers.count} users to ${role}`);

  res.json({
    success: true,
    data: { updatedCount: updatedUsers.count },
    message: `Successfully updated role for ${updatedUsers.count} user(s)`
  });
}));

// Bulk update user status (Admin only)
router.patch('/bulk/status', authenticateToken, requirePermission('users.edit'), asyncHandler(async (req: Request, res: Response) => {
  const { userIds, isActive } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createError('User IDs array is required', 400);
  }

  if (typeof isActive !== 'boolean') {
    throw createError('isActive must be a boolean', 400);
  }

  const updatedUsers = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { isActive }
  });

  logger.info(`Bulk updated status for ${updatedUsers.count} users to ${isActive ? 'active' : 'inactive'}`);

  res.json({
    success: true,
    data: { updatedCount: updatedUsers.count },
    message: `Successfully updated status for ${updatedUsers.count} user(s)`
  });
}));

export default router;
