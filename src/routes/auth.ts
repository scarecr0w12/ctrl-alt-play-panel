import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { addToBlacklist } from '../utils/redisClient';

interface JWTPayload {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  iat?: number;
  exp?: number;
}

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

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
  } catch {
    throw createError('Invalid refresh token', 401);
  }
}));

// Validate token endpoint
router.get('/validate', asyncHandler(async (req: Request, res: Response) => {
  // Debug logging removed for production
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No valid authorization header found
    throw createError('Authorization token required', 401);
  }
  
  const token = authHeader.substring(7);
      // Token extracted from header
  
  try {
          // JWT token verification in progress
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    // Token verified successfully
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.user.id }
    });
    // User lookup completed
    
    if (!user || !user.isActive) {
      // User not found or inactive
      throw createError('User account is inactive or deleted', 403);
    }
    
    res.json({
      success: true,
      data: { user },
      message: 'Token is valid'
    });
  } catch (error: any) {
    // JWT validation failed
    
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === 'TokenExpiredError') {
        // Token has expired
        throw createError('Token expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        // Token is malformed or invalid
        throw createError('Invalid token', 401);
      } else {
        // Other JWT error
        throw createError('Token validation failed', 401);
      }
    }
    throw error;
  }
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Add token to blacklist with 24 hour expiry (JWT tokens typically expire in 24 hours)
    await addToBlacklist(token, 24 * 60 * 60); // 24 hours in seconds
  }

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

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
  } catch {
    throw createError('Invalid token', 401);
  }
}));

// Get user permissions endpoint
router.get('/permissions', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('Authorization token required', 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw createError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const userId = decoded.user.id;

    // Get user with permissions from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Extract permissions from the user through the junction table
    const permissions = user.permissions
      .filter(up => up.granted) // Only include granted permissions
      .map(up => ({
        id: up.permission.id,
        name: up.permission.name,
        description: up.permission.description || '',
        category: up.permission.category || 'GENERAL'
      }));

    res.json({
      success: true,
      data: {
        permissions,
        role: user.role
      }
    });
  } catch {
    throw createError('Invalid token', 401);
  }
}));

export default router;
