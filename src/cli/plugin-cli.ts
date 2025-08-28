#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import PluginManager from '../services/PluginManager.full';
import * as chokidar from 'chokidar';
import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import express from 'express';

// Dynamic import for chalk to avoid ESM issues
let chalk: any;
(async () => {
  try {
    chalk = (await import('chalk')).default;
  } catch (error) {
    // Fallback if chalk fails to load
    chalk = {
      red: (text: string) => text,
      green: (text: string) => text,
      blue: (text: string) => text,
      yellow: (text: string) => text,
      gray: (text: string) => text
    };
  }
})();

interface CommandOptions {
  template?: string;
  type?: string;
  force?: boolean;
}

interface PluginTemplate {
  name: string;
  description: string;
  files: { [key: string]: string };
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description?: string;
  permissions?: Record<string, unknown>;
}

/**
 * Plugin CLI - Command-line interface for plugin development
 * Provides tools for creating, validating, building, and managing plugins
 */
class PluginCLI {
  private program: Command;
  private pluginManager: PluginManager;

  constructor() {
    this.program = new Command();
    
    // Try to use DatabaseService if available, otherwise fall back to a new PrismaClient
    let prisma: any;
    try {
      const { DatabaseService } = require('../services/database');
      console.log('DatabaseService available');
      if (DatabaseService.isInitialized()) {
        prisma = DatabaseService.getInstance();
        console.log('Using DatabaseService PrismaClient');
      } else {
        console.log('DatabaseService not initialized');
        const { PrismaClient } = require('@prisma/client');
        prisma = new PrismaClient();
        console.log('Using new PrismaClient');
      }
    } catch (error) {
      console.log('DatabaseService not available:', error);
      // Fallback if DatabaseService is not available
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      console.log('Using fallback PrismaClient');
    }
    
    this.pluginManager = new PluginManager(prisma);
    this.setupCommands();
  }

  private setupCommands() {
    this.program
      .name('plugin-cli')
      .description('CLI for CTRL-ALT-PLAY plugin development')
      .version('1.0.0');

    // Create command
    this.program
      .command('create <name>')
      .description('Create a new plugin from template')
      .option('-t, --template <type>', 'Template type (basic, game-template, billing-integration)', 'basic')
      .action((name, options) => this.createPlugin(name, options));

    // Validate command
    this.program
      .command('validate <path>')
      .description('Validate a plugin configuration')
      .action((pluginPath) => this.validatePlugin(pluginPath));

    // Install command
    this.program
      .command('install <path>')
      .description('Install a plugin locally')
      .action((pluginPath) => this.installPlugin(pluginPath));

    // Enable command
    this.program
      .command('enable <name>')
      .description('Enable a plugin')
      .action((name) => this.enablePlugin(name));

    // Disable command
    this.program
      .command('disable <name>')
      .description('Disable a plugin')
      .action((name) => this.disablePlugin(name));

    // List command
    this.program
      .command('list')
      .description('List installed plugins')
      .option('-t, --type <type>', 'Filter by plugin type')
      .action((options) => this.listPlugins(options));

    // Uninstall command
    this.program
      .command('uninstall <name>')
      .description('Uninstall a plugin')
      .action((name) => this.uninstallPlugin(name));

    // Dev command - hot-reload development server
    this.program
      .command('dev [path]')
      .description('Start development server with hot-reload')
      .option('-p, --port <port>', 'Development server port', '3001')
      .option('-w, --watch', 'Enable file watching', true)
      .action((pluginPath, options) => this.startDevServer(pluginPath, options));

    // Build command
    this.program
      .command('build [path]')
      .description('Build and package plugin')
      .option('-o, --output <dir>', 'Output directory', 'dist')
      .option('--production', 'Build for production', false)
      .action((pluginPath, options) => this.buildPlugin(pluginPath, options));

    // Test command
    this.program
      .command('test [path]')
      .description('Run plugin tests')
      .option('--watch', 'Watch for file changes', false)
      .option('--coverage', 'Generate coverage report', false)
      .action((pluginPath, options) => this.testPlugin(pluginPath, options));

    // Docs command
    this.program
      .command('docs [path]')
      .description('Generate plugin documentation')
      .option('-o, --output <dir>', 'Documentation output directory', 'docs')
      .option('--format <format>', 'Documentation format (html, markdown)', 'html')
      .action((pluginPath, options) => this.generateDocs(pluginPath, options));
  }

