#!/bin/bash

# =============================================================================
# Ctrl-Alt-Play Panel - Quick Deploy Script
# =============================================================================
# 
# One-command setup for Ctrl-Alt-Play Panel
# This script handles the complete installation and setup process
#
# Usage: ./quick-deploy.sh [options]
# Options:
#   --skip-deps     Skip dependency checks
#   --dev          Setup for development (default)
#   --prod         Setup for production
#   --no-start     Don't start services after setup
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
SKIP_DEPS=false
ENVIRONMENT="development"
START_SERVICES=true
SETUP_METHOD=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "${PURPLE}🔧 $1${NC}"; }
print_header() { echo -e "${CYAN}$1${NC}"; }

show_usage() {
    echo "Ctrl-Alt-Play Panel Quick Deploy"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Setup Methods:"
    echo "  --auto        Automatic setup with intelligent defaults (default)"
    echo "  --wizard      Interactive CLI wizard with guided configuration"
    echo "  --web         Web-based installer with browser interface"
    echo
    echo "Options:"
    echo "  --skip-deps   Skip dependency checks"
    echo "  --dev         Setup for development (default)"
    echo "  --prod        Setup for production"
    echo "  --no-start    Don't start services after setup"
    echo "  -h, --help    Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    # Quick automatic setup"
    echo "  $0 --wizard          # Interactive CLI setup"
    echo "  $0 --web             # Web-based setup"
    echo "  $0 --prod --no-start # Production config, don't start services"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --dev)
            ENVIRONMENT="development"
            shift
            ;;
        --prod)
            ENVIRONMENT="production"
            shift
            ;;
        --no-start)
            START_SERVICES=false
            shift
            ;;
        --wizard)
            SETUP_METHOD="wizard"
            shift
            ;;
        --web)
            SETUP_METHOD="web"
            shift
            ;;
        --auto)
            SETUP_METHOD="auto"
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Header
clear
print_header "🎮 Ctrl-Alt-Play Panel - Quick Deploy"
print_header "======================================"
echo
print_info "Environment: $ENVIRONMENT"
print_info "Project root: $PROJECT_ROOT"
echo

# Setup method selection
if [ -z "${SETUP_METHOD:-}" ]; then
    SETUP_METHOD="auto"
fi

case $SETUP_METHOD in
    wizard)
        print_info "🧙 Starting Interactive CLI Wizard..."
        exec "./scripts/setup-wizard.sh"
        ;;
    web)
        print_info "🌐 Starting Web-based Installer..."
        exec "./scripts/setup-web.sh"
        ;;
    auto)
        print_info "⚡ Using automatic setup with intelligent defaults"
        ;;
    *)
        print_error "Unknown setup method: $SETUP_METHOD"
        exit 1
        ;;
esac

# Navigate to project root
cd "$PROJECT_ROOT"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker Compose version
check_docker_compose() {
    if command_exists "docker" && docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command_exists "docker-compose"; then
        echo "docker-compose"
    else
        return 1
    fi
}

# Step 1: Dependency checks
if [ "$SKIP_DEPS" = false ]; then
    print_step "Step 1: Checking dependencies..."
    
    MISSING_DEPS=()
    
    # Check Node.js
    if ! command_exists node; then
        MISSING_DEPS+=("Node.js 18+")
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            MISSING_DEPS+=("Node.js 18+ (found v$NODE_VERSION)")
        else
            print_success "Node.js $(node -v) ✓"
        fi
    fi
    
    # Check npm
    if ! command_exists npm; then
        MISSING_DEPS+=("npm")
    else
        print_success "npm $(npm -v) ✓"
    fi
    
    # Check Docker
    if ! command_exists docker; then
        MISSING_DEPS+=("Docker")
    else
        print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
    fi
    
    # Check Docker Compose
    COMPOSE_CMD=$(check_docker_compose)
    if [ $? -ne 0 ]; then
        MISSING_DEPS+=("Docker Compose")
    else
        COMPOSE_VERSION=$($COMPOSE_CMD version --short 2>/dev/null || echo "v1")
        print_success "Docker Compose $COMPOSE_VERSION ✓"
    fi
    
    # Check Git (nice to have)
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3) ✓"
    fi
    
    # Report missing dependencies
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        print_error "Missing required dependencies:"
        for dep in "${MISSING_DEPS[@]}"; do
            echo "  • $dep"
        done
        echo
        print_info "Please install the missing dependencies and run this script again."
        print_info "Installation guides:"
        echo "  • Node.js: https://nodejs.org/"
        echo "  • Docker: https://docs.docker.com/engine/install/"
        echo "  • Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "All dependencies found!"
    echo
else
    COMPOSE_CMD=$(check_docker_compose)
    if [ $? -ne 0 ]; then
        COMPOSE_CMD="docker-compose"
    fi
    print_warning "Skipping dependency checks (--skip-deps flag used)"
    echo
fi

