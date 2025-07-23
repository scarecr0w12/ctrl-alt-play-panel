#!/bin/bash

# Ctrl-Alt-Play Panel - VPS Deployment Script
# This script helps deploy the panel to your Proxmox VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (Update these with your VPS details)
VPS_USER="root"  # or your user
VPS_HOST=""      # Your VPS IP address
VPS_PORT="22"    # SSH port
DEPLOY_PATH="/opt/ctrl-alt-play"
DOMAIN=""        # Optional: your domain name

# Functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if configuration is set
check_config() {
    if [ -z "$VPS_HOST" ]; then
        print_error "Please set VPS_HOST in this script before running"
        exit 1
    fi
}

# Test SSH connection
test_ssh() {
    print_step "Testing SSH connection to VPS..."
    if ssh -p $VPS_PORT -o BatchMode=yes -o ConnectTimeout=10 $VPS_USER@$VPS_HOST exit; then
        print_success "SSH connection successful"
    else
        print_error "Cannot connect to VPS via SSH"
        print_warning "Make sure:"
        echo "  1. VPS is running and accessible"
        echo "  2. SSH key is set up or password authentication is enabled"
        echo "  3. Firewall allows SSH connections"
        exit 1
    fi
}

# Install dependencies on VPS
install_dependencies() {
    print_step "Installing dependencies on VPS..."
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'EOF'
        # Update system
        apt update && apt upgrade -y

        # Install Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl enable docker
            systemctl start docker
        fi

        # Install Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi

        # Install Git (if not present)
        apt install -y git

        # Create deployment directory
        mkdir -p /opt/ctrl-alt-play
        
        echo "Dependencies installed successfully"
EOF
    print_success "Dependencies installed on VPS"
}

# Deploy application
deploy_app() {
    print_step "Deploying application to VPS..."
    
    # Create deployment archive
    print_step "Creating deployment archive..."
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='logs' \
        --exclude='.env' \
        -czf ctrl-alt-play-deploy.tar.gz .
    
    # Upload to VPS
    print_step "Uploading to VPS..."
    scp -P $VPS_PORT ctrl-alt-play-deploy.tar.gz $VPS_USER@$VPS_HOST:$DEPLOY_PATH/
    
    # Extract and setup on VPS
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << EOF
        cd $DEPLOY_PATH
        
        # Backup existing deployment if it exists
        if [ -d "current" ]; then
            mv current backup-\$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
        fi
        
        # Extract new deployment
        mkdir -p current
        cd current
        tar -xzf ../ctrl-alt-play-deploy.tar.gz
        
        # Set up environment file
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "Created .env file - please configure it manually"
        fi
        
        # Create necessary directories
        mkdir -p logs uploads
        
        # Set permissions
        chown -R 1001:1001 logs uploads
        
        echo "Application deployed successfully"
EOF
    
    # Clean up local archive
    rm ctrl-alt-play-deploy.tar.gz
    print_success "Application deployed to VPS"
}

# Start services
start_services() {
    print_step "Starting services on VPS..."
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << EOF
        cd $DEPLOY_PATH/current
        
        # Build and start with Docker Compose
        docker-compose down 2>/dev/null || true
        docker-compose build
        docker-compose up -d
        
        echo "Services started successfully"
EOF
    print_success "Services started on VPS"
}

# Show status
show_status() {
    print_step "Checking service status..."
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << EOF
        cd $DEPLOY_PATH/current
        docker-compose ps
        echo ""
        echo "Logs (last 20 lines):"
        docker-compose logs --tail=20
EOF
}

# Main deployment flow
main() {
    echo -e "${BLUE}=== Ctrl-Alt-Play Panel VPS Deployment ===${NC}"
    echo ""
    
    # Check if this is initial setup or update
    if [ "$1" = "setup" ]; then
        check_config
        test_ssh
        install_dependencies
        deploy_app
        start_services
        show_status
        
        print_success "Deployment completed!"
        echo ""
        echo "Next steps:"
        echo "1. Configure your .env file on the VPS at: $DEPLOY_PATH/current/.env"
        echo "2. Set up your database connection"
        echo "3. Configure your domain (if using one)"
        echo "4. Set up SSL certificates (recommended)"
        echo ""
        echo "Access your panel at: http://$VPS_HOST:3000"
        
    elif [ "$1" = "update" ]; then
        check_config
        test_ssh
        deploy_app
        start_services
        show_status
        print_success "Update completed!"
        
    elif [ "$1" = "logs" ]; then
        check_config
        ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/current && docker-compose logs -f"
        
    elif [ "$1" = "restart" ]; then
        check_config
        ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/current && docker-compose restart"
        print_success "Services restarted"
        
    elif [ "$1" = "stop" ]; then
        check_config
        ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd $DEPLOY_PATH/current && docker-compose down"
        print_success "Services stopped"
        
    elif [ "$1" = "status" ]; then
        check_config
        show_status
        
    else
        echo "Usage: $0 {setup|update|logs|restart|stop|status}"
        echo ""
        echo "Commands:"
        echo "  setup   - Initial deployment setup (installs dependencies)"
        echo "  update  - Update deployment with current code"
        echo "  logs    - View live logs"
        echo "  restart - Restart services"
        echo "  stop    - Stop services"
        echo "  status  - Show service status"
        echo ""
        echo "Before running 'setup', please edit this script and set:"
        echo "  - VPS_HOST (your VPS IP address)"
        echo "  - VPS_USER (if not root)"
        echo "  - VPS_PORT (if not 22)"
        echo "  - DOMAIN (if you have one)"
        exit 1
    fi
}

main "$@"
