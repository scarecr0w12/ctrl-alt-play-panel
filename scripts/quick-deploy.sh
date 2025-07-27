#!/bin/bash

# Ctrl-Alt-Play Panel - Quick Deployment Script
# Works on any Linux distribution with automatic conflict resolution

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
DEPLOY_DIR="$HOME/ctrl-alt-play-deployment"
REPO_URL="https://github.com/scarecr0w12/ctrl-alt-play.git"
NODE_MIN_VERSION="18"

# Check if running as root (not recommended)
if [[ $EUID -eq 0 ]]; then
   log_warning "Running as root is not recommended. Consider using a regular user."
   read -p "Continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

log_info "🚀 Starting Ctrl-Alt-Play Panel Quick Deployment"

# System detection
if command -v apt-get &> /dev/null; then
    PACKAGE_MANAGER="apt"
    INSTALL_CMD="sudo apt-get install -y"
    UPDATE_CMD="sudo apt-get update"
elif command -v yum &> /dev/null; then
    PACKAGE_MANAGER="yum"
    INSTALL_CMD="sudo yum install -y"
    UPDATE_CMD="sudo yum update -y"
elif command -v dnf &> /dev/null; then
    PACKAGE_MANAGER="dnf"
    INSTALL_CMD="sudo dnf install -y"
    UPDATE_CMD="sudo dnf update -y"
elif command -v pacman &> /dev/null; then
    PACKAGE_MANAGER="pacman"
    INSTALL_CMD="sudo pacman -S --noconfirm"
    UPDATE_CMD="sudo pacman -Sy"
elif command -v apk &> /dev/null; then
    PACKAGE_MANAGER="apk"
    INSTALL_CMD="sudo apk add"
    UPDATE_CMD="sudo apk update"
else
    log_error "Unsupported package manager. Please install dependencies manually."
    exit 1
fi

log_info "📱 Detected package manager: $PACKAGE_MANAGER"

# Check Node.js version
check_node_version() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge $NODE_MIN_VERSION ]]; then
            log_success "Node.js $NODE_VERSION detected (>= $NODE_MIN_VERSION required)"
            return 0
        else
            log_warning "Node.js $NODE_VERSION is too old (>= $NODE_MIN_VERSION required)"
            return 1
        fi
    else
        log_warning "Node.js not found"
        return 1
    fi
}

# Install Node.js
install_nodejs() {
    log_info "📦 Installing Node.js..."
    
    case $PACKAGE_MANAGER in
        "apt")
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            $INSTALL_CMD nodejs
            ;;
        "yum"|"dnf")
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            $INSTALL_CMD nodejs npm
            ;;
        "pacman")
            $INSTALL_CMD nodejs npm
            ;;
        "apk")
            $INSTALL_CMD nodejs npm
            ;;
    esac
    
    if check_node_version; then
        log_success "Node.js installed successfully"
    else
        log_error "Failed to install Node.js"
        exit 1
    fi
}

# Install system dependencies
install_dependencies() {
    log_info "📦 Installing system dependencies..."
    
    $UPDATE_CMD
    
    case $PACKAGE_MANAGER in
        "apt")
            $INSTALL_CMD curl git build-essential python3 openssl
            ;;
        "yum"|"dnf")
            $INSTALL_CMD curl git gcc-c++ make python3 openssl
            ;;
        "pacman")
            $INSTALL_CMD curl git base-devel python openssl
            ;;
        "apk")
            $INSTALL_CMD curl git build-base python3 openssl
            ;;
    esac
    
    log_success "System dependencies installed"
}

# Generate secure secrets
generate_secrets() {
    log_info "🔐 Generating security keys..."
    
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    AGENT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    
    if [[ -z "$JWT_SECRET" || -z "$AGENT_SECRET" || -z "$SESSION_SECRET" ]]; then
        log_error "Failed to generate security keys"
        exit 1
    fi
    
    log_success "Security keys generated"
}

# Setup deployment directory
setup_deployment() {
    log_info "📁 Setting up deployment directory..."
    
    if [[ -d "$DEPLOY_DIR" ]]; then
        log_warning "Deployment directory exists. Backing up..."
        mv "$DEPLOY_DIR" "${DEPLOY_DIR}.backup.$(date +%s)"
    fi
    
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    log_info "📥 Cloning repository..."
    git clone "$REPO_URL" .
    
    log_success "Repository cloned to $DEPLOY_DIR"
}

