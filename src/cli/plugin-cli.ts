#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import PluginManager from '../services/PluginManager';

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
    this.pluginManager = PluginManager.getInstance();
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

    // List command
    this.program
      .command('list')
      .description('List installed plugins')
      .option('-t, --type <type>', 'Filter by plugin type')
      .action((options) => this.listPlugins(options));
  }

  async run() {
    await this.program.parseAsync(process.argv);
  }

  private async createPlugin(name: string, options: CommandOptions) {
    try {
      console.log(chalk.blue(`🚀 Creating plugin: ${name}`));
      
      const template = this.getTemplate(options.template || 'basic');
      const pluginDir = path.join(process.cwd(), name);

      if (fs.existsSync(pluginDir) && !options.force) {
        console.log(chalk.red(`❌ Directory ${name} already exists. Use --force to overwrite.`));
        return;
      }

      // Create plugin directory
      fs.mkdirSync(pluginDir, { recursive: true });

      // Create files from template
      for (const [fileName, content] of Object.entries(template.files)) {
        const filePath = path.join(pluginDir, fileName);
        const fileDir = path.dirname(filePath);
        
        fs.mkdirSync(fileDir, { recursive: true });
        fs.writeFileSync(filePath, content.replace(/{{name}}/g, name));
      }

      console.log(chalk.green(`✅ Plugin ${name} created successfully!`));
      console.log(chalk.blue(`📁 Location: ${pluginDir}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Creation error:'), error);
    }
  }

  private async validatePlugin(pluginPath: string) {
    try {
      console.log(chalk.blue('🔍 Validating plugin...'));
      
      const configPath = path.join(pluginPath, 'plugin.yaml');
      if (!fs.existsSync(configPath)) {
        console.log(chalk.red('❌ Plugin configuration (plugin.yaml) not found!'));
        return;
      }

      // Read and parse the plugin config
      const yaml = require('js-yaml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);

      const validation = await this.pluginManager.validatePlugin(config);

      if (validation.valid) {
        console.log(chalk.green('✅ Plugin validation passed!'));
      } else {
        console.log(chalk.red('❌ Plugin validation failed!'));
        if (validation.errors?.length) {
          console.log(chalk.red('Errors:'));
          validation.errors.forEach((error: string) => {
            console.log(chalk.red(`   - ${error}`));
          });
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Validation error:'), error);
    }
  }

  private async installPlugin(pluginPath: string) {
    try {
      console.log(chalk.blue('📦 Installing plugin...'));
      
      const result = await this.pluginManager.installPlugin(pluginPath, 'local');

      if (result.success) {
        console.log(chalk.green(`✅ Plugin "${result.plugin.name}" installed successfully!`));
      } else {
        console.log(chalk.red('❌ Installation failed!'));
        console.log(chalk.red(result.message || 'Unknown error'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Installation error:'), error);
    }
  }

  private async listPlugins(options: CommandOptions) {
    try {
      console.log(chalk.blue('📋 Listing plugins...'));
      
      const plugins = await this.pluginManager.getPlugins(options.type);

      if (plugins.length === 0) {
        console.log(chalk.yellow('📭 No plugins found.'));
        return;
      }

      console.log(chalk.green(`Found ${plugins.length} plugin(s):`));
      console.log();

      plugins.forEach((plugin: PluginMetadata) => {
        console.log(chalk.green(`${plugin.name} v${plugin.version}`));
        console.log(chalk.gray(`   ${plugin.description || 'No description'}`));
        console.log(chalk.blue(`   Author: ${plugin.author}`));
        console.log();
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to list plugins:'), error);
    }
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
