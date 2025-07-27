#!/bin/bash

# Ctrl-Alt-Play Panel - Frontend Setup Script v1.2.0
echo "🎮 Setting up Frontend for Ctrl-Alt-Play Panel"
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

# Check if we're in the right directory
cd "$PROJECT_ROOT"

if [ ! -f "package.json" ]; then
    print_error "Please run this script from the ctrl-alt-play-panel root directory"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found"
    print_info "This script requires the frontend to be already set up"
    print_info "Please ensure all frontend files are properly created"
    exit 1
fi

# Install backend dependencies first
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend

if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found"
    print_info "Please ensure the frontend is properly configured"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_success "Frontend dependencies installed"

# Return to project root
cd "$PROJECT_ROOT"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found"
    print_info "Run the main setup script first: ./scripts/setup.sh"
fi

print_success "🚀 Frontend setup complete!"
echo ""
print_info "Development servers:"
echo ""
echo "Terminal 1 (Backend API):"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
print_info "Access points:"
echo "  - Frontend: http://localhost:3001"
echo "  - Backend API: http://localhost:3000"
echo "  - API Documentation: http://localhost:3000/api-docs"
echo ""
print_warning "Demo Credentials (change after first login):"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
print_info "For more information, see frontend/README.md"
