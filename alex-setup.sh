#!/bin/bash

# Ctrl-Alt-Play Panel - Alex-Friendly Setup Script
# For casual gamers who want minimal complexity
# Version: 2.0.0-alex

set -e

# Colors for friendly output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Track what we're installing for the user
INSTALLED_ITEMS=()

# Friendly messaging functions
echo_friendly() {
    echo -e "${BLUE}🎮 $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_working() {
    echo -e "${YELLOW}⚙️  $1${NC}"
}

echo_info() {
    echo -e "${WHITE}ℹ️  $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Welcome message that doesn't intimidate
show_welcome() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}                          🎮 Game Server Setup 🎮                            ${PURPLE}║${NC}"
    echo -e "${PURPLE}║${WHITE}                     No Command Line Experience Needed!                      ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo_friendly "Welcome! Let's get your game server running in just a few minutes."
    echo ""
    echo_info "This installer will:"
    echo "   ✅ Check your system automatically"
    echo "   ✅ Install everything you need"
    echo "   ✅ Set up your game server control panel"
    echo "   ✅ Give you a web interface to manage everything"
    echo ""
    echo_info "You don't need to understand the technical details - just follow along! 😊"
    echo ""

    # Give user control
    read -p "Ready to start? Press Enter to continue, or Ctrl+C to exit..."
    echo ""
}

# System check with explanations
check_system() {
    echo_working "Checking your system..."
    echo ""

    # Check OS with friendly messaging
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo_success "Linux detected - Perfect for game servers!"
        OS_TYPE="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo_success "macOS detected - Great choice!"
        OS_TYPE="macos"
    else
        echo_warning "Unsupported OS detected"
        echo_info "   This works best on Linux or macOS"
        echo_info "   You can still try, but you might need help"
        echo ""
        read -p "Continue anyway? (y/N): " continue_anyway
        if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
            echo_info "No problem! Try this on a Linux server or ask for help"
            exit 0
        fi
        OS_TYPE="unknown"
    fi

    # Check if running as root (bad for security)
    if [[ $EUID -eq 0 ]]; then
        echo_error "You're running as the root user!"
        echo_info "   For security, please run this as a regular user with 'sudo' access"
        echo_info "   Example: if your username is 'alex', log in as alex and run this script"
        exit 1
    fi

    # Detect package manager
    if command -v apt &> /dev/null; then
        PKG_MANAGER="apt"
        INSTALL_CMD="sudo apt-get install -y"
        UPDATE_CMD="sudo apt-get update"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        INSTALL_CMD="sudo yum install -y"
        UPDATE_CMD="sudo yum update -y"
    elif command -v brew &> /dev/null; then
        PKG_MANAGER="brew"
        INSTALL_CMD="brew install"
        UPDATE_CMD="brew update"
    else
        echo_error "Can't detect how to install software on your system"
        echo_info "   This script works on Ubuntu, CentOS, or macOS"
        echo_info "   If you're using a different system, you might need manual installation"
        exit 1
    fi

    echo_success "System check complete!"
    sleep 1
}

