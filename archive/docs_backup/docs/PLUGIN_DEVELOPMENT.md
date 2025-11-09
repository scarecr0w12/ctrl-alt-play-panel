# Plugin Development Guide

## 🧩 Getting Started with Plugin Development

The CTRL-ALT-PLAY panel features a comprehensive plugin system that allows developers to extend functionality with custom game server templates, billing integrations, and more.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Access to CTRL-ALT-PLAY panel installation
- Basic knowledge of JavaScript/TypeScript

### Installation

The plugin CLI comes built-in with your panel installation:

```bash
# Create a new plugin
npx plugin-cli create my-first-plugin

# Create with specific template
npx plugin-cli create minecraft-server --template game-template
npx plugin-cli create payment-gateway --template billing-integration

# Validate plugin structure
npx plugin-cli validate ./my-first-plugin

# Install for testing
npx plugin-cli install ./my-first-plugin

# List available templates
npx plugin-cli list
```

## 📋 Plugin Templates

### Basic Template

Perfect for simple functionality extensions:

```bash
npx plugin-cli create my-plugin --template basic
```

**Generated Structure:**
```
my-plugin/
├── plugin.yaml           # Plugin metadata
├── package.json          # Dependencies
├── README.md             # Documentation
└── index.js              # Main entry point
```

**Use Cases:**
- Simple API extensions
- Utility functions
- Basic integrations

### Game Template

Complete game server plugin with Docker support:

```bash
npx plugin-cli create game-server --template game-template
```

**Generated Structure:**
```
game-server/
├── plugin.yaml           # Plugin metadata with game templates
├── package.json          # Dependencies
├── README.md             # Documentation
├── templates/            # Server configuration templates
│   └── server.json
├── scripts/              # Startup scripts
│   └── start.sh
└── docker/               # Docker configuration
    └── Dockerfile
```

**Features:**
- Docker container configuration
- Server startup scripts
- Environment variable management
- Port configuration
- Resource allocation

### Billing Integration Template

Complete billing system with Stripe webhooks:

```bash
npx plugin-cli create billing-system --template billing-integration
```

**Generated Structure:**
```
billing-system/
├── plugin.yaml           # Plugin metadata
├── package.json          # Dependencies
├── README.md             # Documentation
├── billing.js            # Main billing logic
├── webhooks/             # Webhook handlers
│   └── stripe.js
└── config/               # Configuration files
    └── billing.json
```

**Features:**
- Stripe webhook integration
- Invoice management
- Payment processing
- Customer management
- Revenue tracking

## 📄 Plugin Configuration

### plugin.yaml Structure

The `plugin.yaml` file is the core configuration for your plugin:

```yaml
name: my-plugin
version: "1.0.0"
author: "Your Name"
description: "Plugin description"
permissions:
  servers_create: true
  servers_manage: true
dependencies:
  - "required-plugin"
api_endpoints:
  - path: "/my-plugin/status"
    method: "GET"
    description: "Get plugin status"
```

### Game Template Configuration

For game server plugins:

```yaml
name: minecraft-plugin
version: "1.0.0"
author: "Your Name"
description: "Minecraft server management"
permissions:
  server_create: true
  server_manage: true
game_templates:
  - name: "minecraft-server"
    description: "Minecraft Java Edition"
    game_type: "minecraft"
    docker_image: "openjdk:17-slim"
    startup_cmd: "java -jar server.jar"
    variables:
      - name: "MEMORY"
        description: "Server memory allocation"
        default_value: "2048M"
      - name: "SERVER_PORT"
        description: "Server port"
        default_value: "25565"
    ports:
      - container: 25565
        host: 25565
        protocol: "tcp"
```

### Billing Integration Configuration

For billing plugins:

```yaml
name: stripe-billing
version: "1.0.0"
author: "Your Name"
description: "Stripe billing integration"
permissions:
  billing_manage: true
  invoices_create: true
billing_integration:
  provider: "stripe"
  webhook_endpoints:
    - "/webhook/stripe"
  supported_events:
    - "payment_intent.succeeded"
    - "invoice.payment_failed"
```

## 💻 Plugin Development API

### Basic Plugin Structure

```javascript
class MyPlugin {
  constructor(panel) {
    this.panel = panel;
    this.name = 'my-plugin';
    this.version = '1.0.0';
  }

  // Called when plugin is installed
  async onInstall() {
    console.log('Plugin installed');
    // Setup database tables, initial configuration
  }

  // Called when plugin is enabled
  async onEnable() {
    console.log('Plugin enabled');
    // Register routes, start services
    this.registerRoutes();
  }

  // Called when plugin is disabled
  async onDisable() {
    console.log('Plugin disabled');
    // Cleanup, unregister routes
    this.unregisterRoutes();
  }

  // Called when plugin is uninstalled
  async onUninstall() {
    console.log('Plugin uninstalled');
    // Remove data, cleanup completely
  }

  registerRoutes() {
    this.panel.registerRoute('/my-plugin/status', 'GET', (req, res) => {
      res.json({ status: 'active', version: this.version });
    });
  }

  unregisterRoutes() {
    this.panel.unregisterRoute('/my-plugin/status');
  }
}

module.exports = MyPlugin;
```

### Game Server Plugin

