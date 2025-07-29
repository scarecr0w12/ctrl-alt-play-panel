#!/bin/bash

# Deployment script for dev-panel.thecgn.net
# Ctrl-Alt-Play Panel

set -e  # Exit on any error

echo "🚀 Starting deployment to dev-panel.thecgn.net"

# Check if we're in the right directory
cd /home/scarecrow/ctrl-alt-play-panel || { echo "Error: Can't find project directory"; exit 1; }

# Create necessary directories
mkdir -p ./logs ./uploads ./data ./backups ./ssl ./database

# Generate secure secrets if not already present
if [ ! -f .env.production ]; then
  echo "🔧 Generating production environment configuration..."
  
  # Generate secure secrets
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  AGENT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
  SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
  DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
  REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
  
  # URL-encode DB_PASSWORD for DATABASE_URL
  DB_PASSWORD_ENCODED=$(echo "$DB_PASSWORD" | sed 's/@/%40/g; s/:/%3A/g; s/\//%2F/g; s/\?/%3F/g; s/=/%3D/g; s/&/%26/g; s/#/%23/g; s/\[/%5B/g; s/\]/%5D/g')
  
  # Create .env.production with generated secrets
  cat > .env.production << EOF
# Ctrl-Alt-Play Panel - Production Configuration for dev-panel.thecgn.net
NODE_ENV=production
DEPLOYMENT_ENV=production
HOST=0.0.0.0
PORT=3000
FRONTEND_PORT=3001
AGENT_PORT=8080
AUTO_PORT_DETECTION=false
DATABASE_URL=postgresql://ctrlaltplay:${DB_PASSWORD_ENCODED}@postgres:5432/ctrlaltplay
DB_TYPE=postgresql
DB_NAME=ctrlaltplay
DB_USER=ctrlaltplay
DB_PASSWORD=${DB_PASSWORD}
DB_PORT=5432
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
REDIS_URL=redis://redis:6379
REDIS_MAX_MEMORY=256mb
REDIS_POLICY=allkeys-lru
JWT_SECRET=${JWT_SECRET}
AGENT_SECRET=${AGENT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://dev-panel.thecgn.net
DOMAIN=dev-panel.thecgn.net
BASE_URL=https://dev-panel.thecgn.net
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/dev-panel.thecgn.net.crt
SSL_KEY_PATH=/etc/ssl/private/dev-panel.thecgn.net.key
LOG_LEVEL=info
LOG_MAX_SIZE=100m
LOG_MAX_FILES=10
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
NODE_OPTIONS=--max-old-space-size=2048
REQUEST_TIMEOUT=30000
BODY_LIMIT=50mb
UPLOAD_LIMIT=500mb
MAX_CONNECTIONS=1000
KEEP_ALIVE_TIMEOUT=65000
PLUGIN_SYSTEM_ENABLED=true
WORKSHOP_INTEGRATION_ENABLED=true
ANALYTICS_ENABLED=true
BACKUP_SERVICE_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_DESTINATION=/backups
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE="System maintenance in progress. Please try again later."
EOF
  
  echo "✅ Environment configuration generated successfully"
fi

# Install development dependencies for TypeScript compilation
echo "🔧 Installing development dependencies..."
npm ci

# Load environment variables
echo "🔧 Loading environment variables..."
# Use export to load environment variables safely
export $(grep -v '^#' .env.production | xargs) 2>/dev/null || true

echo "🔍 Debug: DB_PASSWORD=$DB_PASSWORD"
echo "🔍 Debug: DB_USER=$DB_USER"
echo "🔍 Debug: DB_NAME=$DB_NAME"

# Build the application
echo "🔨 Building the application..."
npm run build

# Compile seed script to JavaScript
echo "🔨 Compiling seed script to JavaScript..."
npx tsc --outDir dist/prisma --target es2020 --module commonjs prisma/seed.ts

echo "🐳 Starting Docker containers..."
# Start Docker containers with production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 30

echo "📋 Setting up database..."
# Run database migrations and seed initial data
docker compose exec ctrl-alt-play npm run db:push
docker compose exec ctrl-alt-play npm run db:seed

echo "✅ Deployment to dev-panel.thecgn.net completed successfully!"
echo "   Application should be accessible at: https://dev-panel.thecgn.net"
echo "   Check logs with: docker-compose logs -f"
