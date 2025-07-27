#!/bin/bash

# Ctrl-Alt-Play Panel Easy Setup Script
# Version: 1.5.0
# Description: Comprehensive setup script for direct or Docker installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration variables
INSTALL_TYPE=""
DOMAIN=""
EMAIL=""
USE_SSL=false
DATABASE_PASSWORD=""
JWT_SECRET=""
AGENT_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

# Function to print colored output
print_header() {
    echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                       Ctrl-Alt-Play Panel Setup                              ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${WHITE}                            Version 1.5.0                                    ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo -e "\n${CYAN}🔧 $1${NC}"
}

# Function to generate random passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to detect Docker Compose version and set command
detect_docker_compose() {
    DOCKER_COMPOSE_CMD=""
    
    # Check for Docker Compose v2 (plugin)
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "2.x")
        print_info "Found Docker Compose v2 (plugin): $COMPOSE_VERSION"
        return 0
    fi
    
    # Check for Docker Compose v1 (standalone)
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        COMPOSE_VERSION=$(docker-compose version --short 2>/dev/null || echo "1.x")
        print_info "Found Docker Compose v1 (standalone): $COMPOSE_VERSION"
        return 0
    fi
    
    print_error "Docker Compose not found"
    return 1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "This script should not be run as root for security reasons"
        print_info "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            PKG_MANAGER="apt"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            PKG_MANAGER="yum"
        elif [ -f /etc/arch-release ]; then
            OS="arch"
            PKG_MANAGER="pacman"
        else
            OS="linux"
            PKG_MANAGER="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
    else
        OS="unknown"
        PKG_MANAGER="unknown"
    fi
    
    print_info "Detected OS: $OS"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check for required commands
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if [ "$INSTALL_TYPE" = "docker" ]; then
        if ! command -v docker &> /dev/null; then
            missing_deps+=("docker")
        fi
        
        # Use our Docker Compose detection function
        if ! detect_docker_compose; then
            missing_deps+=("docker-compose")
        fi
    else
        if ! command -v node &> /dev/null; then
            missing_deps+=("nodejs")
        fi
        
        if ! command -v npm &> /dev/null; then
            missing_deps+=("npm")
        fi
        
        if ! command -v psql &> /dev/null; then
            missing_deps+=("postgresql")
        fi
        
        if ! command -v redis-cli &> /dev/null; then
            missing_deps+=("redis")
        fi
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing dependencies: ${missing_deps[*]}"
        print_info "Would you like to install them automatically? (y/N)"
        read -r install_deps
        
        if [[ $install_deps =~ ^[Yy]$ ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            print_error "Please install the missing dependencies and run the script again"
            exit 1
        fi
    else
        print_success "All prerequisites are met"
    fi
}

# Function to install dependencies
install_dependencies() {
    local deps=("$@")
    print_step "Installing dependencies: ${deps[*]}"
    
    case $PKG_MANAGER in
        "apt")
            sudo apt update
            for dep in "${deps[@]}"; do
                case $dep in
                    "nodejs")
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                        ;;
                    "docker")
                        curl -fsSL https://get.docker.com | sh
                        sudo usermod -aG docker $USER
                        ;;
                    "docker-compose")
                        # Try to install Docker Compose v2 plugin first
                        if docker --version &> /dev/null; then
                            print_info "Installing Docker Compose v2 plugin..."
                            sudo apt-get install -y docker-compose-plugin
                        else
                            # Fallback to standalone v1 if Docker is not available yet
                            print_info "Installing Docker Compose v1 standalone..."
                            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                            sudo chmod +x /usr/local/bin/docker-compose
                        fi
                        ;;
                    "postgresql")
                        sudo apt-get install -y postgresql postgresql-contrib
                        ;;
                    "redis")
                        sudo apt-get install -y redis-server
                        ;;
                    *)
                        sudo apt-get install -y "$dep"
                        ;;
                esac
            done
            ;;
        "yum")
            sudo yum update -y
            for dep in "${deps[@]}"; do
                case $dep in
                    "nodejs")
                        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                        sudo yum install -y nodejs
                        ;;
                    "docker")
                        sudo yum install -y docker
                        sudo systemctl start docker
                        sudo systemctl enable docker
                        sudo usermod -aG docker $USER
                        ;;
                    "docker-compose")
                        # Try to install Docker Compose v2 plugin first
                        if docker --version &> /dev/null; then
                            print_info "Installing Docker Compose v2 plugin..."
                            sudo yum install -y docker-compose-plugin
                        else
                            # Fallback to standalone v1
                            print_info "Installing Docker Compose v1 standalone..."
                            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                            sudo chmod +x /usr/local/bin/docker-compose
                        fi
                        ;;
                    *)
                        sudo yum install -y "$dep"
                        ;;
                esac
            done
            ;;
        "pacman")
            sudo pacman -Syu
            for dep in "${deps[@]}"; do
                case $dep in
                    "nodejs")
                        sudo pacman -S nodejs npm
                        ;;
                    "docker")
                        sudo pacman -S docker docker-compose
                        sudo systemctl start docker
                        sudo systemctl enable docker
                        sudo usermod -aG docker $USER
                        ;;
                    *)
                        sudo pacman -S "$dep"
                        ;;
                esac
            done
            ;;
        "brew")
            for dep in "${deps[@]}"; do
                case $dep in
                    "nodejs")
                        brew install node
                        ;;
                    "docker")
                        brew install --cask docker
                        ;;
                    "docker-compose")
                        # Docker Desktop for Mac includes Docker Compose v2
                        print_info "Docker Compose v2 is included with Docker Desktop"
                        print_info "If Docker Desktop is not installed, installing it now..."
                        brew install --cask docker
                        ;;
                    "postgresql")
                        brew install postgresql
                        brew services start postgresql
                        ;;
                    "redis")
                        brew install redis
                        brew services start redis
                        ;;
                    *)
                        brew install "$dep"
                        ;;
                esac
            done
            ;;
        *)
            print_error "Unsupported package manager. Please install dependencies manually."
            exit 1
            ;;
    esac
    
    print_success "Dependencies installed successfully"
}

