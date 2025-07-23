import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: PrismaClient;

  public static async initialize(): Promise<void> {
    try {
      this.instance = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });

      await this.instance.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public static getInstance(): PrismaClient {
    if (!this.instance) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  public static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      logger.info('Database disconnected');
    }
  }
}

export default DatabaseService;
