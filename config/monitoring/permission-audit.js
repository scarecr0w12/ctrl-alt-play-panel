const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

class PermissionAuditor {
  async generateFullAuditReport() {
    try {
      console.log('📋 Generating comprehensive permission audit report...');
      
      // Get all users with their permissions
      const users = await prisma.user.findMany({
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      // Get role-based permissions
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      // Get security logs from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      const securityLogs = await prisma.securityLog.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Last 1000 events
      });
      
      // Analyze permission patterns
      const permissionAnalysis = await this.analyzePermissionPatterns(securityLogs);
      
      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalUsers: users.length,
          totalRoles: roles.length,
          totalSecurityEvents: securityLogs.length,
          activeUsers: users.filter(u => u.isActive).length,
          adminUsers: users.filter(u => u.role === 'ADMIN').length
        },
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          rootAdmin: user.rootAdmin,
          directPermissions: user.permissions.map(up => up.permission.name),
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        })),
        roles: roles.map(role => ({
          name: role.name,
          description: role.description,
          permissions: role.permissions.map(rp => rp.permission.name)
        })),
        securityEvents: securityLogs.slice(0, 100), // Last 100 events for detailed view
        analysis: permissionAnalysis
      };
      
      // Write report
      const reportPath = path.join('logs', 'permissions', `audit-report-${new Date().toISOString().split('T')[0]}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`✅ Audit report generated: ${reportPath}`);
      return report;
      
    } catch (error) {
      console.error('❌ Error generating audit report:', error);
      throw error;
    }
  }

  async analyzePermissionPatterns(securityLogs) {
    const analysis = {
      topActions: {},
      topUsers: {},
      permissionDenials: [],
      failedLogins: [],
      adminActivities: []
    };
    
    securityLogs.forEach(log => {
      // Count actions
      analysis.topActions[log.action] = (analysis.topActions[log.action] || 0) + 1;
      
      // Count user activities
      if (log.userId) {
        analysis.topUsers[log.userId] = (analysis.topUsers[log.userId] || 0) + 1;
      }
      
      // Collect specific event types
      if (log.action === 'PERMISSION_DENIED') {
        analysis.permissionDenials.push(log);
      } else if (log.action === 'LOGIN_FAILED') {
        analysis.failedLogins.push(log);
      } else if (['USER_CREATED', 'USER_DELETED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'].includes(log.action)) {
        analysis.adminActivities.push(log);
      }
    });
    
    // Convert to sorted arrays
    analysis.topActions = Object.entries(analysis.topActions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
      
    analysis.topUsers = Object.entries(analysis.topUsers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    return analysis;
  }

  async checkPermissionConsistency() {
    console.log('🔍 Checking permission system consistency...');
    
    const issues = [];
    
    // Check for orphaned user permissions (permissions without valid user references)
    const orphanedUserPermissions = await prisma.userPermission.findMany({
      where: {
        user: {
          is: null
        }
      }
    });
    
    if (orphanedUserPermissions.length > 0) {
      issues.push({
        type: 'ORPHANED_USER_PERMISSIONS',
        count: orphanedUserPermissions.length,
        description: 'User permissions without associated users'
      });
    }
    
    // Check for inactive users with permissions
    const inactiveUsersWithPermissions = await prisma.user.findMany({
      where: {
        isActive: false,
        permissions: {
          some: {}
        }
      },
      include: {
        permissions: true
      }
    });
    
    if (inactiveUsersWithPermissions.length > 0) {
      issues.push({
        type: 'INACTIVE_USERS_WITH_PERMISSIONS',
        count: inactiveUsersWithPermissions.length,
        description: 'Inactive users still have permissions assigned'
      });
    }
    
    return {
      timestamp: new Date().toISOString(),
      issues,
      isHealthy: issues.length === 0
    };
  }
}

module.exports = { PermissionAuditor };

// Run audit if called directly
if (require.main === module) {
  const auditor = new PermissionAuditor();
  
  Promise.all([
    auditor.generateFullAuditReport(),
    auditor.checkPermissionConsistency()
  ])
  .then(([auditReport, consistencyCheck]) => {
    console.log('📊 Audit completed');
    console.log('🔍 Consistency check:', consistencyCheck.isHealthy ? '✅ HEALTHY' : '⚠️  ISSUES FOUND');
    if (!consistencyCheck.isHealthy) {
      console.log('Issues found:', consistencyCheck.issues);
    }
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
}
