/**
 * Service-to-service JWT authentication utilities
 * Handles secure token generation and validation for marketplace integration
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ServiceJWTPayload, ServiceAuthToken, MarketplaceError, MarketplaceErrorCode } from '../types/marketplace';

export class ServiceJWT {
  private static readonly ALGORITHM = 'HS256';
  private static readonly TOKEN_EXPIRY = 15 * 60; // 15 minutes
  private static readonly ISSUER = 'panel.ctrl-alt-play.com';
  private static readonly AUDIENCE = 'marketplace.ctrl-alt-play.com';
  private static readonly SERVICE_ID = 'panel-system';

  private readonly jwtSecret: string;
  private readonly serviceId: string;

  constructor(jwtSecret: string, serviceId?: string) {
    if (!jwtSecret) {
      throw new Error('JWT secret is required for service authentication');
    }
    this.jwtSecret = jwtSecret;
    this.serviceId = serviceId || ServiceJWT.SERVICE_ID;
  }

  /**
   * Generate a service-to-service JWT token
   */
  generateServiceToken(permissions: string[] = []): ServiceAuthToken {
    const now = Math.floor(Date.now() / 1000);
    const payload: ServiceJWTPayload = {
      iss: ServiceJWT.ISSUER,
      aud: ServiceJWT.AUDIENCE,
      sub: 'service-integration',
      exp: now + ServiceJWT.TOKEN_EXPIRY,
      iat: now,
      service_id: this.serviceId,
      permissions
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      algorithm: ServiceJWT.ALGORITHM,
      issuer: ServiceJWT.ISSUER,
      audience: ServiceJWT.AUDIENCE,
      expiresIn: ServiceJWT.TOKEN_EXPIRY
    });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: ServiceJWT.TOKEN_EXPIRY,
      scope: permissions,
      issued_at: new Date(now * 1000).toISOString()
    };
  }

  /**
   * Validate a service JWT token
   */
  validateServiceToken(token: string): ServiceJWTPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: [ServiceJWT.ALGORITHM],
        issuer: ServiceJWT.ISSUER,
        audience: ServiceJWT.AUDIENCE
      }) as ServiceJWTPayload;

      // Additional validation
      if (payload.service_id !== this.serviceId) {
        throw new MarketplaceError(
          MarketplaceErrorCode.AUTHENTICATION_FAILED,
          'Invalid service ID in token'
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new MarketplaceError(
          MarketplaceErrorCode.AUTHENTICATION_FAILED,
          `Invalid JWT token: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Generate HMAC signature for request signing
   */
  static generateSignature(payload: string, secret: string, timestamp: string): string {
    const message = timestamp + payload;
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: string,
    toleranceMs: number = 300000 // 5 minutes
  ): boolean {
    // Check timestamp tolerance
    const now = Date.now();
    const requestTime = parseInt(timestamp) * 1000;
    if (Math.abs(now - requestTime) > toleranceMs) {
      return false;
    }

    // Verify signature
    const expectedSignature = this.generateSignature(payload, secret, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature)
    );
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generate API key for service authentication
   */
  static generateApiKey(serviceId: string, environment: string = 'production'): string {
    const prefix = environment === 'production' ? 'pk' : 'sk';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const checksum = crypto
      .createHash('sha256')
      .update(`${serviceId}:${randomBytes}`)
      .digest('hex')
      .substring(0, 8);
    
    return `${prefix}_${serviceId}_${randomBytes}_${checksum}`;
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string, expectedServiceId: string): boolean {
    const parts = apiKey.split('_');
    if (parts.length !== 4) {
      return false;
    }

    const [prefix, serviceId, randomBytes, providedChecksum] = parts;
    
    // Validate prefix
    if (!['pk', 'sk'].includes(prefix)) {
      return false;
    }

    // Validate service ID
    if (serviceId !== expectedServiceId) {
      return false;
    }

    // Validate checksum
    const expectedChecksum = crypto
      .createHash('sha256')
      .update(`${serviceId}:${randomBytes}`)
      .digest('hex')
      .substring(0, 8);

    return crypto.timingSafeEqual(
      Buffer.from(providedChecksum),
      Buffer.from(expectedChecksum)
    );
  }

  /**
   * Create authorization headers for service requests
   */
  createAuthHeaders(apiKey: string, permissions: string[] = []): Record<string, string> {
    const token = this.generateServiceToken(permissions);
    
    return {
      'Authorization': `Bearer ${token.access_token}`,
      'X-API-Key': apiKey,
      'X-Service-ID': this.serviceId,
      'X-Request-ID': crypto.randomUUID(),
      'X-Timestamp': Math.floor(Date.now() / 1000).toString()
    };
  }

  /**
   * Create signed request headers
   */
  createSignedHeaders(
    payload: string,
    apiKey: string,
    secret: string,
    permissions: string[] = []
  ): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = ServiceJWT.generateSignature(payload, secret, timestamp);
    const token = this.generateServiceToken(permissions);

    return {
      'Authorization': `Bearer ${token.access_token}`,
      'X-API-Key': apiKey,
      'X-Service-ID': this.serviceId,
      'X-Signature': `sha256=${signature}`,
      'X-Timestamp': timestamp,
      'X-Request-ID': crypto.randomUUID(),
      'Content-Type': 'application/json'
    };
  }
}

/**
 * Default service JWT instance
 */
// Only create serviceJWT if marketplace credentials are available
export const serviceJWT = process.env.MARKETPLACE_JWT_SECRET 
  ? new ServiceJWT(
      process.env.MARKETPLACE_JWT_SECRET,
      process.env.SERVICE_ID || 'panel-system'
    )
  : null;

/**
 * Middleware helper for extracting and validating service tokens
 */
export function extractServiceAuth(headers: Record<string, string | undefined>): {
  token: string | null;
  apiKey: string | null;
  serviceId: string | null;
  timestamp: string | null;
  signature: string | null;
} {
  return {
    token: ServiceJWT.extractTokenFromHeader(headers.authorization || ''),
    apiKey: headers['x-api-key'] || null,
    serviceId: headers['x-service-id'] || null,
    timestamp: headers['x-timestamp'] || null,
    signature: headers['x-signature'] || null
  };
}