```javascript
class GameServerPlugin {
  constructor(panel) {
    this.panel = panel;
  }

  async onEnable() {
    // Register game template
    this.panel.registerGameTemplate({
      name: 'my-game-server',
      image: 'my-game:latest',
      startupCommand: './start.sh',
      ports: [{ container: 7777, host: 7777 }],
      variables: {
        SERVER_NAME: 'My Game Server',
        MAX_PLAYERS: '32'
      }
    });
  }

  async createServer(config) {
    // Custom server creation logic
    return await this.panel.createDockerContainer({
      image: config.image,
      command: config.startupCommand,
      environment: config.variables,
      ports: config.ports
    });
  }
}
```

### Billing Integration Plugin

```javascript
class BillingPlugin {
  constructor(panel) {
    this.panel = panel;
  }

  async onEnable() {
    // Register webhook endpoints
    this.panel.registerRoute('/webhook/stripe', 'POST', this.handleStripeWebhook.bind(this));
  }

  async handleStripeWebhook(req, res) {
    const event = req.body;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
    }
    
    res.json({ received: true });
  }

  async createInvoice(customerId, amount) {
    // Custom billing logic
    return await this.panel.database.invoice.create({
      data: {
        customerId,
        amount,
        status: 'pending'
      }
    });
  }
}
```

## 🔧 Development Workflow

### 1. Create Plugin

```bash
# Create plugin from template
npx plugin-cli create my-plugin --template basic

# Navigate to plugin directory
cd my-plugin
```

### 2. Develop Functionality

Edit the generated files to implement your plugin logic:

- `plugin.yaml` - Plugin metadata and configuration
- `index.js` - Main plugin logic
- `package.json` - Dependencies and scripts

### 3. Test Plugin

```bash
# Validate plugin structure
npx plugin-cli validate .

# Install for testing
npx plugin-cli install .

# Check if plugin is loaded
curl http://localhost:3000/api/plugins
```

### 4. Debug Plugin

Enable plugin logging to debug issues:

```javascript
class MyPlugin {
  log(message) {
    console.log(`[${this.name}] ${message}`);
  }

  async onEnable() {
    this.log('Plugin enabling...');
    // Your code here
    this.log('Plugin enabled successfully');
  }
}
```

## 🛡️ Security Best Practices

### Input Validation

Always validate input data:

```javascript
validateServerConfig(config) {
  if (!config.name || config.name.length < 3) {
    throw new Error('Server name must be at least 3 characters');
  }
  
  if (!config.memory || config.memory < 512) {
    throw new Error('Memory must be at least 512MB');
  }
}
```

### Permission Checks

Verify user permissions before operations:

```javascript
async createServer(req, res) {
  if (!req.user.hasPermission('server_create')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Proceed with server creation
}
```

### Data Sanitization

Sanitize user input to prevent injection attacks:

```javascript
const sanitize = require('sanitize-html');

processUserInput(input) {
  return sanitize(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
}
```

## 🧪 Testing Plugins

### Unit Testing

Create tests for your plugin functionality:

```javascript
// tests/plugin.test.js
const MyPlugin = require('../index');

describe('MyPlugin', () => {
  let plugin;
  
  beforeEach(() => {
    plugin = new MyPlugin(mockPanel);
  });
  
  test('should enable successfully', async () => {
    await plugin.onEnable();
    expect(plugin.enabled).toBe(true);
  });
});
```

### Integration Testing

Test plugin integration with the panel:

```bash
# Start test panel
npm run test:panel

# Install plugin
npx plugin-cli install ./my-plugin

# Run integration tests
npm run test:integration
```

## 📦 Publishing Plugins

### Plugin Package

Package your plugin for distribution:

```bash
# Create plugin archive
tar -czf my-plugin-1.0.0.tar.gz my-plugin/

# Or use npm pack
cd my-plugin && npm pack
```

### Plugin Registry

Submit to the plugin registry:

```bash
# Submit plugin (future feature)
npx plugin-cli publish ./my-plugin
```

## 🔍 Troubleshooting

### Common Issues

**Plugin not loading:**
- Check `plugin.yaml` syntax
- Verify required permissions
- Check console logs for errors

**Routes not working:**
- Ensure routes are registered in `onEnable()`
- Check for route conflicts
- Verify middleware order

**Database errors:**
- Check database permissions
- Verify table schemas
- Test database connectivity

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=plugin:* npm start
```

### Log Analysis

Check plugin logs:

```bash
# View plugin logs
tail -f logs/plugins.log

# Filter specific plugin
tail -f logs/plugins.log | grep "my-plugin"
```

## 📚 API Reference

### Panel API

The panel provides these APIs to plugins:

```javascript
// Register HTTP route
panel.registerRoute(path, method, handler)

// Unregister HTTP route
panel.unregisterRoute(path)

// Register game template
panel.registerGameTemplate(template)

// Database access
panel.database

// Configuration access
panel.config

// User management
panel.users

// Server management
panel.servers
```

### Plugin Lifecycle

```javascript
// Installation
onInstall() -> Plugin setup

// Activation
onEnable() -> Register routes, start services

// Deactivation
onDisable() -> Cleanup, unregister routes

// Removal
onUninstall() -> Complete cleanup
```

## 🎯 Examples

Check the `examples/` directory for complete plugin examples:

- `examples/basic-plugin/` - Simple API extension
- `examples/minecraft-plugin/` - Game server integration
- `examples/billing-plugin/` - Payment processing

## 🤝 Contributing

Contribute to plugin development:

1. Fork the repository
2. Create a feature branch
3. Add your plugin or improvements
4. Submit a pull request

## 📞 Support

Need help with plugin development?

- 📖 Documentation: `/docs/`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: support@ctrl-alt-play.com

---

Happy plugin development! 🎉
