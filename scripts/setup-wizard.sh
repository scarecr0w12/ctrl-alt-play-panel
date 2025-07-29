#!/bin/bash

# Ctrl-Alt-Play Panel - Interactive Setup Wizard
# Advanced configuration wizard with intelligent defaults and validation

set -euo pipefail

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✅"
CROSS="❌"
WARN="⚠️"
INFO="💡"
ROCKET="🚀"
GEAR="⚙️"
LOCK="🔒"
DB="🗄️"
MAIL="📧"
GLOBE="🌐"

# Configuration variables
CONFIG_FILE=".env"
BACKUP_FILE=".env.backup"
WIZARD_LOG="setup-wizard.log"

# Default values
DEFAULT_ENVIRONMENT="development"
DEFAULT_PORT="3000"
DEFAULT_DB_HOST="postgres"
DEFAULT_DB_PORT="5432"
DEFAULT_DB_NAME="ctrl_alt_play"
DEFAULT_DB_USER="postgres"
DEFAULT_REDIS_HOST="redis"
DEFAULT_REDIS_PORT="6379"
DEFAULT_DOMAIN="localhost"

# Configuration storage
declare -A CONFIG

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$WIZARD_LOG"
}

# Print functions
print_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🎮 Ctrl-Alt-Play Panel Setup Wizard                      ║"
    echo "║                          Interactive Configuration                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GRAY}Advanced setup with intelligent defaults and real-time validation${NC}"
    echo
}

print_section() {
    echo -e "\n${CYAN}═══ $1 ═══${NC}"
    log "Starting section: $1"
}

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}${WARN} $1${NC}"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
    log "ERROR: $1"
}

print_info() {
    echo -e "${CYAN}${INFO} $1${NC}"
}

# Input validation functions
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1 ] && [ $port -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

validate_domain() {
    local domain=$1
    if [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Prompt functions
prompt_choice() {
    local prompt=$1
    local default=$2
    local options=$3
    
    echo -e "${WHITE}$prompt${NC}"
    echo -e "${GRAY}Options: $options${NC}"
    echo -e "${GRAY}Default: $default${NC}"
    
    read -p "Enter choice: " choice
    choice=${choice:-$default}
    echo "$choice"
}

prompt_input() {
    local prompt=$1
    local default=$2
    local validation_func=${3:-}
    
    while true; do
        echo -e "${WHITE}$prompt${NC}"
        if [ -n "$default" ]; then
            echo -e "${GRAY}Default: $default${NC}"
        fi
        
        read -p "Enter value: " input
        input=${input:-$default}
        
        if [ -n "$validation_func" ]; then
            if $validation_func "$input"; then
                echo "$input"
                return 0
            else
                print_error "Invalid input. Please try again."
                continue
            fi
        else
            echo "$input"
            return 0
        fi
    done
}

prompt_password() {
    local prompt=$1
    local confirm=${2:-true}
    
    while true; do
        echo -e "${WHITE}$prompt${NC}"
        read -s -p "Enter password: " password1
        echo
        
        if [ "$confirm" = true ]; then
            read -s -p "Confirm password: " password2
            echo
            
            if [ "$password1" = "$password2" ]; then
                echo "$password1"
                return 0
            else
                print_error "Passwords do not match. Please try again."
                continue
            fi
        else
            echo "$password1"
            return 0
        fi
    done
}

prompt_yes_no() {
    local prompt=$1
    local default=${2:-"n"}
    
    local default_text
    if [ "$default" = "y" ]; then
        default_text="Y/n"
    else
        default_text="y/N"
    fi
    
    while true; do
        echo -e "${WHITE}$prompt${NC} ${GRAY}[$default_text]${NC}"
        read -p "" response
        response=${response:-$default}
        
        case $response in
            [Yy]|[Yy][Ee][Ss])
                echo "y"
                return 0
                ;;
            [Nn]|[Nn][Oo])
                echo "n"
                return 0
                ;;
            *)
                print_error "Please answer yes or no."
                ;;
        esac
    done
}

