import { PrismaClient } from '@prisma/client';
import { ExternalAgentService } from './externalAgentService';
import axios from 'axios';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Steam Web API configuration
const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_API_ENABLED = process.env.STEAM_API_ENABLED === 'true' && !!STEAM_API_KEY;

export interface WorkshopItemData {
  workshopId: string;
  name: string;
  description?: string;
  type: 'mod' | 'map' | 'collection';
  gameId: string;
  fileSize?: number;
  downloadUrl?: string;
  imageUrl?: string;
}

export interface WorkshopInstallation {
  id: string;
  serverId: string;
  workshopId: string;
  status: string;
  installedAt?: Date;
  createdAt: Date;
  item: WorkshopItemData;
}

export interface ServerWorkshopItem {
  id: string;
  status: string;
  installedAt?: Date | null;
  item: {
    workshopId: string;
    name: string;
    description?: string | null;
    type: string;
    imageUrl?: string | null;
    fileSize?: number | null;
  };
}

export interface WorkshopSearchResult {
  items: WorkshopItemData[];
  totalCount: number;
  hasMore: boolean;
}

export class SteamWorkshopService {
  private externalAgentService: ExternalAgentService;

  constructor() {
    this.externalAgentService = ExternalAgentService.getInstance();
  }

  /**
   * Search Steam Workshop for items
   */
  async searchWorkshopItems(
    gameId: string,
    query?: string,
    type?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<WorkshopSearchResult> {
    try {
      if (STEAM_API_ENABLED) {
        return await this.searchSteamWorkshopItems(gameId, query, type, page, limit);
      } else {
        logger.warn('Steam API not configured, using fallback data');
        return await this.getFallbackWorkshopItems(gameId, query, type, limit);
      }
    } catch (error) {
      logger.error('Failed to search Steam Workshop:', error);
      
      // Fallback to cached data on API failure
      try {
        return await this.getCachedWorkshopItems(gameId, query, type, limit);
      } catch (fallbackError) {
        logger.error('Failed to get cached workshop items:', fallbackError);
        throw new Error('Failed to search Steam Workshop');
      }
    }
  }

  /**
   * Search Steam Workshop via Steam Web API
   */
  private async searchSteamWorkshopItems(
    gameId: string,
    query?: string,
    type?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<WorkshopSearchResult> {
    const params = new URLSearchParams({
      key: STEAM_API_KEY!,
      appid: gameId,
      numperpage: limit.toString(),
      page: page.toString(),
      search_text: query || '',
      match_all_tags: '1',
      required_tags: type || ''
    });

    const response = await axios.get(
      `${STEAM_API_BASE}/IPublishedFileService/QueryFiles/v1/?${params}`,
      { timeout: 10000 }
    );

    if (!response.data?.response?.publishedfiledetails) {
      throw new Error('Invalid Steam API response');
    }

    const items = response.data.response.publishedfiledetails.map((item: any) => ({
      workshopId: item.publishedfileid?.toString() || '',
      name: item.title || 'Unknown Item',
      description: item.description || '',
      type: this.mapSteamFileType(item.file_type),
      gameId: gameId,
      fileSize: item.file_size || 0,
      downloadUrl: `steam://workshop/download/${item.publishedfileid}`,
      imageUrl: item.preview_url || null
    }));

    const totalCount = response.data.response.total || items.length;

    return {
      items,
      totalCount,
      hasMore: (page * limit) < totalCount
    };
  }

  /**
   * Get fallback workshop items when Steam API is not available
   */
  private async getFallbackWorkshopItems(
    gameId: string,
    query?: string,
    type?: string,
    limit: number = 20
  ): Promise<WorkshopSearchResult> {
    // Try to get from database first
    const cachedItems = await this.getCachedWorkshopItems(gameId, query, type, limit);
    
    if (cachedItems.items.length > 0) {
      return cachedItems;
    }

    // Return informative mock data if no cached items
    const mockItems: WorkshopItemData[] = [
      {
        workshopId: 'demo-mod-1',
        name: 'Demo Mod Pack (Steam API Required)',
        description: 'Configure STEAM_API_KEY to access real Workshop content',
        type: 'mod',
        gameId,
        fileSize: 0,
        downloadUrl: '',
        imageUrl: ''
      }
    ];

    return {
      items: mockItems,
      totalCount: mockItems.length,
      hasMore: false
    };
  }

  /**
   * Map Steam file type to our enum
   */
  private mapSteamFileType(fileType: number): 'mod' | 'map' | 'collection' {
    switch (fileType) {
      case 0: return 'mod';
      case 1: return 'map';
      case 2: return 'collection';
      default: return 'mod';
    }
  }

  /**
   * Get cached workshop items from database
   */
  private async getCachedWorkshopItems(
    gameId: string,
    query?: string,
    type?: string,
    limit: number = 20
  ): Promise<WorkshopSearchResult> {
    const whereClause: any = { gameId };
    
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    if (type) {
      whereClause.type = type;
    }

    const items = await prisma.steamWorkshopItem.findMany({
      where: whereClause,
      take: limit,
      orderBy: { lastUpdated: 'desc' }
    });

    const totalCount = await prisma.steamWorkshopItem.count({
      where: whereClause
    });

    return {
      items: items.map(item => ({
        workshopId: item.workshopId,
        name: item.name,
        description: item.description || undefined,
        type: item.type as 'mod' | 'map' | 'collection',
        gameId: item.gameId,
        fileSize: item.fileSize || undefined,
        downloadUrl: item.downloadUrl || undefined,
        imageUrl: item.imageUrl || undefined
      })),
      totalCount,
      hasMore: items.length >= limit
    };
  }

  /**
   * Get workshop item details
   */
  async getWorkshopItem(workshopId: string): Promise<WorkshopItemData | null> {
    try {
      // Check if item exists in database
      let item = await prisma.steamWorkshopItem.findUnique({
        where: { workshopId }
      });

      if (!item) {
        // Fetch from Steam API and cache
        const workshopData = await this.fetchWorkshopItemFromSteam(workshopId);
        if (!workshopData) return null;

        item = await prisma.steamWorkshopItem.create({
          data: workshopData
        });
      }

      return {
        workshopId: item.workshopId,
        name: item.name,
        description: item.description || undefined,
        type: item.type as 'mod' | 'map' | 'collection',
        gameId: item.gameId,
        fileSize: item.fileSize || undefined,
        downloadUrl: item.downloadUrl || undefined,
        imageUrl: item.imageUrl || undefined
      };
    } catch (error) {
      console.error(`Failed to get workshop item ${workshopId}:`, error);
      return null;
    }
  }

  /**
   * Install workshop item on server
   */
  async installWorkshopItem(serverId: string, workshopId: string): Promise<boolean> {
    try {
      // Check if already installed
      const existing = await prisma.workshopInstallation.findUnique({
        where: {
          serverId_itemId: {
            serverId,
            itemId: workshopId
          }
        }
      });

      if (existing && existing.status === 'COMPLETED') {
        throw new Error('Workshop item already installed');
      }

      // Get workshop item details
      const workshopItem = await this.getWorkshopItem(workshopId);
      if (!workshopItem) {
        throw new Error('Workshop item not found');
      }

      // Get server details
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: { node: true }
      });

      if (!server) {
        throw new Error('Server not found');
      }

      // Create or update installation record
      const installation = await prisma.workshopInstallation.upsert({
        where: {
          serverId_itemId: {
            serverId,
            itemId: workshopId
          }
        },
        create: {
          serverId,
          itemId: workshopId,
          status: 'DOWNLOADING'
        },
        update: {
          status: 'DOWNLOADING'
        }
      });

      // Send installation request to external agent
      const result = await this.externalAgentService.installMod(
        server.node.uuid,
        serverId,
        {
          type: 'steam_workshop',
          workshopId,
          name: workshopItem.name,
          downloadUrl: workshopItem.downloadUrl
        }
      );

      const success = result.success;

      if (success) {
        await prisma.workshopInstallation.update({
          where: { id: installation.id },
          data: {
            status: 'INSTALLING'
          }
        });
      } else {
        await prisma.workshopInstallation.update({
          where: { id: installation.id },
          data: {
            status: 'FAILED'
          }
        });
      }

      return success;
    } catch (error) {
      console.error(`Failed to install workshop item ${workshopId}:`, error);
      return false;
    }
  }

