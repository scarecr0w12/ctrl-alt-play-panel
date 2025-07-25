const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Comprehensive permission definitions
const SYSTEM_PERMISSIONS = [
  // User Management
  { name: 'users.view', description: 'View user profiles and lists', category: 'user_management', resource: 'users', action: 'view' },
  { name: 'users.create', description: 'Create new user accounts', category: 'user_management', resource: 'users', action: 'create' },
  { name: 'users.edit', description: 'Modify user profiles and settings', category: 'user_management', resource: 'users', action: 'edit' },
  { name: 'users.delete', description: 'Remove user accounts', category: 'user_management', resource: 'users', action: 'delete' },
  { name: 'users.roles', description: 'Assign and modify user roles', category: 'user_management', resource: 'users', action: 'roles' },
  { name: 'users.permissions', description: 'Grant and revoke user permissions', category: 'user_management', resource: 'users', action: 'permissions' },

  // Control Management (Ctrls)
  { name: 'ctrls.view', description: 'View control panels and configurations', category: 'control_management', resource: 'ctrls', action: 'view' },
  { name: 'ctrls.create', description: 'Create new control panels', category: 'control_management', resource: 'ctrls', action: 'create' },
  { name: 'ctrls.edit', description: 'Modify control configurations', category: 'control_management', resource: 'ctrls', action: 'edit' },
  { name: 'ctrls.delete', description: 'Remove control panels', category: 'control_management', resource: 'ctrls', action: 'delete' },

  // Alternative Management (Alts)
  { name: 'alts.view', description: 'View alternative configurations', category: 'alternative_management', resource: 'alts', action: 'view' },
  { name: 'alts.create', description: 'Create new alternatives', category: 'alternative_management', resource: 'alts', action: 'create' },
  { name: 'alts.edit', description: 'Modify alternative configurations', category: 'alternative_management', resource: 'alts', action: 'edit' },
  { name: 'alts.delete', description: 'Remove alternatives', category: 'alternative_management', resource: 'alts', action: 'delete' },

  // System Administration
  { name: 'system.admin', description: 'Full system administrative access', category: 'system_administration', resource: 'system', action: 'admin' },
  { name: 'system.config', description: 'Modify system-wide settings', category: 'system_administration', resource: 'system', action: 'config' },
  { name: 'system.backup', description: 'Create and restore system backups', category: 'system_administration', resource: 'system', action: 'backup' },
  { name: 'system.logs', description: 'Access system logs and diagnostics', category: 'system_administration', resource: 'system', action: 'logs' },

  // Security
  { name: 'security.view', description: 'View security events and reports', category: 'security', resource: 'security', action: 'view' },
  { name: 'security.audit', description: 'Perform security audits and investigations', category: 'security', resource: 'security', action: 'audit' },
  { name: 'security.policies', description: 'Manage security policies and rules', category: 'security', resource: 'security', action: 'policies' },

  // File Management
  { name: 'files.view', description: 'Browse and view files', category: 'file_management', resource: 'files', action: 'view' },
  { name: 'files.upload', description: 'Upload new files to the system', category: 'file_management', resource: 'files', action: 'upload' },
  { name: 'files.download', description: 'Download files from the system', category: 'file_management', resource: 'files', action: 'download' },
  { name: 'files.delete', description: 'Remove files from the system', category: 'file_management', resource: 'files', action: 'delete' },

  // Server Management
  { name: 'servers.view', description: 'View server status and information', category: 'server_management', resource: 'servers', action: 'view' },
  { name: 'servers.manage', description: 'Start, stop, and configure servers', category: 'server_management', resource: 'servers', action: 'manage' },
  { name: 'servers.logs', description: 'Access server logs and diagnostics', category: 'server_management', resource: 'servers', action: 'logs' },

  // Workshop Management
  { name: 'workshop.view', description: 'Browse workshop content and mods', category: 'workshop_management', resource: 'workshop', action: 'view' },
  { name: 'workshop.manage', description: 'Install and manage workshop items', category: 'workshop_management', resource: 'workshop', action: 'manage' },

  // Monitoring
  { name: 'monitoring.view', description: 'Access system monitoring dashboards', category: 'monitoring', resource: 'monitoring', action: 'view' },
  { name: 'monitoring.alerts', description: 'Manage monitoring alerts and notifications', category: 'monitoring', resource: 'monitoring', action: 'alerts' },

  // API Access
  { name: 'api.read', description: 'Read access to API endpoints', category: 'api_access', resource: 'api', action: 'read' },
  { name: 'api.write', description: 'Write access to API endpoints', category: 'api_access', resource: 'api', action: 'write' },
  { name: 'api.admin', description: 'Administrative access to API endpoints', category: 'api_access', resource: 'api', action: 'admin' }
];

