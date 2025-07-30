import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export async function initializeRedis(): Promise<void> {
  try {
    logger.info('Starting Redis initialization...');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    logger.info(`Using Redis URL: ${redisUrl}`);
    redisClient = createClient({
      url: redisUrl
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });
    
    logger.info('Connecting to Redis...');
    await redisClient.connect();
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis', error);
    // Don't throw error to prevent app crash if Redis is not available
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

export async function addToBlacklist(token: string, expiry: number): Promise<void> {
  if (!redisClient) {
    logger.warn('Redis client not available, cannot blacklist token');
    return;
  }
  
  try {
    // Add token to blacklist with expiry time
    await redisClient.setEx(`blacklist:${token}`, expiry, 'true');
  } catch (error) {
    logger.error('Failed to add token to blacklist', error);
  }
}

export async function isBlacklisted(token: string): Promise<boolean> {
  if (!redisClient) {
    logger.warn('Redis client not available, cannot check blacklist');
    return false;
  }
  
  try {
    const result = await redisClient.get(`blacklist:${token}`);
    return result === 'true';
  } catch (error) {
    logger.error('Failed to check token blacklist status', error);
    return false;
  }
}