# Function to show installation options
show_installation_options() {
    print_header
    echo -e "${WHITE}Welcome to the Ctrl-Alt-Play Panel Setup!${NC}\n"
    
    echo -e "${CYAN}This script will help you set up the Ctrl-Alt-Play Panel with marketplace integration.${NC}"
    echo -e "${CYAN}You can choose between two installation methods:${NC}\n"
    
    echo -e "${GREEN}1. Docker Installation (Recommended)${NC}"
    echo -e "   ${WHITE}• Easy setup with containerized services${NC}"
    echo -e "   ${WHITE}• Automatic PostgreSQL and Redis setup${NC}"
    echo -e "   ${WHITE}• Isolated environment${NC}"
    echo -e "   ${WHITE}• Easy updates and maintenance${NC}\n"
    
    echo -e "${YELLOW}2. Direct Installation${NC}"
    echo -e "   ${WHITE}• Install services directly on your system${NC}"
    echo -e "   ${WHITE}• Full control over configuration${NC}"
    echo -e "   ${WHITE}• Better performance for production${NC}"
    echo -e "   ${WHITE}• Requires manual service management${NC}\n"
    
    while true; do
        echo -e "${BLUE}Choose installation type:${NC}"
        echo -e "  ${GREEN}[1]${NC} Docker Installation"
        echo -e "  ${YELLOW}[2]${NC} Direct Installation"
        echo -e "  ${RED}[q]${NC} Quit"
        echo ""
        read -p "Enter your choice [1/2/q]: " choice
        
        case $choice in
            1)
                INSTALL_TYPE="docker"
                print_success "Selected: Docker Installation"
                break
                ;;
            2)
                INSTALL_TYPE="direct"
                print_success "Selected: Direct Installation"
                break
                ;;
            q|Q)
                print_info "Setup cancelled by user"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter 1, 2, or q"
                ;;
        esac
    done
}

