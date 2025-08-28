/**
 * Plugin SDK Utilities
 * Helper functions and utilities for plugin development
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PluginConfig, ValidationRule, PluginTemplate } from './types';

/**
 * Plugin configuration utilities
 */
export class PluginConfigUtils {
  /**
   * Load and parse plugin configuration from plugin.yaml
   */
  static loadConfig(pluginPath: string): PluginConfig {
    const configPath = path.join(pluginPath, 'plugin.yaml');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Plugin configuration not found at ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent) as PluginConfig;

    this.validateConfig(config);
    return config;
  }

  /**
   * Save plugin configuration to plugin.yaml
   */
  static saveConfig(pluginPath: string, config: PluginConfig): void {
    const configPath = path.join(pluginPath, 'plugin.yaml');
    const configContent = yaml.dump(config, { indent: 2 });
    fs.writeFileSync(configPath, configContent, 'utf-8');
  }

  /**
   * Validate plugin configuration
   */
  static validateConfig(config: PluginConfig): void {
    const errors: string[] = [];

    if (!config.name) errors.push('Plugin name is required');
    if (!config.version) errors.push('Plugin version is required');
    if (!config.author) errors.push('Plugin author is required');

    if (config.name && !/^[a-z0-9-_]+$/.test(config.name)) {
      errors.push('Plugin name must contain only lowercase letters, numbers, hyphens, and underscores');
    }

    if (config.version && !/^\d+\.\d+\.\d+/.test(config.version)) {
      errors.push('Plugin version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (errors.length > 0) {
      throw new Error(`Plugin configuration validation failed:\n  - ${errors.join('\n  - ')}`);
    }
  }

  /**
   * Merge configurations with defaults
   */
  static mergeWithDefaults(config: Partial<PluginConfig>): PluginConfig {
    const defaults: PluginConfig = {
      name: '',
      version: '1.0.0',
      author: '',
      description: '',
      permissions: {
        read: true,
        write: false,
        execute: false,
        network: false,
        database: false,
        filesystem: false,
        routes: false,
        hooks: false
      },
      dependencies: [],
      apis: [],
      hooks: []
    };

    return { ...defaults, ...config };
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate a value against validation rules
   */
  static validate(value: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(rule.message || 'Field is required');
          }
          break;

        case 'minLength':
          if (typeof value === 'string' && value.length < rule.value) {
            errors.push(rule.message || `Minimum length is ${rule.value}`);
          }
          break;

        case 'maxLength':
          if (typeof value === 'string' && value.length > rule.value) {
            errors.push(rule.message || `Maximum length is ${rule.value}`);
          }
          break;

        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
            errors.push(rule.message || 'Invalid format');
          }
          break;

        case 'custom':
          if (typeof rule.value === 'function') {
            const result = rule.value(value);
            if (result !== true) {
              errors.push(typeof result === 'string' ? result : (rule.message || 'Validation failed'));
            }
          }
          break;
      }
    }

    return errors;
  }

  /**
   * Common validation rules
   */
  static rules = {
    required: (): ValidationRule => ({ type: 'required' }),
    minLength: (min: number): ValidationRule => ({ type: 'minLength', value: min }),
    maxLength: (max: number): ValidationRule => ({ type: 'maxLength', value: max }),
    email: (): ValidationRule => ({
      type: 'pattern',
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    }),
    url: (): ValidationRule => ({
      type: 'pattern',
      value: /^https?:\/\/.+/,
      message: 'Invalid URL format'
    }),
    semver: (): ValidationRule => ({
      type: 'pattern',
      value: /^\d+\.\d+\.\d+/,
      message: 'Invalid semantic version format'
    }),
    pluginName: (): ValidationRule => ({
      type: 'pattern',
      value: /^[a-z0-9-_]+$/,
      message: 'Plugin name must contain only lowercase letters, numbers, hyphens, and underscores'
    })
  };
}

/**
 * File system utilities
 */
