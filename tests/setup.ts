import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global test setup and utilities
export const createTestUser = async (userData: any) => {
  // Helper to create test users
  return {
    id: 1,
    username: userData.username,
    email: userData.email,
    createdAt: new Date()
  };
};

export const createTestServer = async (serverData: any) => {
  // Helper to create test servers
  return {
    id: 'server-test-123',
    name: serverData.name,
    image: serverData.image,
    status: 'stopped',
    createdAt: new Date()
  };
};

export const getAuthToken = async (email: string, password: string) => {
  // Helper to get JWT token for testing
  return 'test-jwt-token-' + Date.now();
};

// Database cleanup utility that respects foreign key constraints
export const cleanupTestDatabase = async () => {
  console.log('🧹 Cleaning up test database...');
  
  try {
    // Delete in order to respect foreign key constraints
    await prisma.workshopInstallation.deleteMany({});
    await prisma.voiceServer.deleteMany({});
    await prisma.subuser.deleteMany({});
    await prisma.serverTransfer.deleteMany({});
    await prisma.serverMetrics.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.modInstallation.deleteMany({});
    await prisma.database.deleteMany({});
    await prisma.backup.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.allocation.deleteMany({});
    await prisma.alert.deleteMany({});
    await prisma.serverVariable.deleteMany({});
    await prisma.server.deleteMany({});
    await prisma.altVariable.deleteMany({});
    await prisma.alt.deleteMany({});
    await prisma.ctrl.deleteMany({});
    await prisma.userSshKey.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.userPermission.deleteMany({});
    await prisma.recoveryToken.deleteMany({});
    await prisma.apiKey.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.node.deleteMany({});
    await prisma.location.deleteMany({});
    
    console.log('✅ Test database cleanup completed');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    throw error;
  }
};

// Quick cleanup for individual tests
export const quickCleanup = async () => {
  try {
    // Clean up most common test entities
    await prisma.alt.deleteMany({});
    await prisma.ctrl.deleteMany({});
    await prisma.server.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.error('❌ Quick cleanup failed:', error);
  }
};

// Test configuration
export const testConfig = {
  database: {
    url: 'sqlite::memory:'
  },
  jwt: {
    secret: 'test-secret-key'
  },
  agent: {
    secret: 'test-agent-secret'
  }
};

// Global teardown
export const teardownTestDatabase = async () => {
  await cleanupTestDatabase();
  await prisma.$disconnect();
};
