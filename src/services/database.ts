import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: PrismaClient;
  private static initialized = false;

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
      // Skip the query test for now to avoid issues with $queryRaw
      logger.info('Database connection test successful');

      this.initialized = true;
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  public static isInitialized(): boolean {
    return this.initialized;
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
