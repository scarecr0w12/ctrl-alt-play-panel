/**
 * Hello World Plugin
 * A simple example plugin demonstrating the plugin system
 */

class HelloWorldPlugin {
  constructor(context) {
    this.context = context;
    this.logger = context.logger;
    this.pluginName = context.pluginName;
  }

  // Lifecycle methods
  async onInstall() {
    this.logger.info(`Plugin ${this.pluginName} installed`);
  }

  async onEnable() {
    this.logger.info(`Plugin ${this.pluginName} enabled`);
  }

  async onDisable() {
    this.logger.info(`Plugin ${this.pluginName} disabled`);
  }

  async onUninstall() {
    this.logger.info(`Plugin ${this.pluginName} uninstalled`);
  }

  // API methods
  async getHello(req, res) {
    res.json({
      success: true,
      message: "Hello from the plugin system!",
      plugin: this.pluginName,
      timestamp: new Date().toISOString()
    });
  }

  async postHello(req, res) {
    const { name } = req.body;
    
    res.json({
      success: true,
      message: `Hello ${name || 'World'} from ${this.pluginName}!`,
      plugin: this.pluginName,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = HelloWorldPlugin;
