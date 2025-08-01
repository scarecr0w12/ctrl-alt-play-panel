# 🚀 Quick Start Guide - Ctrl-Alt-Play Panel

**Version:** 1.6.1  
**Time to complete:** 10-15 minutes

---

## 🎯 What You'll Get

After following this guide, you'll have:

- ✅ A fully functional game server management panel
- ✅ Web interface running on http://localhost:3000
- ✅ Database and Redis services
- ✅ Admin account ready to use
- ✅ Sample game servers for testing

---

## 📋 Prerequisites Check

Before starting, ensure you have:

- [ ] **Linux/macOS/Windows** with terminal access
- [ ] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [ ] **Docker** installed ([Install Docker](https://docs.docker.com/get-docker/))
- [ ] **Git** installed
- [ ] **10GB+ free disk space**
- [ ] **2GB+ available RAM**

Quick verification:

```bash
node --version    # Should show v18+ or higher
docker --version  # Should show Docker version
git --version     # Should show Git version
```

---

## ⚡ Method 1: Automated Setup (Recommended)

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel

# Run the automated setup
./scripts/setup.sh
```

### Step 2: Configure Environment

```bash
# Edit the environment file
nano .env

# At minimum, change these security values:
# JWT_SECRET=your-random-secret-here
# AGENT_SECRET=your-random-agent-secret-here
```

**Generate secure secrets:**

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate agent secret  
openssl rand -hex 32
```

### Step 3: Start the Panel

```bash
# Start all services
./start.sh

# Check status
./start.sh status
```

**✅ Done!** Skip to [First Login](#-first-login) section.

---

## 🐳 Method 2: Docker Quick Start

### Step 1: Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel

# Setup environment
cp .env.example .env
nano .env  # Edit JWT_SECRET and AGENT_SECRET
```

### Step 2: Start Services

```bash
# Start all services
docker-compose up -d

# Initialize database (wait 30 seconds first)
sleep 30
docker-compose exec ctrl-alt-play npm run db:push
docker-compose exec ctrl-alt-play npm run db:seed
```

### Step 3: Verify Installation

```bash
# Check all services are running
docker-compose ps

# Should show:
# - ctrl-alt-play (healthy)  
# - ctrl-alt-play-postgres (healthy)
# - ctrl-alt-play-redis (healthy)
```

---

## 🔧 Method 3: Manual Installation

### Step 1: Install Dependencies

```bash
git clone https://github.com/yourusername/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel

# Install Node.js dependencies
npm install

# Install frontend dependencies (optional)
cd frontend && npm install && cd ..
```

### Step 2: Start Database Services

```bash
# Start database services (choose your database)
docker-compose --profile postgresql up -d  # or mysql, mariadb, mongodb, sqlite

# Wait for services to start
sleep 15
```

### Step 3: Configure and Initialize

```bash
# Setup environment
cp .env.example .env
nano .env  # Configure your settings

# Initialize database
npm run db:generate
npm run db:push
npm run db:seed
```

### Step 4: Start Application

```bash
# Development mode
npm run dev

# Or production mode
npm run build
npm start
```

---

## 🎉 First Login

1. **Open your browser** and navigate to: http://localhost:3000

2. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin123`

3. **Important: Change the password immediately!**
   - Go to **Profile Settings**
   - Update your password
   - Configure your profile details

---

## ✅ Verification Steps

After installation, verify everything is working:

### 1. Check Panel Access

- [ ] Panel loads at http://localhost:3000
- [ ] Can login with admin credentials
- [ ] Dashboard shows system information

### 2. Check Services

```bash
# Check Docker services
docker-compose ps

# Check logs for errors
docker-compose logs ctrl-alt-play

# Check database connection (adjust for your database type)
docker-compose exec postgresql psql -U ctrlaltplay -d ctrlaltplay -c "\dt"  # for PostgreSQL
# docker-compose exec mysql mysql -u ctrlaltplay -p ctrlaltplay -e "SHOW TABLES;"  # for MySQL
```

### 3. Test Basic Functions

- [ ] Can access **Servers** page
- [ ] Can access **Admin Panel**
- [ ] Can view **System Stats**
- [ ] Can create a test user

---

## 🚀 Next Steps

### 1. Secure Your Installation

```bash
# Generate new secure secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for AGENT_SECRET

# Update .env file with new secrets
nano .env

# Restart services
./start.sh restart
```

### 2. Create Additional Users

1. Go to **Admin Panel > Users**
2. Click **Create New User**
3. Assign appropriate roles

### 3. Add Server Nodes

1. Go to **Admin Panel > Nodes**
2. Click **Add Node**
3. Configure your server nodes

### 4. Install Agents (Optional)

Follow the [Agent Installation Guide](docs/development/AGENT_INSTALLATION.md) to set up agents on your nodes for actual server management.

---

## 🔧 Common Issues & Quick Fixes

### Issue: Port 3000 Already in Use

```bash
# Find what's using the port
sudo netstat -tulpn | grep :3000

# Kill the process or change port in .env
PORT=3001
```

### Issue: Database Connection Failed

```bash
# Restart database services
docker-compose restart postgresql redis  # adjust service name for your database
sleep 10

# Check database logs
docker-compose logs postgresql  # adjust service name for your database
```

### Issue: Permission Denied

```bash
# Fix script permissions
chmod +x scripts/*.sh start.sh version.sh

# Fix file ownership
sudo chown -R $USER:$USER .
```

### Issue: Docker Compose Not Found

```bash
# Try Docker Compose v2 syntax
docker compose up -d

# Or install docker-compose
sudo apt install docker-compose-plugin
```

---

## 📱 Quick Commands Reference

```bash
# Start all services
./start.sh

# Stop all services  
./start.sh stop

# View logs
./start.sh logs

# Check status
./start.sh status

# Update panel
./start.sh update

# Database operations
npm run db:push     # Apply schema changes
npm run db:seed     # Add sample data
npm run db:reset    # Reset database

# Development
npm run dev         # Start dev server
npm run test        # Run tests
npm run lint        # Check code style
```

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the logs:** `./start.sh logs`
2. **Verify prerequisites:** Run version commands above
3. **Check our documentation:** [Full Installation Guide](INSTALLATION.md)
4. **Create an issue:** [GitHub Issues](https://github.com/yourusername/ctrl-alt-play-panel/issues)

---

## 🎮 You're Ready!

Your Ctrl-Alt-Play Panel is now installed and ready to use!

- **Panel URL:** http://localhost:3000
- **Username:** admin
- **Password:** admin123 (change this!)

Enjoy managing your game servers! 🚀
