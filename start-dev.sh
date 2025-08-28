#!/usr/bin/env bash
set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly MAX_HEALTH_CHECKS=30
readonly HEALTH_CHECK_INTERVAL=2
readonly ENV_FILE=".env"

# Auto-detect compose command
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  echo -e "${RED}Error: Docker Compose not found. Please install Docker and Docker Compose.${NC}"
  echo "Visit: https://docs.docker.com/compose/install/"
  exit 1
fi

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
  cat << EOF
Ctrl-Alt-Play Panel Development Setup Script

USAGE:
  ./start-dev.sh [COMMAND] [OPTIONS]

COMMANDS:
  start, up          Start development environment (default)
  stop, down         Stop all services
  restart            Restart all services
  reset              Reset database and restart services
  logs               Show service logs
  status             Show service status
  migrate            Run database migrations only
  seed               Run database seeding only
  health             Check service health
  clean              Clean up Docker resources
  help               Show this help message

OPTIONS:
  --no-migrate       Skip database migrations
  --no-seed          Skip database seeding
  --no-health-check  Skip health checks
  --force            Force operations without confirmation
  --verbose          Enable verbose output
  --db-reset         Reset database before starting
  --port PORT        Override default port (default: 3000)

EXAMPLES:
  ./start-dev.sh                    # Start with full setup
  ./start-dev.sh --no-migrate       # Start without migrations
  ./start-dev.sh reset --force      # Reset without confirmation
  ./start-dev.sh logs               # View service logs
  ./start-dev.sh stop               # Stop all services

EOF
}

# Generate secure random secret
generate_secret() {
  openssl rand -base64 32 2>/dev/null || \
  head -c 32 /dev/urandom | base64 2>/dev/null || \
  date +%s | sha256sum | base64 | head -c 32
}

# Create or update environment file
setup_environment() {
  local force_reset=${1:-false}
  
  if [[ -f "$ENV_FILE" && "$force_reset" != "true" ]]; then
    log_info "Environment file exists: $ENV_FILE"
    return 0
  fi

  log_info "Creating environment configuration..."
  
  # Generate secrets
  local jwt_secret database_url redis_url
  jwt_secret=$(generate_secret)
  database_url="postgresql://postgres:postgres@localhost:5432/ctrl_alt_play_dev"
  redis_url="redis://localhost:6379"

  # Create .env file
  cat > "$ENV_FILE" << EOF
# Development Environment Configuration
# Generated on $(date)

# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Security
JWT_SECRET=$jwt_secret
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=$database_url

# Redis Configuration  
REDIS_URL=$redis_url

# Agent Discovery
AGENT_DISCOVERY_NETWORKS=192.168.1.0/24,10.0.0.0/8
AGENT_DISCOVERY_INTERVAL=30000
AGENT_HEALTH_CHECK_INTERVAL=10000

# File Manager Settings
UPLOAD_MAX_SIZE=50000000
ALLOWED_FILE_EXTENSIONS=.txt,.log,.json,.yml,.yaml,.md
PLUGIN_DIRECTORY=./plugins

# Development Features
HOT_RELOAD=true
DEBUG_MODE=true
MOCK_EXTERNAL_SERVICES=true

# Docker Compose Settings
POSTGRES_DB=ctrl_alt_play_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_PASSWORD=""
EOF

  log_success "Environment file created: $ENV_FILE"
}

# Check if service is healthy
check_service_health() {
  local service_name="$1"
  local health_url="$2"
  local max_attempts="${3:-$MAX_HEALTH_CHECKS}"
  local interval="${4:-$HEALTH_CHECK_INTERVAL}"
  
  log_info "Checking $service_name health..."
  
  for ((i=1; i<=max_attempts; i++)); do
    if curl -f -s "$health_url" > /dev/null 2>&1; then
      log_success "$service_name is healthy"
      return 0
    fi
    
    if [[ $i -lt $max_attempts ]]; then
      echo -n "."
      sleep "$interval"
    fi
  done
  
  log_error "$service_name health check failed after $max_attempts attempts"
  return 1
}

