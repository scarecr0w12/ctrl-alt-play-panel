import { PrismaClient } from '@prisma/client';
import { AgentService } from './agentService';
import axios from 'axios';

const prisma = new PrismaClient();

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

export interface WorkshopSearchResult {
  items: WorkshopItemData[];
  totalCount: number;
  hasMore: boolean;
}

export class SteamWorkshopService {
  private agentService: AgentService;

  constructor() {
    this.agentService = new AgentService();
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
      // In a real implementation, this would use Steam Web API
      // For now, return mock data
      const mockItems: WorkshopItemData[] = [
        {
          workshopId: '12345',
          name: 'Epic Mod Pack',
          description: 'A collection of amazing mods',
          type: 'mod',
          gameId,
          fileSize: 1024 * 1024 * 50, // 50MB
          downloadUrl: 'steam://workshop/download/12345',
          imageUrl: 'https://steamuserimages-a.akamaihd.net/ugc/12345/image.jpg'
        },
        {
          workshopId: '67890',
          name: 'Custom Map Collection',
          description: 'Best custom maps for this game',
          type: 'collection',
          gameId,
          fileSize: 1024 * 1024 * 25, // 25MB
          downloadUrl: 'steam://workshop/download/67890',
          imageUrl: 'https://steamuserimages-a.akamaihd.net/ugc/67890/image.jpg'
        }
      ];

      return {
        items: mockItems,
        totalCount: mockItems.length,
        hasMore: false
      };
    } catch (error) {
      console.error('Failed to search Steam Workshop:', error);
      throw new Error('Failed to search Steam Workshop');
    }
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

      // Send installation request to agent
      const success = await this.agentService.installMod(
        server.node.fqdn,
        serverId,
        {
          type: 'steam_workshop',
          workshopId,
          name: workshopItem.name,
          downloadUrl: workshopItem.downloadUrl
        }
      );

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
  async getServerWorkshopItems(serverId: string): Promise<any[]> {
    try {
      const installations = await prisma.workshopInstallation.findMany({
        where: { serverId },
        include: {
          item: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return installations.map(installation => ({
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
   * Fetch workshop item from Steam API (mock implementation)
   */
  private async fetchWorkshopItemFromSteam(workshopId: string): Promise<any | null> {
    try {
      // In a real implementation, this would call Steam Web API
      // For development, return mock data
      return {
        workshopId,
        name: `Steam Workshop Item ${workshopId}`,
        description: `Description for workshop item ${workshopId}`,
        type: 'mod',
        gameId: '570', // Example: Dota 2
        fileSize: 1024 * 1024 * 10, // 10MB
        downloadUrl: `steam://workshop/download/${workshopId}`,
        imageUrl: `https://steamuserimages-a.akamaihd.net/ugc/${workshopId}/image.jpg`,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Failed to fetch workshop item ${workshopId} from Steam:`, error);
      return null;
    }
  }

  /**
   * Sync workshop items (update cached data from Steam)
   */
  async syncWorkshopItems(): Promise<void> {
    try {
      const items = await prisma.steamWorkshopItem.findMany({
        where: {
          lastUpdated: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        }
      });

      for (const item of items) {
        const updated = await this.fetchWorkshopItemFromSteam(item.workshopId);
        if (updated) {
          await prisma.steamWorkshopItem.update({
            where: { id: item.id },
            data: updated
          });
        }
      }

      console.log(`Synced ${items.length} workshop items`);
    } catch (error) {
      console.error('Failed to sync workshop items:', error);
    }
  }
}