  async run() {
    await this.program.parseAsync(process.argv);
  }

  private async createPlugin(name: string, options: { template?: string; output?: string }) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text
          };
        }
      }
      console.log(chalk.blue(`✨ Creating plugin "${name}"...`));
      
      const outputPath = options.output || path.join(process.cwd(), name);
      
      // Create plugin directory
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      
      // Create plugin.yaml
      const pluginYaml = `name: ${name}
version: 1.0.0
author: Your Name
description: A new plugin
`;
      fs.writeFileSync(path.join(outputPath, 'plugin.yaml'), pluginYaml);
      
      // Create index.ts
      const indexTs = `import { PluginBase } from '../types/plugin/PluginBase';

export default class ${name} extends PluginBase {
  async onLoad(): Promise<void> {
    console.log('Plugin ${name} loaded!');
  }

  async onUnload(): Promise<void> {
    console.log('Plugin ${name} unloaded!');
  }
}
`;
      fs.writeFileSync(path.join(outputPath, 'index.ts'), indexTs);
      
      console.log(chalk.green(`✅ Plugin "${name}" created successfully at ${outputPath}`));
      console.log(chalk.gray('Next steps:'));
      console.log(chalk.gray(`  1. cd ${outputPath}`));
      console.log(chalk.gray('  2. npm install # if you have dependencies')); 
      console.log(chalk.gray('  3. npm run build # if you have build steps'));
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Failed to create plugin:'), error);
    }
  }

  private async validatePlugin(pluginPath: string) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text
          };
        }
      }
      console.log(chalk.blue('🔍 Validating plugin...'));
      
      const fullPath = path.resolve(pluginPath);
      
      // Check if plugin.yaml exists
      const configPath = path.join(fullPath, 'plugin.yaml');
      if (!fs.existsSync(configPath)) {
        console.log(chalk.red('❌ Plugin configuration (plugin.yaml) not found!'));
        return;
      }
      
      // Validate using PluginManager
      const result = await this.pluginManager.validatePluginStructure(fullPath);
      
      if (result) {
        console.log(chalk.green('✅ Plugin validation passed!'));
      } else {
        console.log(chalk.red('❌ Plugin validation failed!'));
      }
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Validation error:'), error);
      console.log(chalk.red('Errors:'));
      console.log(chalk.red(`   - ${(error as Error).message || error}`));
    }
  }

  private async installPlugin(pluginPath: string) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text
          };
        }
      }
      console.log(chalk.blue('📦 Installing plugin...'));
      
      const fullPath = path.resolve(pluginPath);
      
      // Validate first
      try {
        await this.pluginManager.validatePluginStructure(fullPath);
      } catch (error) {
        console.log(chalk.red('❌ Plugin validation failed:'));
        console.log(chalk.red(`   - ${(error as Error).message || error}`));
        return;
      }
      
      // Install using PluginManager
      const plugin = await this.pluginManager.installPlugin(fullPath);
      
      if (plugin) {
        console.log(chalk.green(`✅ Plugin "${plugin.name}" installed successfully!`));
      }
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Installation error:'), error);
      console.log(chalk.red(`   - ${(error as Error).message || error}`));
    }
  }

  private async uninstallPlugin(name: string) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text
          };
        }
      }
      console.log(chalk.blue('🗑️  Uninstalling plugin...'));
      
      // Uninstall using PluginManager
      const result = await this.pluginManager.uninstallPlugin(name);
      
      if ((result as any)?.success) {
        console.log(chalk.green(`✅ Plugin "${name}" uninstalled successfully!`));
      } else {
        console.log(chalk.red(`❌ Failed to uninstall plugin: ${(result as any)?.message || 'Unknown error'}`));
      }
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Uninstallation error:'), error);
      console.log(chalk.red(`   - ${(error as Error).message || error}`));
    }
  }

  private async listPlugins(options: { json: boolean }) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text,
            bold: (text: string) => text
          };
        }
      }
      
      const plugins = await this.pluginManager.getInstalledPlugins();
      
      if (options.json) {
        console.log(JSON.stringify(plugins, null, 2));
        return;
      }
      
      console.log(chalk.blue('🔌 Installed Plugins:'));
      if (plugins.length === 0) {
        console.log(chalk.yellow('No plugins installed'));
        return;
      }
      
      plugins.forEach(plugin => {
        const status = plugin.status === 'ACTIVE' ? chalk.green('✓ Active') : chalk.gray('○ Inactive');
        console.log(`  ${chalk.bold(plugin.name)} (${plugin.version}) ${status}`);
        if (plugin.description) {
          console.log(`    ${chalk.gray(plugin.description)}`);
        }
        console.log(`    Author: ${plugin.author}`);
        console.log(`    Installed: ${new Date(plugin.installedAt).toLocaleDateString()}`);
        console.log();
      });
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text,
          bold: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Failed to list plugins:'), error);
    }
  }

  private async enablePlugin(name: string) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text
          };
        }
      }
      
      console.log(chalk.blue(`🔌 Enabling plugin "${name}"...`));
      await this.pluginManager.enablePlugin(name);
      console.log(chalk.green(`✅ Plugin "${name}" enabled successfully!`));
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Failed to enable plugin:'), error);
      console.log(chalk.red(`   - ${(error as Error).message || error}`));
    }
  }

  private async disablePlugin(name: string) {
    try {
      // Ensure chalk is available
      if (!chalk) {
        try {
          chalk = (await import('chalk')).default;
        } catch (error) {
          // Fallback if chalk fails to load
          chalk = {
            red: (text: string) => text,
            green: (text: string) => text,
            blue: (text: string) => text,
            yellow: (text: string) => text,
            gray: (text: string) => text
          };
        }
      }
      
      console.log(chalk.blue(`🔌 Disabling plugin "${name}"...`));
      await this.pluginManager.disablePlugin(name);
      console.log(chalk.green(`✅ Plugin "${name}" disabled successfully!`));
    } catch (error) {
      // Ensure chalk is available for error messages
      if (!chalk) {
        chalk = {
          red: (text: string) => text,
          green: (text: string) => text,
          blue: (text: string) => text,
          yellow: (text: string) => text,
          gray: (text: string) => text
        };
      }
      console.error(chalk.red('❌ Failed to disable plugin:'), error);
      console.log(chalk.red(`   - ${(error as Error).message || error}`));
    }
  }

  private async startDevServer(pluginPath: string = '.', options: { port: string; watch: boolean }) {
    try {
      const resolvedPath = path.resolve(pluginPath);
      
      if (!chalk) {
        chalk = { blue: (s: string) => s, green: (s: string) => s, yellow: (s: string) => s, red: (s: string) => s, gray: (s: string) => s };
      }

      console.log(chalk.blue(`🚀 Starting development server for plugin at: ${resolvedPath}`));
      console.log(chalk.gray(`   Port: ${options.port}`));
      console.log(chalk.gray(`   Watch: ${options.watch}`));

      // Validate plugin structure first
      if (!fs.existsSync(path.join(resolvedPath, 'plugin.yaml'))) {
        throw new Error('plugin.yaml not found. This doesn\'t appear to be a plugin directory.');
      }

      // Create development server
      const app = express();
      const port = parseInt(options.port);

      // Enable CORS for development
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
      });

      // Plugin status endpoint
      app.get('/status', (req, res) => {
        res.json({ 
          status: 'development',
          path: resolvedPath,
          timestamp: new Date().toISOString()
        });
      });

      // Plugin reload endpoint
      app.post('/reload', (req, res) => {
        console.log(chalk.yellow('🔄 Plugin reload triggered'));
        res.json({ success: true, message: 'Plugin reloaded' });
      });

      const server = app.listen(port, () => {
        console.log(chalk.green(`✅ Development server running on http://localhost:${port}`));
        console.log(chalk.gray('   Available endpoints:'));
        console.log(chalk.gray(`   - GET  /status  - Plugin status`));
        console.log(chalk.gray(`   - POST /reload  - Trigger reload`));
      });

      // Set up file watching if enabled
      if (options.watch) {
        const watcher = chokidar.watch(resolvedPath, {
          ignored: ['node_modules/**', 'dist/**', '.git/**'],
          persistent: true
        });

        watcher.on('change', (filePath) => {
          console.log(chalk.yellow(`📝 File changed: ${path.relative(resolvedPath, filePath)}`));
          console.log(chalk.gray('   Plugin should be reloaded in your development environment'));
        });

        console.log(chalk.blue('👀 File watcher enabled'));
      }

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Shutting down development server...'));
        server.close(() => {
          console.log(chalk.green('✅ Development server stopped'));
          process.exit(0);
        });
      });

    } catch (error) {
      if (!chalk) chalk = { red: (s: string) => s };
      console.error(chalk.red('❌ Failed to start development server:'), error);
    }
  }

  private async buildPlugin(pluginPath: string = '.', options: { output: string; production: boolean }) {
    try {
      const resolvedPath = path.resolve(pluginPath);
      const outputDir = path.resolve(options.output);

      if (!chalk) {
        chalk = { blue: (s: string) => s, green: (s: string) => s, yellow: (s: string) => s, gray: (s: string) => s };
      }

      console.log(chalk.blue(`🔨 Building plugin at: ${resolvedPath}`));
      console.log(chalk.gray(`   Output: ${outputDir}`));
      console.log(chalk.gray(`   Production: ${options.production}`));

      // Validate plugin structure
      const pluginYamlPath = path.join(resolvedPath, 'plugin.yaml');
      if (!fs.existsSync(pluginYamlPath)) {
        throw new Error('plugin.yaml not found');
      }

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Copy plugin files
      const filesToCopy = ['plugin.yaml', 'index.js', 'package.json', 'README.md'];
      for (const file of filesToCopy) {
        const srcPath = path.join(resolvedPath, file);
        const destPath = path.join(outputDir, file);
        
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(chalk.gray(`   ✓ Copied ${file}`));
        }
      }

      // Copy directories
      const dirsToConisder = ['templates', 'scripts', 'config', 'webhooks', 'docker'];
      for (const dir of dirsToConisder) {
        const srcDir = path.join(resolvedPath, dir);
        const destDir = path.join(outputDir, dir);
        
        if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
          this.copyDir(srcDir, destDir);
          console.log(chalk.gray(`   ✓ Copied ${dir}/ directory`));
        }
      }

      // Create package archive if production build
      if (options.production) {
        const packagePath = path.join(outputDir, '..', `plugin-${Date.now()}.tar.gz`);
        console.log(chalk.yellow(`📦 Creating package: ${packagePath}`));
        // Note: In production, you might want to use tar or zip libraries
        console.log(chalk.gray('   Package creation would happen here (requires tar/zip library)'));
      }

      console.log(chalk.green(`✅ Plugin built successfully in ${outputDir}`));

    } catch (error) {
      if (!chalk) chalk = { red: (s: string) => s };
      console.error(chalk.red('❌ Failed to build plugin:'), error);
    }
  }

  private async testPlugin(pluginPath: string = '.', options: { watch: boolean; coverage: boolean }) {
    try {
      const resolvedPath = path.resolve(pluginPath);

      if (!chalk) {
        chalk = { blue: (s: string) => s, green: (s: string) => s, yellow: (s: string) => s, gray: (s: string) => s };
      }

      console.log(chalk.blue(`🧪 Running tests for plugin at: ${resolvedPath}`));
      console.log(chalk.gray(`   Watch mode: ${options.watch}`));
      console.log(chalk.gray(`   Coverage: ${options.coverage}`));

      // Check if package.json exists with test scripts
      const packageJsonPath = path.join(resolvedPath, 'package.json');
      let hasTestScript = false;

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        hasTestScript = packageJson.scripts && packageJson.scripts.test;
      }

      if (hasTestScript) {
        console.log(chalk.yellow('🔄 Running npm test...'));
        
        const testArgs = ['test'];
        if (options.watch) testArgs.push('--watch');
        if (options.coverage) testArgs.push('--coverage');

        const testProcess = spawn('npm', testArgs, {
          cwd: resolvedPath,
          stdio: 'inherit'
        });

        testProcess.on('exit', (code) => {
          if (code === 0) {
            console.log(chalk.green('✅ Tests completed successfully'));
          } else {
            console.log(chalk.red('❌ Tests failed'));
          }
        });
      } else {
        // Run basic plugin validation as fallback
        console.log(chalk.yellow('📋 No test script found, running plugin validation...'));
        await this.validatePlugin(resolvedPath);
      }

    } catch (error) {
      if (!chalk) chalk = { red: (s: string) => s };
      console.error(chalk.red('❌ Failed to run tests:'), error);
    }
  }

  private async generateDocs(pluginPath: string = '.', options: { output: string; format: string }) {
    try {
      const resolvedPath = path.resolve(pluginPath);
      const outputDir = path.resolve(options.output);

      if (!chalk) {
        chalk = { blue: (s: string) => s, green: (s: string) => s, gray: (s: string) => s };
      }

      console.log(chalk.blue(`📚 Generating documentation for plugin at: ${resolvedPath}`));
      console.log(chalk.gray(`   Output: ${outputDir}`));
      console.log(chalk.gray(`   Format: ${options.format}`));

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Read plugin metadata
      const pluginYamlPath = path.join(resolvedPath, 'plugin.yaml');
      if (!fs.existsSync(pluginYamlPath)) {
        throw new Error('plugin.yaml not found');
      }

      const yaml = require('js-yaml');
      const pluginData = yaml.load(fs.readFileSync(pluginYamlPath, 'utf8'));

      // Generate documentation based on format
      if (options.format === 'markdown') {
        const markdown = this.generateMarkdownDocs(pluginData, resolvedPath);
        fs.writeFileSync(path.join(outputDir, 'README.md'), markdown);
        console.log(chalk.gray('   ✓ Generated README.md'));
      } else {
        const html = this.generateHtmlDocs(pluginData, resolvedPath);
        fs.writeFileSync(path.join(outputDir, 'index.html'), html);
        console.log(chalk.gray('   ✓ Generated index.html'));
      }

      console.log(chalk.green(`✅ Documentation generated in ${outputDir}`));

    } catch (error) {
      if (!chalk) chalk = { red: (s: string) => s };
      console.error(chalk.red('❌ Failed to generate documentation:'), error);
    }
  }

  private copyDir(src: string, dest: string) {
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

  private generateMarkdownDocs(pluginData: any, pluginPath: string): string {
    return `# ${pluginData.name}

${pluginData.description || 'No description provided'}

## Plugin Information

- **Version**: ${pluginData.version}
- **Author**: ${pluginData.author}
- **Created**: ${new Date().toISOString()}

## Installation

\`\`\`bash
# Install the plugin
plugin-cli install ${path.basename(pluginPath)}

# Enable the plugin
plugin-cli enable ${pluginData.name}
\`\`\`

## Configuration

${pluginData.permissions ? '### Permissions\n\n```yaml\n' + JSON.stringify(pluginData.permissions, null, 2) + '\n```' : ''}

## API Documentation

This plugin provides the following functionality:

- Plugin lifecycle management
- Configuration handling
- Event system integration

## Development

\`\`\`bash
# Start development server
plugin-cli dev ${path.basename(pluginPath)}

# Run tests
plugin-cli test ${path.basename(pluginPath)}

# Build for production
plugin-cli build ${path.basename(pluginPath)} --production
\`\`\`
`;
  }

  private generateHtmlDocs(pluginData: any, pluginPath: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pluginData.name} - Plugin Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        .meta { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>${pluginData.name}</h1>
    <p>${pluginData.description || 'No description provided'}</p>
    
    <div class="meta">
        <h2>Plugin Information</h2>
        <ul>
            <li><strong>Version:</strong> ${pluginData.version}</li>
            <li><strong>Author:</strong> ${pluginData.author}</li>
            <li><strong>Generated:</strong> ${new Date().toISOString()}</li>
        </ul>
    </div>

    <h2>Installation</h2>
    <pre><code># Install the plugin
plugin-cli install ${path.basename(pluginPath)}

# Enable the plugin
plugin-cli enable ${pluginData.name}</code></pre>

    ${pluginData.permissions ? `<h2>Configuration</h2>
    <h3>Permissions</h3>
    <pre><code>${JSON.stringify(pluginData.permissions, null, 2)}</code></pre>` : ''}

    <h2>Development</h2>
    <pre><code># Start development server
plugin-cli dev ${path.basename(pluginPath)}

# Run tests
plugin-cli test ${path.basename(pluginPath)}

# Build for production
plugin-cli build ${path.basename(pluginPath)} --production</code></pre>
</body>
</html>`;
  }

  private getTemplate(templateType: string): PluginTemplate {
    const templates: { [key: string]: PluginTemplate } = {
      basic: {
        name: 'Basic Plugin',
        description: 'A basic plugin template',
        files: {
          'plugin.yaml': `name: {{name}}
version: "1.0.0"
author: "Your Name"
description: "A basic plugin for CTRL-ALT-PLAY"
permissions:
  read: true
  write: false
`,
          'index.js': `// {{name}} Plugin Entry Point
console.log('{{name}} plugin loaded!');

module.exports = {
  name: '{{name}}',
  initialize() {
    console.log('{{name}} plugin initialized');
  },
  
  shutdown() {
    console.log('{{name}} plugin shutdown');
  }
};
`,
          'README.md': `# {{name}}

A plugin for CTRL-ALT-PLAY panel.

## Installation

1. Copy this plugin to your plugins directory
2. Restart the panel

## Configuration

Edit \`plugin.yaml\` to configure the plugin.
`,
          'package.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "A plugin for CTRL-ALT-PLAY",
  "main": "index.js",
  "dependencies": {}
}
`
        }
      },
      
      'game-template': {
        name: 'Game Template Plugin',
        description: 'A plugin for game server templates',
        files: {
          'plugin.yaml': `name: {{name}}
version: "1.0.0"
author: "Your Name"
description: "Game template plugin for CTRL-ALT-PLAY"
permissions:
  server_create: true
  server_manage: true
game_templates:
  - name: "{{name}}-server"
    description: "{{name}} game server"
    game_type: "custom"
    docker_image: "ubuntu:latest"
    startup_cmd: "./start.sh"
    variables:
      - name: "SERVER_PORT"
        description: "Server port"
        default_value: "25565"
    ports:
      - container: 25565
        host: 25565
        protocol: "tcp"
`,
          'templates/server.json': `{
  "name": "{{name}} Server",
  "description": "Default {{name}} server configuration",
  "startup": "./start.sh",
  "variables": {
    "SERVER_PORT": "25565"
  }
}
`,
          'scripts/start.sh': `#!/bin/bash
# {{name}} Server Start Script

echo "Starting {{name}} server..."
echo "Port: $SERVER_PORT"

# Add your server startup logic here
./server --port=$SERVER_PORT
`,
          'docker/Dockerfile': `FROM ubuntu:latest

# Install dependencies for {{name}}
RUN apt-get update && apt-get install -y \\
    curl \\
    wget \\
    unzip \\
    && rm -rf /var/lib/apt/lists/*

# Create server directory
WORKDIR /server

# Copy server files
COPY . .

# Make scripts executable
RUN chmod +x scripts/start.sh

# Expose server port
EXPOSE 25565

# Start server
CMD ["./scripts/start.sh"]
`,
          'README.md': `# {{name}} Game Template

A game template plugin for CTRL-ALT-PLAY panel.

## Features

- Custom game server templates
- Configurable startup commands
- Docker support
- Port management
- Environment variables

## Configuration

Edit \`plugin.yaml\` to customize:
- Game server settings
- Docker image
- Startup commands
- Server variables

## Files

- \`templates/server.json\` - Server configuration template
- \`scripts/start.sh\` - Server startup script
- \`docker/Dockerfile\` - Docker container definition
`,
          'package.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "Game template plugin for CTRL-ALT-PLAY",
  "main": "index.js",
  "scripts": {
    "start": "./scripts/start.sh"
  },
  "dependencies": {}
}
`
        }
      },
      
      'billing-integration': {
        name: 'Billing Integration Plugin',
        description: 'A plugin for billing system integration',
        files: {
          'plugin.yaml': `name: {{name}}
version: "1.0.0"
author: "Your Name"
description: "Billing integration plugin for CTRL-ALT-PLAY"
permissions:
  billing_read: true
  billing_write: true
billing_integration:
  provider: "custom"
  webhook_url: "https://your-billing-system.com/webhook"
  api_key: "your-api-key"
  settings:
    currency: "USD"
    tax_rate: 0.08
`,
          'billing.js': `// {{name}} Billing Integration
const express = require('express');

class {{name}}Billing {
  constructor() {
    this.app = express();
    this.setupRoutes();
  }
  
  setupRoutes() {
    this.app.post('/webhook', (req, res) => {
      console.log('Billing webhook received:', req.body);
      res.json({ status: 'received' });
    });
    
    this.app.get('/invoices', (req, res) => {
      // List invoices
      res.json({ invoices: [] });
    });
    
    this.app.post('/invoices', (req, res) => {
      // Create invoice
      this.createInvoice(req.body.customerId, req.body.amount);
      res.json({ status: 'created' });
    });
  }
  
  createInvoice(customerId, amount) {
    console.log(\`Creating invoice for customer \${customerId}: $\${amount}\`);
    // Implement billing logic here
    return {
      id: Date.now(),
      customerId,
      amount,
      status: 'pending'
    };
  }
  
  processPayment(invoiceId, paymentData) {
    console.log(\`Processing payment for invoice \${invoiceId}\`);
    // Implement payment processing here
    return {
      success: true,
      transactionId: Date.now()
    };
  }
}

module.exports = {{name}}Billing;
`,
          'webhooks/stripe.js': `// Stripe webhook handler for {{name}}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeWebhookHandler {
  constructor(billing) {
    this.billing = billing;
  }
  
  handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          this.handlePaymentFailure(event.data.object);
          break;
        default:
          console.log(\`Unhandled event type: \${event.type}\`);
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err.message);
      res.status(400).send(\`Webhook Error: \${err.message}\`);
    }
  }
  
  handlePaymentSuccess(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    // Update billing system
  }
  
  handlePaymentFailure(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    // Handle failed payment
  }
}

module.exports = StripeWebhookHandler;
`,
          'README.md': `# {{name}} Billing Integration

A billing integration plugin for CTRL-ALT-PLAY panel.

## Features

- Webhook support for multiple providers
- Invoice management
- Payment processing
- Customer management
- Tax calculation
- Subscription handling

## Supported Providers

- Stripe
- PayPal
- Square
- Custom billing systems

## Configuration

1. Set up your billing provider credentials
2. Configure webhook endpoints
3. Set tax rates and currency
4. Test with sandbox mode

## API Endpoints

- \`POST /webhook\` - Handle billing webhooks
- \`GET /invoices\` - List invoices
- \`POST /invoices\` - Create new invoice
- \`PUT /invoices/:id\` - Update invoice

## Security

- Webhook signature verification
- API key authentication
- Rate limiting
- Input validation
`,
          'package.json': `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "Billing integration plugin for CTRL-ALT-PLAY",
  "main": "billing.js",
  "scripts": {
    "start": "node billing.js",
    "test": "npm run test:unit",
    "test:unit": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "stripe": "^12.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
`,
          'config/billing.json': `{
  "providers": {
    "stripe": {
      "enabled": true,
      "webhook_endpoint": "/webhook/stripe"
    },
    "paypal": {
      "enabled": false,
      "webhook_endpoint": "/webhook/paypal"
    }
  },
  "settings": {
    "currency": "USD",
    "tax_rate": 0.08,
    "late_fee": 5.00,
    "payment_terms": 30
  }
}
`
        }
      }
    };

    return templates[templateType] || templates.basic;
  }
}

// Export for use in other modules
export default PluginCLI;

// Main execution for CLI usage
async function main() {
  const cli = new PluginCLI();
  await cli.run();
}

if (require.main === module) {
  main().catch(console.error);
}
