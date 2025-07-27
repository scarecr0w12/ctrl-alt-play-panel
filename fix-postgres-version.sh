#!/bin/bash

# PostgreSQL Version Compatibility Resolver
# Resolves PostgreSQL version conflicts in Docker setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${NC}                    PostgreSQL Version Compatibility Resolver                ${PURPLE}║${NC}"
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

# Detect Docker Compose command
detect_docker_compose() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        print_error "Docker Compose not found"
        exit 1
    fi
}

# Main function
main() {
    print_header
    
    COMPOSE_CMD=$(detect_docker_compose)
    print_info "Using Docker Compose command: $COMPOSE_CMD"
    
    echo "This script will help resolve PostgreSQL version compatibility issues."
    echo "Your database was initialized with PostgreSQL 16, but Docker was trying to use version 15."
    echo ""
    
    echo "Available options:"
    echo "1. Update Docker to use PostgreSQL 16 (RECOMMENDED - already done)"
    echo "2. Backup current data and recreate with PostgreSQL 16"
    echo "3. Remove all data and start fresh"
    echo "4. Exit without changes"
    echo ""
    
    read -p "Choose an option (1-4): " choice
    
    case $choice in
        1)
            print_info "Docker Compose configuration has already been updated to use PostgreSQL 16"
            print_info "Attempting to restart services..."
            
            $COMPOSE_CMD -f docker-compose.prod.yml down
            print_success "Services stopped"
            
            $COMPOSE_CMD -f docker-compose.prod.yml up -d postgres redis
            print_info "Starting PostgreSQL 16 and Redis..."
            
            # Wait for PostgreSQL to be ready
            print_info "Waiting for PostgreSQL to be ready..."
            sleep 10
            
            if $COMPOSE_CMD -f docker-compose.prod.yml exec postgres pg_isready -U postgres; then
                print_success "PostgreSQL is ready!"
                
                # Start the main application
                $COMPOSE_CMD -f docker-compose.prod.yml up -d
                print_success "All services started successfully"
                
                print_info "Checking service status..."
                $COMPOSE_CMD -f docker-compose.prod.yml ps
                
            else
                print_error "PostgreSQL failed to start. Please check logs:"
                print_info "Run: $COMPOSE_CMD -f docker-compose.prod.yml logs postgres"
            fi
            ;;
            
        2)
            print_warning "This will backup your current database and recreate it"
            read -p "Are you sure? (y/N): " confirm
            
            if [[ $confirm =~ ^[Yy]$ ]]; then
                # Create backup directory
                mkdir -p ./backups/$(date +%Y%m%d_%H%M%S)
                BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
                
                print_info "Creating backup in $BACKUP_DIR..."
                
                # Try to create a backup if PostgreSQL is running
                if $COMPOSE_CMD -f docker-compose.prod.yml exec postgres pg_isready -U postgres &> /dev/null; then
                    $COMPOSE_CMD -f docker-compose.prod.yml exec postgres pg_dump -U postgres ctrl_alt_play > "$BACKUP_DIR/database_backup.sql"
                    print_success "Database backup created: $BACKUP_DIR/database_backup.sql"
                else
                    print_warning "PostgreSQL not accessible for backup"
                fi
                
                # Stop services and remove volumes
                $COMPOSE_CMD -f docker-compose.prod.yml down -v
                print_success "Services stopped and volumes removed"
                
                # Start fresh with PostgreSQL 16
                $COMPOSE_CMD -f docker-compose.prod.yml up -d
                print_success "Services restarted with PostgreSQL 16"
                
                # Wait and initialize database
                sleep 15
                print_info "Initializing database..."
                $COMPOSE_CMD -f docker-compose.prod.yml exec app npm run db:push
                
                if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
                    print_info "Would you like to restore the backup? (y/N)"
                    read -p "> " restore
                    if [[ $restore =~ ^[Yy]$ ]]; then
                        cat "$BACKUP_DIR/database_backup.sql" | $COMPOSE_CMD -f docker-compose.prod.yml exec -T postgres psql -U postgres -d ctrl_alt_play
                        print_success "Database backup restored"
                    fi
                fi
            else
                print_info "Backup and recreate cancelled"
            fi
            ;;
            
        3)
            print_warning "This will PERMANENTLY DELETE all database data"
            read -p "Are you absolutely sure? Type 'DELETE' to confirm: " confirm
            
            if [ "$confirm" = "DELETE" ]; then
                $COMPOSE_CMD -f docker-compose.prod.yml down -v
                print_success "All data removed"
                
                $COMPOSE_CMD -f docker-compose.prod.yml up -d
                print_success "Services restarted with fresh PostgreSQL 16"
                
                sleep 15
                print_info "Initializing fresh database..."
                $COMPOSE_CMD -f docker-compose.prod.yml exec app npm run db:push
                $COMPOSE_CMD -f docker-compose.prod.yml exec app npm run seed
                print_success "Fresh database initialized with seed data"
            else
                print_info "Fresh start cancelled"
            fi
            ;;
            
        4)
            print_info "Exiting without changes"
            exit 0
            ;;
            
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "PostgreSQL version compatibility resolved!"
    print_info "You can now access your application at: http://localhost:3000"
    print_info "Check service status with: $COMPOSE_CMD -f docker-compose.prod.yml ps"
    print_info "View logs with: $COMPOSE_CMD -f docker-compose.prod.yml logs"
}

# Run main function
main "$@"