# Wait for database to be ready
wait_for_database() {
  log_info "Waiting for database to be ready..."
  
  local max_attempts=30
  for ((i=1; i<=max_attempts; i++)); do
    if $COMPOSE exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
      log_success "Database is ready"
      return 0
    fi
    
    if [[ $i -lt $max_attempts ]]; then
      echo -n "."
      sleep 2
    fi
  done
  
  log_error "Database failed to start after $max_attempts attempts"
  return 1
}

# Run database migrations
run_migrations() {
  log_info "Running database migrations..."
  
  if $COMPOSE exec -T backend npx prisma migrate deploy; then
    log_success "Database migrations completed"
    return 0
  else
    log_error "Database migrations failed"
    return 1
  fi
}

# Seed database with initial data
seed_database() {
  log_info "Seeding database with initial data..."
  
  if $COMPOSE exec -T backend npx prisma db seed; then
    log_success "Database seeding completed"
    return 0
  else
    log_warning "Database seeding failed or no seed script available"
    return 0  # Non-critical failure
  fi
}

# Start services
start_services() {
  local skip_migrate="$1"
  local skip_seed="$2"
  local skip_health="$3"
  local db_reset="$4"
  
  log_info "Starting Ctrl-Alt-Play Panel development environment..."
  
  # Reset database if requested
  if [[ "$db_reset" == "true" ]]; then
    log_warning "Resetting database..."
    $COMPOSE down -v
    setup_environment true
  fi
  
  # Start infrastructure services first
  log_info "Starting infrastructure services..."
  if ! $COMPOSE up -d postgres redis; then
    log_error "Failed to start infrastructure services"
    exit 1
  fi
  
  # Wait for database
  if ! wait_for_database; then
    log_error "Database startup failed"
    exit 1
  fi
  
  # Run migrations if not skipped
  if [[ "$skip_migrate" != "true" ]]; then
    if ! run_migrations; then
      log_error "Migration failed - stopping startup"
      exit 1
    fi
  fi
  
  # Start application services
  log_info "Starting application services..."
  if ! $COMPOSE up -d; then
    log_error "Failed to start application services"
    exit 1
  fi
  
  # Seed database if not skipped
  if [[ "$skip_seed" != "true" ]]; then
    sleep 5  # Give backend time to start
    seed_database
  fi
  
  # Health checks if not skipped
  if [[ "$skip_health" != "true" ]]; then
    log_info "Performing health checks..."
    sleep 10  # Give services time to fully start
    
    # Check backend health
    check_service_health "Backend API" "http://localhost:3000/api/health" || true
    
    # Check frontend health
    check_service_health "Frontend" "http://localhost:3001" || true
  fi
  
  # Show service status
  show_service_status
  
  log_success "Development environment is ready!"
  echo ""
  echo -e "${GREEN}🚀 Access your application:${NC}"
  echo -e "  Frontend: ${BLUE}http://localhost:3001${NC}"
  echo -e "  Backend API: ${BLUE}http://localhost:3000${NC}"
  echo -e "  API Documentation: ${BLUE}http://localhost:3000/api/docs${NC}"
  echo ""
  echo -e "${YELLOW}📝 Useful commands:${NC}"
  echo -e "  View logs: ${BLUE}./start-dev.sh logs${NC}"
  echo -e "  Stop services: ${BLUE}./start-dev.sh stop${NC}"
  echo -e "  Check status: ${BLUE}./start-dev.sh status${NC}"
}

# Stop services
stop_services() {
  log_info "Stopping all services..."
  
  if $COMPOSE down; then
    log_success "All services stopped"
  else
    log_error "Failed to stop some services"
    exit 1
  fi
}

