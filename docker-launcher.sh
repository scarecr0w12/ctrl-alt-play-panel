#!/bin/bash

# Docker Compose Profile Launcher for Ctrl-Alt-Play Panel
# Automatically starts the correct database service based on DB_TYPE

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Set defaults
DB_TYPE=${DB_TYPE:-postgresql}
DB_LOCAL=${DB_LOCAL:-true}

print_info "🗄️ Database Type: $DB_TYPE"
print_info "📍 Local Database: $DB_LOCAL"

# Function to start with appropriate profile
start_services() {
    if [ "$DB_LOCAL" = "true" ]; then
        case $DB_TYPE in
            "postgresql")
                print_info "🐘 Starting with PostgreSQL profile"
                docker-compose --profile postgresql up -d
                ;;
            "mysql")
                print_info "🐬 Starting with MySQL profile"
                docker-compose --profile mysql up -d
                ;;
            "mariadb")
                print_info "🦭 Starting with MariaDB profile"
                docker-compose --profile mariadb up -d
                ;;
            "mongodb")
                print_info "🍃 Starting with MongoDB profile"
                docker-compose --profile mongodb up -d
                ;;
            "sqlite")
                print_info "📁 Starting without database profile (SQLite)"
                docker-compose up -d ctrl-alt-play redis
                ;;
            *)
                print_error "Unknown database type: $DB_TYPE"
                exit 1
                ;;
        esac
    else
        print_info "🌐 Starting without local database (using remote)"
        docker-compose up -d ctrl-alt-play redis
    fi
}

# Function to stop services
stop_services() {
    print_info "🛑 Stopping all services"
    docker-compose down
}

# Function to restart services
restart_services() {
    print_info "🔄 Restarting services"
    stop_services
    start_services
}

# Function to show logs
show_logs() {
    docker-compose logs -f "${1:-}"
}

# Function to show status
show_status() {
    docker-compose ps
}

# Main execution
case "${1:-start}" in
    "start")
        start_services
        print_success "🚀 Services started successfully!"
        print_info "📊 Use './docker-launcher.sh status' to check service status"
        print_info "📋 Use './docker-launcher.sh logs' to view logs"
        ;;
    "stop")
        stop_services
        print_success "🛑 Services stopped successfully!"
        ;;
    "restart")
        restart_services
        print_success "🔄 Services restarted successfully!"
        ;;
    "logs")
        print_info "📋 Showing logs (Ctrl+C to exit)"
        show_logs "${2:-}"
        ;;
    "status")
        print_info "📊 Service Status:"
        show_status
        ;;
    "help"|"-h"|"--help")
        echo "Docker Compose Launcher for Ctrl-Alt-Play Panel"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  start    Start services with appropriate database profile (default)"
        echo "  stop     Stop all services"
        echo "  restart  Restart all services"
        echo "  logs     Show logs (optionally specify service name)"
        echo "  status   Show service status"
        echo "  help     Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start                 # Start with database from .env"
        echo "  $0 logs ctrl-alt-play    # Show application logs"
        echo "  $0 logs postgres         # Show PostgreSQL logs"
        echo ""
        echo "Environment variables:"
        echo "  DB_TYPE   Database type (postgresql|mysql|mariadb|mongodb|sqlite)"
        echo "  DB_LOCAL  Use local database container (true|false)"
        ;;
    *)
        print_error "Unknown command: $1"
        print_info "Use '$0 help' for usage information"
        exit 1
        ;;
esac
