/**
 * Security utilities for input validation and sanitization
 */

/**
 * HTML escape function to prevent XSS attacks
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize user input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length to prevent DOS attacks
  sanitized = sanitized.substring(0, 10000);
  
  return sanitized.trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate username format (alphanumeric + some special chars)
 */
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate server name format
 */
export function validateServerName(name: string): boolean {
  // Allow alphanumeric, spaces, hyphens, underscores
  const nameRegex = /^[a-zA-Z0-9\s_-]{1,64}$/;
  return nameRegex.test(name);
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(path: string): boolean {
  // Prevent directory traversal attacks
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // Ensure it doesn't start with absolute paths or special directories
  if (path.startsWith('/') || path.startsWith('\\') || path.includes(':')) {
    return false;
  }
  
  return true;
}

/**
 * Validate URL format and ensure it's safe
 */
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Rate limiting helper for preventing brute force attacks
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    // Increment attempt count
    this.attempts.set(key, { 
      count: attempt.count + 1, 
      lastAttempt: now 
    });
    
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * CSRF token validation
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}
