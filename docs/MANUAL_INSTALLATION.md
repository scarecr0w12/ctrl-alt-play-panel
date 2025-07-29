# 📚 Manual Installation Guide

This guide covers manual installation for users who prefer step-by-step control or need custom configurations.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Installation guide](https://docs.docker.com/engine/install/)
- **Git** - For cloning the repository

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel
```

### 2. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env

# Generate secure secrets (recommended)
./scripts/generate-secrets.sh

# OR edit .env manually with your preferred settings
nano .env
```

### 3. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies (if using separate frontend)
cd frontend && npm install && cd ..
```

### 4. Database Setup

```bash
# Start database services
docker-compose up -d postgres redis

# Wait for services to be ready (about 30 seconds)
sleep 30

# Generate Prisma client
npm run db:generate

# Initialize database
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### 5. Start the Application

**Development Mode:**
```bash
# Backend with hot reload
npm run dev

# Frontend (if separate) - in another terminal
cd frontend && npm run dev
```

**Production Mode:**
```bash
# Build the application
npm run build

# Start all services
docker-compose up -d

# OR start just the application
npm start
```

## Access Your Panel

- **Panel:** http://localhost:3000
- **API Health:** http://localhost:3000/health
- **Frontend:** http://localhost:3001 (if enabled)

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **Important:** Change the default credentials immediately after first login!

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Use different ports in .env
PORT=3001
```

### Permission Issues
```bash
# Fix directory permissions
chmod -R 755 logs uploads data
```

### Service Health
```bash
# Check all service status
docker-compose ps

# View application logs
docker-compose logs ctrl-alt-play

# Check health endpoints
curl http://localhost:3000/health
```

## Configuration Options

See the [Configuration Guide](configuration.md) for detailed information about:

- Database settings
- Security configuration
- Email setup
- SSL/HTTPS configuration
- Performance tuning

## Need Help?

- **Check logs:** `docker-compose logs`
- **View issues:** [GitHub Issues](https://github.com/scarecr0w12/ctrl-alt-play-panel/issues)
- **Quick start:** Try `./quick-deploy.sh` for automated setup
