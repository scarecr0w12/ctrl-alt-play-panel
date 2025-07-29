# Deployment Guide

This guide enables deployment of the Ctrl-Alt-Play Panel on any Linux system without infrastructure dependencies or port conflicts.

## System Requirements

- **Linux**: Any distribution (Ubuntu, CentOS, RHEL, Debian, Alpine, etc.)
- **Node.js**: 18.0.0 or higher
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 5GB free space minimum
- **Network**: Internet access for initial setup

## One-Command Deployment

```bash
# Clone and deploy in one command
curl -fsSL https://raw.githubusercontent.com/scarecr0w12/ctrl-alt-play/main/scripts/quick-deploy.sh | bash
```

## Manual Deployment Steps

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
```

### 3. Database Setup

The system supports multiple database backends:

- PostgreSQL (recommended for production)
- MySQL/MariaDB
- MongoDB
- SQLite (development only)

Configure your database connection in the `.env.production` file:

```
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ctrlaltplay?schema=public
DATABASE_TYPE=postgresql
```

### 4. Service Configuration

Configure additional services in your `.env.production` file:

```
# Steam Workshop Integration
STEAM_API_KEY=your-steam-api-key
STEAM_API_ENABLED=true

# Redis Caching
REDIS_URL=redis://localhost:6379
```

### 5. Installation

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start the application
npm start
```

## Docker Deployment

For containerized deployment, use the provided Docker Compose configuration:

```bash
docker-compose up -d
```

## Backup and Recovery

The system includes built-in backup capabilities:

```bash
# Create a backup
./backup.sh

# Restore from backup
./restore.sh /path/to/backup
```

## Monitoring and Maintenance

Regular maintenance tasks include:

1. Checking system logs
2. Monitoring resource usage
3. Updating dependencies
4. Rotating logs
5. Verifying backups