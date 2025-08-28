# 🎮 Ctrl-Alt-Play Panel Installation Guide

**Version:** 1.6.1  
**Architecture:** Panel+Agent Distributed System  
**Requirements:** Node.js 18+, Docker, Database (PostgreSQL/MySQL/MariaDB/MongoDB/SQLite)

---

## 📋 Table of Contents

1. [System Requirements](#-system-requirements)
2. [Quick Start](#-quick-start)
3. [Manual Installation](#-manual-installation)
4. [Production Deployment](#-production-deployment)
5. [Configuration](#-configuration)
6. [Troubleshooting](#-troubleshooting)
7. [Security Setup](#-security-setup)

---

## 🖥️ System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+) |
| **Node.js** | 18.0+ LTS |
| **Memory** | 2GB RAM |
| **Disk Space** | 10GB available |
| **Docker** | 20.10+ |
| **Docker Compose** | 2.0+ (v2) or 1.29+ (v1) |

### Recommended for Production

| Component | Requirement |
|-----------|-------------|
| **Memory** | 4GB+ RAM |
| **CPU** | 2+ cores |
| **Disk Space** | 50GB+ SSD |
| **Network** | Static IP address |
| **SSL Certificate** | Valid SSL certificate for HTTPS |

### Database Requirements

**Multi-Database Support** - Full production support for 5 database types:

| Database | Version | Support Level | Best For |
|----------|---------|---------------|----------|
| **PostgreSQL** | 12+ | ✅ Full Production | Enterprise features and advanced queries |
| **MySQL** | 8.0+ | ✅ Full Production | High performance and wide compatibility |
| **MariaDB** | 10.3+ | ✅ Full Production | MySQL alternative with enhanced features |
| **SQLite** | 3+ | ✅ Full Production | Development and small deployments |
| **MongoDB** | 4.4+ | ✅ Full Production | Document-based with flexible schema |

**Additional Services:**
- **Redis**: 6+ (optional, for caching and session storage)

All databases are fully supported with automatic connection string generation, dynamic Prisma configuration, and comprehensive testing.

---

## 🚀 Quick Start

**For the fastest setup experience, see the comprehensive [Quick Start Guide in README.md](README.md#-quick-start) which provides a streamlined one-minute setup process.**

The README.md includes:
- **One-minute setup** with automated environment detection
- **Cross-platform compatibility** (Linux, macOS, Windows)
- **Multiple database support** (PostgreSQL, MySQL, MariaDB, MongoDB, SQLite)
- **Docker and native installation options**
- **Troubleshooting for common issues**

For detailed installation options and advanced configuration, continue with the sections below.

---

## 🔧 Manual Installation

### Step 1: Install Prerequisites

#### Ubuntu/Debian
```bash
# Update package index
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose (if not included)
sudo apt install -y docker-compose-plugin
```

#### CentOS/RHEL/Fedora
```bash
# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs npm

# Install Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### Step 2: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel

# Install dependencies
npm install

# Setup frontend (if using frontend)
cd frontend && npm install && cd ..

# Make scripts executable
chmod +x scripts/*.sh start.sh version.sh
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://ctrlaltplay:ctrlaltplay@localhost:5432/ctrlaltplay"
REDIS_URL="redis://localhost:6379"

# Security (CHANGE THESE!)
JWT_SECRET="your-secure-random-jwt-secret-here"
AGENT_SECRET="your-secure-random-agent-secret-here"

# Application
NODE_ENV=production
PORT=3000
AGENT_PORT=8080
PANEL_URL=https://your-domain.com
```

### Step 4: Start Services

```bash
# Start database services (choose your database)
docker-compose --profile postgresql up -d  # or mysql, mariadb, mongodb, sqlite

# Wait for services to be ready
sleep 10

# Initialize database
npm run db:push
npm run db:seed

# Start the application
npm run start
```

---

## 🏭 Production Deployment

### Option 1: Docker Production (Recommended)

1. **Prepare environment:**

```bash
# Copy production environment
cp .env.production.example .env

# Edit with production values
nano .env
```

2. **Deploy with Docker:**

```bash
# Start production services
./start.sh

# Check status
./start.sh status

# View logs
./start.sh logs
```

### Option 2: VPS Deployment

See [VPS Deployment Guide](docs/deployment/VPS_DEPLOYMENT_GUIDE.md) for detailed production setup including:
- Nginx reverse proxy configuration
- SSL certificate setup
- Firewall configuration
- Automated backups

### Option 3: Kubernetes Deployment

See [Kubernetes Deployment](docs/deployment/kubernetes/) for enterprise-scale deployment.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Panel web port | `3000` | No |
| `AGENT_PORT` | Agent WebSocket port | `8080` | No |
| `DATABASE_URL` | Database connection string (supports 5 types) | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `AGENT_SECRET` | Agent authentication secret | - | Yes |
| `PANEL_URL` | Public panel URL | `http://localhost:3000` | No |
| `MAX_FILE_SIZE` | Upload limit | `100MB` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

### Database Configuration

The panel supports multiple database types with full production support. Choose from PostgreSQL, MySQL, MariaDB, MongoDB, or SQLite. Redis 6+ is optional for caching.

**Database Selection:**

```bash
# Set your preferred database type
export DB_TYPE=postgresql  # or mysql, mariadb, mongodb, sqlite

# Start with automatic database selection
./start-dev.sh
```

**Custom Database Setup:**

```bash
# For external PostgreSQL
DATABASE_URL="postgresql://username:password@host:port/database"

# For external MySQL
DATABASE_URL="mysql://username:password@host:port/database"

# For external MariaDB
DATABASE_URL="mysql://username:password@host:port/database"

# For external MongoDB
DATABASE_URL="mongodb://username:password@host:port/database"

# For external Redis  
REDIS_URL="redis://host:port"
```

### Agent Configuration

Agents connect to the panel using WebSocket connections on port 8080 (configurable).

**Agent Discovery:**
- Automatic discovery on known nodes
- Manual registration via API
- Health monitoring and reconnection

---

## 🔒 Security Setup

### 1. Change Default Credentials

```bash
# After first login, change the admin password
# Navigate to: Settings > Users > Admin User > Change Password
```

### 2. Generate Secure Secrets

```bash
# Generate random JWT secret
openssl rand -hex 32

# Generate random agent secret  
openssl rand -hex 32

# Update .env file with these values
```

### 3. Configure SSL/TLS

For production deployments, always use HTTPS:

```bash
# Using Let's Encrypt with nginx
sudo certbot --nginx -d your-domain.com

# Or configure your own certificates
# See docs/deployment/VPS_DEPLOYMENT_GUIDE.md
```

### 4. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP (redirect to HTTPS)
sudo ufw allow 443     # HTTPS
sudo ufw allow 8080    # Agent WebSocket (if external agents)
sudo ufw enable
```

### 5. Regular Security Updates

```bash
# Update the panel
./start.sh update

# Update system packages
sudo apt update && sudo apt upgrade -y
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors

```bash
# Fix script permissions
chmod +x scripts/*.sh start.sh version.sh

# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 uploads logs data
```

#### 2. Database Connection Failed

```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down
docker volume rm ctrl-alt-play-panel_postgres_data
docker-compose up -d postgres
```

#### 3. Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 <PID>

# Or use different port in .env
PORT=3001
```

#### 4. npm Install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. Docker Issues

```bash
# Restart Docker service
sudo systemctl restart docker

# Check Docker status
sudo systemctl status docker

# View Docker logs
journalctl -u docker.service -f
```

### Debug Mode

Enable debug logging:

```bash
# Set debug level in .env
LOG_LEVEL=debug

# Restart application
./start.sh restart

# View detailed logs
./start.sh logs
```

### Database Issues

Reset and reseed database:

```bash
# Stop application
./start.sh stop

# Reset database
npm run db:reset

# Seed fresh data
npm run db:seed

# Restart
./start.sh
```

---

## 📱 Post-Installation

### 1. First Login

1. Navigate to your panel URL
2. Login with default credentials: `admin` / `admin123`
3. **Immediately change the password**
4. Configure your profile settings

### 2. Create Additional Users

1. Go to **Admin Panel > Users**
2. Click **Create User**
3. Assign appropriate roles and permissions

### 3. Configure Nodes

1. Go to **Admin Panel > Nodes**
2. Add your server nodes where agents will run
3. Note the daemon tokens for agent setup

### 4. Install Agents

Follow the [Agent Installation Guide](docs/development/AGENT_INSTALLATION.md) to set up agents on your nodes.

### 5. Create Your First Server

1. Go to **Servers > Create Server**
2. Select a node and configuration
3. Choose server template (Alt)
4. Configure resources and environment

---

## 📚 Additional Resources

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Development Guide](docs/development/)** - For developers and contributors
- **[Deployment Guide](docs/deployment/)** - Advanced deployment scenarios
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Security Guide](SECURITY.md)** - Security best practices

---

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/ctrl-alt-play-panel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ctrl-alt-play-panel/discussions)
- **Documentation**: [Project Documentation](docs/)
- **Discord**: [Community Discord](#) (if available)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Installation complete!** 🎉

Your Ctrl-Alt-Play Panel should now be running and ready for use. Don't forget to:
- Change default passwords
- Configure SSL for production
- Set up regular backups
- Install agents on your server nodes

For additional help, check the troubleshooting section or create an issue on GitHub.