# Restart services
restart_services() {
  log_info "Restarting all services..."
  stop_services
  sleep 2
  start_services false false false false
}

# Show service logs
show_logs() {
  local service="${1:-}"
  
  if [[ -n "$service" ]]; then
    log_info "Showing logs for $service..."
    $COMPOSE logs -f "$service"
  else
    log_info "Showing logs for all services..."
    $COMPOSE logs -f
  fi
}

# Show service status
show_service_status() {
  log_info "Service Status:"
  echo ""
  
  # Get container status
  $COMPOSE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
  
  echo ""
  log_info "Quick Health Check:"
  
  # Check if services are responding
  if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "  Backend API: ${GREEN}✓ Healthy${NC}"
  else
    echo -e "  Backend API: ${RED}✗ Unhealthy${NC}"
  fi
  
  if curl -f -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✓ Healthy${NC}"
  else
    echo -e "  Frontend: ${RED}✗ Unhealthy${NC}"
  fi
  
  # Check database connection
  if $COMPOSE exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "  Database: ${GREEN}✓ Ready${NC}"
  else
    echo -e "  Database: ${RED}✗ Not Ready${NC}"
  fi
  
  # Check Redis connection
  if $COMPOSE exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  Redis: ${GREEN}✓ Ready${NC}"
  else
    echo -e "  Redis: ${RED}✗ Not Ready${NC}"
  fi
}

# Clean up Docker resources
clean_docker() {
  local force="$1"
  
  if [[ "$force" != "true" ]]; then
    echo -e "${YELLOW}This will remove all containers, volumes, and networks for this project.${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_info "Cleanup cancelled"
      return 0
    fi
  fi
  
  log_info "Cleaning up Docker resources..."
  
  # Stop and remove containers, networks, and volumes
  $COMPOSE down -v --remove-orphans
  
  # Remove any dangling images related to this project
  if docker images -q --filter="dangling=true" | grep -q .; then
    docker rmi $(docker images -q --filter="dangling=true") 2>/dev/null || true
  fi
  
  log_success "Docker cleanup completed"
}

# Reset database
reset_database() {
  local force="$1"
  
  if [[ "$force" != "true" ]]; then
    echo -e "${YELLOW}This will destroy all data in the development database.${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_info "Database reset cancelled"
      return 0
    fi
  fi
  
  log_info "Resetting database..."
  
  # Stop services
  $COMPOSE stop backend frontend
  
  # Remove database volume
  $COMPOSE down -v postgres
  
  # Restart database
  $COMPOSE up -d postgres
  
  # Wait for database
  wait_for_database
  
  # Run migrations and seeding
  run_migrations
  seed_database
  
  log_success "Database reset completed"
}

# Perform comprehensive health check
comprehensive_health_check() {
  log_info "Performing comprehensive health check..."
  echo ""
  
  local all_healthy=true
  
  # Check Docker
  if ! command -v docker &>/dev/null; then
    log_error "Docker not installed"
    all_healthy=false
  else
    log_success "Docker is available"
  fi
  
  # Check Docker Compose
  if ! command -v docker compose &>/dev/null && ! command -v docker-compose &>/dev/null; then
    log_error "Docker Compose not available"
    all_healthy=false
  else
    log_success "Docker Compose is available ($COMPOSE)"
  fi
  
  # Check if containers are running
  if ! $COMPOSE ps --services --filter "status=running" | grep -q .; then
    log_warning "No services are currently running"
    echo "Run './start-dev.sh start' to start services"
    return 1
  fi
  
  # Check individual services
  local services=("postgres" "redis" "backend" "frontend")
  
  for service in "${services[@]}"; do
    if $COMPOSE ps "$service" --format "table {{.Status}}" | grep -q "Up"; then
      log_success "$service is running"
    else
      log_error "$service is not running"
      all_healthy=false
    fi
  done
  
  # Check service endpoints
  echo ""
  log_info "Checking service endpoints..."
  
  check_service_health "Backend API" "http://localhost:3000/api/health" 5 1 || all_healthy=false
  check_service_health "Frontend" "http://localhost:3001" 5 1 || all_healthy=false
  
  # Database connectivity
  if wait_for_database; then
    log_success "Database connectivity verified"
  else
    log_error "Database connectivity failed"
    all_healthy=false
  fi
  
  echo ""
  if [[ "$all_healthy" == "true" ]]; then
    log_success "All health checks passed ✅"
    return 0
  else
    log_error "Some health checks failed ❌"
    return 1
  fi
}

