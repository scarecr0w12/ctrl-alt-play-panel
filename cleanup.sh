#!/bin/bash

# Project Cleanup and Maintenance Script
# Linux Distribution Agnostic

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Clean up old/unused files
cleanup_files() {
    print_info "Cleaning up project files..."
    
    # Remove common build artifacts and caches
    local cleanup_paths=(
        "node_modules/.cache"
        "dist"
        "build"
        ".next"
        "coverage"
        "*.log"
        "*.log.*"
        ".npm"
        ".yarn"
        "*.tsbuildinfo"
    )
    
    for path in "${cleanup_paths[@]}"; do
        if [[ -e "$path" ]]; then
            rm -rf "$path"
            print_success "Removed: $path"
        fi
    done
    
    # Clean up temporary files (cross-platform)
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
    
    print_success "File cleanup completed"
}

# Clean up Docker resources
cleanup_docker() {
    print_info "Cleaning up Docker resources..."
    
    if command -v docker >/dev/null 2>&1; then
        # Stop and remove containers
        docker compose down 2>/dev/null || true
        
        # Remove unused images, containers, networks
        docker system prune -f 2>/dev/null || true
        
        # Remove dangling images
        docker image prune -f 2>/dev/null || true
        
        print_success "Docker cleanup completed"
    else
        print_warning "Docker not found, skipping Docker cleanup"
    fi
}

