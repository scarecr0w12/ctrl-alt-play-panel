#!/bin/bash

# Ctrl-Alt-Play Panel Docker Startup Script
# Linux Distribution Agnostic
# Compatible with Ubuntu, Debian, CentOS, RHEL, Alpine, Arch, etc.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env"
PROD_ENV_EXAMPLE="${SCRIPT_DIR}/.env.production.example"

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_error() { print_message "$RED" "❌ $1"; }
print_success() { print_message "$GREEN" "✅ $1"; }
print_warning() { print_message "$YELLOW" "⚠️  $1"; }
print_info() { print_message "$BLUE" "ℹ️  $1"; }

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. Consider using a non-root user for security."
    fi
}

# Detect Linux distribution
detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
    elif command -v lsb_release >/dev/null 2>&1; then
        DISTRO=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
        VERSION=$(lsb_release -sr)
    elif [[ -f /etc/redhat-release ]]; then
        DISTRO="rhel"
        VERSION=$(cat /etc/redhat-release | grep -oE '[0-9]+\.[0-9]+')
    else
        DISTRO="unknown"
        VERSION="unknown"
    fi
    
    print_info "Detected Linux distribution: $DISTRO $VERSION"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "Install Docker: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # Check if Docker service is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker service is not running. Please start Docker."
        case $DISTRO in
            ubuntu|debian)
                print_info "Start Docker: sudo systemctl start docker"
                ;;
            centos|rhel|fedora)
                print_info "Start Docker: sudo systemctl start docker"
                ;;
            arch)
                print_info "Start Docker: sudo systemctl start docker"
                ;;
            alpine)
                print_info "Start Docker: sudo rc-service docker start"
                ;;
            *)
                print_info "Start Docker with your system's service manager"
                ;;
        esac
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check Docker Compose version
check_docker_compose() {
    # Check for Docker Compose v2 (plugin)
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
        COMPOSE_VERSION=$(docker compose version --short)
        print_success "Docker Compose v2 detected: $COMPOSE_VERSION"
    # Fallback to Docker Compose v1 (standalone)
    elif command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
        COMPOSE_VERSION=$(docker-compose version --short)
        print_warning "Docker Compose v1 detected: $COMPOSE_VERSION"
        print_warning "Consider upgrading to Docker Compose v2 for better performance"
    else
        print_error "Docker Compose is not installed."
        print_info "Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

# Check environment file
check_environment() {
    if [[ ! -f "$ENV_FILE" ]]; then
        print_warning "Environment file not found: $ENV_FILE"
        
        if [[ -f "$PROD_ENV_EXAMPLE" ]]; then
            print_info "Copying example environment file..."
            cp "$PROD_ENV_EXAMPLE" "$ENV_FILE"
            print_warning "Please edit $ENV_FILE and update the configuration values"
            print_warning "Especially change the JWT_SECRET and AGENT_SECRET values!"
        else
            print_error "Example environment file not found: $PROD_ENV_EXAMPLE"
            exit 1
        fi
    else
        print_success "Environment file found: $ENV_FILE"
    fi
}

# Create required directories
create_directories() {
    local dirs=("uploads" "logs" "data" "nginx/ssl")
    
    for dir in "${dirs[@]}"; do
        local full_path="${SCRIPT_DIR}/${dir}"
        if [[ ! -d "$full_path" ]]; then
            mkdir -p "$full_path"
            print_success "Created directory: $dir"
        fi
    done
    
    # Set proper permissions (Linux distribution agnostic)
    chmod -R 755 "${SCRIPT_DIR}/uploads" "${SCRIPT_DIR}/logs" "${SCRIPT_DIR}/data" 2>/dev/null || true
}

# Start services
start_services() {
    print_info "Starting Ctrl-Alt-Play Panel services..."
    
    # Pull latest images
    print_info "Pulling Docker images..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" pull
    
    # Build and start services
    print_info "Building and starting services..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --build
    
    print_success "Services started successfully!"
    print_info "Panel URL: http://localhost:3000"
    print_info "Agent WebSocket: ws://localhost:8080"
}

# Stop services
stop_services() {
    print_info "Stopping Ctrl-Alt-Play Panel services..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" down
    print_success "Services stopped successfully!"
}

# Show status
show_status() {
    print_info "Service Status:"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
}

# Show logs
show_logs() {
    local service=${1:-}
    if [[ -n "$service" ]]; then
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f "$service"
    else
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
    fi
}

# Update services
update_services() {
    print_info "Updating Ctrl-Alt-Play Panel..."
    
    # Pull latest images
    $COMPOSE_CMD -f "$COMPOSE_FILE" pull
    
    # Rebuild and restart
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --build
    
    print_success "Update completed!"
}

# Main function
main() {
    case "${1:-start}" in
        start)
            check_root
            detect_distro
            check_docker
            check_docker_compose
            check_environment
            create_directories
            start_services
            ;;
        stop)
            check_docker_compose
            stop_services
            ;;
        restart)
            check_docker_compose
            stop_services
            sleep 2
            start_services
            ;;
        status)
            check_docker_compose
            show_status
            ;;
        logs)
            check_docker_compose
            show_logs "${2:-}"
            ;;
        update)
            check_root
            check_docker
            check_docker_compose
            update_services
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs [service]|update}"
            echo ""
            echo "Commands:"
            echo "  start   - Start all services"
            echo "  stop    - Stop all services"
            echo "  restart - Restart all services"
            echo "  status  - Show service status"
            echo "  logs    - Show logs (optionally for specific service)"
            echo "  update  - Update and restart services"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
