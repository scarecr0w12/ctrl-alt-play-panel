# Plugin Development SDK

Welcome to the Ctrl+Alt+Play Plugin Development SDK! This guide will help you create powerful plugins for the game server management panel.

## Quick Start

### 1. Create a New Plugin

```bash
npm run plugin:create my-awesome-plugin
```

This creates a new plugin with the following structure:
```
plugins/my-awesome-plugin/
├── plugin.yaml          # Plugin metadata
├── backend/
│   └── index.js         # Main plugin code
├── frontend/            # Frontend components (optional)
├── tests/               # Plugin tests
└── README.md           # Plugin documentation
```

### 2. Configure Your Plugin

Edit `plugin.yaml` to define your plugin's metadata and permissions:

```yaml
name: my-awesome-plugin
version: 1.0.0
author: Your Name
description: Description of what your plugin does
license: MIT

# Required permissions
permissions:
  routes: true      # Can register API routes
  database: false   # Can access database
  filesystem: false # Can access file system
  network: false    # Can make network requests

# API endpoints this plugin provides
api:
  routes:
    - path: /my-endpoint
      method: GET
      handler: myHandler
      description: What this endpoint does
```

### 3. Implement Plugin Logic

Your plugin must extend the base plugin class:

```javascript
class MyAwesomePlugin {
  constructor(context) {
    this.context = context;
    this.logger = context.logger;
    this.pluginName = context.pluginName;
  }

  // Lifecycle hooks
  async onInstall() {
    this.logger.info('Plugin installed');
  }

  async onEnable() {
    this.logger.info('Plugin enabled');
  }

  async onDisable() {
    this.logger.info('Plugin disabled');
  }

  async onUninstall() {
    this.logger.info('Plugin uninstalled');
  }

  // Custom API handlers
  async myHandler(req, res) {
    res.json({
      message: 'Hello from my plugin!',
      plugin: this.pluginName
    });
  }
}

module.exports = MyAwesomePlugin;
```

### 4. Test and Install

```bash
# Validate plugin structure
npm run plugin:validate plugins/my-awesome-plugin

# Install the plugin
npm run plugin:install plugins/my-awesome-plugin

# Enable the plugin
npm run plugin:enable my-awesome-plugin

# List all plugins
npm run plugin:list
```

## Plugin Context API

Your plugin receives a `context` object with the following utilities:

### Logger
```javascript
this.logger.info('Information message');
this.logger.warn('Warning message');
this.logger.error('Error message');
```

### Data Storage
```javascript
// Store plugin-specific data
await this.context.setData('key', { some: 'data' });

// Retrieve plugin data
const data = await this.context.getData('key');
```

### Plugin Information
```javascript
this.context.pluginName;  // Your plugin's name
this.context.pluginPath;  // Path to your plugin directory
```

## Lifecycle Hooks

Your plugin can implement these lifecycle methods:

- `onInstall()` - Called when plugin is first installed
- `onEnable()` - Called when plugin is enabled
- `onDisable()` - Called when plugin is disabled
- `onUninstall()` - Called when plugin is removed

## API Routes

If your plugin has `routes: true` permission, you can handle HTTP requests:

```javascript
async myApiHandler(req, res) {
  // Handle GET, POST, PUT, DELETE requests
  const { method, body, params, query } = req;
  
  // Return JSON response
  res.json({
    success: true,
    data: 'Your response data'
  });
}
```

## Best Practices

### 1. Error Handling
Always wrap your code in try-catch blocks:

```javascript
async myMethod() {
  try {
    // Your code here
  } catch (error) {
    this.logger.error('Something went wrong:', error.message);
    throw error;
  }
}
```

### 2. Data Validation
Validate input data:

```javascript
async myHandler(req, res) {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Name is required and must be a string'
    });
  }
  
  // Process valid data
}
```

### 3. Logging
Use appropriate log levels:

```javascript
this.logger.info('Plugin operation successful');
this.logger.warn('Non-critical issue occurred');
this.logger.error('Critical error that needs attention');
```

### 4. Permissions
Request only the permissions you need:

```yaml
permissions:
  routes: true      # Only if you need API endpoints
  database: false   # Only if you need database access
  filesystem: false # Only if you need file operations
  network: false    # Only if you need external requests
```

## Example Plugins

### Hello World Plugin
A simple plugin that demonstrates basic functionality:

```javascript
class HelloWorldPlugin {
  constructor(context) {
    this.context = context;
    this.logger = context.logger;
    this.pluginName = context.pluginName;
  }

  async onEnable() {
    this.logger.info('Hello World plugin enabled!');
  }

  async getHello(req, res) {
    res.json({
      message: 'Hello from the plugin system!',
      plugin: this.pluginName,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Data Storage Plugin
Example using data storage:

```javascript
class DataStoragePlugin {
  async saveUserPreference(req, res) {
    try {
      const { key, value } = req.body;
      
      await this.context.setData(key, value);
      
      res.json({
        success: true,
        message: 'Preference saved'
      });
    } catch (error) {
      this.logger.error('Failed to save preference:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to save preference'
      });
    }
  }

  async getUserPreference(req, res) {
    try {
      const { key } = req.params;
      const value = await this.context.getData(key);
      
      res.json({
        success: true,
        data: value
      });
    } catch (error) {
      this.logger.error('Failed to get preference:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get preference'
      });
    }
  }
}
```

## CLI Commands

### Plugin Development
- `npm run plugin:create <name>` - Create new plugin
- `npm run plugin:validate <path>` - Validate plugin structure

### Plugin Management
- `npm run plugin:install <path>` - Install plugin
- `npm run plugin:list` - List all plugins
- `npm run plugin:enable <name>` - Enable plugin
- `npm run plugin:disable <name>` - Disable plugin

### Testing
- `npm run plugin:test` - Run plugin system tests

## Troubleshooting

### Common Issues

1. **Plugin not loading**
   - Check plugin.yaml syntax
   - Verify backend/index.js exports a class
   - Check console logs for error messages

2. **Permission denied**
   - Update plugin.yaml permissions
   - Reinstall the plugin after changes

3. **API routes not working**
   - Ensure `routes: true` in permissions
   - Check route handler names match plugin.yaml
   - Verify application server is running

### Debug Mode
Enable debug logging in your plugin:

```javascript
constructor(context) {
  this.context = context;
  this.logger = context.logger.child({ 
    plugin: context.pluginName,
    debug: true 
  });
}
```

## Support

For help with plugin development:
1. Check the example plugins in `sample-plugins/`
2. Review the API documentation
3. Use `npm run plugin:validate` to check your plugin
4. Check application logs for error messages

Happy plugin development! 🔌