# Function to collect configuration
collect_configuration() {
    print_step "Configuration Setup"
    
    # Domain configuration
    echo -e "\n${BLUE}Domain Configuration:${NC}"
    read -p "Enter your domain (e.g., panel.example.com) [localhost]: " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    # SSL configuration
    if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
        echo -e "\n${BLUE}SSL Configuration:${NC}"
        read -p "Enable SSL/HTTPS? (y/N): " ssl_choice
        if [[ $ssl_choice =~ ^[Yy]$ ]]; then
            USE_SSL=true
            read -p "Enter your email for SSL certificate: " EMAIL
        fi
    fi
    
    # Database configuration
    echo -e "\n${BLUE}Database Configuration:${NC}"
    DATABASE_PASSWORD=$(generate_password)
    print_info "Generated database password: $DATABASE_PASSWORD"
    read -p "Use this password or enter custom one: " custom_db_pass
    if [ -n "$custom_db_pass" ]; then
        DATABASE_PASSWORD="$custom_db_pass"
    fi
    
    # Security configuration
    echo -e "\n${BLUE}Security Configuration:${NC}"
    JWT_SECRET=$(generate_password)
    AGENT_SECRET=$(generate_password)
    print_info "Generated security secrets automatically"
    
    # Admin account
    echo -e "\n${BLUE}Admin Account Setup:${NC}"
    read -p "Admin email: " ADMIN_EMAIL
    while [ -z "$ADMIN_EMAIL" ]; do
        print_warning "Admin email is required"
        read -p "Admin email: " ADMIN_EMAIL
    done
    
    read -s -p "Admin password: " ADMIN_PASSWORD
    echo
    while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
        print_warning "Password must be at least 8 characters"
        read -s -p "Admin password: " ADMIN_PASSWORD
        echo
    done
    
    print_success "Configuration collected successfully"
}

# Function to create environment file
create_environment_file() {
    print_step "Creating environment configuration..."
    
    cat > .env << EOF
# Ctrl-Alt-Play Panel Environment Configuration
# Generated on $(date)

# Server Configuration
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
USE_SSL=$USE_SSL

# Database Configuration
DATABASE_URL="postgresql://postgres:$DATABASE_PASSWORD@localhost:5432/ctrl_alt_play"
REDIS_URL="redis://localhost:6379"

# Security Configuration
JWT_SECRET=$JWT_SECRET
AGENT_SECRET=$AGENT_SECRET
SESSION_SECRET=$(generate_password)

# Admin Configuration
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Marketplace Integration
MARKETPLACE_API_URL=https://marketplace.ctrl-alt-play.com/api
MARKETPLACE_CLIENT_ID=panel_client
MARKETPLACE_CLIENT_SECRET=$(generate_password)

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/combined.log

# SSL Configuration (if enabled)
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem

# Monitoring Configuration
ENABLE_MONITORING=true
METRICS_PORT=9090

EOF

    if [ "$INSTALL_TYPE" = "docker" ]; then
        # Update for Docker configuration
        sed -i 's/localhost:5432/postgres:5432/' .env
        sed -i 's/localhost:6379/redis:6379/' .env
    fi
    
    print_success "Environment file created"
}