# Generate secure secrets
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Configuration sections
configure_environment() {
    print_section "${GEAR} Environment Configuration"
    
    print_step "Select your deployment environment:"
    echo "  • development - Local development with debug features"
    echo "  • staging     - Pre-production testing environment"  
    echo "  • production  - Live production deployment"
    echo
    
    CONFIG[NODE_ENV]=$(prompt_choice "Environment:" "$DEFAULT_ENVIRONMENT" "development|staging|production")
    
    print_step "Configure application port:"
    CONFIG[PORT]=$(prompt_input "Application port:" "$DEFAULT_PORT" validate_port)
    
    print_success "Environment configuration completed"
}

configure_database() {
    print_section "${DB} Database Configuration"
    
    print_step "Select your database type:"
    echo "  • postgresql - PostgreSQL (recommended for production)"
    echo "  • mysql      - MySQL/MariaDB (widely compatible)"
    echo "  • mongodb    - MongoDB (NoSQL, document-based)"
    echo "  • sqlite     - SQLite (development/testing only)"
    echo
    
    CONFIG[DB_TYPE]=$(prompt_choice "Database type:" "postgresql" "postgresql|mysql|mongodb|sqlite")
    
    case ${CONFIG[DB_TYPE]} in
        postgresql)
            configure_postgresql
            ;;
        mysql)
            configure_mysql
            ;;
        mongodb)
            configure_mongodb
            ;;
        sqlite)
            configure_sqlite
            ;;
    esac
    
    print_success "Database configuration completed"
}

configure_postgresql() {
    print_step "PostgreSQL Configuration:"
    
    # Local vs Remote
    local_db=$(prompt_yes_no "Use local PostgreSQL Docker container?" "y")
    if [ "$local_db" = "y" ]; then
        CONFIG[DB_HOST]="postgres"
        CONFIG[DB_PORT]="5432"
        CONFIG[DB_LOCAL]="true"
        print_info "Local PostgreSQL container will be created automatically"
    else
        CONFIG[DB_HOST]=$(prompt_input "PostgreSQL host:" "localhost")
        CONFIG[DB_PORT]=$(prompt_input "PostgreSQL port:" "5432" validate_port)
        CONFIG[DB_LOCAL]="false"
        
        # SSL option for remote connections
        if [ "${CONFIG[DB_HOST]}" != "localhost" ]; then
            CONFIG[DB_SSL]=$(prompt_yes_no "Enable SSL connection?" "y")
        else
            CONFIG[DB_SSL]="false"
        fi
    fi
    
    CONFIG[DB_NAME]=$(prompt_input "Database name:" "ctrl_alt_play")
    CONFIG[DB_USER]=$(prompt_input "Database username:" "postgres")
    CONFIG[DB_PASSWORD]=$(prompt_password "Database password:")
    
    # Test connection for remote databases
    if [ "${CONFIG[DB_LOCAL]}" = "false" ]; then
        test_database_connection
    fi
}

configure_mysql() {
    print_step "MySQL/MariaDB Configuration:"
    
    # MySQL vs MariaDB selection
    mysql_variant=$(prompt_choice "MySQL variant:" "mysql" "mysql|mariadb")
    CONFIG[DB_VARIANT]=$mysql_variant
    
    # Local vs Remote
    local_db=$(prompt_yes_no "Use local $mysql_variant Docker container?" "y")
    if [ "$local_db" = "y" ]; then
        CONFIG[DB_HOST]="mysql"
        CONFIG[DB_PORT]="3306"
        CONFIG[DB_LOCAL]="true"
        print_info "Local $mysql_variant container will be created automatically"
    else
        CONFIG[DB_HOST]=$(prompt_input "MySQL host:" "localhost")
        CONFIG[DB_PORT]=$(prompt_input "MySQL port:" "3306" validate_port)
        CONFIG[DB_LOCAL]="false"
        
        # SSL option for remote connections
        if [ "${CONFIG[DB_HOST]}" != "localhost" ]; then
            CONFIG[DB_SSL]=$(prompt_yes_no "Enable SSL connection?" "y")
        else
            CONFIG[DB_SSL]="false"
        fi
    fi
    
    CONFIG[DB_NAME]=$(prompt_input "Database name:" "ctrl_alt_play")
    CONFIG[DB_USER]=$(prompt_input "Database username:" "ctrl_alt_play")
    CONFIG[DB_PASSWORD]=$(prompt_password "Database password:")
    
    # Test connection for remote databases
    if [ "${CONFIG[DB_LOCAL]}" = "false" ]; then
        test_database_connection
    fi
}

