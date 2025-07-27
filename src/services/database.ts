import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: PrismaClient;

  public static async initialize(): Promise<void> {
    try {
      logger.info('Initializing database connection...');
      this.instance = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });

      logger.info('Connecting to database...');
      await this.instance.$connect();
      logger.info('Database connected successfully');
      
      // Test the connection with a simple query
      logger.info('Testing database connection...');
      await this.instance.$queryRaw`SELECT 1 as test`;
      logger.info('Database connection test successful');
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
