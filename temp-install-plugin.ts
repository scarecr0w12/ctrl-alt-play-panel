
        import { DatabaseService } from '../src/services/database';
        import { PluginManager } from '../src/services/PluginManager.full';
        
        async function installPlugin() {
          // Create PluginManager with DatabaseService instance
          const prisma = DatabaseService.getInstance();
          const pluginManager = new PluginManager(prisma);
          
          // Install the plugin
          const pluginPath = '/home/scarecrow/ctrl-alt-play-panel/sample-plugins/test-plugin-system';
          const result = await PluginManager.installPlugin(pluginPath);
          console.log('Plugin installation result:', result);
        }
        
        installPlugin().catch(console.error);
      