import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { User, UserRole } from '../types';

const router = Router();

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName } = req.body;

  // Validate input
  if (!email || !username || !password || !firstName || !lastName) {
    throw createError('All fields are required', 400);
  }

  // TODO: Check if user already exists in database
  // For now, create a mock user
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  const user: User = {
    id: Math.random().toString(36).substring(7),
    email,
    username,
    firstName,
    lastName,
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Generate JWT token
  const payload = { user: { id: user.id, email: user.email, username: user.username, role: user.role } };
  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  logger.info(`New user registered: ${user.username}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    },
    message: 'User registered successfully'
  });
}));

// Login endpoint
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  // TODO: Get user from database
  // For now, create a mock user for demo
  const user: User = {
    id: '1',
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // TODO: Verify password against database
  const isValidPassword = await bcrypt.compare(password, await bcrypt.hash('admin123', 12));

  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw createError('Account is deactivated', 403);
  }

  // Generate JWT token
  const payload = { user: { id: user.id, email: user.email, username: user.username, role: user.role } };
  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  // TODO: Update last login in database

  logger.info(`User logged in: ${user.username}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin
      },
      token
    },
    message: 'Login successful'
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw createError('Refresh token required', 400);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Generate new token
    const newToken = jwt.sign(
      { user: decoded.user },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token: newToken },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement token blacklisting if needed

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Get current user profile
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw createError('Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // TODO: Get full user details from database
    const user = decoded.user;

    res.json({
      success: true,
      data: { user },
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    throw createError('Invalid token', 401);
  }
}));

export default router;