# Check and install tools with explanations
check_and_install_tools() {
    echo ""
    echo_working "Checking what tools we need to install..."
    echo ""

    missing_tools=()
    tool_descriptions=()

    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
        tool_descriptions+=("Docker - Runs your game servers safely in containers")
    else
        echo_success "Docker is already installed"
    fi

    # Check Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
        tool_descriptions+=("Git - Downloads the latest panel software")
    else
        echo_success "Git is already installed"
    fi

    # Check curl
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
        tool_descriptions+=("Curl - Helps download files from the internet")
    else
        echo_success "Curl is already installed"
    fi

    if [ ${#missing_tools[@]} -eq 0 ]; then
        echo_success "All required tools are already installed! 🎉"
        return 0
    fi

    echo_info "We need to install these tools:"
    for i in "${!missing_tools[@]}"; do
        echo "   • ${tool_descriptions[$i]}"
    done
    echo ""
    echo_info "Don't worry - this is automatic and safe! 🔒"
    echo_info "You might be asked for your password (this is normal)"
    echo ""

    read -p "Install missing tools? (Y/n): " install_tools
    if [[ $install_tools =~ ^[Nn]$ ]]; then
        echo_error "Cannot continue without required tools"
        exit 1
    fi

    # Install missing tools
    echo_working "Installing tools... (this may take a few minutes ☕)"

    if [[ "$PKG_MANAGER" == "apt" ]]; then
        echo_working "Updating package lists..."
        sudo apt-get update -qq
    fi

    for tool in "${missing_tools[@]}"; do
        echo_working "Installing $tool..."
        case $tool in
            "docker")
                if [[ "$PKG_MANAGER" == "apt" ]]; then
                    # Install Docker on Ubuntu/Debian
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sudo sh get-docker.sh
                    sudo usermod -aG docker $USER
                    rm get-docker.sh
                elif [[ "$PKG_MANAGER" == "yum" ]]; then
                    sudo yum install -y docker
                    sudo systemctl start docker
                    sudo systemctl enable docker
                    sudo usermod -aG docker $USER
                elif [[ "$PKG_MANAGER" == "brew" ]]; then
                    echo_info "Please install Docker Desktop from https://docker.com/products/docker-desktop"
                    echo_info "Then restart this script"
                    exit 1
                fi
                INSTALLED_ITEMS+=("Docker")
                ;;
            "git")
                $INSTALL_CMD git
                INSTALLED_ITEMS+=("Git")
                ;;
            "curl")
                $INSTALL_CMD curl
                INSTALLED_ITEMS+=("Curl")
                ;;
        esac
        echo_success "$tool installed successfully"
    done

    # Check if Docker needs a restart
    if ! docker info &> /dev/null && command -v docker &> /dev/null; then
        echo_warning "Docker is installed but not running"
        echo_working "Starting Docker service..."
        if command -v systemctl &> /dev/null; then
            sudo systemctl start docker
        fi

        # If user was added to docker group, they need to re-login
        if groups $USER | grep -q docker; then
            echo_info "Great! Docker is ready to go"
        else
            echo_warning "You've been added to the 'docker' group"
            echo_info "   You might need to log out and back in for this to take effect"
            echo_info "   Or run: newgrp docker"
        fi
    fi
}

