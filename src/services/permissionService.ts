import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Define system permissions
export const SYSTEM_PERMISSIONS = {
  // User Management
  'users.view': { category: 'User Management', description: 'View users', resource: 'users', action: 'read' },
  'users.create': { category: 'User Management', description: 'Create users', resource: 'users', action: 'create' },
  'users.edit': { category: 'User Management', description: 'Edit users', resource: 'users', action: 'update' },
  'users.delete': { category: 'User Management', description: 'Delete users', resource: 'users', action: 'delete' },
  'users.permissions': { category: 'User Management', description: 'Manage user permissions', resource: 'users', action: 'permissions' },
  
  // Server Management
  'servers.view': { category: 'Server Management', description: 'View servers', resource: 'servers', action: 'read' },
  'servers.create': { category: 'Server Management', description: 'Create servers', resource: 'servers', action: 'create' },
  'servers.edit': { category: 'Server Management', description: 'Edit servers', resource: 'servers', action: 'update' },
  'servers.delete': { category: 'Server Management', description: 'Delete servers', resource: 'servers', action: 'delete' },
  'servers.start': { category: 'Server Management', description: 'Start servers', resource: 'servers', action: 'start' },
  'servers.stop': { category: 'Server Management', description: 'Stop servers', resource: 'servers', action: 'stop' },
  'servers.restart': { category: 'Server Management', description: 'Restart servers', resource: 'servers', action: 'restart' },
  'servers.console': { category: 'Server Management', description: 'Access server console', resource: 'servers', action: 'console' },
  
  // File Management
  'files.view': { category: 'File Management', description: 'View files', resource: 'files', action: 'read' },
  'files.edit': { category: 'File Management', description: 'Edit files', resource: 'files', action: 'update' },
  'files.upload': { category: 'File Management', description: 'Upload files', resource: 'files', action: 'upload' },
  'files.delete': { category: 'File Management', description: 'Delete files', resource: 'files', action: 'delete' },
  'files.download': { category: 'File Management', description: 'Download files', resource: 'files', action: 'download' },
  
  // Node Management
  'nodes.view': { category: 'Node Management', description: 'View nodes', resource: 'nodes', action: 'read' },
  'nodes.create': { category: 'Node Management', description: 'Create nodes', resource: 'nodes', action: 'create' },
  'nodes.edit': { category: 'Node Management', description: 'Edit nodes', resource: 'nodes', action: 'update' },
  'nodes.delete': { category: 'Node Management', description: 'Delete nodes', resource: 'nodes', action: 'delete' },
  
  // Monitoring
  'monitoring.view': { category: 'Monitoring', description: 'View monitoring data', resource: 'monitoring', action: 'read' },
  'monitoring.metrics': { category: 'Monitoring', description: 'Access detailed metrics', resource: 'monitoring', action: 'metrics' },
  
  // API Management
  'api.keys.view': { category: 'API Management', description: 'View API keys', resource: 'api_keys', action: 'read' },
  'api.keys.create': { category: 'API Management', description: 'Create API keys', resource: 'api_keys', action: 'create' },
  'api.keys.delete': { category: 'API Management', description: 'Delete API keys', resource: 'api_keys', action: 'delete' },
  
  // Workshop
  'workshop.view': { category: 'Workshop', description: 'View workshop items', resource: 'workshop', action: 'read' },
  'workshop.manage': { category: 'Workshop', description: 'Manage workshop items', resource: 'workshop', action: 'manage' },
  
  // Audit Logs
  'audit.view': { category: 'Audit Logs', description: 'View audit logs', resource: 'audit', action: 'read' },
  'audit.export': { category: 'Audit Logs', description: 'Export audit logs', resource: 'audit', action: 'export' },
  
  // System Settings
  'settings.view': { category: 'System Settings', description: 'View system settings', resource: 'settings', action: 'read' },
  'settings.edit': { category: 'System Settings', description: 'Edit system settings', resource: 'settings', action: 'update' },
  
  // Security
  'security.sessions': { category: 'Security', description: 'Manage user sessions', resource: 'security', action: 'sessions' },
  'security.logs': { category: 'Security', description: 'View security logs', resource: 'security', action: 'logs' },
  'security.config': { category: 'Security', description: 'Configure security settings', resource: 'security', action: 'config' },
};

// Define default role permissions
export const DEFAULT_ROLE_PERMISSIONS = {
  USER: [
    'servers.view', 'servers.start', 'servers.stop', 'servers.restart', 'servers.console',
    'files.view', 'files.edit', 'files.upload', 'files.download',
    'monitoring.view',
    'api.keys.view', 'api.keys.create', 'api.keys.delete',
    'workshop.view'
  ],
  MODERATOR: [
    // User permissions
    'servers.view', 'servers.start', 'servers.stop', 'servers.restart', 'servers.console',
    'files.view', 'files.edit', 'files.upload', 'files.download', 'files.delete',
    'monitoring.view', 'monitoring.metrics',
    'api.keys.view', 'api.keys.create', 'api.keys.delete',
    'workshop.view', 'workshop.manage',
    'audit.view',
    // Additional moderator permissions
    'servers.create', 'servers.edit',
    'users.view'
  ],
  ADMIN: [
    // All permissions
    ...Object.keys(SYSTEM_PERMISSIONS)
  ]
};