export class FileUtils {
  /**
   * Recursively copy directory
   */
  static copyDir(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Read directory recursively
   */
  static readDirRecursive(dir: string, filter?: (file: string) => boolean): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.readDirRecursive(fullPath, filter));
      } else if (!filter || filter(fullPath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Ensure directory exists
   */
  static ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Check if path is safe (no directory traversal)
   */
  static isSafePath(filePath: string): boolean {
    const normalized = path.normalize(filePath);
    return !normalized.includes('..');
  }
}

/**
 * Template utilities
 */
export class TemplateUtils {
  /**
   * Process template variables in content
   */
  static processTemplate(content: string, variables: Record<string, any>): string {
    let processed = content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }

  /**
   * Process template files
   */
  static processTemplateFiles(
    template: PluginTemplate,
    variables: Record<string, any>,
    outputPath: string
  ): void {
    FileUtils.ensureDir(outputPath);

    for (const [filePath, content] of Object.entries(template.files)) {
      const processedPath = this.processTemplate(filePath, variables);
      const processedContent = this.processTemplate(content, variables);
      const fullPath = path.join(outputPath, processedPath);

      // Ensure parent directory exists
      FileUtils.ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, processedContent, 'utf-8');
    }
  }

  /**
   * Extract template variables from content
   */
  static extractVariables(content: string): string[] {
    const regex = /{{\\s*(\\w+)\\s*}}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}

/**
 * Path utilities
 */
export class PathUtils {
  /**
   * Get plugin root directory
   */
  static getPluginRoot(startPath: string = process.cwd()): string {
    let currentPath = path.resolve(startPath);

    while (currentPath !== path.dirname(currentPath)) {
      const configPath = path.join(currentPath, 'plugin.yaml');
      if (fs.existsSync(configPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    throw new Error('Plugin root not found (no plugin.yaml found in parent directories)');
  }

  /**
   * Get relative path from plugin root
   */
  static getRelativePath(filePath: string, pluginRoot?: string): string {
    const root = pluginRoot || this.getPluginRoot();
    return path.relative(root, filePath);
  }

  /**
   * Resolve path relative to plugin root
   */
  static resolvePath(relativePath: string, pluginRoot?: string): string {
    const root = pluginRoot || this.getPluginRoot();
    return path.resolve(root, relativePath);
  }
}

/**
 * Version utilities
 */
export class VersionUtils {
  /**
   * Parse semantic version
   */
  static parseVersion(version: string): { major: number; minor: number; patch: number } {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    };
  }

  /**
   * Compare versions
   */
  static compareVersions(version1: string, version2: string): number {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);

    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }

  /**
   * Increment version
   */
  static incrementVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
    const v = this.parseVersion(version);

    switch (type) {
      case 'major':
        return `${v.major + 1}.0.0`;
      case 'minor':
        return `${v.major}.${v.minor + 1}.0`;
      case 'patch':
        return `${v.major}.${v.minor}.${v.patch + 1}`;
      default:
        throw new Error(`Invalid version type: ${type}`);
    }
  }
}

/**
 * Logging utilities
 */
export class LogUtils {
  private static colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };

  /**
   * Colored console logging
   */
  static info(message: string): void {
    console.log(`${this.colors.blue}ℹ${this.colors.reset} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.colors.green}✓${this.colors.reset} ${message}`);
  }

  static warning(message: string): void {
    console.log(`${this.colors.yellow}⚠${this.colors.reset} ${message}`);
  }

  static error(message: string): void {
    console.log(`${this.colors.red}✗${this.colors.reset} ${message}`);
  }

  static debug(message: string): void {
    console.log(`${this.colors.gray}●${this.colors.reset} ${message}`);
  }

  /**
   * Progress indicator
   */
  static progress(message: string, current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    process.stdout.write(`\r${this.colors.cyan}${bar}${this.colors.reset} ${percentage}% ${message}`);
    
    if (current === total) {
      console.log(''); // New line when complete
    }
  }
}