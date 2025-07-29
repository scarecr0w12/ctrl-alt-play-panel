#!/bin/bash

# =============================================================================
# Ctrl-Alt-Play Panel - Secret Generation Script
# =============================================================================
# 
# This script generates secure random secrets for your panel configuration
# Usage: ./scripts/generate-secrets.sh
#

set -e

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

echo "🔐 Ctrl-Alt-Play Panel Secret Generator"
echo "======================================="
echo

# Check if .env already exists
if [ -f .env ]; then
    print_warning ".env file already exists!"
    echo
    read -p "Do you want to update the secrets in the existing .env file? (y/N): " UPDATE_EXISTING
    echo
    
    if [[ ! "$UPDATE_EXISTING" =~ ^[Yy]$ ]]; then
        print_info "Generating new secrets for manual copy-paste:"
        echo
        MANUAL_MODE=true
    else
        MANUAL_MODE=false
    fi
else
    # Copy .env.example to .env
    if [ ! -f .env.example ]; then
        print_error ".env.example file not found!"
        exit 1
    fi
    
    cp .env.example .env
    print_success "Created .env file from .env.example"
    MANUAL_MODE=false
fi

# Generate secure random secrets
print_info "Generating secure secrets..."

# Generate JWT secret (64 characters, alphanumeric + symbols)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)

# Generate Agent secret (64 characters, alphanumeric + symbols)  
AGENT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)

# Generate database password (32 characters, alphanumeric)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo

if [ "$MANUAL_MODE" = true ]; then
    print_info "Generated secrets (copy these to your .env file):"
    echo
    echo "JWT_SECRET=$JWT_SECRET"
    echo "AGENT_SECRET=$AGENT_SECRET" 
    echo "Database password: $DB_PASSWORD"
    echo
    print_warning "Remember to update your DATABASE_URL with the new password!"
    print_info "Example: DATABASE_URL=\"postgresql://ctrlaltplay:$DB_PASSWORD@localhost:5432/ctrlaltplay\""
else
    # Update .env file with generated secrets
    print_info "Updating .env file with generated secrets..."
    
    # Update JWT_SECRET
    if grep -q "JWT_SECRET=" .env; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        print_success "Updated JWT_SECRET"
    else
        echo "JWT_SECRET=$JWT_SECRET" >> .env
        print_success "Added JWT_SECRET"
    fi
    
    # Update AGENT_SECRET
    if grep -q "AGENT_SECRET=" .env; then
        sed -i "s/AGENT_SECRET=.*/AGENT_SECRET=$AGENT_SECRET/" .env
        print_success "Updated AGENT_SECRET"
    else
        echo "AGENT_SECRET=$AGENT_SECRET" >> .env
        print_success "Added AGENT_SECRET"
    fi
    
    # Update database password in DATABASE_URL
    if grep -q "DATABASE_URL=" .env; then
        # Replace the password part in the DATABASE_URL
        sed -i "s|DATABASE_URL=\"postgresql://ctrlaltplay:[^@]*@|DATABASE_URL=\"postgresql://ctrlaltplay:$DB_PASSWORD@|" .env
        print_success "Updated database password in DATABASE_URL"
    fi
    
    print_success "All secrets have been generated and saved to .env file!"
fi

echo
print_info "Security reminders:"
echo "• Keep your .env file secure and never commit it to version control"
echo "• These secrets are used for authentication and security - treat them as passwords"
echo "• For production deployments, ensure these secrets are truly random and secure"
echo "• Consider rotating secrets periodically for enhanced security"
echo

print_success "Secret generation complete! 🎉"