# Parse command line arguments
parse_arguments() {
  COMMAND="start"
  SKIP_MIGRATE=false
  SKIP_SEED=false
  SKIP_HEALTH=false
  FORCE=false
  VERBOSE=false
  DB_RESET=false
  PORT=3000
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      start|up)
        COMMAND="start"
        shift
        ;;
      stop|down)
        COMMAND="stop"
        shift
        ;;
      restart)
        COMMAND="restart"
        shift
        ;;
      reset)
        COMMAND="reset"
        shift
        ;;
      logs)
        COMMAND="logs"
        shift
        ;;
      status)
        COMMAND="status"
        shift
        ;;
      migrate)
        COMMAND="migrate"
        shift
        ;;
      seed)
        COMMAND="seed"
        shift
        ;;
      health)
        COMMAND="health"
        shift
        ;;
      clean)
        COMMAND="clean"
        shift
        ;;
      help|--help|-h)
        show_help
        exit 0
        ;;
      --no-migrate)
        SKIP_MIGRATE=true
        shift
        ;;
      --no-seed)
        SKIP_SEED=true
        shift
        ;;
      --no-health-check)
        SKIP_HEALTH=true
        shift
        ;;
      --force)
        FORCE=true
        shift
        ;;
      --verbose)
        VERBOSE=true
        set -x
        shift
        ;;
      --db-reset)
        DB_RESET=true
        shift
        ;;
      --port)
        PORT="$2"
        shift 2
        ;;
      *)
        log_error "Unknown option: $1"
        echo "Use './start-dev.sh help' for usage information"
        exit 1
        ;;
    esac
  done
  
  # Export port for docker-compose
  export PORT
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check if docker-compose.yml exists
  if [[ ! -f "docker-compose.yml" ]]; then
    log_error "docker-compose.yml not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
  fi
  
  # Check Docker daemon
  if ! docker info > /dev/null 2>&1; then
    log_error "Docker daemon is not running"
    echo "Please start Docker and try again"
    exit 1
  fi
  
  log_success "Prerequisites check passed"
}

# Main execution
main() {
  echo -e "${BLUE}"
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║               Ctrl-Alt-Play Panel Dev Environment            ║"
  echo "║                    Development Setup Script                  ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  
  parse_arguments "$@"
  check_prerequisites
  
  case $COMMAND in
    start)
      setup_environment "$DB_RESET"
      start_services "$SKIP_MIGRATE" "$SKIP_SEED" "$SKIP_HEALTH" "$DB_RESET"
      ;;
    stop)
      stop_services
      ;;
    restart)
      restart_services
      ;;
    reset)
      reset_database "$FORCE"
      ;;
    logs)
      show_logs "${2:-}"
      ;;
    status)
      show_service_status
      ;;
    migrate)
      wait_for_database
      run_migrations
      ;;
    seed)
      wait_for_database
      seed_database
      ;;
    health)
      comprehensive_health_check
      ;;
    clean)
      clean_docker "$FORCE"
      ;;
    *)
      log_error "Unknown command: $COMMAND"
      show_help
      exit 1
      ;;
  esac
}

# Trap signals for cleanup
trap 'echo -e "\n${YELLOW}Script interrupted${NC}"; exit 130' INT TERM

# Execute main function with all arguments
main "$@"