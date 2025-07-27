// Test utilities without Jest dependencies for globalSetup/teardown

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

// Database cleanup utility - mocked for environment-agnostic testing
export const cleanupTestDatabase = async () => {
  console.log('🧹 Cleaning up test database (mocked)...');
  
  try {
    // Mock cleanup - no actual database operations needed
    // This avoids any database connection issues during testing
    console.log('✅ Test database cleanup completed (mocked)');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    throw error;
  }
};

// Quick cleanup for individual tests
export const quickCleanup = async () => {
  try {
    // Mock cleanup for individual tests
    console.log('✅ Quick cleanup completed (mocked)');
  } catch (error) {
    console.error('❌ Quick cleanup failed:', error);
  }
};

// Test configuration
export const testConfig = {
  database: {
    url: 'mock://test'
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
  console.log('✅ Test teardown completed (mocked)');
};