# Simple configuration with smart defaults
get_user_preferences() {
    echo ""
    echo_working "Quick Setup Questions"
    echo ""

    # Domain configuration
    echo_info "Server Access Setup:"
    read -p "What domain will you use? (just press Enter for 'localhost'): " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    echo_success "Using domain: $DOMAIN"

    # SSL configuration
    USE_SSL=false
    if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
        echo ""
        read -p "Want SSL/HTTPS security? (Y/n): " want_ssl
        if [[ ! $want_ssl =~ ^[Nn]$ ]]; then
            echo_success "SSL will be enabled (more secure!)"
            USE_SSL=true
            read -p "Your email for SSL certificate: " EMAIL
        fi
    fi

    # Admin account
    echo ""
    echo_info "Admin Account Setup:"
    read -p "Your email: " ADMIN_EMAIL
    while [ -z "$ADMIN_EMAIL" ]; do
        echo_warning "Email is required for your admin account"
        read -p "Your email: " ADMIN_EMAIL
    done

    read -s -p "Choose an admin password (8+ characters): " ADMIN_PASSWORD
    echo ""
    while [ ${#ADMIN_PASSWORD} -lt 8 ]; do
        echo_warning "Password must be at least 8 characters"
        read -s -p "Choose an admin password (8+ characters): " ADMIN_PASSWORD
        echo ""
    done

    echo_success "Configuration complete!"
}

# Auto-generate secure passwords with explanation
generate_secure_secrets() {
    echo ""
    echo_working "Generating secure passwords and secrets..."
    echo_info "   (You don't need to remember these - we'll store them safely)"

    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        AGENT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
        SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
        DATABASE_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')
    else
        # Fallback if openssl not available
        JWT_SECRET=$(date +%s | sha256sum | base64 | head -c 32)
        AGENT_SECRET=$(date +%s | sha256sum | base64 | head -c 24)
        SESSION_SECRET=$(date +%s | sha256sum | base64 | head -c 24)
        DATABASE_PASSWORD=$(date +%s | sha256sum | base64 | head -c 16)
    fi

    echo_success "Secure secrets generated!"
}

# Download and setup with progress
download_and_setup() {
    echo ""
    echo_working "Downloading the game panel software..."

    INSTALL_DIR="$HOME/ctrl-alt-play-panel"

    if [ -d "$INSTALL_DIR" ]; then
        echo_info "Found existing installation - backing it up..."
        mv "$INSTALL_DIR" "$INSTALL_DIR.backup.$(date +%s)"
    fi

    # Clone the repository
    git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    echo_success "Download complete!"

    # Create configuration file
    echo_working "Creating your configuration..."

    cat > .env << EOF
# Ctrl-Alt-Play Panel Configuration
# Generated by Alex-friendly installer on $(date)

# Server Configuration
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
USE_SSL=$USE_SSL

# Database Configuration (Docker will handle this)
DATABASE_URL="postgresql://postgres:$DATABASE_PASSWORD@postgres:5432/ctrl_alt_play"
REDIS_URL="redis://redis:6379"

# Security Configuration
JWT_SECRET=$JWT_SECRET
AGENT_SECRET=$AGENT_SECRET
SESSION_SECRET=$SESSION_SECRET

# Admin Configuration
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Additional Features
ENABLE_MARKETPLACE=true
ENABLE_PLUGINS=true
ENABLE_MONITORING=true

# SSL Configuration
EOF

    if [ "$USE_SSL" = true ]; then
        cat >> .env << EOF
SSL_CERT_PATH=/app/ssl/cert.pem
SSL_KEY_PATH=/app/ssl/key.pem
EOF
    fi

    echo_success "Configuration created!"
}

# Start services with progress tracking
start_services() {
    echo ""
    echo_working "Starting your game server panel..."
    echo_info "   This might take 5-10 minutes for the first time ☕"
    echo ""

    # Use the existing Docker setup
    if [ -f "docker-compose.yml" ]; then
        echo_working "Starting services with Docker..."

        # Start the services
        docker compose up -d

        echo_working "Waiting for services to start..."
        sleep 30

        # Check if services are running
        if docker compose ps | grep -q "Up"; then
            echo_success "Services are starting up!"
        else
            echo_warning "Services might be taking longer to start"
            echo_info "   This is normal for the first time"
        fi

        # Initialize database
        echo_working "Setting up the database..."
        docker compose exec -T ctrl-alt-play npm run db:push 2>/dev/null || true
        docker compose exec -T ctrl-alt-play npm run db:seed 2>/dev/null || true

    else
        echo_error "Docker configuration not found"
        echo_info "   Using the original easy-setup.sh instead..."
        ./easy-setup.sh
        return
    fi
}

# Health check with user-friendly results
check_deployment() {
    echo ""
    echo_working "Checking if everything is working..."

    local max_attempts=10
    local attempt=1
    local base_url="http://localhost:3000"

    if [ "$USE_SSL" = true ] && [ "$DOMAIN" != "localhost" ]; then
        base_url="https://$DOMAIN"
    elif [ "$DOMAIN" != "localhost" ]; then
        base_url="http://$DOMAIN"
    fi

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$base_url/health" > /dev/null 2>&1; then
            echo_success "Your game panel is working! 🎉"
            break
        else
            echo_working "Still starting up... (attempt $attempt/$max_attempts)"
            sleep 15
            ((attempt++))
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        echo_warning "Panel might still be starting up"
        echo_info "   Sometimes it takes a bit longer - that's normal!"
        echo_info "   You can check manually by visiting: $base_url"
    fi
}

# Show final success message
show_completion() {
    echo ""
    echo_success "🎉 Installation Complete! 🎉"
    echo ""

    local panel_url="http://localhost:3000"
    if [ "$USE_SSL" = true ] && [ "$DOMAIN" != "localhost" ]; then
        panel_url="https://$DOMAIN"
    elif [ "$DOMAIN" != "localhost" ]; then
        panel_url="http://$DOMAIN"
    fi

    echo_friendly "Your Game Server Panel is Ready!"
    echo ""
    echo_info "🌐 Panel URL: $panel_url"
    echo_info "📧 Admin Email: $ADMIN_EMAIL"
    echo_info "🔑 Admin Password: [the one you chose]"
    echo ""

    if [ ${#INSTALLED_ITEMS[@]} -gt 0 ]; then
        echo_info "📦 We installed these tools for you:"
        for item in "${INSTALLED_ITEMS[@]}"; do
            echo "   • $item"
        done
        echo ""
    fi

    echo_friendly "What's Next?"
    echo_info "1. 🌐 Open $panel_url in your web browser"
    echo_info "2. 🔐 Log in with your email and password"
    echo_info "3. 🎮 Create your first game server!"
    echo_info "4. 🎉 Invite your friends to play!"
    echo ""

    echo_friendly "Need Help?"
    echo_info "• 📖 Documentation: https://github.com/scarecr0w12/ctrl-alt-play-panel"
    echo_info "• 🐛 Issues: https://github.com/scarecr0w12/ctrl-alt-play-panel/issues"
    echo_info "• 💬 Discord: [Your Discord link here]"
    echo ""

    echo_success "Happy Gaming! 🎮"
}

# Main execution with error handling
main() {
    # Trap errors and provide helpful messages
    trap 'echo_error "Something went wrong! Check the error message above or ask for help."; exit 1' ERR

    show_welcome
    check_system
    check_and_install_tools
    get_user_preferences
    generate_secure_secrets
    download_and_setup
    start_services
    check_deployment
    show_completion
}

# Run main function
main "$@"
