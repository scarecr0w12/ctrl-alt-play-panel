import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AuthRequest } from './auth';

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Convenience functions
export const requireAdmin = authorize([UserRole.ADMIN]);
export const requireModerator = authorize([UserRole.ADMIN, UserRole.MODERATOR]);
export const requireAnyRole = authorize([UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