# Configure environment
configure_environment() {
    log_info "⚙️  Configuring environment..."
    
    # Copy template
    cp .env.production.template .env.production
    
    # Update with generated secrets
    sed -i "s/your-jwt-secret-here/$JWT_SECRET/" .env.production
    sed -i "s/your-agent-secret-here/$AGENT_SECRET/" .env.production
    sed -i "s/your-session-secret-here/$SESSION_SECRET/" .env.production
    
    # Enable automatic port detection
    {
        echo ""
        echo "# Auto-generated deployment configuration"
        echo "AUTO_PORT_DETECTION=true"
        echo "PORT_RANGE_START=3000"
        echo "PORT_RANGE_END=9999"
        echo "NODE_ENV=production"
        echo "LOG_LEVEL=info"
        echo "DEPLOYMENT_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    } >> .env.production
    
    log_success "Environment configured"
}

# Database setup options
setup_database() {
    log_info "🗄️  Setting up database..."
    
    echo "Choose database option:"
    echo "1) SQLite (Simple, no external dependencies)"
    echo "2) PostgreSQL (Recommended for production)"
    echo "3) Skip (configure manually later)"
    
    read -p "Enter choice (1-3) [1]: " -n 1 -r DB_CHOICE
    echo
    DB_CHOICE=${DB_CHOICE:-1}
    
    case $DB_CHOICE in
        1)
            mkdir -p data
            echo "DATABASE_URL=file:./data/ctrl_alt_play.db" >> .env.production
            log_success "SQLite database configured"
            ;;
        2)
            case $PACKAGE_MANAGER in
                "apt")
                    $INSTALL_CMD postgresql postgresql-contrib
                    ;;
                "yum"|"dnf")
                    $INSTALL_CMD postgresql-server postgresql-contrib
                    sudo postgresql-setup initdb
                    ;;
                "pacman")
                    $INSTALL_CMD postgresql
                    sudo -u postgres initdb -D /var/lib/postgres/data
                    ;;
                "apk")
                    $INSTALL_CMD postgresql postgresql-contrib
                    ;;
            esac
            
            # Start PostgreSQL service
            sudo systemctl enable postgresql || true
            sudo systemctl start postgresql || true
            
            # Create database (user will need to set password manually)
            sudo -u postgres createdb ctrl_alt_play || true
            sudo -u postgres createuser ctrl_alt_play_user || true
            
            echo "DATABASE_URL=postgresql://ctrl_alt_play_user:password@localhost:5432/ctrl_alt_play" >> .env.production
            log_warning "PostgreSQL installed. Please set database password manually:"
            log_info "sudo -u postgres psql -c \"ALTER USER ctrl_alt_play_user PASSWORD 'your-password';\""
            log_info "Then update DATABASE_URL in .env.production"
            ;;
        3)
            log_info "Database setup skipped. Configure DATABASE_URL in .env.production"
            ;;
    esac
}

# Install application
install_application() {
    log_info "📦 Installing application dependencies..."
    
    # Install dependencies
    npm ci --only=production
    
    # Generate Prisma client
    npx prisma generate
    
    # Run database migrations (if database is configured)
    if grep -q "file:./data/" .env.production; then
        npx prisma migrate deploy || log_warning "Database migration failed (may need manual setup)"
    fi
    
    # Build application
    npm run build
    
    log_success "Application installed and built"
}

# Test deployment
test_deployment() {
    log_info "🧪 Testing deployment..."
    
    # Test port management
    if [[ -f "test-port-management.js" ]]; then
        node test-port-management.js
        log_success "Port management tests passed"
    fi
    
    # Test health check script
    if [[ -f "src/health-check.js" ]]; then
        log_info "Health check script ready"
    fi
    
    log_success "Deployment tests completed"
}

# Setup service (optional)
setup_service() {
    read -p "Setup as system service? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "⚙️  Setting up system service..."
        
        sudo tee /etc/systemd/system/ctrl-alt-play.service > /dev/null <<EOF
[Unit]
Description=Ctrl-Alt-Play Panel
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable ctrl-alt-play
        
        log_success "System service created (ctrl-alt-play)"
        log_info "Start with: sudo systemctl start ctrl-alt-play"
        log_info "Check status: sudo systemctl status ctrl-alt-play"
    fi
}

# Main deployment flow
main() {
    echo
    log_info "🎮 Ctrl-Alt-Play Panel - Quick Deployment"
    echo "========================================"
    
    # Install dependencies if needed
    if ! check_node_version; then
        install_nodejs
    fi
    
    install_dependencies
    generate_secrets
    setup_deployment
    configure_environment
    setup_database
    install_application
    test_deployment
    setup_service
    
    echo
    log_success "🎉 Deployment completed successfully!"
    echo "========================================"
    log_info "📍 Deployment location: $DEPLOY_DIR"
    log_info "🔧 Configuration file: $DEPLOY_DIR/.env.production"
    log_info "📖 Full guide: $DEPLOY_DIR/DEPLOYMENT_GUIDE.md"
    echo
    log_info "🚀 To start the application:"
    log_info "   cd $DEPLOY_DIR"
    log_info "   npm start"
    echo
    log_info "🌐 Access will be available at:"
    log_info "   http://localhost:[auto-detected-port]"
    echo
    log_info "🔍 Check health:"
    log_info "   curl http://localhost:[port]/health"
    echo
    
    if [[ -f "/etc/systemd/system/ctrl-alt-play.service" ]]; then
        log_info "💡 Or start as service:"
        log_info "   sudo systemctl start ctrl-alt-play"
    fi
    
    echo
    log_success "Happy gaming! 🎮"
}

# Run main function
main "$@"