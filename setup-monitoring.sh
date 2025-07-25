#!/bin/bash

# CTRL+ALT+Play Panel - Monitoring & Alerting Configuration Script
# This script sets up monitoring, logging, and alerting for the permission system

echo "📊 Setting up Monitoring & Alerting..."
echo "=================================================="

# 1. Create monitoring configuration directory
echo "📁 Creating monitoring configuration..."
mkdir -p config/monitoring
mkdir -p logs/security
mkdir -p logs/permissions

# 2. Create security log monitoring script
echo "🔒 Creating security log monitoring..."
cat > config/monitoring/security-monitor.js << 'EOF'
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
EOF

# 3. Create permission audit script
echo "📋 Creating permission audit script..."
cat > config/monitoring/permission-audit.js << 'EOF'
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
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });
      
      // Get role-based permissions
      const roles = await prisma.role.findMany({
        include: {
          rolePermissions: {
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
          directPermissions: user.userPermissions.map(up => up.permission.name),
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        })),
        roles: roles.map(role => ({
          name: role.name,
          description: role.description,
          permissions: role.rolePermissions.map(rp => rp.permission.name)
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
    
    // Check for orphaned user permissions
    const orphanedUserPermissions = await prisma.userPermission.findMany({
      where: {
        user: null
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
        userPermissions: {
          some: {}
        }
      },
      include: {
        userPermissions: true
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
EOF

# 4. Create systemd service for monitoring
echo "⚙️  Creating systemd service for monitoring..."
cat > config/monitoring/ctrl-alt-security-monitor.service << 'EOF'
[Unit]
Description=Ctrl-Alt-Play Security Monitor
After=network.target
Requires=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ctrl-alt-play-panel
ExecStart=/usr/bin/node config/monitoring/security-monitor.js
Restart=always
RestartSec=10

# Environment
Environment=NODE_ENV=production
EnvironmentFile=/opt/ctrl-alt-play-panel/.env

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ctrl-alt-security

[Install]
WantedBy=multi-user.target
EOF

# 5. Create log rotation configuration
echo "🔄 Creating log rotation configuration..."
cat > config/monitoring/ctrl-alt-logs << 'EOF'
/opt/ctrl-alt-play-panel/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
    postrotate
        systemctl reload ctrl-alt-play-panel
    endscript
}

/opt/ctrl-alt-play-panel/logs/security/*.json {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
}

/opt/ctrl-alt-play-panel/logs/permissions/*.json {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
}
EOF

# 6. Create monitoring dashboard API endpoint
echo "📊 Creating monitoring dashboard API..."
cat > src/routes/monitoring-security.ts << 'EOF'
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
      take: 20,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        timeRange,
        summary: {
          totalEvents: securityEvents.reduce((sum, event) => sum + event._count.action, 0),
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
      by: ['details'],
      where: {
        action: 'PERMISSION_GRANTED',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      _count: {
        details: true
      },
      orderBy: {
        _count: {
          details: 'desc'
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
EOF

# 7. Create alerting webhook configuration
echo "🔔 Creating webhook alerting configuration..."
cat > config/monitoring/webhooks.js << 'EOF'
const axios = require('axios');

class WebhookAlerter {
  constructor() {
    this.webhooks = {
      slack: process.env.SLACK_WEBHOOK_URL,
      discord: process.env.DISCORD_WEBHOOK_URL,
      teams: process.env.TEAMS_WEBHOOK_URL
    };
  }

  async sendAlert(level, message, details = {}) {
    const alert = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      source: 'Ctrl-Alt-Play Security Monitor'
    };

    // Send to configured webhooks
    const promises = [];

    if (this.webhooks.slack) {
      promises.push(this.sendSlackAlert(alert));
    }

    if (this.webhooks.discord) {
      promises.push(this.sendDiscordAlert(alert));
    }

    if (this.webhooks.teams) {
      promises.push(this.sendTeamsAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  async sendSlackAlert(alert) {
    if (!this.webhooks.slack) return;

    const color = this.getColorForLevel(alert.level);
    const payload = {
      attachments: [{
        color,
        title: `🚨 Security Alert - ${alert.level}`,
        text: alert.message,
        fields: [
          {
            title: 'Timestamp',
            value: alert.timestamp,
            short: true
          },
          {
            title: 'Source',
            value: alert.source,
            short: true
          }
        ],
        footer: 'Ctrl-Alt-Play Security Monitor'
      }]
    };

    try {
      await axios.post(this.webhooks.slack, payload);
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  async sendDiscordAlert(alert) {
    if (!this.webhooks.discord) return;

    const color = this.getDiscordColorForLevel(alert.level);
    const payload = {
      embeds: [{
        title: `🚨 Security Alert - ${alert.level}`,
        description: alert.message,
        color,
        timestamp: alert.timestamp,
        footer: {
          text: alert.source
        }
      }]
    };

    try {
      await axios.post(this.webhooks.discord, payload);
    } catch (error) {
      console.error('Failed to send Discord alert:', error.message);
    }
  }

  async sendTeamsAlert(alert) {
    if (!this.webhooks.teams) return;

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Security Alert - ${alert.level}`,
      themeColor: this.getColorForLevel(alert.level),
      sections: [{
        activityTitle: `🚨 Security Alert - ${alert.level}`,
        activitySubtitle: alert.source,
        text: alert.message,
        facts: [
          {
            name: 'Timestamp',
            value: alert.timestamp
          },
          {
            name: 'Level',
            value: alert.level
          }
        ]
      }]
    };

    try {
      await axios.post(this.webhooks.teams, payload);
    } catch (error) {
      console.error('Failed to send Teams alert:', error.message);
    }
  }

  getColorForLevel(level) {
    switch (level) {
      case 'HIGH': return '#ff0000';
      case 'MEDIUM': return '#ff9900';
      case 'INFO': return '#0099ff';
      default: return '#999999';
    }
  }

  getDiscordColorForLevel(level) {
    switch (level) {
      case 'HIGH': return 16711680; // Red
      case 'MEDIUM': return 16753920; // Orange
      case 'INFO': return 39423; // Blue
      default: return 10066329; // Grey
    }
  }
}

module.exports = { WebhookAlerter };
EOF

echo ""
echo "📊 Monitoring & Alerting Setup Complete!"
echo "========================================"
echo "✅ Security monitoring scripts created"
echo "✅ Permission audit tools configured"
echo "✅ Log rotation set up"
echo "✅ Systemd service configuration ready"
echo "✅ Monitoring API endpoints created"
echo "✅ Webhook alerting system configured"
echo ""
echo "🚀 Next Steps:"
echo "1. Copy systemd service: sudo cp config/monitoring/ctrl-alt-security-monitor.service /etc/systemd/system/"
echo "2. Copy logrotate config: sudo cp config/monitoring/ctrl-alt-logs /etc/logrotate.d/"
echo "3. Configure webhook URLs in .env file"
echo "4. Enable and start monitoring: sudo systemctl enable --now ctrl-alt-security-monitor"
echo "5. Test monitoring: node config/monitoring/security-monitor.js"
echo "6. Run audit: node config/monitoring/permission-audit.js"
echo ""
echo "📚 Configuration Files Created:"
echo "- config/monitoring/security-monitor.js"
echo "- config/monitoring/permission-audit.js"
echo "- config/monitoring/ctrl-alt-security-monitor.service"
echo "- config/monitoring/ctrl-alt-logs"
echo "- config/monitoring/webhooks.js"
echo "- src/routes/monitoring-security.ts"

chmod +x config/monitoring/security-monitor.js
chmod +x config/monitoring/permission-audit.js