configure_mongodb() {
    print_step "MongoDB Configuration:"
    
    # Local vs Remote
    local_db=$(prompt_yes_no "Use local MongoDB Docker container?" "y")
    if [ "$local_db" = "y" ]; then
        CONFIG[DB_HOST]="mongodb"
        CONFIG[DB_PORT]="27017"
        CONFIG[DB_LOCAL]="true"
        print_info "Local MongoDB container will be created automatically"
    else
        CONFIG[DB_HOST]=$(prompt_input "MongoDB host:" "localhost")
        CONFIG[DB_PORT]=$(prompt_input "MongoDB port:" "27017" validate_port)
        CONFIG[DB_LOCAL]="false"
        
        # Authentication for MongoDB
        auth_required=$(prompt_yes_no "Does MongoDB require authentication?" "n")
        if [ "$auth_required" = "y" ]; then
            CONFIG[DB_USER]=$(prompt_input "Database username:" "")
            CONFIG[DB_PASSWORD]=$(prompt_password "Database password:")
        fi
        
        # SSL option for remote connections
        if [ "${CONFIG[DB_HOST]}" != "localhost" ]; then
            CONFIG[DB_SSL]=$(prompt_yes_no "Enable SSL connection?" "y")
        else
            CONFIG[DB_SSL]="false"
        fi
    fi
    
    CONFIG[DB_NAME]=$(prompt_input "Database name:" "ctrl_alt_play")
    
    # Test connection for remote databases
    if [ "${CONFIG[DB_LOCAL]}" = "false" ]; then
        test_database_connection
    fi
}

configure_sqlite() {
    print_step "SQLite Configuration:"
    print_warning "SQLite is recommended for development/testing only"
    
    CONFIG[DB_HOST]=""
    CONFIG[DB_PORT]=""
    CONFIG[DB_LOCAL]="true"
    CONFIG[DB_NAME]=$(prompt_input "SQLite database file path:" "./data/ctrl_alt_play.db")
    
    # Create directory if needed
    DB_DIR=$(dirname "${CONFIG[DB_NAME]}")
    if [ ! -d "$DB_DIR" ]; then
        mkdir -p "$DB_DIR"
        print_info "Created directory: $DB_DIR"
    fi
}

test_database_connection() {
    print_step "Testing database connection..."
    
    # Create a temporary test script
    cat > /tmp/db_test.js << EOF
const { DatabaseConfigService } = require('${PROJECT_ROOT}/src/services/DatabaseConfigService.ts');

const config = {
    type: '${CONFIG[DB_TYPE]}',
    host: '${CONFIG[DB_HOST]}',
    port: ${CONFIG[DB_PORT]:-0},
    database: '${CONFIG[DB_NAME]}',
    username: '${CONFIG[DB_USER]:-}',
    password: '${CONFIG[DB_PASSWORD]:-}',
    ssl: ${CONFIG[DB_SSL]:-false}
};

DatabaseConfigService.testConnection(config)
    .then(result => {
        if (result) {
            console.log('✅ Database connection successful');
            process.exit(0);
        } else {
            console.log('❌ Database connection failed');
            process.exit(1);
        }
    })
    .catch(error => {
        console.log('❌ Connection test error:', error.message);
        process.exit(1);
    });
EOF
    
    if node /tmp/db_test.js 2>/dev/null; then
        print_success "Database connection test passed"
        rm -f /tmp/db_test.js
    else
        print_error "Database connection test failed"
        rm -f /tmp/db_test.js
        
        retry=$(prompt_yes_no "Would you like to reconfigure the database?" "y")
        if [ "$retry" = "y" ]; then
            case ${CONFIG[DB_TYPE]} in
                postgresql) configure_postgresql ;;
                mysql) configure_mysql ;;
                mongodb) configure_mongodb ;;
                sqlite) configure_sqlite ;;
            esac
        else
            print_warning "Continuing with potentially invalid database configuration"
        fi
    fi
}

