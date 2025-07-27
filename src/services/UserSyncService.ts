/**
 * User Synchronization Service
 * Handles synchronization of user data between Panel and Marketplace
 */

import { marketplaceIntegration } from './MarketplaceIntegration';
import { UserSyncRequest, MarketplaceUser } from '../types/marketplace';
import { logger } from '../utils/logger';

export interface PanelUser {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  preferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class UserSyncService {
  /**
   * Synchronize user creation with marketplace
   */
  async syncUserCreate(user: PanelUser): Promise<{ marketplace_user_id: string; status: string }> {
    try {
      const request: UserSyncRequest = {
        user_id: user.id,
        action: 'create',
        user_data: {
          user_id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name || user.username,
          avatar_url: user.avatar_url,
          profile: {
            bio: (user.metadata?.bio as string) || undefined,
            location: (user.metadata?.location as string) || undefined,
            website: (user.metadata?.website as string) || undefined,
            social_links: (user.metadata?.social_links as Record<string, string>) || {}
          },
          preferences: {
            newsletter: (user.preferences?.newsletter as boolean) || false,
            notifications: (user.preferences?.notifications as boolean) || true,
            profile_visibility: (user.preferences?.profile_visibility as 'public' | 'private') || 'public'
          },
          roles: (user.metadata?.roles as string[]) || ['user'],
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString()
        }
      };

      const result = await marketplaceIntegration.syncUser(request);

      logger.info('User created and synchronized with marketplace', {
        panelUserId: user.id,
        marketplaceUserId: result.marketplace_user_id,
        status: result.sync_status
      });

      return {
        marketplace_user_id: result.marketplace_user_id,
        status: result.sync_status
      };
    } catch (error) {
      logger.error('Failed to sync user creation', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Synchronize user updates with marketplace
   */
  async syncUserUpdate(user: PanelUser): Promise<{ marketplace_user_id: string; status: string }> {
    try {
      const request: UserSyncRequest = {
        user_id: user.id,
        action: 'update',
        user_data: {
          user_id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name || user.username,
          avatar_url: user.avatar_url,
          profile: {
            bio: (user.metadata?.bio as string) || undefined,
            location: (user.metadata?.location as string) || undefined,
            website: (user.metadata?.website as string) || undefined,
            social_links: (user.metadata?.social_links as Record<string, string>) || {}
          },
          preferences: {
            newsletter: (user.preferences?.newsletter as boolean) || false,
            notifications: (user.preferences?.notifications as boolean) || true,
            profile_visibility: (user.preferences?.profile_visibility as 'public' | 'private') || 'public'
          },
          roles: (user.metadata?.roles as string[]) || ['user'],
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString()
        }
      };

      const result = await marketplaceIntegration.syncUser(request);

      logger.info('User updated and synchronized with marketplace', {
        panelUserId: user.id,
        marketplaceUserId: result.marketplace_user_id,
        status: result.sync_status
      });

      return {
        marketplace_user_id: result.marketplace_user_id,
        status: result.sync_status
      };
    } catch (error) {
      logger.error('Failed to sync user update', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Synchronize user deletion with marketplace
   */
  async syncUserDelete(userId: string): Promise<{ status: string }> {
    try {
      const request: UserSyncRequest = {
        user_id: userId,
        action: 'delete',
        user_data: {
          user_id: userId,
          email: 'deleted@example.com', // Placeholder for deleted user
          username: 'deleted-user',
          display_name: 'Deleted User',
          profile: {
            bio: undefined,
            location: undefined,
            website: undefined,
            social_links: {}
          },
          preferences: {
            newsletter: false,
            notifications: false,
            profile_visibility: 'private'
          },
          roles: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      const result = await marketplaceIntegration.syncUser(request);

      logger.info('User deleted and synchronized with marketplace', {
        panelUserId: userId,
        status: result.sync_status
      });

      return {
        status: result.sync_status
      };
    } catch (error) {
      logger.error('Failed to sync user deletion', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user profile from marketplace
   */
  async getMarketplaceUserProfile(userId: string): Promise<MarketplaceUser> {
    try {
      const profile = await marketplaceIntegration.getUserProfile(userId);

      logger.debug('Retrieved user profile from marketplace', {
        panelUserId: userId,
        marketplaceUserId: profile.user_id
      });

      return profile;
    } catch (error) {
      logger.error('Failed to get marketplace user profile', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Batch synchronize multiple users
   */
  async batchSyncUsers(users: PanelUser[], action: 'create' | 'update'): Promise<{
    successful: Array<{ user_id: string; marketplace_user_id: string; status: string }>;
    failed: Array<{ user_id: string; error: string }>;
  }> {
    const successful: Array<{ user_id: string; marketplace_user_id: string; status: string }> = [];
    const failed: Array<{ user_id: string; error: string }> = [];

    logger.info('Starting batch user synchronization', {
      userCount: users.length,
      action
    });

    for (const user of users) {
      try {
        let result;
        if (action === 'create') {
          result = await this.syncUserCreate(user);
        } else {
          result = await this.syncUserUpdate(user);
        }

        successful.push({
          user_id: user.id,
          marketplace_user_id: result.marketplace_user_id,
          status: result.status
        });
      } catch (error) {
        failed.push({
          user_id: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Batch user synchronization completed', {
      totalUsers: users.length,
      successful: successful.length,
      failed: failed.length,
      action
    });

    return { successful, failed };
  }

  /**
   * Verify user synchronization status
   */
  async verifyUserSync(userId: string): Promise<{
    is_synced: boolean;
    marketplace_user_id?: string;
    last_sync?: string;
    sync_status?: string;
  }> {
    try {
      const profile = await this.getMarketplaceUserProfile(userId);
      
      return {
        is_synced: true,
        marketplace_user_id: profile.user_id,
        last_sync: profile.updated_at,
        sync_status: 'synchronized'
      };
    } catch (error) {
      logger.warn('User sync verification failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        is_synced: false
      };
    }
  }

  /**
   * Re-sync user data if out of sync
   */
  async resyncUser(user: PanelUser): Promise<{ success: boolean; marketplace_user_id?: string }> {
    try {
      // First check if user exists in marketplace
      const verification = await this.verifyUserSync(user.id);
      
      if (verification.is_synced) {
        // User exists, update
        const result = await this.syncUserUpdate(user);
        return {
          success: true,
          marketplace_user_id: result.marketplace_user_id
        };
      } else {
        // User doesn't exist, create
        const result = await this.syncUserCreate(user);
        return {
          success: true,
          marketplace_user_id: result.marketplace_user_id
        };
      }
    } catch (error) {
      logger.error('Failed to re-sync user', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false
      };
    }
  }
}

/**
 * Default user sync service instance
 */
export const userSyncService = new UserSyncService();
