/**
 * Database Configuration Service
 * Handles multiple database types and connection management
 */

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  url?: string;
  ssl?: boolean;
  options?: Record<string, any>;
}

export interface DatabaseProvider {
  type: string;
  name: string;
  defaultPort: number;
  requiresAuth: boolean;
  supportsSSL: boolean;
  dockerImage?: string;
  connectionStringFormat: string;
}

export const DATABASE_PROVIDERS: Record<string, DatabaseProvider> = {
  postgresql: {
    type: 'postgresql',
    name: 'PostgreSQL',
    defaultPort: 5432,
    requiresAuth: true,
    supportsSSL: true,
    dockerImage: 'postgres:15-alpine',
    connectionStringFormat: 'postgresql://{username}:{password}@{host}:{port}/{database}?sslmode={ssl}'
  },
  mysql: {
    type: 'mysql',
    name: 'MySQL',
    defaultPort: 3306,
    requiresAuth: true,
    supportsSSL: true,
    dockerImage: 'mysql:8.0',
    connectionStringFormat: 'mysql://{username}:{password}@{host}:{port}/{database}'
  },
  mariadb: {
    type: 'mysql',
    name: 'MariaDB',
    defaultPort: 3306,
    requiresAuth: true,
    supportsSSL: true,
    dockerImage: 'mariadb:10.11',
    connectionStringFormat: 'mysql://{username}:{password}@{host}:{port}/{database}'
  },
  mongodb: {
    type: 'mongodb',
    name: 'MongoDB',
    defaultPort: 27017,
    requiresAuth: false,
    supportsSSL: true,
    dockerImage: 'mongo:7.0',
    connectionStringFormat: 'mongodb://{username}:{password}@{host}:{port}/{database}'
  },
  sqlite: {
    type: 'sqlite',
    name: 'SQLite',
    defaultPort: 0,
    requiresAuth: false,
    supportsSSL: false,
    connectionStringFormat: 'file:{database}'
  }
};

export class DatabaseConfigService {
  /**
   * Build connection string for any database type
   */
  static buildConnectionString(config: DatabaseConfig): string {
    const provider = DATABASE_PROVIDERS[config.type];
    if (!provider) {
      throw new Error(`Unsupported database type: ${config.type}`);
    }

    // Handle direct URL
    if (config.url) {
      return config.url;
    }

    // Handle SQLite
    if (config.type === 'sqlite') {
      return `file:${config.database}`;
    }

    // Build connection string from components
    let connectionString = provider.connectionStringFormat;
    
    const replacements = {
      username: config.username || '',
      password: config.password || '',
      host: config.host || 'localhost',
      port: config.port || provider.defaultPort,
      database: config.database,
      ssl: config.ssl ? 'require' : 'disable'
    };

    for (const [key, value] of Object.entries(replacements)) {
      connectionString = connectionString.replace(`{${key}}`, String(value));
    }

    // Clean up empty auth for MongoDB
    if (config.type === 'mongodb' && !config.username) {
      connectionString = connectionString.replace('//@', '//');
    }

    return connectionString;
  }

  /**
   * Test database connection
   */
  static async testConnection(config: DatabaseConfig): Promise<boolean> {
    const connectionString = this.buildConnectionString(config);
    
    try {
      switch (config.type) {
        case 'postgresql':
          return await this.testPostgreSQLConnection(connectionString);
        case 'mysql':
          return await this.testMySQLConnection(connectionString);
        case 'mongodb':
          return await this.testMongoDBConnection(connectionString);
        case 'sqlite':
          return await this.testSQLiteConnection(config.database);
        default:
          throw new Error(`Connection testing not implemented for ${config.type}`);
      }
    } catch (error) {
      console.error(`Database connection test failed:`, error);
      return false;
    }
  }

  /**
   * Generate Prisma schema for database type
   */
  static generatePrismaConfig(config: DatabaseConfig): string {
    const provider = this.getPrismaProvider(config.type);
    const url = this.buildConnectionString(config);

    return `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = "${url}"
}
`;
  }

