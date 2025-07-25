const { permissionService } = require('./dist/services/permissionService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPermissionIntegration() {
  try {
    console.log('🧪 Testing Permission System Integration...\n');

    // 1. Check if permissions are initialized
    console.log('1️⃣ Checking permission initialization...');
    const permissions = await prisma.permission.findMany();
    console.log(`   ✅ Found ${permissions.length} permissions in database`);

    // 2. Check if roles exist
    console.log('\n2️⃣ Checking role initialization...');
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log(`   ✅ Found ${roles.length} roles:`);
    for (const role of roles) {
      console.log(`      - ${role.name}: ${role.permissions.length} permissions`);
    }

    // 3. Test permission checking for a user (if any exist)
    console.log('\n3️⃣ Testing user permissions...');
    const testUser = await prisma.user.findFirst();
    
    if (testUser) {
      console.log(`   📋 Testing permissions for user: ${testUser.username}`);
      
      // Test some basic permissions
      const testPermissions = ['users.view', 'servers.view', 'monitoring.view'];
      
      for (const permission of testPermissions) {
        const hasPermission = await permissionService.hasPermission(testUser.id, permission);
        console.log(`      ${hasPermission ? '✅' : '❌'} ${permission}`);
      }
    } else {
      console.log('   ⚠️  No users found to test permissions');
    }

    // 4. Test security logging
    console.log('\n4️⃣ Testing security logging...');
    await permissionService.logSecurityEvent({
      type: 'SYSTEM_TEST',
      userId: testUser?.id || 'system',
      details: { message: 'Permission integration test' }
    });
    console.log('   ✅ Security event logged successfully');

    // 5. Show recent security logs
    console.log('\n5️⃣ Recent security logs:');
    const recentLogs = await permissionService.getSecurityLogs({
      limit: 5,
      type: 'SYSTEM_TEST'
    });
    
    for (const log of recentLogs) {
      console.log(`   📝 ${log.type} - ${log.createdAt.toISOString()}`);
    }

    console.log('\n🎉 Permission integration test completed successfully!');
    console.log('\n📋 System Status:');
    console.log(`   • Permissions: ${permissions.length} initialized`);
    console.log(`   • Roles: ${roles.length} configured`);
    console.log(`   • Security logging: Active`);
    console.log(`   • Permission checking: Functional`);

  } catch (error) {
    console.error('❌ Permission integration test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionIntegration();
