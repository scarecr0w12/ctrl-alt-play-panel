import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Prisma Client for all tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workshopInstallation: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    voiceServer: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    subuser: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    serverTransfer: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    serverMetrics: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    schedule: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    modInstallation: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    database: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    backup: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    allocation: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    alert: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    serverVariable: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    server: {
      deleteMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    altVariable: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    alt: {
      deleteMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn()
    },
    ctrl: {
      deleteMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => {
        const ctrlData = data?.data || data;
        return Promise.resolve({
          id: `ctrl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: ctrlData.name,
          displayName: ctrlData.displayName,
          description: ctrlData.description,
          author: ctrlData.author,
          dockerImage: ctrlData.dockerImage,
          altCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      update: jest.fn()
    },
    userSshKey: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    userSession: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    userPermission: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    recoveryToken: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    apiKey: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    user: {
      deleteMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => {
        const userData = data?.data || data;
        return Promise.resolve({
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: userData.password,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      update: jest.fn()
    },
    rolePermission: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    role: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    permission: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    node: {
      deleteMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn()
    },
    location: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $connect: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock external services for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
  })),
}));

// Mock External Agent Service
jest.mock('../src/services/externalAgentService', () => {
  return jest.fn().mockImplementation(() => ({
    listFiles: jest.fn().mockResolvedValue({ success: true, data: [] }),
    readFile: jest.fn().mockResolvedValue({ success: true, data: { content: '', size: 0, modified: '' } }),
    writeFile: jest.fn().mockResolvedValue({ success: true, data: { size: 0, modified: '' } }),
    createDirectory: jest.fn().mockResolvedValue({ success: true }),
    deleteFile: jest.fn().mockResolvedValue({ success: true }),
    renameFile: jest.fn().mockResolvedValue({ success: true }),
    downloadFile: jest.fn().mockResolvedValue({ success: true, data: { content: '', encoding: 'base64' } }),
    uploadFile: jest.fn().mockResolvedValue({ success: true, data: { size: 0 } }),
    copyFile: jest.fn().mockResolvedValue({ success: true }),
    moveFile: jest.fn().mockResolvedValue({ success: true }),
    getFilePermissions: jest.fn().mockResolvedValue({ success: true, data: { permissions: '0644' } }),
    setFilePermissions: jest.fn().mockResolvedValue({ success: true }),
    createArchive: jest.fn().mockResolvedValue({ success: true, data: { path: '' } }),
    extractArchive: jest.fn().mockResolvedValue({ success: true }),
    getAgentStatus: jest.fn().mockResolvedValue({ online: true, version: '1.0.0' }),
    isAgentAvailable: jest.fn().mockReturnValue(true),
    executeCommand: jest.fn().mockResolvedValue({ success: true, data: { output: '', exitCode: 0 } }),
    validateConnection: jest.fn().mockResolvedValue({ success: true }),
  }));
});

// Mock Steam Workshop service
jest.mock('../src/services/steamWorkshopService', () => ({
  SteamWorkshopService: jest.fn().mockImplementation(() => ({
    searchWorkshopItems: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getWorkshopItem: jest.fn().mockResolvedValue(null),
    installWorkshopItem: jest.fn().mockResolvedValue(true),
    removeWorkshopItem: jest.fn().mockResolvedValue(true),
    getServerWorkshopItems: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock Marketplace Integration
jest.mock('../src/services/MarketplaceIntegration', () => ({
  MarketplaceIntegration: {
    getInstance: jest.fn(() => ({
      testConnection: jest.fn().mockResolvedValue(true),
      syncUser: jest.fn().mockResolvedValue({ success: true }),
      getUserProfile: jest.fn().mockResolvedValue({}),
    })),
  },
}));

// Set test timeout
jest.setTimeout(15000);

// Global test environment setup
beforeAll(async () => {
  // Ensure we're in test environment
  if (!process.env.NODE_ENV) {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
  }
});

afterAll(async () => {
  // Clean up any test artifacts
  if (global.gc) {
    global.gc();
  }
});