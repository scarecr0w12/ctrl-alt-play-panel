#!/usr/bin/env node

/**
 * Plugin CLI Executable
 * Entry point for the plugin development CLI tool
 */

const PluginCLI = require('../dist/cli/plugin-cli').default;

if (PluginCLI) {
  // Create and run CLI
  const cli = new PluginCLI();
  cli.run();
} else {
  console.error('Failed to load PluginCLI. Make sure to run "npm run build" first.');
  process.exit(1);
}
