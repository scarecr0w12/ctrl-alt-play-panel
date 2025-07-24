#!/bin/bash

# Quick VPS Setup Script for Ctrl-Alt-Play Panel
# Run this on your VPS after uploading the files

set -e

echo "🚀 Setting up Ctrl-Alt-Play Panel on VPS..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p /opt/ctrl-alt-play/current/{logs,uploads,data,nginx/ssl}

# Set up environment
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "📝 Created .env file - PLEASE EDIT IT WITH YOUR SETTINGS!"
fi

# Set permissions
echo "🔐 Setting permissions..."
chown -R 1001:1001 logs uploads data

# Install UFW if not present
if ! command -v ufw &> /dev/null; then
    echo "🔥 Installing UFW firewall..."
    apt install -y ufw
fi

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Configure your firewall:"
echo "   ufw allow ssh"
echo "   ufw allow 80/tcp"
echo "   ufw allow 443/tcp"
echo "   ufw allow 8080/tcp"
echo "   ufw enable"
echo "3. Start the services:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🌐 Your panel will be available at: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
