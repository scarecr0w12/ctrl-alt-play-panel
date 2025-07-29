# Plugin Development Guide

The CTRL-ALT-PLAY panel features a comprehensive plugin system that allows developers to extend functionality with custom game server templates, billing integrations, and more.

## Getting Started with Plugin Development

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

## Plugin Templates

### Basic Template

Perfect for simple functionality extensions:

```bash
npx plugin-cli create my-plugin --template basic
```

Generated Structure:
```
my-plugin/
├── plugin.yaml           # Plugin metadata
├── index.js              # Main plugin entry point
├── config/               # Configuration files
│   └── schema.json       # Configuration schema
├── routes/               # Custom API routes
├── public/               # Static assets
└── README.md             # Plugin documentation
```

### Game Template

For game server templates with full Ctrl/Alt configuration:

```bash
npx plugin-cli create my-game --template game-template
```

Generated Structure:
```
my-game/
├── plugin.yaml           # Plugin metadata
├── index.js              # Main plugin entry point
├── ctrl/                 # Ctrl configuration (server setup)
│   ├── install.sh        # Installation script
│   ├── update.sh         # Update script
│   └── uninstall.sh      # Uninstallation script
├── alt/                  # Alt configuration (runtime)
│   ├── start.sh          # Start script
│   ├── stop.sh           # Stop script
│   └── status.sh         # Status check script
├── config/               # Configuration files
│   └── schema.json       # Configuration schema
├── routes/               # Custom API routes
├── public/               # Static assets
└── README.md             # Plugin documentation
```

## Plugin Structure

### plugin.yaml

The plugin.yaml file contains metadata about your plugin:

```yaml
name: my-plugin
version: 1.0.0
description: A sample plugin
type: basic
author: Your Name
license: MIT
permissions:
  - servers.view
  - servers.create
```

### index.js

The main entry point for your plugin:

```javascript
class MyPlugin {
  constructor(panel) {
    this.panel = panel;
    this.name = 'my-plugin';
    this.version = '1.0.0';
  }

  async init() {
    // Initialize plugin
    console.log('MyPlugin initialized');
  }

  async registerRoutes() {
    // Register custom API routes
    this.panel.router.get('/api/my-plugin/hello', (req, res) => {
      res.json({ message: 'Hello from my plugin!' });
    });
  }

  async destroy() {
    // Cleanup when plugin is unloaded
    console.log('MyPlugin destroyed');
  }
}

module.exports = MyPlugin;
```

## Testing Plugins

### Local Development

```bash
# Create test environment
mkdir test-panel

# Start test panel
npm run test:panel

# Install plugin
npx plugin-cli install ./my-plugin
```

### Plugin Validation

The plugin CLI includes validation tools:

```bash
# Validate plugin structure
npx plugin-cli validate ./my-plugin

# Check for common issues
npx plugin-cli check ./my-plugin

# Run plugin tests
npx plugin-cli test ./my-plugin
```

## Publishing Plugins

### Marketplace Submission

1. Ensure your plugin meets quality standards
2. Create a detailed README.md
3. Test across different environments
4. Submit to the CTRL-ALT-PLAY Marketplace

### Version Management

Follow semantic versioning:
- MAJOR version for incompatible API changes
- MINOR version for backward-compatible functionality
- PATCH version for backward-compatible bug fixes

## Best Practices

1. Always validate user input
2. Handle errors gracefully
3. Use proper logging
4. Respect resource limits
5. Follow security best practices
6. Document your plugin thoroughly
7. Test across different environments