async function seedPermissions() {
  console.log('🌱 Seeding permissions and roles...');
  
  try {
    // Create permissions
    console.log('📝 Creating permissions...');
    for (const permission of SYSTEM_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      });
      console.log(`  ✅ ${permission.name}`);
    }

    // Create default roles
    console.log('👥 Creating default roles...');
    
    // Super Admin role
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {
        description: 'Full system access with all permissions'
      },
      create: {
        name: 'Super Admin',
        description: 'Full system access with all permissions'
      }
    });

    // Administrator role
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {
        description: 'System administrator with elevated permissions'
      },
      create: {
        name: 'Administrator',
        description: 'System administrator with elevated permissions'
      }
    });

    // Moderator role
    const moderatorRole = await prisma.role.upsert({
      where: { name: 'Moderator' },
      update: {
        description: 'Moderation capabilities with limited admin access'
      },
      create: {
        name: 'Moderator',
        description: 'Moderation capabilities with limited admin access'
      }
    });

    // User role
    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {
        description: 'Standard user with basic permissions'
      },
      create: {
        name: 'User',
        description: 'Standard user with basic permissions'
      }
    });

    console.log('  ✅ Super Admin');
    console.log('  ✅ Administrator');
    console.log('  ✅ Moderator');
    console.log('  ✅ User');

    // Assign all permissions to Super Admin
    console.log('🔗 Assigning permissions to roles...');
    
    const allPermissions = await prisma.permission.findMany();
    
    // Clear existing role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id }
    });

    // Assign all permissions to Super Admin
    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      });
    }
    console.log(`  ✅ Super Admin: ${allPermissions.length} permissions`);

    // Assign admin permissions to Administrator
    const adminPermissions = allPermissions.filter(p => 
      !p.name.includes('system.admin') && 
      !p.name.includes('security.policies')
    );
    
    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id }
    });

    for (const permission of adminPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }
    console.log(`  ✅ Administrator: ${adminPermissions.length} permissions`);

    // Assign moderate permissions to Moderator
    const moderatorPermissions = allPermissions.filter(p => 
      p.name.includes('view') || 
      p.name.includes('users.') ||
      p.name.includes('files.') ||
      p.name.includes('monitoring.')
    );

    await prisma.rolePermission.deleteMany({
      where: { roleId: moderatorRole.id }
    });

    for (const permission of moderatorPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: moderatorRole.id,
          permissionId: permission.id
        }
      });
    }
    console.log(`  ✅ Moderator: ${moderatorPermissions.length} permissions`);

    // Assign basic permissions to User
    const userPermissions = allPermissions.filter(p => 
      p.name.includes('view') && 
      !p.name.includes('security') &&
      !p.name.includes('system') ||
      p.name.includes('files.view') ||
      p.name.includes('files.download')
    );

    await prisma.rolePermission.deleteMany({
      where: { roleId: userRole.id }
    });

    for (const permission of userPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: userRole.id,
          permissionId: permission.id
        }
      });
    }
    console.log(`  ✅ User: ${userPermissions.length} permissions`);

    // Create default admin user
    console.log('👤 Creating default admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
        isActive: true,
        role: 'ADMIN'
      },
      create: {
        username: 'admin',
        email: 'admin@ctrlaltplay.local',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        role: 'ADMIN'
      }
    });

    console.log('  ✅ Admin user created (username: admin, password: admin123)');

    console.log('');
    console.log('🎉 Permission seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  • Permissions: ${allPermissions.length}`);
    console.log(`  • Roles: 4 (Super Admin, Administrator, Moderator, User)`);
    console.log(`  • Default Admin User: admin / admin123`);
    console.log('');
    console.log('🔐 You can now log in with:');
    console.log('  Username: admin');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPermissions();
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedPermissions, SYSTEM_PERMISSIONS };
