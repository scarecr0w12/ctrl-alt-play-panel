import { createServer } from 'net';
import { logger } from './logger';

/**
 * Utility class for managing ports in a deployment-agnostic way
 * Handles port conflicts and dynamic port assignment for shared development environments
 */
export class PortManager {
  private static instance: PortManager;
  private reservedPorts: Set<number> = new Set();

  private constructor() {}

  public static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  /**
   * Check if a port is available
   */
  public async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Find the next available port starting from a given port
   */
  public async findAvailablePort(
    preferredPort: number, 
    maxAttempts: number = 100
  ): Promise<number> {
    let currentPort = preferredPort;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (!this.reservedPorts.has(currentPort)) {
        const available = await this.isPortAvailable(currentPort);
        if (available) {
          this.reservedPorts.add(currentPort);
          logger.info(`Port ${currentPort} is available and reserved`);
          return currentPort;
        }
      }
      
      currentPort++;
      attempts++;
      
      // Wrap around if we exceed reasonable port range
      if (currentPort > 65535) {
        currentPort = 3000;
      }
    }

    throw new Error(`Unable to find available port after ${maxAttempts} attempts`);
  }

  /**
   * Reserve a port for use
   */
  public reservePort(port: number): void {
    this.reservedPorts.add(port);
    logger.debug(`Port ${port} manually reserved`);
  }

  /**
   * Release a reserved port
   */
  public releasePort(port: number): void {
    this.reservedPorts.delete(port);
    logger.debug(`Port ${port} released`);
  }

  /**
   * Get deployment-safe configuration with automatic port detection
   */
  public async getDeploymentConfig(): Promise<{
    backendPort: number;
    frontendPort: number;
    agentPort: number;
    postgresPort: number;
    redisPort: number;
  }> {
    const autoDetect = process.env.AUTO_DETECT_PORTS === 'true';
    const portRangeStart = parseInt(process.env.PORT_RANGE_START || '3000');
    
    let backendPort = parseInt(process.env.PORT || '3000');
    let frontendPort = parseInt(process.env.FRONTEND_PORT || '3001');
    let agentPort = parseInt(process.env.AGENT_PORT || '8080');
    let postgresPort = parseInt(process.env.POSTGRES_PORT || '5432');
    let redisPort = parseInt(process.env.REDIS_PORT || '6379');

    if (autoDetect) {
      logger.info('Auto-detecting available ports for deployment safety...');
      
      // Find available ports in sequence to avoid conflicts
      backendPort = await this.findAvailablePort(backendPort);
      frontendPort = await this.findAvailablePort(frontendPort);
      agentPort = await this.findAvailablePort(agentPort);
      
      // Database ports - only check if not using Docker
      if (!process.env.DATABASE_URL?.includes('@postgres:')) {
        postgresPort = await this.findAvailablePort(postgresPort);
      }
      
      if (!process.env.REDIS_URL?.includes('@redis:')) {
        redisPort = await this.findAvailablePort(redisPort);
      }

      logger.info(`Deployment ports assigned: Backend=${backendPort}, Frontend=${frontendPort}, Agent=${agentPort}`);
    }

    return {
      backendPort,
      frontendPort,
      agentPort,
      postgresPort,
      redisPort
    };
  }

  /**
   * Generate environment-specific URLs
   */
  public generateUrls(ports: {
    backendPort: number;
    frontendPort: number;
  }): {
    backendUrl: string;
    frontendUrl: string;
    panelUrl: string;
  } {
    const host = process.env.HOST || 'localhost';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    return {
      backendUrl: `${protocol}://${host}:${ports.backendPort}`,
      frontendUrl: `${protocol}://${host}:${ports.frontendPort}`,
      panelUrl: `${protocol}://${host}:${ports.backendPort}`
    };
  }

  /**
   * Validate port configuration for deployment
   */
  public validatePortConfiguration(config: {
    backendPort: number;
    frontendPort: number;
    agentPort: number;
  }): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const ports = [config.backendPort, config.frontendPort, config.agentPort];
    
    // Check for duplicate ports
    const duplicates = ports.filter((port, index) => ports.indexOf(port) !== index);
    if (duplicates.length > 0) {
      issues.push(`Duplicate ports detected: ${duplicates.join(', ')}`);
    }
    
    // Check for privileged ports (< 1024) in non-root environments
    const privilegedPorts = ports.filter(port => port < 1024);
    if (privilegedPorts.length > 0 && process.getuid && process.getuid() !== 0) {
      issues.push(`Privileged ports require root access: ${privilegedPorts.join(', ')}`);
    }
    
    // Check for ports outside valid range
    const invalidPorts = ports.filter(port => port < 1 || port > 65535);
    if (invalidPorts.length > 0) {
      issues.push(`Invalid port numbers: ${invalidPorts.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Create deployment-specific environment variables
   */
  public createDeploymentEnv(config: {
    backendPort: number;
    frontendPort: number;
    agentPort: number;
  }): Record<string, string> {
    const urls = this.generateUrls(config);
    
    return {
      PORT: config.backendPort.toString(),
      FRONTEND_PORT: config.frontendPort.toString(),
      AGENT_PORT: config.agentPort.toString(),
      FRONTEND_URL: urls.frontendUrl,
      PANEL_URL: urls.panelUrl,
      BACKEND_URL: urls.backendUrl,
      // Update hardcoded URLs in the application
      REACT_APP_API_URL: urls.backendUrl,
      NEXT_PUBLIC_API_URL: urls.backendUrl,
      NEXT_PUBLIC_WS_URL: urls.backendUrl.replace('http', 'ws')
    };
  }
}

/**
 * Singleton instance for global use
 */
export const portManager = PortManager.getInstance();

/**
 * Utility function to get safe port configuration
 */
export async function getSafePortConfiguration() {
  try {
    const config = await portManager.getDeploymentConfig();
    const validation = portManager.validatePortConfiguration(config);
    
    if (!validation.valid) {
      logger.error('Port configuration validation failed:', validation.issues);
      throw new Error(`Port configuration invalid: ${validation.issues.join(', ')}`);
    }
    
    return config;
  } catch (error) {
    logger.error('Failed to get safe port configuration:', error);
    throw error;
  }
}