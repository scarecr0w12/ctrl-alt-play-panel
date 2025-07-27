#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
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

# Test the function
echo "Testing Docker Compose detection..."
if detect_docker_compose; then
    print_success "Docker Compose command set to: $DOCKER_COMPOSE_CMD"
    
    # Test the command
    echo "Testing the detected command..."
    $DOCKER_COMPOSE_CMD --version
else
    print_error "Docker Compose detection failed"
fi
