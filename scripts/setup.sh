#!/bin/bash

# Ctrl-Alt-Play Panel Setup Script
echo "🎮 Ctrl-Alt-Play Panel Setup Script v1.2.0"
echo "==============================================="

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check for required tools
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    print_info "Install from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18+."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    print_info "Install from: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check for Docker Compose v2 or v1
COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    print_info "Install from: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "All prerequisites found!"
print_info "Node.js: $(node -v)"
print_info "npm: $(npm -v)"
print_info "Docker: $(docker -v | cut -d',' -f1)"
print_info "Docker Compose: $($COMPOSE_CMD version --short 2>/dev/null || echo 'v1')"

# Navigate to project root
cd "$PROJECT_ROOT"

# Create environment file
if [ ! -f .env ]; then
    print_info "Creating environment file..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from template"
        print_warning "Please edit .env file with your configuration before proceeding"
        print_warning "Important: Change JWT_SECRET and AGENT_SECRET to secure random values!"
    else
        print_error ".env.example file not found"
        exit 1
    fi
else
    print_success "Environment file already exists"
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
if [ -d "frontend" ]; then
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    cd ..
else
    print_warning "Frontend directory not found, skipping frontend setup"
fi

# Create necessary directories
print_info "Creating directories..."
mkdir -p logs uploads data
mkdir -p logs/permissions logs/security
mkdir -p nginx/ssl

# Set proper permissions
chmod -R 755 logs uploads data 2>/dev/null || true

print_success "Directories created successfully"

# Generate Prisma client
print_info "Setting up database schema..."
npm run db:generate

if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi

print_success "🚀 Setup complete!"
echo ""
print_info "Next steps:"
echo "1. 📝 Edit .env file with your configuration"
echo "   - Set secure JWT_SECRET and AGENT_SECRET"
echo "   - Configure database and Redis URLs"
echo ""
echo "2. 🗄️  Start the database services:"
echo "   $COMPOSE_CMD up -d postgres redis"
echo ""
echo "3. 🔄 Initialize the database:"
echo "   npm run db:push"
echo "   npm run db:seed"
echo ""
echo "4. 🚀 Start the application:"
echo "   - Development: npm run dev"
echo "   - Production: $COMPOSE_CMD up -d"
echo ""
print_warning "Default admin credentials (change after first login):"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
print_info "Access points:"
echo "  - Panel: http://localhost:3000"
echo "  - Frontend: http://localhost:3001 (if enabled)"
echo "  - API Docs: http://localhost:3000/api-docs"
