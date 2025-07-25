const { PrismaClient } = require('@prisma/client');
const { permissionService } = require('./dist/services/permissionService');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedPermissions() {
  console.log('🌱 Seeding permissions and roles...');

  // Clear existing data
  await prisma.userPermission.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  // Create permissions
  console.log('📝 Creating permissions...');
  for (const [name, details] of Object.entries(SYSTEM_PERMISSIONS)) {
    await prisma.permission.create({
      data: {
        name,
        description: details.description,
        category: details.category,
        resource: details.resource || 'system',
        action: details.action || 'access'
      }
    });
  }

  // Create roles
  console.log('👥 Creating roles...');
  const roles = ['USER', 'MODERATOR', 'ADMIN'];
  for (const role of roles) {
    await prisma.role.create({
      data: {
        name: role,
        description: `System ${role.toLowerCase()} role`,
        isSystem: true,
        priority: role === 'ADMIN' ? 100 : role === 'MODERATOR' ? 50 : 10
      }
    });
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...');
  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    
    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
      
      if (role && permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }
  }

  console.log('✅ Permissions and roles seeded successfully!');
  console.log(`📊 Created ${Object.keys(SYSTEM_PERMISSIONS).length} permissions`);
  console.log(`👥 Created ${roles.length} roles`);
}

seedPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
