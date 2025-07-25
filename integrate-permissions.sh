#!/bin/bash

# CTRL+ALT+Play Panel - Permission Integration Script
# This script integrates the new permission system with existing routes

echo "🔐 Integrating Advanced Permission System..."

# Update main index.ts to use new middleware
echo "📝 Updating main index.ts..."

# Backup original files
cp src/index.ts src/index.ts.backup

# Update the main app to initialize permissions on startup
echo "
// Initialize permissions on startup
import { permissionService } from './services/permissionService';

async function initializeApp() {
  try {
    await permissionService.initializePermissions();
    console.log('✅ Permissions initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize permissions:', error);
  }
}

initializeApp();" >> src/index.ts

echo "✅ Permission integration script completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Compile TypeScript: npx tsc"
echo "2. Test permission endpoints"
echo "3. Create admin user with permissions"
echo "4. Update frontend to handle permission-based access"
echo ""
echo "🔧 Available Permissions by Category:"
echo "👥 User Management: users.view, users.create, users.edit, users.delete, users.permissions"
echo "🖥️  Server Management: servers.view, servers.create, servers.edit, servers.delete, servers.start, servers.stop, servers.restart, servers.configure"
echo "📁 File Management: files.view, files.edit, files.upload, files.download, files.delete"
echo "🌐 Node Management: nodes.view, nodes.create, nodes.edit, nodes.delete"
echo "📊 Monitoring: monitoring.view, monitoring.metrics"
echo "🔑 API Management: api.keys.view, api.keys.create, api.keys.delete"
echo "🎮 Workshop: workshop.view, workshop.manage"
echo "📜 Audit Logs: audit.view, audit.export"
echo "⚙️  System Settings: settings.view, settings.edit"
echo "🔒 Security: security.sessions, security.logs, security.config"