# Function for Docker installation
install_docker() {
    print_step "Setting up Docker installation..."
    
    # Detect and set Docker Compose command
    if ! detect_docker_compose; then
        print_error "Docker Compose is required but not found. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Create docker-compose.yml for production
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ctrl_alt_play
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF

    # Create nginx configuration
    mkdir -p nginx
    cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    server {
        listen 80;
        server_name $DOMAIN;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

    # Build and start services
    print_info "Building Docker images..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml build
    
    print_info "Starting services..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 30
    
    # Run database migrations
    print_info "Running database migrations..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml exec app npm run db:push
    
    # Create admin user
    print_info "Creating admin user..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml exec app npm run seed
    
    print_success "Docker installation completed"
}

# Function for direct installation
install_direct() {
    print_step "Setting up direct installation..."
    
    # Install Node.js dependencies
    print_info "Installing Node.js dependencies..."
    npm install --production
    
    # Build the application
    print_info "Building application..."
    npm run build
    
    # Setup PostgreSQL
    print_step "Setting up PostgreSQL..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    # Create database
    print_info "Creating database..."
    sudo -u postgres createdb ctrl_alt_play 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DATABASE_PASSWORD';" 2>/dev/null || true
    
    # Setup Redis
    print_step "Setting up Redis..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start redis
        sudo systemctl enable redis
    fi
    
    # Run database migrations
    print_info "Running database migrations..."
    npm run db:push
    
    # Create admin user
    print_info "Creating admin user..."
    npm run seed
    
    # Create systemd service
    print_step "Creating system service..."
    cat > ctrl-alt-play.service << EOF
[Unit]
Description=Ctrl-Alt-Play Panel
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node dist/src/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo mv ctrl-alt-play.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable ctrl-alt-play
    sudo systemctl start ctrl-alt-play
    
    print_success "Direct installation completed"
}

# Function to setup SSL
setup_ssl() {
    if [ "$USE_SSL" = true ] && [ "$DOMAIN" != "localhost" ]; then
        print_step "Setting up SSL certificate..."
        
        # Install certbot
        if [ "$PKG_MANAGER" = "apt" ]; then
            sudo apt-get install -y certbot
        elif [ "$PKG_MANAGER" = "yum" ]; then
            sudo yum install -y certbot
        fi
        
        # Get SSL certificate
        sudo certbot certonly --standalone -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
        
        print_success "SSL certificate installed"
    fi
}

# Function to perform health check
health_check() {
    print_step "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    local url="http://localhost:3000/health"
    
    if [ "$USE_SSL" = true ]; then
        url="https://$DOMAIN/health"
    elif [ "$DOMAIN" != "localhost" ]; then
        url="http://$DOMAIN/health"
    fi
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "Health check passed!"
            break
        else
            print_info "Attempt $attempt/$max_attempts - Waiting for service to start..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_warning "Health check failed. Service may still be starting up."
    fi
}

# Function to show completion message
show_completion() {
    print_header
    
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}\n"
    
    echo -e "${CYAN}Access Information:${NC}"
    if [ "$USE_SSL" = true ]; then
        echo -e "  ${WHITE}Panel URL: https://$DOMAIN${NC}"
    else
        echo -e "  ${WHITE}Panel URL: http://$DOMAIN:3000${NC}"
    fi
    echo -e "  ${WHITE}Admin Email: $ADMIN_EMAIL${NC}"
    echo -e "  ${WHITE}Admin Password: [as configured]${NC}\n"
    
    echo -e "${CYAN}Useful Commands:${NC}"
    if [ "$INSTALL_TYPE" = "docker" ]; then
        echo -e "  ${WHITE}View logs: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs -f${NC}"
        echo -e "  ${WHITE}Restart: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml restart${NC}"
        echo -e "  ${WHITE}Stop: $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down${NC}"
        echo -e "  ${WHITE}Update: git pull && $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d --build${NC}"
    else
        echo -e "  ${WHITE}View logs: sudo journalctl -u ctrl-alt-play -f${NC}"
        echo -e "  ${WHITE}Restart: sudo systemctl restart ctrl-alt-play${NC}"
        echo -e "  ${WHITE}Stop: sudo systemctl stop ctrl-alt-play${NC}"
        echo -e "  ${WHITE}Update: git pull && npm run build && sudo systemctl restart ctrl-alt-play${NC}"
    fi
    
    echo -e "\n${CYAN}Documentation:${NC}"
    echo -e "  ${WHITE}API Documentation: $url/docs${NC}"
    echo -e "  ${WHITE}GitHub: https://github.com/scarecr0w12/ctrl-alt-play-panel${NC}"
    echo -e "  ${WHITE}Issues: https://github.com/scarecr0w12/ctrl-alt-play-panel/issues${NC}"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo -e "  ${WHITE}1. Log in to the panel with your admin credentials${NC}"
    echo -e "  ${WHITE}2. Configure your first game server${NC}"
    echo -e "  ${WHITE}3. Explore the plugin marketplace${NC}"
    echo -e "  ${WHITE}4. Set up monitoring and alerts${NC}"
    
    echo -e "\n${GREEN}Thank you for using Ctrl-Alt-Play Panel!${NC}"
}

# Main execution
main() {
    # Check if running as root
    check_root
    
    # Detect OS
    detect_os
    
    # Show installation options
    show_installation_options
    
    # Check prerequisites
    check_prerequisites
    
    # Collect configuration
    collect_configuration
    
    # Create environment file
    create_environment_file
    
    # Setup SSL if needed
    setup_ssl
    
    # Perform installation based on type
    if [ "$INSTALL_TYPE" = "docker" ]; then
        install_docker
    else
        install_direct
    fi
    
    # Perform health check
    health_check
    
    # Show completion message
    show_completion
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
