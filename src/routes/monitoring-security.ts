import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler';
import { 
  authenticateToken, 
  requirePermission 
} from '../middlewares/permissions';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Get security dashboard data
router.get('/security/dashboard', 
  authenticateToken, 
  requirePermission('security.view'), 
  asyncHandler(async (req: Request, res: Response) => {
    const timeRange = (req.query.range as string) || '24h';
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
    
    // Get security events summary
    const securityEvents = await prisma.securityLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: startTime }
      },
      _count: {
        action: true
      }
    });
    
    // Get failed login attempts
    const failedLogins = await prisma.securityLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: startTime }
      }
    });
    
    // Get permission denials
    const permissionDenials = await prisma.securityLog.count({
      where: {
        action: 'PERMISSION_DENIED',
        createdAt: { gte: startTime }
      }
    });
    
    // Get active users count
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastLogin: { gte: startTime }
      }
    });
    
    // Get recent critical events
    const criticalEvents = await prisma.securityLog.findMany({
      where: {
        action: { in: ['LOGIN_FAILED', 'PERMISSION_DENIED', 'USER_DELETED', 'PERMISSION_REVOKED'] },
        createdAt: { gte: startTime }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json({
      success: true,
      data: {
        timeRange,
        summary: {
          totalEvents: securityEvents.reduce((sum: number, event: any) => sum + event._count.action, 0),
          failedLogins,
          permissionDenials,
          activeUsers
        },
        eventsByType: securityEvents,
        criticalEvents
      }
    });
  })
);

// Get permission usage analytics
router.get('/permissions/analytics',
  authenticateToken,
  requirePermission('audit.view'),
  asyncHandler(async (req: Request, res: Response) => {
    // Get permission usage over time
    const permissionUsage = await prisma.securityLog.groupBy({
      by: ['action', 'createdAt'],
      where: {
        action: { contains: 'PERMISSION' },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      _count: {
        action: true
      }
    });
    
    // Get most used permissions
    const topPermissions = await prisma.securityLog.groupBy({
      by: ['resource'],
      where: {
        action: 'PERMISSION_GRANTED',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        resource: { not: null }
      },
      _count: {
        resource: true
      },
      orderBy: {
        _count: {
          resource: 'desc'
        }
      },
      take: 10
    });
    
    res.json({
      success: true,
      data: {
        permissionUsage,
        topPermissions
      }
    });
  })
);

// Get latest alerts
router.get('/security/alerts',
  authenticateToken,
  requirePermission('security.view'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const alertsPath = path.join('logs', 'security', `alerts-${today}.json`);
      
      let alerts = [];
      try {
        const alertsContent = await fs.readFile(alertsPath, 'utf8');
        alerts = JSON.parse(alertsContent);
      } catch (e) {
        // No alerts file for today
      }
      
      res.json({
        success: true,
        data: {
          alerts: alerts.slice(-50), // Last 50 alerts
          count: alerts.length
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          alerts: [],
          count: 0
        }
      });
    }
  })
);

export default router;
