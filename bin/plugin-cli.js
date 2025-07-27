#!/usr/bin/env node

/**
 * Plugin CLI Executable
 * Entry point for the plugin development CLI tool
 */

require('ts-node/register');
const { PluginCLI } = require('../src/cli/plugin-cli');

// Create and run CLI
const cli = new PluginCLI();
cli.run();