  /**
   * Get Docker configuration for local database
   */
  static getDockerConfig(config: DatabaseConfig): any {
    const provider = DATABASE_PROVIDERS[config.type];
    if (!provider.dockerImage) {
      throw new Error(`No Docker image available for ${config.type}`);
    }

    const commonConfig = {
      image: provider.dockerImage,
      restart: 'unless-stopped',
      ports: [`${config.port || provider.defaultPort}:${provider.defaultPort}`],
      volumes: [`${config.type}_data:/var/lib/${config.type === 'mongodb' ? 'mongodb' : config.type}`]
    };

    switch (config.type) {
      case 'postgresql':
        return {
          ...commonConfig,
          environment: {
            POSTGRES_DB: config.database,
            POSTGRES_USER: config.username,
            POSTGRES_PASSWORD: config.password,
            POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256'
          },
          healthcheck: {
            test: ['CMD-SHELL', `pg_isready -U ${config.username} -d ${config.database}`],
            interval: '10s',
            timeout: '5s',
            retries: 5
          }
        };

      case 'mysql':
        return {
          ...commonConfig,
          environment: {
            MYSQL_DATABASE: config.database,
            MYSQL_USER: config.username,
            MYSQL_PASSWORD: config.password,
            MYSQL_ROOT_PASSWORD: config.password
          },
          healthcheck: {
            test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
            interval: '10s',
            timeout: '5s',
            retries: 5
          }
        };

      case 'mongodb':
        return {
          ...commonConfig,
          environment: config.username ? {
            MONGO_INITDB_ROOT_USERNAME: config.username,
            MONGO_INITDB_ROOT_PASSWORD: config.password,
            MONGO_INITDB_DATABASE: config.database
          } : {},
          healthcheck: {
            test: ['CMD', 'mongosh', '--eval', 'db.adminCommand("ping")'],
            interval: '10s',
            timeout: '5s',
            retries: 5
          }
        };

      default:
        throw new Error(`Docker configuration not supported for ${config.type}`);
    }
  }

  /**
   * Validate database configuration
   */
  static validateConfig(config: DatabaseConfig): string[] {
    const errors: string[] = [];
    const provider = DATABASE_PROVIDERS[config.type];

    if (!provider) {
      errors.push(`Unsupported database type: ${config.type}`);
      return errors;
    }

    // Validate required fields
    if (!config.database) {
      errors.push('Database name is required');
    }

    if (provider.requiresAuth && config.type !== 'sqlite') {
      if (!config.username) {
        errors.push('Username is required for this database type');
      }
      if (!config.password) {
        errors.push('Password is required for this database type');
      }
    }

    // Validate port
    if (config.port && (config.port < 1 || config.port > 65535)) {
      errors.push('Port must be between 1 and 65535');
    }

    // Validate host for remote connections
    if (config.host && config.host !== 'localhost' && !this.isValidHost(config.host)) {
      errors.push('Invalid host format');
    }

    return errors;
  }

  // Private helper methods
  private static getPrismaProvider(type: string): string {
    switch (type) {
      case 'postgresql': return 'postgresql';
      case 'mysql': return 'mysql';
      case 'mongodb': return 'mongodb';
      case 'sqlite': return 'sqlite';
      default: throw new Error(`Unsupported database type: ${type}`);
    }
  }

  private static isValidHost(host: string): boolean {
    // Basic hostname/IP validation
    const hostPattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    
    return hostPattern.test(host) || ipPattern.test(host);
  }

  private static async testPostgreSQLConnection(url: string): Promise<boolean> {
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: url });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async testMySQLConnection(url: string): Promise<boolean> {
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(url);
      await connection.execute('SELECT 1');
      await connection.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async testMongoDBConnection(url: string): Promise<boolean> {
    try {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(url);
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async testSQLiteConnection(path: string): Promise<boolean> {
    try {
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database(path);
      return new Promise((resolve) => {
        db.serialize(() => {
          db.run('SELECT 1', (err: any) => {
            db.close();
            resolve(!err);
          });
        });
      });
    } catch (error) {
      return false;
    }
  }
}

export default DatabaseConfigService;