configure_redis() {
    print_section "🔴 Redis Configuration"
    
    print_step "Redis cache settings:"
    CONFIG[REDIS_HOST]=$(prompt_input "Redis host:" "$DEFAULT_REDIS_HOST")
    CONFIG[REDIS_PORT]=$(prompt_input "Redis port:" "$DEFAULT_REDIS_PORT" validate_port)
    
    # Optional Redis password
    use_redis_auth=$(prompt_yes_no "Enable Redis authentication?" "n")
    if [ "$use_redis_auth" = "y" ]; then
        CONFIG[REDIS_PASSWORD]=$(prompt_password "Redis password:" false)
    fi
    
    print_success "Redis configuration completed"
}

configure_security() {
    print_section "${LOCK} Security Configuration"
    
    print_step "Generating secure secrets..."
    CONFIG[JWT_SECRET]=$(generate_secret 64)
    CONFIG[AGENT_SECRET]=$(generate_secret 32)
    CONFIG[SESSION_SECRET]=$(generate_secret 32)
    print_success "Security secrets generated"
    
    print_step "Administrator account setup:"
    CONFIG[ADMIN_EMAIL]=$(prompt_input "Admin email:" "" validate_email)
    CONFIG[ADMIN_PASSWORD]=$(prompt_password "Admin password:")
    
    print_step "Additional security options:"
    CONFIG[ENABLE_2FA]=$(prompt_yes_no "Enable two-factor authentication?" "y")
    CONFIG[RATE_LIMIT_ENABLED]=$(prompt_yes_no "Enable API rate limiting?" "y")
    
    print_success "Security configuration completed"
}

configure_email() {
    print_section "${MAIL} Email Configuration (Optional)"
    
    setup_email=$(prompt_yes_no "Configure email settings?" "n")
    if [ "$setup_email" = "y" ]; then
        print_step "Email server settings:"
        CONFIG[SMTP_HOST]=$(prompt_input "SMTP host:" "")
        CONFIG[SMTP_PORT]=$(prompt_input "SMTP port:" "587" validate_port)
        CONFIG[SMTP_USER]=$(prompt_input "SMTP username:" "")
        CONFIG[SMTP_PASS]=$(prompt_password "SMTP password:" false)
        CONFIG[SMTP_FROM]=$(prompt_input "From email address:" "" validate_email)
        
        CONFIG[EMAIL_ENABLED]="true"
        print_success "Email configuration completed"
    else
        CONFIG[EMAIL_ENABLED]="false"
        print_info "Email configuration skipped"
    fi
}

configure_domain() {
    print_section "${GLOBE} Domain and SSL Configuration"
    
    print_step "Domain settings:"
    CONFIG[DOMAIN]=$(prompt_input "Domain name:" "$DEFAULT_DOMAIN" validate_domain)
    
    if [ "${CONFIG[DOMAIN]}" != "localhost" ]; then
        setup_ssl=$(prompt_yes_no "Enable SSL/HTTPS?" "y")
        if [ "$setup_ssl" = "y" ]; then
            CONFIG[SSL_ENABLED]="true"
            print_info "SSL certificates will be configured after deployment"
        else
            CONFIG[SSL_ENABLED]="false"
        fi
    else
        CONFIG[SSL_ENABLED]="false"
    fi
    
    print_success "Domain configuration completed"
}

configure_features() {
    print_section "🎯 Feature Configuration"
    
    print_step "Optional features:"
    CONFIG[ANALYTICS_ENABLED]=$(prompt_yes_no "Enable analytics and metrics?" "y")
    CONFIG[BACKUP_ENABLED]=$(prompt_yes_no "Enable automated backups?" "y")
    CONFIG[PLUGIN_SYSTEM_ENABLED]=$(prompt_yes_no "Enable plugin system?" "y")
    CONFIG[API_DOCS_ENABLED]=$(prompt_yes_no "Enable API documentation?" "y")
    
    print_success "Feature configuration completed"
}

