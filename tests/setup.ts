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
