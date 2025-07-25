const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class SecurityMonitor {
  constructor() {
    this.alertThresholds = {
      failedLogins: 5,           // Failed logins per minute
      permissionDenials: 10,     // Permission denials per minute
      suspiciousActivity: 3,     // Suspicious activities per minute
      adminActions: 1            // Admin actions requiring notification
    };
    
    this.monitoringInterval = 60000; // 1 minute
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🛡️  Security monitoring started');
    
    // Monitor security logs every minute
    setInterval(() => {
      this.checkSecurityAlerts();
    }, this.monitoringInterval);
    
    // Monitor permission usage every 5 minutes
    setInterval(() => {
      this.generatePermissionReport();
    }, this.monitoringInterval * 5);
  }

  async checkSecurityAlerts() {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      
      // Check for failed login attempts
      const failedLogins = await prisma.securityLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (failedLogins >= this.alertThresholds.failedLogins) {
        await this.sendAlert('HIGH', `${failedLogins} failed login attempts in the last minute`);
      }
      
      // Check for permission denials
      const permissionDenials = await prisma.securityLog.count({
        where: {
          action: 'PERMISSION_DENIED',
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (permissionDenials >= this.alertThresholds.permissionDenials) {
        await this.sendAlert('MEDIUM', `${permissionDenials} permission denials in the last minute`);
      }
      
      // Check for admin actions
      const adminActions = await prisma.securityLog.count({
        where: {
          action: { in: ['USER_CREATED', 'USER_DELETED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'] },
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (adminActions >= this.alertThresholds.adminActions) {
        await this.sendAlert('INFO', `${adminActions} admin actions performed in the last minute`);
      }
      
    } catch (error) {
      console.error('Error checking security alerts:', error);
    }
  }

  async generatePermissionReport() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 300000);
      
      // Get permission usage statistics
      const permissionUsage = await prisma.securityLog.groupBy({
        by: ['action'],
        where: {
          createdAt: { gte: fiveMinutesAgo }
        },
        _count: {
          action: true
        }
      });
      
      // Get most active users
      const activeUsers = await prisma.securityLog.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: fiveMinutesAgo },
          userId: { not: null }
        },
        _count: {
          userId: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 5
      });
      
      // Write report to file
      const report = {
        timestamp: now.toISOString(),
        permissionUsage,
        activeUsers,
        summary: {
          totalEvents: permissionUsage.reduce((sum, item) => sum + item._count.action, 0),
          uniqueUsers: activeUsers.length
        }
      };
      
      const reportPath = path.join('logs', 'permissions', `report-${now.toISOString().split('T')[0]}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
    } catch (error) {
      console.error('Error generating permission report:', error);
    }
  }

  async sendAlert(level, message) {
    const alert = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source: 'SecurityMonitor'
    };
    
    // Log alert
    console.log(`🚨 [${level}] ${message}`);
    
    // Write to alerts log file
    const alertPath = path.join('logs', 'security', `alerts-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
      let alerts = [];
      try {
        const existingAlerts = await fs.readFile(alertPath, 'utf8');
        alerts = JSON.parse(existingAlerts);
      } catch (e) {
        // File doesn't exist yet
      }
      
      alerts.push(alert);
      await fs.writeFile(alertPath, JSON.stringify(alerts, null, 2));
      
      // TODO: Integrate with external alerting services (Slack, Discord, Email, etc.)
      
    } catch (error) {
      console.error('Error writing alert:', error);
    }
  }

  async stop() {
    this.isRunning = false;
    console.log('🛡️  Security monitoring stopped');
  }
}

module.exports = { SecurityMonitor };

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new SecurityMonitor();
  monitor.start();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await monitor.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
}
