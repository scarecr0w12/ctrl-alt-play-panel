const { SYSTEM_PERMISSIONS } = require('./dist/services/permissionService');

async function testPermissions() {
  try {
    console.log('🔍 Testing permission system...\n');
    
    console.log('📋 Available System Permissions:');
    console.log(`Total permissions: ${Object.keys(SYSTEM_PERMISSIONS).length}`);
    
    // Group permissions by category
    const categories = {};
    Object.entries(SYSTEM_PERMISSIONS).forEach(([perm, details]) => {
      if (!categories[details.category]) {
        categories[details.category] = [];
      }
      categories[details.category].push(perm);
    });
    
    console.log('\n🏷️  Permissions by Category:');
    Object.entries(categories).forEach(([category, perms]) => {
      console.log(`  ${category}: ${perms.length} permissions`);
      perms.slice(0, 3).forEach(perm => console.log(`    - ${perm}`));
      if (perms.length > 3) console.log(`    ... and ${perms.length - 3} more`);
    });
    
    console.log('\n✅ Permission system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  }
}

testPermissions();
