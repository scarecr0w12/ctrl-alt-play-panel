const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true
      }
    });
    console.log('\n👥 Users:', users);
    
    // Check permissions
    const permissionCount = await prisma.permission.count();
    console.log('\n🔐 Permissions count:', permissionCount);
    
    // Check roles
    const roleCount = await prisma.role.count();
    console.log('👤 Roles count:', roleCount);
    
    // Test password verification for admin user
    if (users.length > 0) {
      const bcrypt = require('bcryptjs');
      const adminUser = users.find(u => u.username === 'admin');
      
      if (adminUser) {
        console.log('\n🔐 Admin user found:', adminUser.email);
        
        const fullUser = await prisma.user.findUnique({
          where: { email: adminUser.email }
        });
        
        const isValidPassword = await bcrypt.compare('admin123', fullUser.password);
        console.log('🔓 Password verification result:', isValidPassword);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
