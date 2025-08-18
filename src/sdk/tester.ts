/**
 * Plugin Testing Framework
 * Comprehensive testing utilities for plugin development
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { TestOptions, TestResults } from './types';
import { PluginConfigUtils } from './utils';

export class PluginTester {
  private pluginPath: string;
  private options: TestOptions;

  constructor(pluginPath: string, options: Partial<TestOptions> = {}) {
    this.pluginPath = path.resolve(pluginPath);
    this.options = {
      watch: false,
      coverage: false,
      verbose: false,
      testPattern: '**/*.test.js',
      reporters: ['default'],
      ...options
    };
  }

  async runTests(): Promise<TestResults> {
    console.log('🧪 Running plugin tests...');
    
    // Check if tests exist
    if (!this.hasTests()) {
      console.log('ℹ️ No tests found, running validation instead');
      return this.runValidation();
    }

    // Run Jest tests if available
    if (this.hasJestConfig()) {
      return this.runJestTests();
    }

    // Run custom test script if available
    if (this.hasTestScript()) {
      return this.runCustomTests();
    }

    // Fall back to validation
    return this.runValidation();
  }

  private hasTests(): boolean {
    const testDirs = ['tests', 'test', '__tests__'];
    return testDirs.some(dir => fs.existsSync(path.join(this.pluginPath, dir)));
  }

  private hasJestConfig(): boolean {
    const jestConfigs = [
      'jest.config.js',
      'jest.config.json',
      'jest.config.ts'
    ];
    
    // Check for jest config files
    if (jestConfigs.some(config => fs.existsSync(path.join(this.pluginPath, config)))) {
      return true;
    }

    // Check for jest in package.json
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return Boolean(packageJson.jest || (packageJson.devDependencies && packageJson.devDependencies.jest));
    }

    return false;
  }

  private hasTestScript(): boolean {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return Boolean(packageJson.scripts && packageJson.scripts.test);
    }
    return false;
  }

  private async runJestTests(): Promise<TestResults> {
    console.log('🃏 Running Jest tests...');
    
    const args = ['test'];
    
    if (this.options.watch) {
      args.push('--watch');
    }
    
    if (this.options.coverage) {
      args.push('--coverage');
    }
    
    if (this.options.verbose) {
      args.push('--verbose');
    }
    
    if (this.options.testPattern) {
      args.push('--testPathPattern', this.options.testPattern);
    }

    const result = await this.runCommand('npx', ['jest', ...args]);
    return this.parseJestOutput(result);
  }

  private async runCustomTests(): Promise<TestResults> {
    console.log('🔧 Running custom test script...');
    
    const result = await this.runCommand('npm', ['test']);
    return this.parseCustomTestOutput(result);
  }

  private async runValidation(): Promise<TestResults> {
    console.log('✅ Running plugin validation...');
    
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    try {
      // Validate plugin structure
      const structureErrors = this.validatePluginStructure();
      if (structureErrors.length > 0) {
        errors.push(...structureErrors.map(err => ({ test: 'Plugin Structure', error: new Error(err) })));
        failed += structureErrors.length;
      } else {
        passed += 1;
      }

      // Validate configuration
      try {
        PluginConfigUtils.loadConfig(this.pluginPath);
        passed += 1;
      } catch (error) {
        errors.push({ test: 'Plugin Configuration', error: error as Error });
        failed += 1;
      }

      // Validate main file
      try {
        this.validateMainFile();
        passed += 1;
      } catch (error) {
        errors.push({ test: 'Main File', error: error as Error });
        failed += 1;
      }

      // Validate dependencies
      try {
        this.validateDependencies();
        passed += 1;
      } catch (error) {
        errors.push({ test: 'Dependencies', error: error as Error });
        failed += 1;
      }

    } catch (error) {
      errors.push({ test: 'General Validation', error: error as Error });
      failed += 1;
    }

    return {
      passed,
      failed,
      errors,
      duration: 0,
      coverage: null
    };
  }

  private validatePluginStructure(): string[] {
    const errors: string[] = [];
    
    // Required files
    const requiredFiles = ['plugin.yaml', 'index.js'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.pluginPath, file))) {
        errors.push(`Missing required file: ${file}`);
      }
    }

    // Recommended files
    const recommendedFiles = ['README.md', 'package.json'];
    for (const file of recommendedFiles) {
      if (!fs.existsSync(path.join(this.pluginPath, file))) {
        console.warn(`⚠️ Missing recommended file: ${file}`);
      }
    }

    return errors;
  }

  private validateMainFile(): void {
    const mainPath = path.join(this.pluginPath, 'index.js');
    const content = fs.readFileSync(mainPath, 'utf-8');
    
    // Basic syntax check
    try {
      // This is a simple check - in production you might want to use a proper JS parser
      if (!content.includes('module.exports') && !content.includes('export')) {
        throw new Error('Main file must export a plugin class or object');
      }
    } catch (error) {
      throw new Error(`Invalid main file: ${(error as Error).message}`);
    }
  }

  private validateDependencies(): void {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return; // No dependencies to validate
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Check if node_modules exists if there are dependencies
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
      const nodeModulesPath = path.join(this.pluginPath, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        throw new Error('Dependencies listed but node_modules not found. Run npm install.');
      }
    }
  }

  private async runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        cwd: this.pluginPath,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.options.verbose) {
          console.log(data.toString());
        }
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.options.verbose) {
          console.error(data.toString());
        }
      });

      process.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode: exitCode || 0 });
      });

      process.on('error', (error) => {
        resolve({ stdout, stderr: error.message, exitCode: 1 });
      });
    });
  }

  private parseJestOutput(result: { stdout: string; stderr: string; exitCode: number }): TestResults {
    const output = result.stdout + result.stderr;
    
    // Parse Jest output for test results
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const timeMatch = output.match(/Time:\s*(\d+\.?\d*)\s*s/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const duration = timeMatch ? parseFloat(timeMatch[1]) * 1000 : 0;

    // Extract error information
    const errors: Array<{ test: string; error: Error }> = [];
    if (result.exitCode !== 0 && failed > 0) {
      // This is a simplified error extraction
      const lines = output.split('\n');
      let currentTest = '';
      
      for (const line of lines) {
        if (line.includes('✕')) {
          currentTest = line.trim();
        } else if (line.includes('Error:') || line.includes('Expected:')) {
          errors.push({
            test: currentTest || 'Unknown Test',
            error: new Error(line.trim())
          });
        }
      }
    }

    // Extract coverage information if available
    let coverage = null;
    if (this.options.coverage && output.includes('Coverage')) {
      const coverageMatch = output.match(/All files\s*\|\s*(\d+\.?\d*)/);
      if (coverageMatch) {
        coverage = {
          percentage: parseFloat(coverageMatch[1]),
          raw: output
        };
      }
    }

    return {
      passed,
      failed,
      errors,
      duration,
      coverage
    };
  }

  private parseCustomTestOutput(result: { stdout: string; stderr: string; exitCode: number }): TestResults {
    // This is a generic parser for custom test outputs
    const output = result.stdout + result.stderr;
    
    return {
      passed: result.exitCode === 0 ? 1 : 0,
      failed: result.exitCode === 0 ? 0 : 1,
      errors: result.exitCode === 0 ? [] : [
        { test: 'Custom Test Script', error: new Error(result.stderr || 'Test script failed') }
      ],
      duration: 0,
      coverage: null
    };
  }

  async setupTestEnvironment(): Promise<void> {
    console.log('⚙️ Setting up test environment...');
    
    // Create test directory if it doesn't exist
    const testDir = path.join(this.pluginPath, 'tests');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create basic test file if none exists
    const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));
    if (testFiles.length === 0) {
      await this.createBasicTest();
    }

    // Create Jest config if using Jest but no config exists
    if (this.hasJestInDependencies() && !this.hasJestConfig()) {
      await this.createJestConfig();
    }
  }

  private hasJestInDependencies(): boolean {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return Boolean(
        (packageJson.dependencies && packageJson.dependencies.jest) ||
        (packageJson.devDependencies && packageJson.devDependencies.jest)
      );
    }
    return false;
  }

  private async createBasicTest(): Promise<void> {
    const config = PluginConfigUtils.loadConfig(this.pluginPath);
    const className = this.toPascalCase(config.name);
    
    const testContent = `const ${className} = require('../index');

describe('${config.name} Plugin', () => {
  let plugin;

  beforeEach(() => {
    // Mock plugin context
    const mockContext = {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        child: jest.fn(() => mockContext.logger)
      },
      events: {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      }
    };
    
    plugin = new ${className}(mockContext);
  });

  test('should initialize correctly', () => {
    expect(plugin.name).toBe('${config.name}');
    expect(plugin.version).toBe('${config.version}');
  });

  test('should load without errors', async () => {
    if (plugin.onLoad) {
      await expect(plugin.onLoad()).resolves.not.toThrow();
    }
  });

  test('should enable without errors', async () => {
    if (plugin.onEnable) {
      await expect(plugin.onEnable()).resolves.not.toThrow();
    }
  });

  test('should disable without errors', async () => {
    if (plugin.onDisable) {
      await expect(plugin.onDisable()).resolves.not.toThrow();
    }
  });
});`;

    fs.writeFileSync(
      path.join(this.pluginPath, 'tests', 'plugin.test.js'),
      testContent
    );
    
    console.log('✅ Created basic test file');
  }

  private async createJestConfig(): Promise<void> {
    const jestConfig = {
      testEnvironment: 'node',
      testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
      collectCoverageFrom: [
        'index.js',
        'components/**/*.js',
        '!**/node_modules/**',
        '!**/dist/**'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'html', 'lcov']
    };

    fs.writeFileSync(
      path.join(this.pluginPath, 'jest.config.json'),
      JSON.stringify(jestConfig, null, 2)
    );
    
    console.log('✅ Created Jest configuration');
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^(.)/, (char) => char.toUpperCase());
  }

  async generateCoverageReport(): Promise<void> {
    if (!this.hasJestConfig()) {
      console.log('⚠️ Jest not configured, cannot generate coverage report');
      return;
    }

    console.log('📊 Generating coverage report...');
    
    await this.runCommand('npx', ['jest', '--coverage', '--watchAll=false']);
    
    const coveragePath = path.join(this.pluginPath, 'coverage', 'lcov-report', 'index.html');
    if (fs.existsSync(coveragePath)) {
      console.log(`📊 Coverage report generated: ${coveragePath}`);
    }
  }
}