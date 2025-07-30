const fs = require('fs');
const path = require('path');

// Function to create a test plugin with proper escaping
function createTestPluginContent(name, pluginConfig) {
  // Create plugin.js with proper escaping
  const pluginJsContent = 
    "const { PluginBase } = require('../../sdk/PluginBase');\n" +
    "\n" +
    "class TestPlugin extends PluginBase {\n" +
    "  constructor(context) {\n" +
    "    super(context);\n" +
    "    this.name = '" + name + "';\n" +
    "    this.version = '" + pluginConfig.version + "';\n" +
    "  }\n" +
    "\n" +
    "  async install() {\n" +
    "    this.log('Installing " + name + "...');\n" +
    "    return { success: true };\n" +
    "  }\n" +
    "\n" +
    "  async enable() {\n" +
    "    this.log('Enabling " + name + "...');\n" +
    "    return { success: true };\n" +
    "  }\n" +
    "\n" +
    "  async disable() {\n" +
    "    this.log('Disabling " + name + "...');\n" +
    "    return { success: true };\n" +
    "  }\n" +
    "\n" +
    "  async uninstall() {\n" +
    "    this.log('Uninstalling " + name + "...');\n" +
    "    return { success: true };\n" +
    "  }\n" +
    "}\n" +
    "\n" +
    "module.exports = TestPlugin;";
  
  return pluginJsContent;
}

// Test the function
const testConfig = {
  version: '1.0.0',
  author: 'Test Author',
  description: 'Test plugin',
  main: 'plugin.js',
  permissions: {
    routes: false,
    database: false,
    filesystem: false,
    network: false
  }
};

const content = createTestPluginContent('test-plugin', testConfig);
console.log(content);
