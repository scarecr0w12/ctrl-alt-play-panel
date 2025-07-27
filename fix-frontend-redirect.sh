#!/bin/bash

# Fix Frontend Redirect Issue
# This script temporarily fixes the frontend redirect problem

echo "🔧 Fixing frontend redirect issue..."

# Update environment to serve frontend directly
echo "Setting FRONTEND_URL to localhost:3000..."
sed -i 's/FRONTEND_URL=http:\/\/localhost$/FRONTEND_URL=http:\/\/localhost:3000/' .env

# Restart the application
echo "Restarting application..."
docker compose -f docker-compose.prod.yml restart app

echo "✅ Fix applied!"
echo ""
echo "🌐 You can now access the application at:"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost:3000/api/"
echo "   - Through nginx: http://localhost (may still redirect)"
echo ""
echo "📝 Note: The application is working, but the frontend redirect is configured"
echo "   for a development setup. For production, the frontend should be served"
echo "   directly by the main application server."
