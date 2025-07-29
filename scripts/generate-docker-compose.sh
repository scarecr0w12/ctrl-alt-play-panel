#!/bin/bash

# Docker Compose Generator for Ctrl-Alt-Play Panel
# Dynamically generates docker-compose.yml based on database configuration

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

# Load environment configuration
load_env_config() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please run setup wizard first."
        exit 1
    fi
    
    # Source environment variables
    export $(grep -v '^#' .env | xargs)
    
    # Set defaults if not present
    DB_TYPE=${DB_TYPE:-postgresql}
    DB_LOCAL=${DB_LOCAL:-true}
    DB_VARIANT=${DB_VARIANT:-postgres}
}

# Generate base docker-compose structure
generate_base_compose() {
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Main application service
  ctrl-alt-play:
    build:
      context: .
      dockerfile: Dockerfile
      target: ${NODE_ENV:-development}
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - PORT=${PORT:-3000}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
EOF

    # Add database dependency if local
    if [ "$DB_LOCAL" = "true" ] && [ "$DB_TYPE" != "sqlite" ]; then
        echo "      - database" >> docker-compose.yml
    fi

    # Add Redis dependency
    echo "      - redis" >> docker-compose.yml
    
    cat >> docker-compose.yml << 'EOF'
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "src/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # Redis cache service
  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

EOF
}

# Add database service based on type
add_database_service() {
    if [ "$DB_LOCAL" != "true" ]; then
        print_info "Skipping local database service (using remote database)"
        return
    fi

    case $DB_TYPE in
        postgresql)
            add_postgresql_service
            ;;
        mysql)
            add_mysql_service
            ;;
        mongodb)
            add_mongodb_service
            ;;
        sqlite)
            print_info "SQLite doesn't require a Docker service"
            ;;
        *)
            print_error "Unsupported database type: $DB_TYPE"
            exit 1
            ;;
    esac
}

add_postgresql_service() {
    cat >> docker-compose.yml << EOF
  # PostgreSQL database service
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: \${DB_NAME:-ctrl_alt_play}
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256'
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres} -d \${DB_NAME:-ctrl_alt_play}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

EOF
}

add_mysql_service() {
    local image="mysql:8.0"
    if [ "$DB_VARIANT" = "mariadb" ]; then
        image="mariadb:10.11"
    fi

    cat >> docker-compose.yml << EOF
  # MySQL/MariaDB database service
  database:
    image: $image
    environment:
      MYSQL_DATABASE: \${DB_NAME:-ctrl_alt_play}
      MYSQL_USER: \${DB_USER:-ctrl_alt_play}
      MYSQL_PASSWORD: \${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD}
    ports:
      - "\${DB_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

EOF
}

add_mongodb_service() {
    cat >> docker-compose.yml << 'EOF'
  # MongoDB database service
  database:
    image: mongo:7.0
    environment:
EOF

    # Add authentication if configured
    if [ -n "${DB_USER:-}" ]; then
        cat >> docker-compose.yml << EOF
      MONGO_INITDB_ROOT_USERNAME: \${DB_USER}
      MONGO_INITDB_ROOT_PASSWORD: \${DB_PASSWORD}
      MONGO_INITDB_DATABASE: \${DB_NAME:-ctrl_alt_play}
EOF
    fi

    cat >> docker-compose.yml << 'EOF'
    ports:
      - "${DB_PORT:-27017}:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

EOF
}

# Add volume definitions
add_volumes() {
    echo "" >> docker-compose.yml
    echo "volumes:" >> docker-compose.yml
    echo "  redis_data:" >> docker-compose.yml
    
    if [ "$DB_LOCAL" = "true" ]; then
        case $DB_TYPE in
            postgresql)
                echo "  postgres_data:" >> docker-compose.yml
                ;;
            mysql)
                echo "  mysql_data:" >> docker-compose.yml
                ;;
            mongodb)
                echo "  mongodb_data:" >> docker-compose.yml
                ;;
        esac
    fi
}

# Generate nginx configuration if needed
generate_nginx_config() {
    if [ "${NGINX_ENABLED:-false}" = "true" ]; then
        cat >> docker-compose.yml << 'EOF'

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - ctrl-alt-play
    restart: unless-stopped

EOF
    fi
}

# Generate production overrides
generate_production_compose() {
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  ctrl-alt-play:
    build:
      target: production
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  redis:
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

EOF

    # Add production database configurations
    if [ "$DB_LOCAL" = "true" ]; then
        case $DB_TYPE in
            postgresql)
                cat >> docker-compose.prod.yml << 'EOF'
  database:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

EOF
                ;;
            mysql)
                cat >> docker-compose.prod.yml << 'EOF'
  database:
    command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=256M
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

EOF
                ;;
            mongodb)
                cat >> docker-compose.prod.yml << 'EOF'
  database:
    command: mongod --wiredTigerCacheSizeGB 0.25
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

EOF
                ;;
        esac
    fi
}

# Main generation function
main() {
    print_info "🐳 Generating Docker Compose configuration..."
    
    # Load configuration
    load_env_config
    
    print_info "Database type: $DB_TYPE"
    print_info "Local database: $DB_LOCAL"
    if [ -n "${DB_VARIANT:-}" ]; then
        print_info "Database variant: $DB_VARIANT"
    fi
    
    # Backup existing file
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.yml.backup
        print_info "Backed up existing docker-compose.yml"
    fi
    
    # Generate configuration
    generate_base_compose
    add_database_service
    generate_nginx_config
    add_volumes
    
    # Generate production overrides
    if [ "${NODE_ENV:-}" = "production" ]; then
        generate_production_compose
        print_success "Generated docker-compose.prod.yml for production"
    fi
    
    print_success "✅ Docker Compose configuration generated"
    print_info "📁 Files created:"
    echo "   - docker-compose.yml"
    if [ "${NODE_ENV:-}" = "production" ]; then
        echo "   - docker-compose.prod.yml"
    fi
    
    # Validate configuration
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose config >/dev/null 2>&1; then
            print_success "Docker Compose configuration is valid"
        else
            print_warning "Docker Compose configuration validation failed"
        fi
    fi
}

# Show usage if no env file
show_usage() {
    echo "Docker Compose Generator for Ctrl-Alt-Play Panel"
    echo
    echo "This script generates docker-compose.yml based on your .env configuration."
    echo
    echo "Usage: $0"
    echo
    echo "Prerequisites:"
    echo "  - .env file must exist (run setup wizard first)"
    echo "  - Database configuration must be present in .env"
    echo
    echo "Generated files:"
    echo "  - docker-compose.yml (base configuration)"
    echo "  - docker-compose.prod.yml (production overrides)"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    show_usage
    exit 1
fi

# Run main function
main "$@"