export class PermissionService {
  
  /**
   * Initialize system permissions and roles
   */
  async initializePermissions(): Promise<void> {
    try {
      logger.info('🔐 Initializing system permissions...');
      
      // Create all system permissions
      for (const [name, config] of Object.entries(SYSTEM_PERMISSIONS)) {
        await prisma.permission.upsert({
          where: { name },
          update: {
            description: config.description,
            category: config.category,
            resource: config.resource,
            action: config.action,
          },
          create: {
            name,
            description: config.description,
            category: config.category,
            resource: config.resource,
            action: config.action,
          },
        });
      }
      
      // Create system roles
      for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const role = await prisma.role.upsert({
          where: { name: roleName },
          update: { description: `System ${roleName.toLowerCase()} role` },
          create: {
            name: roleName,
            description: `System ${roleName.toLowerCase()} role`,
            isSystem: true,
            priority: roleName === 'ADMIN' ? 100 : roleName === 'MODERATOR' ? 50 : 10,
          },
        });
        
        // Assign permissions to role
        for (const permissionName of permissions) {
          const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
          });
          
          if (permission) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }
      
      logger.info('✅ System permissions initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize permissions:', error);
      throw error;
    }
  }
  
  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Check if user is root admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rootAdmin: true, role: true, isActive: true },
      });
      
      if (!user || !user.isActive) {
        return false;
      }
      
      if (user.rootAdmin) {
        return true;
      }
      
      // Check direct user permission
      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId,
          permission: { name: permissionName },
          granted: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });
      
      if (userPermission) {
        return true;
      }
      
      // Check role-based permission
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: { name: user.role },
          permission: { name: permissionName },
        },
      });
      
      return !!rolePermission;
    } catch (error) {
      logger.error(`Failed to check permission ${permissionName} for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rootAdmin: true, role: true, isActive: true },
      });
      
      if (!user || !user.isActive) {
        return [];
      }
      
      if (user.rootAdmin) {
        return Object.keys(SYSTEM_PERMISSIONS);
      }
      
      const permissions = new Set<string>();
      
      // Get role permissions
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: { name: user.role },
        },
        include: {
          permission: true,
        },
      });
      
      rolePermissions.forEach((rp: any) => {
        permissions.add(rp.permission.name);
      });
      
      // Get direct user permissions
      const userPermissions = await prisma.userPermission.findMany({
        where: {
          userId,
          granted: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          permission: true,
        },
      });
      
      userPermissions.forEach((up: any) => {
        if (up.granted) {
          permissions.add(up.permission.name);
        }
      });
      
      return Array.from(permissions);
    } catch (error) {
      logger.error(`Failed to get permissions for user ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: string,
    permissionName: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });
      
      if (!permission) {
        throw new Error(`Permission ${permissionName} not found`);
      }
      
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id,
          },
        },
        update: {
          granted: true,
          grantedBy,
          grantedAt: new Date(),
          expiresAt,
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: true,
          grantedBy,
          expiresAt,
        },
      });
      
      logger.info(`Permission ${permissionName} granted to user ${userId} by ${grantedBy}`);
    } catch (error) {
      logger.error(`Failed to grant permission ${permissionName} to user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Revoke permission from user
   */
  async revokePermission(userId: string, permissionName: string): Promise<void> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });
      
      if (!permission) {
        throw new Error(`Permission ${permissionName} not found`);
      }
      
      await prisma.userPermission.deleteMany({
        where: {
          userId,
          permissionId: permission.id,
        },
      });
      
      logger.info(`Permission ${permissionName} revoked from user ${userId}`);
    } catch (error) {
      logger.error(`Failed to revoke permission ${permissionName} from user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Log security event
   */
  async logSecurityEvent(
    action: string,
    userId?: string,
    resource?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    reason?: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId,
          action,
          resource,
          ipAddress: ipAddress || 'unknown',
          userAgent,
          success,
          reason,
          metadata,
        },
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Get security logs with pagination
   */
  async getSecurityLogs(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const page = params.page || 1;
      const limit = Math.min(params.limit || 50, 100);
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (params.userId) where.userId = params.userId;
      if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
      if (params.success !== undefined) where.success = params.success;
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.gte = params.startDate;
        if (params.endDate) where.createdAt.lte = params.endDate;
      }
      
      const [logs, total] = await Promise.all([
        prisma.securityLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.securityLog.count({ where }),
      ]);
      
      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get security logs:', error);
      throw error;
    }
  }
  
  /**
   * Clean up expired user sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await prisma.userSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false },
          ],
        },
      });
      
      logger.info(`Cleaned up ${result.count} expired sessions`);
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
    }
  }
}

// Create and export singleton instance
export const permissionService = new PermissionService();
export default permissionService;
