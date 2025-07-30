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
    plugin: (() => {
      // Stateful storage for plugins
      const pluginStorage: any[] = [];
      
      // Mock plugin model with stateful implementations
      const mockPluginModel = {
        findUnique: jest.fn().mockImplementation((args) => {
          const plugin = pluginStorage.find(p => p.name === args.where.name);
          return Promise.resolve(plugin || null);
        }),
        findFirst: jest.fn().mockImplementation((args) => {
          const plugin = pluginStorage.find(p => p.name === args.where.name);
          return Promise.resolve(plugin || null);
        }),
        create: jest.fn().mockImplementation((args) => {
          // Check if plugin already exists
          const existing = pluginStorage.find(p => p.name === args.data.name);
          if (existing) {
            throw new Error(`Plugin "${args.data.name}" is already installed`);
          }
          
          const newPlugin = {
            id: args.data.name + '-id',
            name: args.data.name,
            version: args.data.version || '1.0.0',
            author: args.data.author || 'Test Author',
            description: args.data.description || 'Test plugin',
            permissions: args.data.permissions || {},
            autoUpdate: args.data.autoUpdate || false,
            versionLocked: args.data.versionLocked || false,
            status: args.data.status || 'INACTIVE',
            installedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args.data
          };
          pluginStorage.push(newPlugin);
          return Promise.resolve(newPlugin);
        }),
        update: jest.fn().mockImplementation((args) => {
          const index = pluginStorage.findIndex(p => p.name === args.where.name);
          if (index !== -1) {
            pluginStorage[index] = {
              ...pluginStorage[index],
              ...args.data,
              updatedAt: new Date()
            };
            return Promise.resolve(pluginStorage[index]);
          }
          return Promise.reject(new Error(`Plugin ${args.where.name} not found`));
        }),
        findMany: jest.fn().mockImplementation(() => {
          return Promise.resolve([...pluginStorage]);
        }),
        delete: jest.fn().mockImplementation((args) => {
          const index = pluginStorage.findIndex(p => p.name === args.where.name);
          if (index !== -1) {
            const deleted = pluginStorage.splice(index, 1)[0];
            return Promise.resolve(deleted);
          }
          return Promise.reject(new Error(`Plugin ${args.where.name} not found`));
        }),
        deleteMany: jest.fn().mockImplementation((args) => {
          const initialLength = pluginStorage.length;
          const filtered = pluginStorage.filter(p => !args.where || !args.where.name || p.name !== args.where.name);
          const deletedCount = initialLength - filtered.length;
          pluginStorage.length = 0;
          pluginStorage.push(...filtered);
          return Promise.resolve({ count: deletedCount });
        }),
        updateMany: jest.fn().mockImplementation((args) => {
          let updatedCount = 0;
          for (let i = 0; i < pluginStorage.length; i++) {
            pluginStorage[i] = {
              ...pluginStorage[i],
              ...args.data,
              updatedAt: new Date()
            };
            updatedCount++;
          }
          return Promise.resolve({ count: updatedCount });
        })
      };
      return mockPluginModel;
    })(),
    pluginData: (() => {
      // Stateful storage for plugin data
      const pluginDataStorage: any[] = [];
      
      // Mock pluginData model with stateful implementations
      const mockPluginDataModel = {
        findUnique: jest.fn().mockImplementation((args) => {
          const data = pluginDataStorage.find(d => 
            d.pluginId === args.where.pluginId_key?.pluginId && 
            d.key === args.where.pluginId_key?.key
          );
          return Promise.resolve(data || null);
        }),
        findFirst: jest.fn().mockImplementation((args) => {
          const data = pluginDataStorage.find(d => 
            (args.where.pluginId_key && d.pluginId === args.where.pluginId_key.pluginId && d.key === args.where.pluginId_key.key)
          );
          return Promise.resolve(data || null);
        }),
        create: jest.fn().mockImplementation((args) => {
          const newData = {
            id: args.data.pluginId + '-' + args.data.key + '-id',
            pluginId: args.data.pluginId,
            key: args.data.key,
            value: args.data.value,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args.data
          };
          pluginDataStorage.push(newData);
          return Promise.resolve(newData);
        }),
        update: jest.fn().mockImplementation((args) => {
          const index = pluginDataStorage.findIndex(d => 
            d.pluginId === args.where.pluginId_key?.pluginId && 
            d.key === args.where.pluginId_key?.key
          );
          if (index !== -1) {
            pluginDataStorage[index] = {
              ...pluginDataStorage[index],
              ...args.data,
              updatedAt: new Date()
            };
            return Promise.resolve(pluginDataStorage[index]);
          }
          return Promise.reject(new Error(`Plugin data for ${args.where.pluginId_key?.pluginId}:${args.where.pluginId_key?.key} not found`));
        }),
        delete: jest.fn().mockImplementation((args) => {
          const index = pluginDataStorage.findIndex(d => 
            d.pluginId === args.where.pluginId_key?.pluginId && 
            d.key === args.where.pluginId_key?.key
          );
          if (index !== -1) {
            const deleted = pluginDataStorage.splice(index, 1)[0];
            return Promise.resolve(deleted);
          }
          return Promise.reject(new Error(`Plugin data for ${args.where.pluginId_key?.pluginId}:${args.where.pluginId_key?.key} not found`));
        }),
        deleteMany: jest.fn().mockImplementation((args) => {
          const initialLength = pluginDataStorage.length;
          const filtered = pluginDataStorage.filter(d => !args.where || !args.where.pluginId || d.pluginId !== args.where.pluginId);
          const deletedCount = initialLength - filtered.length;
          pluginDataStorage.length = 0;
          pluginDataStorage.push(...filtered);
          return Promise.resolve({ count: deletedCount });
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve([...pluginDataStorage]))
      };
      return mockPluginDataModel;
    })(),
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