  /**
   * Remove workshop item from server
   */
  async removeWorkshopItem(serverId: string, workshopId: string): Promise<boolean> {
    try {
      const installation = await prisma.workshopInstallation.findUnique({
        where: {
          serverId_itemId: {
            serverId,
            itemId: workshopId
          }
        }
      });

      if (!installation) {
        throw new Error('Workshop item not installed');
      }

      // Remove installation record
      await prisma.workshopInstallation.delete({
        where: { id: installation.id }
      });

      // Send removal request to agent (implementation would depend on game)
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: { node: true }
      });

      if (server) {
        // This would send a removal command to the agent
        console.log(`Removing workshop item ${workshopId} from server ${serverId}`);
      }

      return true;
    } catch (error) {
      console.error(`Failed to remove workshop item ${workshopId}:`, error);
      return false;
    }
  }

  /**
   * Get server's installed workshop items
   */
  async getServerWorkshopItems(serverId: string): Promise<ServerWorkshopItem[]> {
    try {
      const installations = await prisma.workshopInstallation.findMany({
        where: { serverId },
        include: {
          item: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return installations.map((installation: any) => ({
        id: installation.id,
        status: installation.status,
        installedAt: installation.installedAt,
        item: {
          workshopId: installation.item.workshopId,
          name: installation.item.name,
          description: installation.item.description,
          type: installation.item.type,
          imageUrl: installation.item.imageUrl,
          fileSize: installation.item.fileSize
        }
      }));
    } catch (error) {
      console.error(`Failed to get workshop items for server ${serverId}:`, error);
      return [];
    }
  }

  /**
   * Update installation status (called by agent webhook)
   */
  async updateInstallationStatus(
    serverId: string,
    workshopId: string,
    status: 'COMPLETED' | 'FAILED',
    error?: string
  ): Promise<void> {
    try {
      await prisma.workshopInstallation.updateMany({
        where: {
          serverId,
          itemId: workshopId
        },
        data: {
          status,
          installedAt: status === 'COMPLETED' ? new Date() : null
        }
      });

      if (status === 'COMPLETED') {
        console.log(`Workshop item ${workshopId} successfully installed on server ${serverId}`);
      } else {
        console.error(`Workshop item ${workshopId} installation failed on server ${serverId}:`, error);
      }
    } catch (error) {
      console.error('Failed to update installation status:', error);
    }
  }

  /**
   * Fetch workshop item from Steam API
   */
  private async fetchWorkshopItemFromSteam(workshopId: string): Promise<WorkshopItemData | null> {
    try {
      if (!STEAM_API_ENABLED) {
        logger.warn(`Steam API not configured, cannot fetch workshop item ${workshopId}`);
        return this.createFallbackWorkshopItem(workshopId);
      }

      const params = new URLSearchParams({
        key: STEAM_API_KEY!,
        itemcount: '1',
        'publishedfileids[0]': workshopId
      });

      const response = await axios.get(
        `${STEAM_API_BASE}/ISteamRemoteStorage/GetPublishedFileDetails/v1/?${params}`,
        { timeout: 10000 }
      );

      if (!response.data?.response?.publishedfiledetails?.[0]) {
        logger.error(`No data returned for workshop item ${workshopId}`);
        return null;
      }

      const item = response.data.response.publishedfiledetails[0];
      
      // Check if item was found (result = 1 means success)
      if (item.result !== 1) {
        logger.error(`Workshop item ${workshopId} not found or unavailable (result: ${item.result})`);
        return null;
      }

      return {
        workshopId: item.publishedfileid?.toString() || workshopId,
        name: item.title || `Workshop Item ${workshopId}`,
        description: item.description || '',
        type: this.mapSteamFileType(item.file_type || 0),
        gameId: item.consumer_appid?.toString() || '0',
        fileSize: item.file_size || 0,
        downloadUrl: `steam://workshop/download/${workshopId}`,
        imageUrl: item.preview_url || null
      };
    } catch (error) {
      logger.error(`Failed to fetch workshop item ${workshopId} from Steam:`, error);
      
      // Return fallback item for development/testing
      return this.createFallbackWorkshopItem(workshopId);
    }
  }

  /**
   * Create fallback workshop item when Steam API is unavailable
   */
  private createFallbackWorkshopItem(workshopId: string): WorkshopItemData {
    return {
      workshopId,
      name: `Workshop Item ${workshopId} (API Required)`,
      description: 'Configure STEAM_API_KEY to fetch real item details',
      type: 'mod',
      gameId: '0',
      fileSize: 0,
      downloadUrl: `steam://workshop/download/${workshopId}`,
      imageUrl: ''
    };
  }

  /**
   * Sync workshop items (update cached data from Steam)
   */
  async syncWorkshopItems(): Promise<void> {
    try {
      if (!STEAM_API_ENABLED) {
        logger.warn('Steam API not configured, skipping workshop items sync');
        return;
      }

      const items = await prisma.steamWorkshopItem.findMany({
        where: {
          lastUpdated: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        },
        take: 100 // Limit to avoid API rate limits
      });

      let syncedCount = 0;
      let failedCount = 0;

      for (const item of items) {
        try {
          const updated = await this.fetchWorkshopItemFromSteam(item.workshopId);
          if (updated && updated.name !== `Workshop Item ${item.workshopId} (API Required)`) {
            await prisma.steamWorkshopItem.update({
              where: { id: item.id },
              data: {
                ...updated,
                lastUpdated: new Date()
              }
            });
            syncedCount++;
          } else {
            failedCount++;
          }
          
          // Rate limiting - Steam API has limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Failed to sync workshop item ${item.workshopId}:`, error);
          failedCount++;
        }
      }

      logger.info(`Workshop sync completed: ${syncedCount} synced, ${failedCount} failed, ${items.length} total`);
    } catch (error) {
      logger.error('Failed to sync workshop items:', error);
    }
  }

  /**
   * Get Steam Workshop integration status
   */
  getIntegrationStatus(): {
    enabled: boolean;
    configured: boolean;
    apiKey: boolean;
    lastSync?: Date;
  } {
    return {
      enabled: STEAM_API_ENABLED,
      configured: !!process.env.STEAM_API_KEY,
      apiKey: !!STEAM_API_KEY,
      lastSync: undefined // Could track this in database
    };
  }
}
