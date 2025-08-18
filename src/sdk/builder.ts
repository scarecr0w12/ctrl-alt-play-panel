/**
 * Plugin Builder
 * Build and package plugins for distribution
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { BuildOptions } from './types';
import { FileUtils, PluginConfigUtils } from './utils';

export class PluginBuilder {
  private pluginPath: string;
  private options: BuildOptions;

  constructor(pluginPath: string, options: Partial<BuildOptions> = {}) {
    this.pluginPath = path.resolve(pluginPath);
    this.options = {
      output: 'dist',
      production: false,
      minify: false,
      sourceMaps: false,
      bundleAnalyzer: false,
      ...options
    };
  }

  async build(): Promise<void> {
    console.log('🔨 Building plugin...');
    
    // Validate plugin structure
    await this.validatePlugin();
    
    // Create output directory
    const outputPath = path.resolve(this.options.output);
    FileUtils.ensureDir(outputPath);
    
    // Copy plugin files
    await this.copyPluginFiles(outputPath);
    
    // Process dependencies
    await this.processDependencies(outputPath);
    
    // Build assets if needed
    await this.buildAssets(outputPath);
    
    // Generate manifest
    await this.generateManifest(outputPath);
    
    // Create package if production build
    if (this.options.production) {
      await this.createPackage(outputPath);
    }
    
    console.log('✅ Plugin built successfully');
  }

  private async validatePlugin(): Promise<void> {
    const configPath = path.join(this.pluginPath, 'plugin.yaml');
    if (!fs.existsSync(configPath)) {
      throw new Error('plugin.yaml not found');
    }

    const mainFile = path.join(this.pluginPath, 'index.js');
    if (!fs.existsSync(mainFile)) {
      throw new Error('index.js not found');
    }

    // Validate configuration
    try {
      PluginConfigUtils.loadConfig(this.pluginPath);
    } catch (error) {
      throw new Error(`Invalid plugin configuration: ${(error as Error).message}`);
    }
  }

  private async copyPluginFiles(outputPath: string): Promise<void> {
    console.log('📁 Copying plugin files...');
    
    const filesToCopy = [
      'plugin.yaml',
      'index.js',
      'package.json',
      'README.md',
      'LICENSE'
    ];

    for (const file of filesToCopy) {
      const srcPath = path.join(this.pluginPath, file);
      const destPath = path.join(outputPath, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
      }
    }

    // Copy directories
    const dirsToCopy = [
      'components',
      'templates',
      'scripts',
      'config',
      'assets',
      'docs'
    ];

    for (const dir of dirsToCopy) {
      const srcDir = path.join(this.pluginPath, dir);
      const destDir = path.join(outputPath, dir);
      
      if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
        FileUtils.copyDir(srcDir, destDir);
        console.log(`  ✓ ${dir}/`);
      }
    }
  }

  private async processDependencies(outputPath: string): Promise<void> {
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    console.log('📦 Processing dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
      // Install production dependencies in output directory
      await this.runCommand('npm', ['install', '--production'], outputPath);
    }
  }

  private async buildAssets(outputPath: string): Promise<void> {
    // Check for frontend build scripts
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Run webpack build if configured
    if (fs.existsSync(path.join(this.pluginPath, 'webpack.config.js'))) {
      console.log('⚙️ Building frontend assets...');
      
      const mode = this.options.production ? 'production' : 'development';
      const args = ['--mode', mode];
      
      if (this.options.sourceMaps) {
        args.push('--devtool', 'source-map');
      }
      
      if (this.options.bundleAnalyzer) {
        args.push('--analyze');
      }
      
      await this.runCommand('npx', ['webpack', ...args], this.pluginPath);
      
      // Copy built assets to output
      const distPath = path.join(this.pluginPath, 'dist');
      if (fs.existsSync(distPath)) {
        FileUtils.copyDir(distPath, path.join(outputPath, 'dist'));
      }
    }
    
    // Run custom build script if available
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('🔧 Running custom build script...');
      await this.runCommand('npm', ['run', 'build'], this.pluginPath);
    }
  }

  private async generateManifest(outputPath: string): Promise<void> {
    console.log('📋 Generating build manifest...');
    
    const config = PluginConfigUtils.loadConfig(this.pluginPath);
    const files = FileUtils.readDirRecursive(outputPath)
      .map(file => path.relative(outputPath, file));
    
    const manifest = {
      plugin: {
        name: config.name,
        version: config.version,
        author: config.author,
        description: config.description
      },
      build: {
        timestamp: new Date().toISOString(),
        mode: this.options.production ? 'production' : 'development',
        options: this.options
      },
      files: files.sort(),
      checksum: this.generateChecksum(files, outputPath)
    };
    
    fs.writeFileSync(
      path.join(outputPath, 'build-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  private generateChecksum(files: string[], basePath: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    
    for (const file of files.sort()) {
      const filePath = path.join(basePath, file);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath);
        hash.update(file);
        hash.update(content);
      }
    }
    
    return hash.digest('hex');
  }

  private async createPackage(outputPath: string): Promise<void> {
    console.log('📦 Creating distribution package...');
    
    const config = PluginConfigUtils.loadConfig(outputPath);
    const packageName = `${config.name}-${config.version}.tar.gz`;
    const packagePath = path.join(path.dirname(outputPath), packageName);
    
    // Create tar.gz package
    await this.runCommand('tar', [
      '-czf',
      packagePath,
      '-C',
      path.dirname(outputPath),
      path.basename(outputPath)
    ]);
    
    console.log(`📦 Package created: ${packageName}`);
    
    // Generate package info
    const packageInfo = {
      name: config.name,
      version: config.version,
      filename: packageName,
      size: fs.statSync(packagePath).size,
      created: new Date().toISOString(),
      checksum: this.calculateFileChecksum(packagePath)
    };
    
    fs.writeFileSync(
      path.join(path.dirname(outputPath), `${config.name}-${config.version}.json`),
      JSON.stringify(packageInfo, null, 2)
    );
  }

  private calculateFileChecksum(filePath: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const content = fs.readFileSync(filePath);
    hash.update(content);
    return hash.digest('hex');
  }

  private async runCommand(command: string, args: string[], cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: cwd || this.pluginPath,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async clean(): Promise<void> {
    const outputPath = path.resolve(this.options.output);
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
      console.log('🗑️ Build directory cleaned');
    }
  }

  async watch(): Promise<void> {
    console.log('👀 Starting build watcher...');
    
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(this.pluginPath, {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath: string) => {
      console.log(`📝 File changed: ${path.relative(this.pluginPath, filePath)}`);
      try {
        await this.build();
        console.log('✅ Rebuild completed');
      } catch (error) {
        console.error('❌ Rebuild failed:', error);
      }
    });

    // Initial build
    await this.build();
  }
}