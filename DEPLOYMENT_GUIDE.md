# Ctrl-Alt-Play Panel - Portable Deployment Guide

## 🚀 Quick Start

This guide enables deployment of the Ctrl-Alt-Play Panel on **any Linux system** without infrastructure dependencies or port conflicts.

### System Requirements

- **Linux**: Any distribution (Ubuntu, CentOS, RHEL, Debian, Alpine, etc.)
- **Node.js**: 18.0.0 or higher
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 5GB free space minimum
- **Network**: Internet access for initial setup

### One-Command Deployment

```bash
# Clone and deploy in one command
curl -fsSL https://raw.githubusercontent.com/scarecr0w12/ctrl-alt-play/main/scripts/quick-deploy.sh | bash
```

## 📋 Manual Deployment Steps

### 1. Environment Setup

```bash
# Create deployment directory
mkdir -p ~/ctrl-alt-play-deployment
cd ~/ctrl-alt-play-deployment

# Clone repository
git clone https://github.com/scarecr0w12/ctrl-alt-play.git .

# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu/Debian
# OR
sudo yum install -y nodejs npm   # CentOS/RHEL
```

### 2. Configuration

```bash
# Copy environment template
cp .env.production.template .env.production

# Generate security keys
export JWT_SECRET=$(openssl rand -base64 64)
export AGENT_SECRET=$(openssl rand -base64 32)
export SESSION_SECRET=$(openssl rand -base64 32)

# Update configuration file
sed -i "s/your-jwt-secret-here/$JWT_SECRET/" .env.production
sed -i "s/your-agent-secret-here/$AGENT_SECRET/" .env.production
sed -i "s/your-session-secret-here/$SESSION_SECRET/" .env.production
```

### 3. Automatic Port Detection

The system automatically detects available ports to avoid conflicts:

```bash
# Set automatic port detection (default: enabled)
echo "AUTO_PORT_DETECTION=true" >> .env.production
echo "PORT_RANGE_START=3000" >> .env.production
echo "PORT_RANGE_END=9999" >> .env.production

# Or specify exact ports if preferred
# echo "PORT=3000" >> .env.production
# echo "FRONTEND_PORT=3001" >> .env.production
# echo "AGENT_PORT=8080" >> .env.production
```

### 4. Database Setup

#### Option A: PostgreSQL (Recommended)
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb ctrl_alt_play
sudo -u postgres createuser --interactive ctrl_alt_play_user

# Update database URL in .env.production
echo "DATABASE_URL=postgresql://ctrl_alt_play_user:password@localhost:5432/ctrl_alt_play" >> .env.production
```

#### Option B: SQLite (Development/Testing)
```bash
# Use SQLite for simple deployments
echo "DATABASE_URL=file:./data/ctrl_alt_play.db" >> .env.production
mkdir -p data
```

### 5. Build and Start

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Start application
npm start
```

## 🐳 Docker Deployment (Recommended)

### Quick Docker Deploy

```bash
# Using docker-compose (easiest)
curl -o docker-compose.yml https://raw.githubusercontent.com/scarecr0w12/ctrl-alt-play/main/docker-compose.yml
curl -o .env.production.template https://raw.githubusercontent.com/scarecr0w12/ctrl-alt-play/main/.env.production.template

# Configure environment
cp .env.production.template .env.production
# Edit .env.production with your settings

# Deploy with automatic port detection
docker-compose up -d
```

### Manual Docker Build

```bash
# Build image
docker build -t ctrl-alt-play:latest .

# Run with flexible ports
docker run -d \
  --name ctrl-alt-play \
  --env-file .env.production \
  -p 3000:3000 \
  -p 3001:3001 \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  ctrl-alt-play:latest
```

## ⚙️ Configuration Options

### Essential Environment Variables

```bash
# Security (REQUIRED)
JWT_SECRET=your-jwt-secret-here                    # Generate with: openssl rand -base64 64
AGENT_SECRET=your-agent-secret-here                # Generate with: openssl rand -base64 32
SESSION_SECRET=your-session-secret-here            # Generate with: openssl rand -base64 32

# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@localhost:5432/db  # PostgreSQL
# OR
DATABASE_URL=file:./data/ctrl_alt_play.db              # SQLite

# Port Configuration
AUTO_PORT_DETECTION=true                           # Enable automatic port detection
PORT=0                                             # 0 = auto-detect, or specify port
FRONTEND_PORT=0                                    # 0 = auto-detect, or specify port
AGENT_PORT=0                                       # 0 = auto-detect, or specify port
PORT_RANGE_START=3000                             # Start of port scan range
PORT_RANGE_END=9999                               # End of port scan range
```

### Optional Integrations

```bash
# Steam Workshop Integration
STEAM_API_KEY=your-steam-api-key                  # Optional: Steam Workshop features
STEAM_API_ENABLED=true                            # Enable Steam integration

# Redis Caching
REDIS_URL=redis://localhost:6379                  # Optional: Performance boost
REDIS_ENABLED=true                                # Enable Redis caching

# Marketplace Integration
MARKETPLACE_ENABLED=true                          # Enable marketplace features
MARKETPLACE_API_URL=https://api.example.com       # Marketplace API endpoint
```

