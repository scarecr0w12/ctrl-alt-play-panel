import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { User, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(createError('Access token required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as { id: string; role: string; email: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch {
    return next(createError('Invalid or expired token', 403));
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Normalize role comparison (handle both uppercase and lowercase)
    const userRole = req.user.role.toLowerCase() as UserRole;
    const allowedRoles = roles.map(role => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireModerator = requireRole([UserRole.ADMIN, UserRole.MODERATOR]);
