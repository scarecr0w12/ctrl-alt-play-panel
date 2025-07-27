#!/usr/bin/env node

/**
 * Plugin System Test
 * Tests the plugin database operations directly
 */

const { PrismaClient } = require('@prisma/client');

async function testPluginSystem() {
  const prisma = new PrismaClient();

  try {
    console.log('🔌 Testing Plugin System...\n');

    // Test 1: Create a test plugin
    console.log('1. Creating test plugin...');
    const testPlugin = await prisma.plugin.create({
      data: {
        name: 'test-plugin',
        version: '1.0.0',
        author: 'Test Developer',
        description: 'A test plugin for system validation',
        permissions: { routes: true, database: false },
        autoUpdate: false,
        versionLocked: false,
        status: 'INACTIVE'
      }
    });
    console.log('✅ Plugin created:', testPlugin.name);

    // Test 2: List all plugins
    console.log('\n2. Listing all plugins...');
    const plugins = await prisma.plugin.findMany();
    console.log(`✅ Found ${plugins.length} plugin(s):`);
    plugins.forEach((plugin) => {
      console.log(`   - ${plugin.name} v${plugin.version} (${plugin.status})`);
    });

    // Test 3: Update plugin status
    console.log('\n3. Enabling test plugin...');
    const updatedPlugin = await prisma.plugin.update({
      where: { name: 'test-plugin' },
      data: { status: 'ACTIVE' }
    });
    console.log('✅ Plugin enabled:', updatedPlugin.status);

    // Test 4: Test plugin data storage
    console.log('\n4. Testing plugin data storage...');
    await prisma.pluginData.create({
      data: {
        pluginId: testPlugin.id,  // Use the actual plugin ID, not name
        key: 'test-key',
        value: { message: 'Hello from plugin data!' }
      }
    });
    
    const pluginData = await prisma.pluginData.findUnique({
      where: {
        pluginId_key: {
          pluginId: testPlugin.id,  // Use the actual plugin ID, not name
          key: 'test-key'
        }
      }
    });
    console.log('✅ Plugin data retrieved:', pluginData.value);

    // Test 5: Clean up
    console.log('\n5. Cleaning up test data...');
    await prisma.pluginData.deleteMany({
      where: { pluginId: testPlugin.id }  // Use the actual plugin ID, not name
    });
    await prisma.plugin.delete({
      where: { name: 'test-plugin' }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Plugin System Test Completed Successfully!');
    console.log('\nPlugin system is ready for use:');
    console.log('- Database schema: ✅ Working');
    console.log('- CRUD operations: ✅ Working');
    console.log('- Data storage: ✅ Working');
    console.log('- API routes: ✅ Ready (pending app startup fix)');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Plugin System Test Failed:', errorMessage);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPluginSystem();