# Generate configuration file
generate_config_file() {
    print_section "📝 Generating Configuration"
    
    # Backup existing config
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$BACKUP_FILE"
        print_info "Existing configuration backed up to $BACKUP_FILE"
    fi
    
    # Generate .env file
    cat > "$CONFIG_FILE" << EOF
# Ctrl-Alt-Play Panel Configuration
# Generated by Setup Wizard on $(date)

# ═══════════════════════════════════════════════════════════════
# ENVIRONMENT CONFIGURATION
# ═══════════════════════════════════════════════════════════════
NODE_ENV=${CONFIG[NODE_ENV]}
PORT=${CONFIG[PORT]}
DOMAIN=${CONFIG[DOMAIN]}

# ═══════════════════════════════════════════════════════════════
# DATABASE CONFIGURATION  
# ═══════════════════════════════════════════════════════════════
DB_HOST=${CONFIG[DB_HOST]}
DB_PORT=${CONFIG[DB_PORT]}
DB_NAME=${CONFIG[DB_NAME]}
DB_USER=${CONFIG[DB_USER]}
DB_PASSWORD=${CONFIG[DB_PASSWORD]}

# ═══════════════════════════════════════════════════════════════
# REDIS CONFIGURATION
# ═══════════════════════════════════════════════════════════════
REDIS_HOST=${CONFIG[REDIS_HOST]}
REDIS_PORT=${CONFIG[REDIS_PORT]}
EOF

    # Add Redis password if configured
    if [ -n "${CONFIG[REDIS_PASSWORD]:-}" ]; then
        echo "REDIS_PASSWORD=${CONFIG[REDIS_PASSWORD]}" >> "$CONFIG_FILE"
    fi

    # Add security configuration
    cat >> "$CONFIG_FILE" << EOF

# ═══════════════════════════════════════════════════════════════
# SECURITY CONFIGURATION
# ═══════════════════════════════════════════════════════════════
JWT_SECRET=${CONFIG[JWT_SECRET]}
AGENT_SECRET=${CONFIG[AGENT_SECRET]}
SESSION_SECRET=${CONFIG[SESSION_SECRET]}
ADMIN_EMAIL=${CONFIG[ADMIN_EMAIL]}
ADMIN_PASSWORD=${CONFIG[ADMIN_PASSWORD]}
ENABLE_2FA=${CONFIG[ENABLE_2FA]}
RATE_LIMIT_ENABLED=${CONFIG[RATE_LIMIT_ENABLED]}
SSL_ENABLED=${CONFIG[SSL_ENABLED]}

# ═══════════════════════════════════════════════════════════════
# FEATURE CONFIGURATION
# ═══════════════════════════════════════════════════════════════
ANALYTICS_ENABLED=${CONFIG[ANALYTICS_ENABLED]}
BACKUP_ENABLED=${CONFIG[BACKUP_ENABLED]}
PLUGIN_SYSTEM_ENABLED=${CONFIG[PLUGIN_SYSTEM_ENABLED]}
API_DOCS_ENABLED=${CONFIG[API_DOCS_ENABLED]}
EOF

    # Add email configuration if enabled
    if [ "${CONFIG[EMAIL_ENABLED]}" = "true" ]; then
        cat >> "$CONFIG_FILE" << EOF

# ═══════════════════════════════════════════════════════════════
# EMAIL CONFIGURATION
# ═══════════════════════════════════════════════════════════════
EMAIL_ENABLED=true
SMTP_HOST=${CONFIG[SMTP_HOST]}
SMTP_PORT=${CONFIG[SMTP_PORT]}
SMTP_USER=${CONFIG[SMTP_USER]}
SMTP_PASS=${CONFIG[SMTP_PASS]}
SMTP_FROM=${CONFIG[SMTP_FROM]}
EOF
    else
        echo -e "\n# EMAIL CONFIGURATION\nEMAIL_ENABLED=false" >> "$CONFIG_FILE"
    fi

    print_success "Configuration file generated: $CONFIG_FILE"
}

