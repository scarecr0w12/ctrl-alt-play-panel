import { DatabaseService } from '../src/services/database';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function testPluginInstall() {
  try {
    // Initialize DatabaseService
    console.log('Initializing DatabaseService...');
    await DatabaseService.initialize();
    console.log('DatabaseService initialized');
    
    // Create the test plugin
    const pluginPath = path.join(__dirname, '../sample-plugins/test-plugin-system');
    
    if (!fs.existsSync(pluginPath)) {
      fs.mkdirSync(pluginPath, { recursive: true });
    }
    
    const yamlContent = `name: test-plugin-system
version: 1.0.0
author: Test Author
description: Test plugin
main: plugin.js
permissions:
  routes: false
  database: false
  filesystem: false
  network: false`;
    
    fs.writeFileSync(path.join(pluginPath, 'plugin.yaml'), yamlContent);
    
    fs.writeFileSync(path.join(pluginPath, 'plugin.js'), `
const { PluginBase } = require('../../sdk/PluginBase');

class TestPlugin extends PluginBase {
  constructor(context) {
    super(context);
    this.name = 'test-plugin-system';
    this.version = '1.0.0';
  }

  async install() {
    this.log('Installing test-plugin-system...');
    return { success: true };
  }

  async enable() {
    this.log('Enabling test-plugin-system...');
    return { success: true };
  }

  async disable() {
    this.log('Disabling test-plugin-system...');
    return { success: true };
  }

  async uninstall() {
    this.log('Uninstalling test-plugin-system...');
    return { success: true };
  }
}

module.exports = TestPlugin;
    `);
    
    // Create backend directory and index.js
    const backendPath = path.join(pluginPath, 'backend');
    if (!fs.existsSync(backendPath)) {
      fs.mkdirSync(backendPath, { recursive: true });
    }
    
    fs.writeFileSync(path.join(backendPath, 'index.js'), `
// Test plugin backend
console.log('Test plugin backend loaded');
    `);
    
    // Run the CLI install command
    const cliPath = path.join(__dirname, '../src/cli/plugin-cli.ts');
    
    console.log('Installing plugin...');
    execSync(`npx ts-node ${cliPath} install ${pluginPath}`, { stdio: 'inherit' } as any);
    console.log('Plugin installed');
    
    // Check if plugin exists in database
    const prisma = DatabaseService.getInstance();
    const plugin = await prisma.plugin.findUnique({
      where: { name: 'test-plugin-system' }
    });
    console.log('Plugin in database:', plugin);
  } catch (error) {
    console.error('Error:', error);
  }
}

testPluginInstall();