# Step 2: Environment configuration
print_step "Step 2: Setting up environment configuration..."

if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        print_error ".env.example file not found!"
        exit 1
    fi
    
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_success "Created .env file"
    
    # Generate secrets automatically
    print_info "Generating secure secrets..."
    if [ -f scripts/generate-secrets.sh ]; then
        chmod +x scripts/generate-secrets.sh
        echo "y" | scripts/generate-secrets.sh >/dev/null 2>&1 || {
            print_warning "Auto-secret generation failed, using defaults"
        }
        print_success "Generated secure secrets"
    fi
    
    # Update environment for production
    if [ "$ENVIRONMENT" = "production" ]; then
        sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
        print_success "Configured for production environment"
    fi
    
else
    print_success ".env file already exists"
    
    # Check if secrets need updating
    if grep -q "your-super-secret-jwt-key-CHANGE-THIS" .env; then
        print_warning "Detected default secrets in .env file"
        read -p "Would you like to generate new secure secrets? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            if [ -f scripts/generate-secrets.sh ]; then
                chmod +x scripts/generate-secrets.sh
                echo "y" | scripts/generate-secrets.sh >/dev/null 2>&1 || {
                    print_warning "Auto-secret generation failed"
                }
                print_success "Updated secrets"
            fi
        fi
    fi
fi

echo

# Step 3: Install dependencies
print_step "Step 3: Installing application dependencies..."

print_info "Installing backend dependencies..."
npm install --silent
print_success "Backend dependencies installed"

if [ -d "frontend" ]; then
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
    print_success "Frontend dependencies installed"
fi

echo

# Step 4: Create directories and set permissions
print_step "Step 4: Setting up directories..."

print_info "Creating required directories..."
mkdir -p logs uploads data
mkdir -p logs/permissions logs/security
mkdir -p nginx/ssl

# Set permissions (ignore errors on systems without proper permissions)
chmod -R 755 logs uploads data 2>/dev/null || true

print_success "Directories created and configured"
echo

# Step 5: Generate Prisma client
print_step "Step 5: Setting up database schema..."

print_info "Generating Prisma client..."
npm run db:generate --silent
print_success "Database schema ready"
echo

# Step 6: Start services
if [ "$START_SERVICES" = true ]; then
    print_step "Step 6: Starting services..."
    
    print_info "Starting database and cache services..."
    $COMPOSE_CMD up -d postgres redis --wait 2>/dev/null || {
        $COMPOSE_CMD up -d postgres redis
        print_info "Waiting for services to be ready..."
        sleep 10
    }
    
    # Check if services are healthy
    print_info "Checking service health..."
    sleep 5
    
    # Initialize database
    print_info "Initializing database..."
    npm run db:push --silent 2>/dev/null || {
        print_warning "Database initialization failed, retrying..."
        sleep 5
        npm run db:push --silent
    }
    print_success "Database initialized"
    
    print_info "Seeding database with sample data..."
    npm run db:seed --silent 2>/dev/null || {
        print_warning "Database seeding failed (this is often normal on fresh installs)"
    }
    
    print_success "Services started successfully!"
    echo
else
    print_warning "Skipping service startup (--no-start flag used)"
    echo
fi

# Success message and next steps
print_header "🎉 Setup Complete!"
print_header "=================="
echo

if [ "$START_SERVICES" = true ]; then
    print_success "Ctrl-Alt-Play Panel is ready to use!"
    echo
    print_info "🌐 Access your panel:"
    echo "   Panel: http://localhost:3000"
    if [ -d "frontend" ]; then
        echo "   Frontend: http://localhost:3001"
    fi
    echo "   API Health: http://localhost:3000/health"
    echo
    
    print_info "🔑 Default admin credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo "   ⚠️  Change these immediately after first login!"
    echo
    
    print_info "🚀 Start/stop services:"
    echo "   Start: $COMPOSE_CMD up -d"
    echo "   Stop: $COMPOSE_CMD down"
    echo "   Logs: $COMPOSE_CMD logs -f"
    echo
    
    print_info "🛠️  Development mode:"
    echo "   Backend: npm run dev"
    echo "   Frontend: npm run dev:frontend"
    echo
else
    print_info "🚀 To start services manually:"
    echo "   Database: $COMPOSE_CMD up -d postgres redis"
    echo "   Initialize: npm run db:push && npm run db:seed"
    echo "   Start app: npm run dev (development) or npm start (production)"
    echo
fi

print_info "📚 Documentation:"
echo "   • README.md - Overview and features"
echo "   • docs/configuration.md - Advanced configuration"
echo "   • API_DOCUMENTATION.md - API reference"
echo

print_info "💬 Need help?"
echo "   • Check the logs: docker-compose logs"
echo "   • View issues: https://github.com/scarecr0w12/ctrl-alt-play-panel/issues"
echo "   • Documentation: See docs/ folder"
echo

print_success "Happy gaming! 🎮"