# Validate configuration
validate_configuration() {
    print_section "🔍 Configuration Validation"
    
    print_step "Validating configuration..."
    
    # Check required fields
    local required_fields=("NODE_ENV" "PORT" "DB_HOST" "DB_PASSWORD" "JWT_SECRET")
    for field in "${required_fields[@]}"; do
        if [ -z "${CONFIG[$field]:-}" ]; then
            print_error "Required field missing: $field"
            return 1
        fi
    done
    
    # Port conflict check
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :"${CONFIG[PORT]}" >/dev/null 2>&1; then
            print_warning "Port ${CONFIG[PORT]} is already in use"
        else
            print_success "Port ${CONFIG[PORT]} is available"
        fi
    fi
    
    print_success "Configuration validation completed"
}

# Final deployment
deploy_application() {
    print_section "${ROCKET} Deployment"
    
    start_services=$(prompt_yes_no "Start services now?" "y")
    if [ "$start_services" = "y" ]; then
        print_step "Starting Docker services..."
        
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose up -d
            print_success "Services started successfully"
            
            # Wait for services to be ready
            print_step "Waiting for services to be ready..."
            sleep 10
            
            # Health check
            print_step "Running health check..."
            if node src/health-check.js; then
                print_success "Health check passed"
            else
                print_warning "Health check failed - check logs for details"
            fi
        else
            print_error "Docker Compose not found - please start services manually"
        fi
    fi
}

# Show summary
show_summary() {
    print_section "📋 Setup Summary"
    
    echo -e "${WHITE}Configuration Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}Environment:${NC} ${CONFIG[NODE_ENV]}"
    echo -e "${CYAN}Application URL:${NC} http://${CONFIG[DOMAIN]}:${CONFIG[PORT]}"
    echo -e "${CYAN}Database:${NC} ${CONFIG[DB_HOST]}:${CONFIG[DB_PORT]}/${CONFIG[DB_NAME]}"
    echo -e "${CYAN}Redis:${NC} ${CONFIG[REDIS_HOST]}:${CONFIG[REDIS_PORT]}"
    echo -e "${CYAN}Admin Email:${NC} ${CONFIG[ADMIN_EMAIL]}"
    echo -e "${CYAN}SSL Enabled:${NC} ${CONFIG[SSL_ENABLED]}"
    echo -e "${CYAN}Email Enabled:${NC} ${CONFIG[EMAIL_ENABLED]}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo -e "\n${GREEN}${CHECK} Setup completed successfully!${NC}"
    echo -e "${INFO} Configuration saved to: $CONFIG_FILE"
    echo -e "${INFO} Setup log saved to: $WIZARD_LOG"
    
    if [ "${CONFIG[SSL_ENABLED]}" = "true" ] && [ "${CONFIG[DOMAIN]}" != "localhost" ]; then
        echo -e "\n${WARN} Next steps for SSL setup:"
        echo "   1. Point your domain to this server"
        echo "   2. Run: ./scripts/setup-ssl.sh"
    fi
    
    echo -e "\n${ROCKET} Access your panel at: ${WHITE}http://${CONFIG[DOMAIN]}:${CONFIG[PORT]}${NC}"
}

# Main wizard flow
main() {
    print_header
    
    echo -e "${INFO} This wizard will guide you through configuring Ctrl-Alt-Play Panel"
    echo -e "${INFO} You can press Ctrl+C at any time to exit"
    echo
    
    read -p "Press Enter to begin setup..."
    
    # Initialize log
    echo "Setup Wizard started at $(date)" > "$WIZARD_LOG"
    
    # Run configuration sections
    configure_environment
    configure_database
    configure_redis
    configure_security
    configure_email
    configure_domain
    configure_features
    
    # Generate and validate configuration
    generate_config_file
    validate_configuration
    
    # Final deployment
    deploy_application
    
    # Show summary
    show_summary
    
    log "Setup Wizard completed successfully"
}

# Error handling
trap 'echo -e "\n${RED}Setup interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
