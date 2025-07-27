/**
 * User Event Hooks for Marketplace Integration
 * Automatically synchronizes user events with marketplace
 */

import { userSyncService, PanelUser } from '../services/UserSyncService';
import { marketplaceIntegration } from '../services/MarketplaceIntegration';
import { logger } from '../utils/logger';

export class UserEventHooks {
  /**
   * Handle user creation event
   */
  static async onUserCreated(user: PanelUser): Promise<void> {
    try {
      logger.info('Processing user creation event for marketplace sync', {
        userId: user.id,
        email: user.email
      });

      await userSyncService.syncUserCreate(user);

      logger.info('User creation successfully synchronized with marketplace', {
        userId: user.id
      });
    } catch (error) {
      logger.error('Failed to sync user creation with marketplace', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw - we don't want to fail user creation if marketplace sync fails
    }
  }

  /**
   * Handle user update event
   */
  static async onUserUpdated(user: PanelUser): Promise<void> {
    try {
      logger.info('Processing user update event for marketplace sync', {
        userId: user.id,
        email: user.email
      });

      await userSyncService.syncUserUpdate(user);

      logger.info('User update successfully synchronized with marketplace', {
        userId: user.id
      });
    } catch (error) {
      logger.error('Failed to sync user update with marketplace', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw - we don't want to fail user updates if marketplace sync fails
    }
  }

  /**
   * Handle user deletion event
   */
  static async onUserDeleted(userId: string): Promise<void> {
    try {
      logger.info('Processing user deletion event for marketplace sync', {
        userId
      });

      await userSyncService.syncUserDelete(userId);

      logger.info('User deletion successfully synchronized with marketplace', {
        userId
      });
    } catch (error) {
      logger.error('Failed to sync user deletion with marketplace', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw - we don't want to fail user deletion if marketplace sync fails
    }
  }

  /**
   * Handle user login event (for analytics)
   */
  static async onUserLogin(userId: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      logger.debug('Processing user login event for marketplace analytics', {
        userId
      });

      // Send login analytics event to marketplace
      const success = await marketplaceIntegration.sendAnalyticsEvent('user_login', {
        user_id: userId,
        timestamp: new Date().toISOString(),
        source: 'panel-system',
        ...metadata
      });

      if (success) {
        logger.debug('User login analytics sent to marketplace', {
          userId
        });
      }
    } catch (error) {
      logger.warn('Failed to send login analytics to marketplace', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw - analytics are not critical
    }
  }

  /**
   * Handle user logout event (for analytics)
   */
  static async onUserLogout(userId: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      logger.debug('Processing user logout event for marketplace analytics', {
        userId
      });

      // Send logout analytics event to marketplace
      const success = await marketplaceIntegration.sendAnalyticsEvent('user_logout', {
        user_id: userId,
        timestamp: new Date().toISOString(),
        source: 'panel-system',
        ...metadata
      });

      if (success) {
        logger.debug('User logout analytics sent to marketplace', {
          userId
        });
      }
    } catch (error) {
      logger.warn('Failed to send logout analytics to marketplace', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw - analytics are not critical
    }
  }

  /**
   * Bulk sync existing users to marketplace
   */
  static async bulkSyncUsers(users: PanelUser[]): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ user_id: string; error: string }>;
  }> {
    logger.info('Starting bulk user synchronization', {
      userCount: users.length
    });

    const result = await userSyncService.batchSyncUsers(users, 'create');

    logger.info('Bulk user synchronization completed', {
      total: users.length,
      successful: result.successful.length,
      failed: result.failed.length
    });

    return {
      successful: result.successful.length,
      failed: result.failed.length,
      errors: result.failed
    };
  }

  /**
   * Verify and re-sync user if needed
   */
  static async ensureUserSynced(user: PanelUser): Promise<boolean> {
    try {
      logger.debug('Verifying user sync status', {
        userId: user.id
      });

      const verification = await userSyncService.verifyUserSync(user.id);
      
      if (!verification.is_synced) {
        logger.info('User not synced, attempting re-sync', {
          userId: user.id
        });

        const result = await userSyncService.resyncUser(user);
        return result.success;
      }

      return true;
    } catch (error) {
      logger.error('Failed to ensure user sync', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }
}