### Performance Tuning

```bash
# Application Performance
NODE_ENV=production                               # Production optimizations
WORKERS=auto                                      # Worker processes (auto = CPU cores)
MAX_MEMORY=2048                                   # Max memory per worker (MB)

# Logging
LOG_LEVEL=info                                    # debug, info, warn, error
LOG_FILE=true                                     # Enable file logging
LOG_RETENTION_DAYS=30                             # Log file retention

# Rate Limiting
RATE_LIMIT_WINDOW=15                              # Rate limit window (minutes)
RATE_LIMIT_MAX=100                                # Max requests per window
```

## 🔍 Health Checks & Monitoring

### Built-in Health Check

```bash
# HTTP health check
curl http://localhost:3000/health

# Detailed health check script
node dist/health-check.js

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-27T21:40:00.000Z",
  "version": "1.5.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "agent": "running"
  }
}
```

### Monitoring Setup

```bash
# SystemD service (Ubuntu/Debian/CentOS)
sudo tee /etc/systemd/system/ctrl-alt-play.service > /dev/null <<EOF
[Unit]
Description=Ctrl-Alt-Play Panel
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ctrl-alt-play
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable ctrl-alt-play
sudo systemctl start ctrl-alt-play
sudo systemctl status ctrl-alt-play
```

## 🛠️ Troubleshooting

### Port Conflicts

```bash
# Check if ports are occupied
netstat -tulpn | grep :3000
lsof -i :3000

# Force port detection
node -e "
const pm = require('./dist/utils/portManager');
pm.PortManager.findAvailablePort(3000).then(port => 
  console.log('Available port:', port)
);
"
```

### Database Issues

```bash
# Test database connection
npx prisma db pull

# Reset database (CAUTION: destroys data)
npx prisma migrate reset --force

# Check database status
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('DB connected')).catch(console.error);
"
```

### Performance Issues

```bash
# Check memory usage
free -h
ps aux | grep node

# Check disk space
df -h

# Monitor logs
tail -f logs/app.log

# Test with load
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3000/health
```

### Network Issues

```bash
# Test internal services
curl http://localhost:3000/api/status
curl http://localhost:3001/  # Frontend
curl http://localhost:8080/  # Agent

# Check firewall
sudo ufw status
sudo iptables -L

# Test from external
telnet your-server-ip 3000
```

## 🔧 Advanced Configuration

### Load Balancer Setup (Nginx)

```nginx
# /etc/nginx/sites-available/ctrl-alt-play
upstream ctrl_alt_play {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001 backup;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://ctrl_alt_play;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Multi-Instance Deployment

```bash
# Run multiple instances with different configs
cp .env.production .env.instance1
cp .env.production .env.instance2

# Instance 1
PORT=3000 AGENT_PORT=8080 npm start &

# Instance 2  
PORT=3002 AGENT_PORT=8082 npm start &
```

## 📦 Migration & Backup

### Data Migration

```bash
# Export existing data
pg_dump ctrl_alt_play > backup.sql

# Import to new instance
psql -h new-server -d ctrl_alt_play < backup.sql

# Migrate configuration
scp .env.production user@new-server:/path/to/ctrl-alt-play/
```

### Automated Backups

```bash
# Database backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/ctrl-alt-play"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump ctrl_alt_play > $BACKUP_DIR/db_$DATE.sql
tar -czf $BACKUP_DIR/files_$DATE.tar.gz data/ logs/

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🎯 Testing Deployment

### Pre-deployment Testing

```bash
# Run comprehensive tests
npm test

# Test port management
node test-port-management.js

# Test Docker build
docker build -t ctrl-alt-play:test .
docker run --rm ctrl-alt-play:test npm test
```

### Post-deployment Validation

```bash
# System health check
curl -f http://localhost:3000/health || echo "Health check failed"

# API endpoints test
curl -f http://localhost:3000/api/status || echo "API test failed"

# Database connectivity
npx prisma db pull || echo "Database connection failed"

# Agent communication
curl -f http://localhost:8080/agent/status || echo "Agent test failed"
```

## 📞 Support

### Log Analysis

```bash
# View application logs
tail -f logs/app.log

# View error logs
grep ERROR logs/app.log

# View access logs
tail -f logs/access.log
```

### Getting Help

- **GitHub Issues**: https://github.com/scarecr0w12/ctrl-alt-play/issues
- **Documentation**: https://github.com/scarecr0w12/ctrl-alt-play/wiki
- **Community**: Discord server link in repository

### Common Solutions

| Issue | Solution |
|-------|----------|
| Port in use | Enable `AUTO_PORT_DETECTION=true` |
| Database connection failed | Check `DATABASE_URL` and database service |
| High memory usage | Reduce `WORKERS` or increase server memory |
| Slow response | Enable Redis caching with `REDIS_ENABLED=true` |
| Agent not responding | Check `AGENT_PORT` and firewall settings |

---

**✅ This deployment guide ensures the Ctrl-Alt-Play Panel can be deployed on any Linux system with automatic conflict resolution and zero infrastructure dependencies.**