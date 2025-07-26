import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { User, UserRole } from '../types';

const router = Router();
const prisma = new PrismaClient();

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName } = req.body;

  // Validate input
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
  const user = await prisma.user.create({
    data: {
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role: 'USER',
      isActive: true
    }
  });

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

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw createError('Account is deactivated', 403);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // Generate JWT token
  const payload = { user: { id: user.id, email: user.email, username: user.username, role: user.role } };
  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

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
        lastLogin: new Date()
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

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

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
