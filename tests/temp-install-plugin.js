
        const { DatabaseService } = require('../src/services/database');
        const { PluginManager } = require('../src/services/PluginManager.full');
        const path = require('path');
        
        async function installPlugin() {
          // Initialize DatabaseService
          await DatabaseService.initialize();
          
          // Create PluginManager with DatabaseService instance
          const prisma = DatabaseService.getInstance();
          const pluginManager = new PluginManager(prisma);
          
          // Install the plugin
          const pluginPath = '/home/scarecrow/ctrl-alt-play-panel/sample-plugins/test-plugin-system';
          const result = await PluginManager.installPlugin(pluginPath);
          console.log('Plugin installation result:', result);
        }
        
        installPlugin().catch(console.error);
      