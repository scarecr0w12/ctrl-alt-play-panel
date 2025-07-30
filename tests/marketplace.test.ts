/**
 * Marketplace Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MarketplaceIntegration } from '../src/services/MarketplaceIntegration';
import { UserSyncService } from '../src/services/UserSyncService';
import { UserEventHooks } from '../src/services/UserEventHooks';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Marketplace Integration', () => {
  let marketplaceIntegration: MarketplaceIntegration;
  let userSyncService: UserSyncService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock axios.create
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    } as any);

    // Create test instances
    marketplaceIntegration = new MarketplaceIntegration({
      api_key: 'test-api-key',
      jwt_secret: 'test-jwt-secret',
      base_url: 'https://test-marketplace.com/api/v1'
    });

    userSyncService = new UserSyncService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('MarketplaceIntegration', () => {
    it('should create instance with correct configuration', () => {
      expect(marketplaceIntegration).toBeInstanceOf(MarketplaceIntegration);
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://test-marketplace.com/api/v1',
          timeout: 30000
        })
      );
    });

    it('should test connection successfully', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      };

      const mockAxiosInstance: any = {
        get: jest.fn().mockResolvedValue(mockResponse as unknown as never)
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const integration = new MarketplaceIntegration({
        api_key: 'test-key',
        jwt_secret: 'test-secret'
      });

      const result = await integration.testConnection();
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should handle connection test failure', async () => {
      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(new Error('Network error') as never)
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const integration = new MarketplaceIntegration({
        api_key: 'test-key',
        jwt_secret: 'test-secret'
      });

      const result = await integration.testConnection();
      expect(result).toBe(false);
    });

    it('should sync user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user_id: 'user-123',
            marketplace_user_id: 'mp-user-456',
            sync_status: 'synchronized',
            created_at: '2024-01-01T00:00:00Z'
          }
        }
      };

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const integration = new MarketplaceIntegration({
        api_key: 'test-key',
        jwt_secret: 'test-secret'
      });

      const userSyncRequest = {
        user_id: 'user-123',
        action: 'create' as const,
        user_data: {
          user_id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          display_name: 'Test User',
          avatar_url: undefined,
          profile: {
            bio: undefined,
            location: undefined,
            website: undefined,
            social_links: {}
          },
          preferences: {
            newsletter: false,
            notifications: true,
            profile_visibility: 'public' as const
          },
          roles: ['user'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      };

      const result = await integration.syncUser(userSyncRequest);
      
      expect(result).toEqual({
        user_id: 'user-123',
        marketplace_user_id: 'mp-user-456',
        sync_status: 'synchronized',
        created_at: '2024-01-01T00:00:00Z'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/integration/users/sync',
        userSyncRequest
      );
    });

    it('should publish plugin successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            marketplace_item_id: 'mp-item-789',
            panel_item_id: 'panel-item-123',
            status: 'published',
            published_at: '2024-01-01T00:00:00Z'
          }
        }
      };

      const mockAxiosInstance = {
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const integration = new MarketplaceIntegration({
        api_key: 'test-key',
        jwt_secret: 'test-secret'
      });

      const publishRequest: any = {
        panel_item_id: 'panel-item-123',
        user_id: 'user-123',
        item_data: {
          title: 'Test Plugin',
          description: 'A test plugin',
          version: '1.0.0',
          author: 'Test Author',
          tags: ['test'],
          category_id: 'utility',
          files: [{
            name: 'manifest.json',
            size: 100,
            type: 'application/json',
            url: 'https://example.com/plugin.zip',
            checksum: 'abc123'
          }],
          screenshots: []
        }
      };

      const result = await integration.publishPlugin(publishRequest);
      
      expect(result).toEqual({
        marketplace_item_id: 'mp-item-789',
        panel_item_id: 'panel-item-123',
        status: 'published',
        published_at: '2024-01-01T00:00:00Z'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/integration/plugins/publish',
        publishRequest
      );
    });
  });

  describe('UserSyncService', () => {
    it('should sync user creation', async () => {
      // Mock the marketplace integration
      const mockSyncUser = jest.fn().mockResolvedValue({
        data: {
          user_id: 'user-123',
          marketplace_user_id: 'mp-456',
          sync_status: 'synchronized',
          created_at: '2024-01-01T00:00:00Z'
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {}
      } as AxiosResponse<any>);

      // Replace the marketplace integration instance
      (userSyncService as any).marketplaceIntegration = {
        syncUser: mockSyncUser
      };

      const panelUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        preferences: {},
        metadata: {}
      };

      const result = await userSyncService.syncUserCreate(panelUser);
      
      expect(result).toEqual({
        marketplace_user_id: 'mp-user-456',
        status: 'synchronized'
      });

      expect(mockSyncUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'create',
          user_data: expect.objectContaining({
            email: 'test@example.com',
            username: 'testuser'
          })
        })
      );
    });

    it('should handle sync failure gracefully', async () => {
      // Mock the marketplace integration to throw error
      const mockSyncUser = jest.fn().mockRejectedValue(new Error('Network error') as never);

      // Replace the marketplace integration instance
      (userSyncService as any).marketplaceIntegration = {
        syncUser: mockSyncUser
      };

      const panelUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date(),
        preferences: {},
        metadata: {}
      };

      await expect(userSyncService.syncUserCreate(panelUser)).rejects.toThrow('Network error');
    });

    it('should batch sync users', async () => {
      // Mock the sync methods
      const mockSyncUserCreate = jest.fn()
        .mockResolvedValueOnce({
          data: { marketplace_user_id: 'mp-1', status: 'synchronized' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {}
        } as AxiosResponse<any>)
        .mockResolvedValueOnce({
          data: { marketplace_user_id: 'mp-2', status: 'synchronized' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          request: {}
        } as AxiosResponse<any>)
        .mockRejectedValueOnce(new Error('Sync failed'));

      userSyncService.syncUserCreate = mockSyncUserCreate;

      const users = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          username: 'user1',
          created_at: new Date(),
          updated_at: new Date(),
          preferences: {},
          metadata: {}
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          username: 'user2',
          created_at: new Date(),
          updated_at: new Date(),
          preferences: {},
          metadata: {}
        },
        {
          id: 'user-3',
          email: 'user3@example.com',
          username: 'user3',
          created_at: new Date(),
          updated_at: new Date(),
          preferences: {},
          metadata: {}
        }
      ];

      const result = await userSyncService.batchSyncUsers(users, 'create');
      
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual({
        user_id: 'user-3',
        error: 'Sync failed'
      });
    });
  });

  describe('UserEventHooks', () => {
    it('should handle user creation event', async () => {
      const mockSyncUserCreate = jest.fn().mockResolvedValue({
        data: {
          marketplace_user_id: 'mp-user-456',
          status: 'synchronized'
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      } as AxiosResponse<any>);

      // Mock the userSyncService
      (UserEventHooks as any).userSyncService = {
        syncUserCreate: mockSyncUserCreate
      };

      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date(),
        preferences: {},
        metadata: {}
      };

      // Should not throw
      await expect(UserEventHooks.onUserCreated(user)).resolves.toBeUndefined();
      expect(mockSyncUserCreate).toHaveBeenCalledWith(user);
    });

    it('should handle sync errors gracefully in user creation', async () => {
      const mockSyncUserCreate = jest.fn().mockRejectedValue(new Error('Sync failed'));

      // Mock the userSyncService
      (UserEventHooks as any).userSyncService = {
        syncUserCreate: mockSyncUserCreate
      };

      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date(),
        preferences: {},
        metadata: {}
      };

      // Should not throw even when sync fails
      await expect(UserEventHooks.onUserCreated(user)).resolves.toBeUndefined();
      expect(mockSyncUserCreate).toHaveBeenCalledWith(user);
    });

    it('should send analytics events', async () => {
      const mockSendAnalyticsEvent = jest.fn().mockResolvedValue({
        data: true,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      } as AxiosResponse<any>);

      // Mock the marketplaceIntegration
      (UserEventHooks as any).marketplaceIntegration = {
        sendAnalyticsEvent: mockSendAnalyticsEvent
      };

      await UserEventHooks.onUserLogin('user-123', { ip: '127.0.0.1' });

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        'user_login',
        expect.objectContaining({
          user_id: 'user-123',
          ip: '127.0.0.1',
          source: 'panel-system'
        })
      );
    });
  });
});
