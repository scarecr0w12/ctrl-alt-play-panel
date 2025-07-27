import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CodeBracketIcon,
  DocumentIcon,
  WrenchScrewdriverIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const PluginDevelopmentGuidePage = () => {
  const { user } = useAuth();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const codeBlocks = {
    createPlugin: `npm run plugin:create my-awesome-plugin`,
    basicPlugin: `// plugin.js
const { PluginBase } = require('../sdk/PluginBase');

class MyAwesomePlugin extends PluginBase {
  constructor(context) {
    super(context);
    this.name = 'my-awesome-plugin';
    this.version = '1.0.0';
  }

  async install() {
    this.log('Installing My Awesome Plugin...');
    // Your installation logic here
    return { success: true };
  }

  async enable() {
    this.log('Enabling My Awesome Plugin...');
    // Register routes, start services, etc.
    this.registerRoute('/api/my-plugin/status', this.getStatus.bind(this));
    return { success: true };
  }

  async disable() {
    this.log('Disabling My Awesome Plugin...');
    // Clean up resources
    return { success: true };
  }

  async uninstall() {
    this.log('Uninstalling My Awesome Plugin...');
    // Remove data, clean up, etc.
    return { success: true };
  }

  async getStatus(req, res) {
    res.json({ status: 'active', message: 'Plugin is running!' });
  }
}

module.exports = MyAwesomePlugin;`,
    
    pluginYaml: `# plugin.yaml
name: my-awesome-plugin
version: 1.0.0
author: Your Name
description: A brief description of what your plugin does
permissions:
  routes: true
  database: false
  filesystem: false
  network: false
main: plugin.js
dependencies:
  - axios@^1.0.0
  - lodash@^4.17.21
compatibility:
  - "1.0.0+"
tags:
  - utility
  - automation
  - monitoring`,

    installPlugin: `npm run plugin:install ./plugins/my-awesome-plugin`,
    
    enablePlugin: `npm run plugin:enable my-awesome-plugin`,
    
    validatePlugin: `npm run plugin:validate ./plugins/my-awesome-plugin`,

    advancedPlugin: `// Advanced plugin example with database and API integration
class AdvancedPlugin extends PluginBase {
  async install() {
    // Create database tables if needed
    if (this.hasPermission('database')) {
      await this.createTable('my_plugin_data', {
        id: 'INTEGER PRIMARY KEY',
        user_id: 'INTEGER',
        data: 'TEXT',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
      });
    }
    
    return { success: true };
  }

  async enable() {
    // Register API routes
    this.registerRoute('/api/my-plugin/data', this.handleData.bind(this));
    this.registerRoute('/api/my-plugin/users/:id', this.handleUser.bind(this));
    
    // Register event listeners
    this.on('server.start', this.onServerStart.bind(this));
    this.on('user.login', this.onUserLogin.bind(this));
    
    return { success: true };
  }

  async handleData(req, res) {
    try {
      if (req.method === 'GET') {
        const data = await this.query('SELECT * FROM my_plugin_data');
        res.json({ success: true, data });
      } else if (req.method === 'POST') {
        const { user_id, data } = req.body;
        await this.query(
          'INSERT INTO my_plugin_data (user_id, data) VALUES (?, ?)',
          [user_id, JSON.stringify(data)]
        );
        res.json({ success: true, message: 'Data saved' });
      }
    } catch (error) {
      this.error('Error handling data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async onServerStart(server) {
    this.log(\`Server \${server.name} started\`);
    // Your logic here
  }

  async onUserLogin(user) {
    this.log(\`User \${user.username} logged in\`);
    // Track user activity, send notifications, etc.
  }
}`,

    testingPlugin: `// test/plugin.test.js
const PluginTester = require('../sdk/PluginTester');
const MyAwesomePlugin = require('../plugin');

describe('MyAwesomePlugin', () => {
  let plugin;
  let tester;

  beforeEach(async () => {
    tester = new PluginTester();
    plugin = new MyAwesomePlugin(tester.createContext());
    await plugin.install();
  });

  afterEach(async () => {
    await plugin.uninstall();
  });

  test('should install successfully', async () => {
    const result = await plugin.install();
    expect(result.success).toBe(true);
  });

  test('should enable and register routes', async () => {
    await plugin.enable();
    expect(tester.hasRoute('/api/my-plugin/status')).toBe(true);
  });

  test('should return status', async () => {
    await plugin.enable();
    const response = await tester.request('/api/my-plugin/status');
    expect(response.status).toBe('active');
  });
});`
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You need to be logged in to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Plugin Development Guide - Ctrl+Alt+Play</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center">
              <CodeBracketIcon className="mx-auto h-12 w-12 text-indigo-600" />
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Plugin Development Guide</h1>
              <p className="mt-2 text-lg text-gray-600">
                Learn how to create powerful plugins for the Ctrl+Alt+Play panel
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center mb-4">
              <RocketLaunchIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Quick Start</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">1. Create a New Plugin</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                    <code>{codeBlocks.createPlugin}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.createPlugin)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">2. Install Your Plugin</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                    <code>{codeBlocks.installPlugin}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.installPlugin)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">3. Enable Your Plugin</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                    <code>{codeBlocks.enablePlugin}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.enablePlugin)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plugin Structure */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center mb-4">
              <DocumentIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Plugin Structure</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Plugin Class</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto max-h-96">
                    <code>{codeBlocks.basicPlugin}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.basicPlugin)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Plugin Configuration (plugin.yaml)</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-yellow-400 p-4 rounded text-sm overflow-x-auto max-h-96">
                    <code>{codeBlocks.pluginYaml}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.pluginYaml)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <div className="flex items-center mb-4">
              <WrenchScrewdriverIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Advanced Features</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Database Integration & Event Handling</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto max-h-96">
                    <code>{codeBlocks.advancedPlugin}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.advancedPlugin)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Plugin Testing</h3>
                <div className="relative">
                  <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto max-h-64">
                    <code>{codeBlocks.testingPlugin}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeBlocks.testingPlugin)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Permissions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Permissions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  permission: 'routes',
                  description: 'Register API routes and endpoints',
                  example: 'this.registerRoute(\'/api/my-plugin/data\', handler)'
                },
                {
                  permission: 'database',
                  description: 'Execute database queries and create tables',
                  example: 'this.query(\'SELECT * FROM users\')'
                },
                {
                  permission: 'filesystem',
                  description: 'Read and write files on the server',
                  example: 'this.readFile(\'/path/to/file\')'
                },
                {
                  permission: 'network',
                  description: 'Make external HTTP requests',
                  example: 'this.httpRequest(\'https://api.example.com\')'
                }
              ].map((perm) => (
                <div key={perm.permission} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-medium text-gray-900">{perm.permission}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{perm.description}</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">{perm.example}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CLI Commands */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">CLI Commands</h2>
            
            <div className="space-y-4">
              {[
                {
                  command: 'npm run plugin:create <name>',
                  description: 'Create a new plugin with boilerplate code'
                },
                {
                  command: 'npm run plugin:install <path>',
                  description: 'Install a plugin from a directory'
                },
                {
                  command: 'npm run plugin:enable <name>',
                  description: 'Enable an installed plugin'
                },
                {
                  command: 'npm run plugin:disable <name>',
                  description: 'Disable a running plugin'
                },
                {
                  command: 'npm run plugin:uninstall <name>',
                  description: 'Uninstall a plugin completely'
                },
                {
                  command: 'npm run plugin:validate <path>',
                  description: 'Validate plugin structure and configuration'
                },
                {
                  command: 'npm run plugin:list',
                  description: 'List all installed plugins'
                }
              ].map((cmd) => (
                <div key={cmd.command} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono text-sm bg-gray-800 text-green-400 px-2 py-1 rounded flex-shrink-0">
                    {cmd.command}
                  </code>
                  <p className="text-sm text-gray-600">{cmd.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Best Practices</h2>
            
            <div className="space-y-4">
              {[
                'Always validate user inputs in your API endpoints',
                'Use the plugin logging system instead of console.log',
                'Handle errors gracefully and return meaningful error messages',
                'Clean up resources in the disable() and uninstall() methods',
                'Use meaningful plugin names and follow semantic versioning',
                'Test your plugin thoroughly before publishing',
                'Document your plugin\'s API and configuration options',
                'Use the minimum required permissions for your plugin',
                'Follow the existing code style and conventions',
                'Include proper error handling and validation'
              ].map((practice, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{practice}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PluginDevelopmentGuidePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  };
};
