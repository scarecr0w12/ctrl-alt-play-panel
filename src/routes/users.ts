import { Router, Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { AuthRequest, requireAdmin } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { User, UserRole } from '../types';

const router = Router();

// Get all users (Admin only)
router.get('/', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Get users from database with pagination
  const users: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: '2',
      email: 'user@example.com',
      username: 'user',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    }
  ];

  res.json({
    success: true,
    data: users,
    message: 'Users retrieved successfully'
  });
}));

// Get specific user by ID
router.get('/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // TODO: Get user from database
  if (id !== '1' && id !== '2') {
    throw createError('User not found', 404);
  }

  const user = {
    id,
    email: id === '1' ? 'admin@example.com' : 'user@example.com',
    username: id === '1' ? 'admin' : 'user',
    firstName: id === '1' ? 'Admin' : 'Regular',
    lastName: 'User',
    role: id === '1' ? UserRole.ADMIN : UserRole.USER,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  };

  res.json({
    success: true,
    data: user,
    message: 'User retrieved successfully'
  });
}));

// Create new user (Admin only)
router.post('/', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, username, password, firstName, lastName, role } = req.body;

  if (!email || !username || !password || !firstName || !lastName) {
    throw createError('All fields are required', 400);
  }

  // TODO: Create user in database
  const newUser = {
    id: Math.random().toString(36).substring(7),
    email,
    username,
    firstName,
    lastName,
    role: role || UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  logger.info(`Admin ${req.user!.username} created new user: ${username}`);

  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
}));

// Update user (Admin only)
router.patch('/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { email, username, firstName, lastName, role, isActive } = req.body;

  // TODO: Update user in database
  logger.info(`Admin ${req.user!.username} updated user: ${id}`);

  res.json({
    success: true,
    message: 'User updated successfully'
  });
}));

// Delete user (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    throw createError('Cannot delete your own account', 400);
  }

  // TODO: Delete user from database
  logger.info(`Admin ${req.user!.username} deleted user: ${id}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// Get user's servers
router.get('/:id/servers', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if user can access this data
  if (req.user!.role !== UserRole.ADMIN && req.user!.id !== id) {
    throw createError('Access denied', 403);
  }

  // TODO: Get user's servers from database
  const servers: any[] = [];

  res.json({
    success: true,
    data: servers,
    message: 'User servers retrieved successfully'
  });
}));

export default router;
