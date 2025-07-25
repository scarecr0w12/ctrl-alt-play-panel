import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      uuid: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      language: true,
      gravatar: true,
      useTotp: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          servers: true,
          apiKeys: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// Update current user profile
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { firstName, lastName, language, gravatar } = req.body;

  // Validate input
  if (!firstName || !lastName) {
    throw createError('First name and last name are required', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      language: language || 'en',
      gravatar: gravatar !== undefined ? gravatar : true,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      language: true,
      gravatar: true,
      updatedAt: true
    }
  });

  logger.info(`User ${updatedUser.username} updated their profile`);

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  });
}));

// Change password
router.put('/change-password', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw createError('All password fields are required', 400);
  }

  if (newPassword !== confirmPassword) {
    throw createError('New passwords do not match', 400);
  }

  if (newPassword.length < 8) {
    throw createError('New password must be at least 8 characters long', 400);
  }

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw createError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  logger.info(`User ${user.username} changed their password`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Update email (requires password confirmation)
router.put('/change-email', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { newEmail, password } = req.body;

  if (!newEmail || !password) {
    throw createError('New email and password are required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw createError('Invalid email format', 400);
  }

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError('Password is incorrect', 400);
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail }
  });

  if (existingUser && existingUser.id !== userId) {
    throw createError('Email is already taken', 409);
  }

  // Update email
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true
    }
  });

  logger.info(`User ${user.username} changed their email to ${newEmail}`);

  res.json({
    success: true,
    data: updatedUser,
    message: 'Email updated successfully'
  });
}));

// Get user activity/audit log
router.get('/activity', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    }),
    prisma.auditLog.count({
      where: { userId }
    })
  ]);

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

// Admin Routes
// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const isActive = req.query.isActive as string;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (role && role !== 'all') {
    where.role = role;
  }

  if (isActive !== undefined && isActive !== 'all') {
    where.isActive = isActive === 'true';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        uuid: true,
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
            servers: true,
            apiKeys: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
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

// Get specific user (admin only)
router.get('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      uuid: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      language: true,
      gravatar: true,
      useTotp: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          servers: true,
          apiKeys: true,
          auditLogs: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
}));

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, role, isActive, language } = req.body;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive,
      language: language || user.language,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      language: true,
      updatedAt: true
    }
  });

  logger.info(`Admin updated user ${user.username}: ${JSON.stringify({ firstName, lastName, role, isActive, language })}`);

  res.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  });
}));

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = (req as any).user.id;

  if (id === currentUserId) {
    throw createError('Cannot delete your own account', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.rootAdmin) {
    throw createError('Cannot delete root admin user', 403);
  }

  await prisma.user.delete({
    where: { id }
  });

  logger.info(`Admin deleted user ${user.username}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw createError('New password is required', 400);
  }

  if (newPassword.length < 8) {
    throw createError('Password must be at least 8 characters long', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  logger.info(`Admin reset password for user ${user.username}`);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

export default router;
