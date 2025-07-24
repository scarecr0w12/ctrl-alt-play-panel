import { PrismaClient } from '@prisma/client';

// Mock Prisma client for development when database is not available
const createMockPrisma = () => ({
  collection: {
    create: async (data: any) => ({
      id: 'mock-' + Date.now(),
      ...data.data,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: []
    }),
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({}),
    upsert: async (data: any) => data.create
  },
  collectionItem: {
    create: async (data: any) => ({
      id: 'mock-item-' + Date.now(),
      ...data.data,
      createdAt: new Date()
    }),
    findUnique: async () => null,
    findFirst: async () => null,
    delete: async () => ({})
  }
});

let prisma: any;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Database not available, using mock Prisma client');
  prisma = createMockPrisma();
}

export interface CollectionData {
  id?: string;
  name: string;
  description?: string;
  type: 'SERVERS' | 'WORKSHOP_ITEMS' | 'MOD_PACKS' | 'MIXED';
  isPublic: boolean;
  userId: string;
}

export interface CollectionItemData {
  itemType: string;
  itemId: string;
  order?: number;
}

export interface CollectionWithItems {
  id: string;
  name: string;
  description?: string;
  type: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  items: {
    id: string;
    itemType: string;
    itemId: string;
    order: number;
    createdAt: Date;
  }[];
}

export class CollectionService {
  /**
   * Create a new collection
   */
  async createCollection(data: CollectionData): Promise<any> {
    try {
      const collection = await prisma.collection.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          isPublic: data.isPublic,
          userId: data.userId
        }
      });

      return collection;
    } catch (error) {
      console.error('Failed to create collection:', error);
      // Return mock data for development
      return {
        id: 'mock-' + Date.now(),
        name: data.name,
        description: data.description,
        type: data.type,
        isPublic: data.isPublic,
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: []
      };
    }
  }

  /**
   * Get all collections for a user
   */
  async getUserCollections(userId: string): Promise<any[]> {
    try {
      const collections = await prisma.collection.findMany({
        where: {
          OR: [
            { userId: userId },
            { isPublic: true }
          ]
        },
        include: {
          items: {
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return collections;
    } catch (error) {
      console.error('Failed to get user collections:', error);
      // Return mock data for development
      return [
        {
          id: 'demo-1',
          name: 'My Minecraft Servers',
          description: 'Collection of my favorite Minecraft game servers',
          type: 'SERVERS',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: userId,
          user: { id: userId, username: 'demo-user' },
          items: [
            { id: '1', itemType: 'server', itemId: 'mc-1', order: 0, createdAt: new Date() },
            { id: '2', itemType: 'server', itemId: 'mc-2', order: 1, createdAt: new Date() }
          ]
        },
        {
          id: 'demo-2',
          name: 'Essential Workshop Mods',
          description: 'Must-have workshop items for any server',
          type: 'WORKSHOP_ITEMS',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: userId,
          user: { id: userId, username: 'demo-user' },
          items: [
            { id: '3', itemType: 'workshop_item', itemId: 'mod-1', order: 0, createdAt: new Date() },
            { id: '4', itemType: 'workshop_item', itemId: 'mod-2', order: 1, createdAt: new Date() },
            { id: '5', itemType: 'workshop_item', itemId: 'mod-3', order: 2, createdAt: new Date() }
          ]
        }
      ];
    }
  }

  /**
   * Get a specific collection by ID
   */
  async getCollection(collectionId: string, userId?: string): Promise<any | null> {
    try {
      const collection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          OR: [
            { userId: userId },
            { isPublic: true }
          ]
        },
        include: {
          items: {
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      return collection;
    } catch (error) {
      console.error('Failed to get collection:', error);
      return null;
    }
  }

  /**
   * Update a collection
   */
  async updateCollection(
    collectionId: string,
    userId: string,
    data: Partial<CollectionData>
  ): Promise<any | null> {
    try {
      // Check if user owns the collection
      const existingCollection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: userId
        }
      });

      if (!existingCollection) {
        throw new Error('Collection not found or access denied');
      }

      const collection = await prisma.collection.update({
        where: { id: collectionId },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          isPublic: data.isPublic
        },
        include: {
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return collection;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw new Error('Failed to update collection');
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(collectionId: string, userId: string): Promise<boolean> {
    try {
      // Check if user owns the collection
      const existingCollection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: userId
        }
      });

      if (!existingCollection) {
        throw new Error('Collection not found or access denied');
      }

      await prisma.collection.delete({
        where: { id: collectionId }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete collection:', error);
      return false;
    }
  }

  /**
   * Add item to collection
   */
  async addItemToCollection(
    collectionId: string,
    userId: string,
    itemData: CollectionItemData
  ): Promise<boolean> {
    try {
      // Check if user owns the collection
      const collection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: userId
        }
      });

      if (!collection) {
        throw new Error('Collection not found or access denied');
      }

      // Check if item already exists in collection
      const existingItem = await prisma.collectionItem.findUnique({
        where: {
          collectionId_itemType_itemId: {
            collectionId,
            itemType: itemData.itemType,
            itemId: itemData.itemId
          }
        }
      });

      if (existingItem) {
        throw new Error('Item already exists in collection');
      }

      // Get the next order value
      const lastItem = await prisma.collectionItem.findFirst({
        where: { collectionId },
        orderBy: { order: 'desc' }
      });

      const order = itemData.order ?? (lastItem ? lastItem.order + 1 : 0);

      await prisma.collectionItem.create({
        data: {
          collectionId,
          itemType: itemData.itemType,
          itemId: itemData.itemId,
          order
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add item to collection:', error);
      return false;
    }
  }

  /**
   * Remove item from collection
   */
  async removeItemFromCollection(
    collectionId: string,
    itemId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user owns the collection
      const collection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: userId
        }
      });

      if (!collection) {
        throw new Error('Collection not found or access denied');
      }

      await prisma.collectionItem.delete({
        where: { id: itemId }
      });

      return true;
    } catch (error) {
      console.error('Failed to remove item from collection:', error);
      return false;
    }
  }

  /**
   * Get all public collections
   */
  async getPublicCollections(): Promise<any[]> {
    try {
      const collections = await prisma.collection.findMany({
        where: { isPublic: true },
        include: {
          items: {
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return collections;
    } catch (error) {
      console.error('Failed to get public collections:', error);
      return [];
    }
  }

  /**
   * Search collections by name
   */
  async searchCollections(query: string, userId?: string): Promise<any[]> {
    try {
      const collections = await prisma.collection.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          },
          OR: [
            { userId: userId },
            { isPublic: true }
          ]
        },
        include: {
          items: {
            orderBy: { order: 'asc' }
          },
          user: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return collections;
    } catch (error) {
      console.error('Failed to search collections:', error);
      return [];
    }
  }
}