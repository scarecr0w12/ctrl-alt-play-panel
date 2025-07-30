import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import permissionService from '../services/permissionService';
import { logger } from '../utils/logger';
import { isBlacklisted } from '../utils/redisClient';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    rootAdmin: boolean;
    permissions: string[];
  };
  session?: {
    id: string;
    ipAddress: string;
    userAgent?: string;
  };
}

/**
 * Enhanced authentication middleware with session management
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      await permissionService.logSecurityEvent(
        'AUTH_FAILED',
        undefined,
        undefined,
        req.ip,
        req.get('User-Agent'),
        false,
        'No token provided'
      );
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // Check if token is blacklisted
    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      await permissionService.logSecurityEvent(
        'AUTH_FAILED',
        decoded.user?.id,
        undefined,
        req.ip,
        req.get('User-Agent'),
        false,
        'Token is blacklisted'
      );
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated'
      });
      return;
    }
    
    // Check if session exists and is active
    const session = await prisma.userSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            rootAdmin: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.user) {
      await permissionService.logSecurityEvent(
        'AUTH_FAILED',
        decoded.user?.id,
        undefined,
        req.ip,
        req.get('User-Agent'),
        false,
        'Invalid or expired session'
      );
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
      return;
    }

    if (!session.user.isActive) {
      await permissionService.logSecurityEvent(
        'AUTH_FAILED',
        session.user.id,
        undefined,
        req.ip,
        req.get('User-Agent'),
        false,
        'User account is inactive'
      );
      res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
      return;
    }

    // Update session activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    // Get user permissions
    const permissions = await permissionService.getUserPermissions(session.user.id);

    // Attach user and session info to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      role: session.user.role,
      rootAdmin: session.user.rootAdmin,
      permissions,
    };

    req.session = {
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent || undefined,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    await permissionService.logSecurityEvent(
      'AUTH_ERROR',
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent'),
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Root admins have all permissions
      if (req.user.rootAdmin) {
        next();
        return;
      }

      // Check if user has the required permission
      const hasPermission = await permissionService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        await permissionService.logSecurityEvent(
          'PERMISSION_DENIED',
          req.user.id,
          permission,
          req.ip,
          req.get('User-Agent'),
          false,
          `Missing permission: ${permission}`
        );
        res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${permission}`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Multiple permissions middleware (user needs ANY of the permissions)
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.rootAdmin) {
        next();
        return;
      }

      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await permissionService.hasPermission(req.user.id, permission);
        if (hasPermission) {
          next();
          return;
        }
      }

      await permissionService.logSecurityEvent(
        'PERMISSION_DENIED',
        req.user.id,
        permissions.join(', '),
        req.ip,
        req.get('User-Agent'),
        false,
        `Missing any of permissions: ${permissions.join(', ')}`
      );
      res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required any of: ${permissions.join(', ')}`
      });
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Multiple permissions middleware (user needs ALL of the permissions)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.rootAdmin) {
        next();
        return;
      }

      // Check if user has all required permissions
      for (const permission of permissions) {
        const hasPermission = await permissionService.hasPermission(req.user.id, permission);
        if (!hasPermission) {
          await permissionService.logSecurityEvent(
            'PERMISSION_DENIED',
            req.user.id,
            permissions.join(', '),
            req.ip,
            req.get('User-Agent'),
            false,
            `Missing permission: ${permission} from required set: ${permissions.join(', ')}`
          );
          res.status(403).json({
            success: false,
            message: `Insufficient permissions. Required all of: ${permissions.join(', ')}`
          });
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Resource ownership check middleware
 */
export const requireResourceOwnership = (resourceType: string, resourceIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.rootAdmin) {
        next();
        return;
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        res.status(400).json({
          success: false,
          message: 'Resource ID required'
        });
        return;
      }

      let isOwner = false;

      // Check resource ownership based on type
      switch (resourceType) {
        case 'server': {
          const server = await prisma.server.findFirst({
            where: { id: resourceId, userId: req.user.id },
          });
          isOwner = !!server;
          break;
        }
        
        case 'apiKey': {
          const apiKey = await prisma.apiKey.findFirst({
            where: { id: resourceId, userId: req.user.id },
          });
          isOwner = !!apiKey;
          break;
        }
        
        default:
          res.status(400).json({
            success: false,
            message: 'Unknown resource type'
          });
          return;
      }

      if (!isOwner) {
        await permissionService.logSecurityEvent(
          'RESOURCE_ACCESS_DENIED',
          req.user.id,
          `${resourceType}:${resourceId}`,
          req.ip,
          req.get('User-Agent'),
          false,
          'Not resource owner'
        );
        res.status(403).json({
          success: false,
          message: 'Access denied: not resource owner'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership check failed'
      });
    }
  };
};

/**
 * Rate limiting middleware for sensitive operations
 */
export const rateLimitSensitive = (maxAttempts: number = 5, windowMinutes: number = 15) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const userAttempts = attempts.get(key);
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userAttempts.count >= maxAttempts) {
      await permissionService.logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        req.user?.id,
        undefined,
        req.ip,
        req.get('User-Agent'),
        false,
        `Rate limit exceeded: ${userAttempts.count}/${maxAttempts} attempts`
      );
      res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
      return;
    }

    userAttempts.count++;
    next();
  };
};

// Legacy middleware for backward compatibility
export const requireAdmin = requirePermission('users.view');
export const requireModerator = requireAnyPermission(['users.view', 'servers.create']);

export default {
  authenticateToken,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireResourceOwnership,
  rateLimitSensitive,
  requireAdmin,
  requireModerator,
};