# Fix file permissions (Linux distribution agnostic)
fix_permissions() {
    print_info "Fixing file permissions..."
    
    # Make scripts executable
    local scripts=(
        "start.sh"
        "setup.sh"
        "cleanup.sh"
        "scripts/*.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -e "$script" ]]; then
            chmod +x "$script" 2>/dev/null || true
            print_success "Made executable: $script"
        fi
    done
    
    # Set proper directory permissions
    local dirs=(
        "uploads"
        "logs"
        "data"
        "nginx/ssl"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            chmod -R 755 "$dir" 2>/dev/null || true
            print_success "Set permissions for: $dir"
        fi
    done
    
    print_success "Permission fixes completed"
}

# Validate configuration files
validate_configs() {
    print_info "Validating configuration files..."
    
    # Check Docker Compose files
    local compose_files=(
        "docker-compose.yml"
        "docs/deployment/docker-compose.prod.yml"
        "docs/deployment/docker-compose.test.yml"
    )
    
    for file in "${compose_files[@]}"; do
        if [[ -f "$file" ]]; then
            if docker compose -f "$file" config >/dev/null 2>&1; then
                print_success "Valid Docker Compose: $file"
            else
                print_error "Invalid Docker Compose: $file"
            fi
        fi
    done
    
    # Check package.json files
    local package_files=(
        "package.json"
        "frontend/package.json"
        "agent/package.json"
    )
    
    for file in "${package_files[@]}"; do
        if [[ -f "$file" ]]; then
            if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
                print_success "Valid JSON: $file"
            else
                print_error "Invalid JSON: $file"
            fi
        fi
    done
    
    print_success "Configuration validation completed"
}

# Update dependencies (with error handling)
update_dependencies() {
    print_info "Updating dependencies..."
    
    # Update root dependencies
    if [[ -f "package.json" ]]; then
        npm audit fix --force 2>/dev/null || print_warning "npm audit fix failed for root"
        npm update 2>/dev/null || print_warning "npm update failed for root"
        print_success "Updated root dependencies"
    fi
    
    # Update frontend dependencies
    if [[ -f "frontend/package.json" ]]; then
        (cd frontend && npm audit fix --force 2>/dev/null) || print_warning "npm audit fix failed for frontend"
        (cd frontend && npm update 2>/dev/null) || print_warning "npm update failed for frontend"
        print_success "Updated frontend dependencies"
    fi
    
    # Update agent dependencies
    if [[ -f "agent/package.json" ]]; then
        (cd agent && npm audit fix --force 2>/dev/null) || print_warning "npm audit fix failed for agent"
        (cd agent && npm update 2>/dev/null) || print_warning "npm update failed for agent"
        print_success "Updated agent dependencies"
    fi
    
    print_success "Dependency updates completed"
}

# Security check
security_check() {
    print_info "Running security checks..."
    
    # Check for sensitive files
    local sensitive_patterns=(
        "*.key"
        "*.pem"
        "*.p12"
        "*.pfx"
        ".env.production"
        "id_rsa*"
    )
    
    for pattern in "${sensitive_patterns[@]}"; do
        if find . -name "$pattern" -type f 2>/dev/null | grep -q .; then
            print_warning "Found sensitive files matching: $pattern"
        fi
    done
    
    # Check for hardcoded secrets in code
    if command -v grep >/dev/null 2>&1; then
        local secret_patterns=(
            "password.*=.*['\"][^'\"]{8,}"
            "secret.*=.*['\"][^'\"]{8,}"
            "token.*=.*['\"][^'\"]{8,}"
            "key.*=.*['\"][^'\"]{8,}"
        )
        
        for pattern in "${secret_patterns[@]}"; do
            if grep -r -i -E "$pattern" src/ frontend/ 2>/dev/null | grep -v example | grep -q .; then
                print_warning "Potential hardcoded secret found (pattern: $pattern)"
            fi
        done
    fi
    
    print_success "Security check completed"
}

# Generate project report
generate_report() {
    print_info "Generating project report..."
    
    local report_file="PROJECT_HEALTH_REPORT.md"
    
    cat > "$report_file" << EOF
# Project Health Report
Generated: $(date)

## System Information
- OS: $(uname -s)
- Architecture: $(uname -m)
- User: $(whoami)

## Docker Information
EOF

    if command -v docker >/dev/null 2>&1; then
        echo "- Docker Version: $(docker --version)" >> "$report_file"
        echo "- Docker Compose Version: $(docker compose version --short 2>/dev/null || echo 'Not available')" >> "$report_file"
    else
        echo "- Docker: Not installed" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## Node.js Information
EOF

    if command -v node >/dev/null 2>&1; then
        echo "- Node.js Version: $(node --version)" >> "$report_file"
        echo "- NPM Version: $(npm --version)" >> "$report_file"
    else
        echo "- Node.js: Not installed" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

## Project Structure
- Backend: $(if [[ -d "src" ]]; then echo "✅ Present"; else echo "❌ Missing"; fi)
- Frontend: $(if [[ -d "frontend" ]]; then echo "✅ Present"; else echo "❌ Missing"; fi)
- Agent: $(if [[ -d "agent" ]]; then echo "✅ Present"; else echo "❌ Missing"; fi)
- Database: $(if [[ -d "database" ]]; then echo "✅ Present"; else echo "❌ Missing"; fi)
- Docker Config: $(if [[ -f "docker-compose.yml" ]]; then echo "✅ Present"; else echo "❌ Missing"; fi)

## Configuration Files Status
EOF

    local config_files=(
        "package.json:Backend Package"
        "frontend/package.json:Frontend Package"
        "agent/package.json:Agent Package"
        "docker-compose.yml:Docker Compose"
        "Dockerfile:Docker Image"
        ".env.example:Environment Template"
        "prisma/schema.prisma:Database Schema"
    )

    for item in "${config_files[@]}"; do
        IFS=':' read -r file description <<< "$item"
        if [[ -f "$file" ]]; then
            echo "- $description: ✅ Present" >> "$report_file"
        else
            echo "- $description: ❌ Missing" >> "$report_file"
        fi
    done

    print_success "Project report generated: $report_file"
}

# Main function
main() {
    local action="${1:-all}"
    
    print_info "Starting project cleanup and maintenance..."
    print_info "Working directory: $SCRIPT_DIR"
    
    case "$action" in
        files)
            cleanup_files
            ;;
        docker)
            cleanup_docker
            ;;
        permissions)
            fix_permissions
            ;;
        validate)
            validate_configs
            ;;
        update)
            update_dependencies
            ;;
        security)
            security_check
            ;;
        report)
            generate_report
            ;;
        all)
            cleanup_files
            fix_permissions
            validate_configs
            security_check
            generate_report
            print_success "All cleanup and maintenance tasks completed!"
            ;;
        *)
            echo "Usage: $0 {files|docker|permissions|validate|update|security|report|all}"
            echo ""
            echo "Commands:"
            echo "  files       - Clean up build artifacts and temporary files"
            echo "  docker      - Clean up Docker resources"
            echo "  permissions - Fix file and directory permissions"
            echo "  validate    - Validate configuration files"
            echo "  update      - Update dependencies (with audit fix)"
            echo "  security    - Run security checks"
            echo "  report      - Generate project health report"
            echo "  all         - Run all cleanup tasks (default)"
            exit 1
            ;;
    esac
}

# Change to script directory and run
cd "$SCRIPT_DIR"
main "$@"
