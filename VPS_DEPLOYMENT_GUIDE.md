# 🚀 VPS Deployment Guide - Ctrl-Alt-Play Panel

This guide will help you deploy the Ctrl-Alt-Play Panel to your Proxmox VPS.

## 📋 Prerequisites

### On Your Local Machine:
- SSH access to your VPS
- Git (for version control)
- This project checked out locally

### On Your VPS:
- Ubuntu 20.04+ / Debian 11+ (recommended)
- Root or sudo access
- At least 2GB RAM and 20GB storage
- Ports 80, 443, 3000, 8080 accessible

## 🔧 Quick Deployment

### Step 1: Configure Deployment Script

Edit the `deploy-to-vps.sh` file and set your VPS details:

```bash
# Update these values in deploy-to-vps.sh
VPS_USER="root"           # Your VPS username
VPS_HOST="192.168.1.100"  # Your VPS IP address
VPS_PORT="22"             # SSH port (usually 22)
DOMAIN="panel.yourdomain.com"  # Optional: your domain
```

### Step 2: Initial Deployment

```bash
# Make the script executable (if not already)
chmod +x deploy-to-vps.sh

# Run initial deployment
./deploy-to-vps.sh setup
```

This will:
- Install Docker and Docker Compose on your VPS
- Upload and extract the application
- Create necessary directories
- Set up the environment

### Step 3: Configure Environment

SSH into your VPS and configure the environment:

```bash
ssh your-user@your-vps-ip
cd /opt/ctrl-alt-play/current
cp .env.production .env
nano .env  # Edit with your settings
```

**Important**: Change all default passwords and secrets in the `.env` file!

### Step 4: Start Services

```bash
# On your VPS
cd /opt/ctrl-alt-play/current
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Management Commands

From your local machine:

```bash
# Update deployment
./deploy-to-vps.sh update

# View logs
./deploy-to-vps.sh logs

# Restart services
./deploy-to-vps.sh restart

# Check status
./deploy-to-vps.sh status

# Stop services
./deploy-to-vps.sh stop
```

## 🌐 Domain and SSL Setup

### Option 1: Using Let's Encrypt (Recommended)

1. Point your domain to your VPS IP
2. Install Certbot on your VPS:
```bash
apt install certbot python3-certbot-nginx
```

3. Get SSL certificate:
```bash
certbot --nginx -d your-domain.com
```

### Option 2: Custom SSL Certificates

1. Upload your certificates to `/opt/ctrl-alt-play/current/nginx/ssl/`
2. Update the nginx configuration
3. Restart nginx

## 🔐 Security Checklist

### Required Security Steps:
- [ ] Change all default passwords in `.env`
- [ ] Set strong JWT_SECRET and AGENT_SECRET
- [ ] Configure firewall (UFW recommended)
- [ ] Set up SSL certificates
- [ ] Configure automatic security updates
- [ ] Set up monitoring and backups

### Firewall Configuration:
```bash
# Basic UFW setup
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Agent communication port
ufw enable
```

## 📊 Monitoring and Maintenance

### Service Health Checks:
```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats
```

### Database Backup:
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U ctrlaltplay ctrlaltplay > backup.sql

# Automated backup script (set up as cron job)
#!/bin/bash
BACKUP_DIR="/opt/ctrl-alt-play/backups"
mkdir -p $BACKUP_DIR
docker-compose -f /opt/ctrl-alt-play/current/docker-compose.prod.yml exec -T postgres pg_dump -U ctrlaltplay ctrlaltplay > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql
find $BACKUP_DIR -name "backup-*.sql" -mtime +7 -delete
```

## 🔧 Troubleshooting

### Common Issues:

1. **Services won't start:**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Check disk space
   df -h
   
   # Check memory
   free -h
   ```

2. **Can't connect to panel:**
   - Check firewall settings
   - Verify nginx configuration
   - Check if services are running

3. **Database connection issues:**
   - Verify DATABASE_URL in .env
   - Check PostgreSQL logs
   - Ensure database is running

4. **Agent connection issues:**
   - Verify AGENT_SECRET matches
   - Check port 8080 is accessible
   - Review WebSocket logs

### Log Locations:
- Application logs: `/opt/ctrl-alt-play/current/logs/`
- Nginx logs: `/opt/ctrl-alt-play/current/logs/nginx/`
- Docker logs: `docker-compose logs`

## 📈 Performance Optimization

### For production workloads:
1. Increase worker processes in nginx
2. Tune PostgreSQL settings
3. Set up Redis persistence
4. Configure log rotation
5. Monitor resource usage

### Scaling Options:
- Use a load balancer for multiple instances
- Separate database to dedicated server
- Use Redis Cluster for high availability
- Implement CDN for static assets

## 🆘 Support

If you encounter issues:
1. Check the logs first
2. Review the troubleshooting section
3. Verify all configuration settings
4. Check the GitHub repository for updates

## 📝 Update Process

To update the panel:
1. Pull latest changes locally
2. Run `./deploy-to-vps.sh update`
3. Check logs for any issues
4. Test functionality

Remember to backup your data before major updates!
