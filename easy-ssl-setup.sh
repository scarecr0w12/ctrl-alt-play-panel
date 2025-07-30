#!/bin/bash

# Ctrl-Alt-Play Panel - Auto SSL Setup with Nginx Proxy
# This script sets up automatic SSL certificates and Nginx proxy for easy access

set -e

# Configuration
DOMAIN="${DOMAIN:-dev-test.thecgn.net}"
EMAIL="${CERTBOT_EMAIL:-admin@thecgn.net}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Start the complete setup
main() {
    echo "🚀 Ctrl-Alt-Play Panel - Auto SSL & Nginx Setup"
    echo "================================================"
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo ""

    log "Starting Docker containers first..."

    # Update the Docker Compose to enable Nginx
    log "Enabling Nginx proxy in Docker Compose..."
    docker compose up -d nginx

    log "Waiting for application to be ready..."
    sleep 10

    # Check if the application is responding
    if curl -s http://localhost:3000/health > /dev/null; then
        log_success "Application is responding on port 3000"
    else
        log_error "Application not responding. Please check Docker containers."
        docker compose ps
        exit 1
    fi

    log "Setting up SSL certificates via Docker..."

    # Run the SSL setup script inside the Nginx container
    docker compose exec nginx /bin/sh -c "
        # Install certbot in the container
        apk add --no-cache certbot certbot-nginx

        # Create webroot directory
        mkdir -p /var/www/certbot

        # Get SSL certificate
        certbot --nginx \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            --domains $DOMAIN \
            --non-interactive
    " || {
        log_warning "SSL certificate generation failed. Continuing with HTTP..."
        log "Your site will be available at: http://$DOMAIN"
        return 0
    }

    log_success "SSL setup completed!"

    # Test the setup
    log "Testing SSL setup..."
    sleep 3

    if curl -s -I "https://$DOMAIN" > /dev/null 2>&1; then
        log_success "🎉 SSL is working correctly!"
        log_success "Your Ctrl-Alt-Play Panel is now accessible at:"
        log_success "  HTTPS: https://$DOMAIN"
        log_success "  HTTP:  http://$DOMAIN (redirects to HTTPS)"
    else
        log_warning "SSL test failed, but HTTP should work"
        log "Your site is available at: http://$DOMAIN"
    fi

    echo ""
    log_success "🎯 Setup Complete!"
    log "Access your panel at: https://$DOMAIN"
    log "Dashboard: https://$DOMAIN/dashboard"
    log "Console: https://$DOMAIN/console"
    log "Monitoring: https://$DOMAIN/monitoring"
    echo ""
}

# Show current status
status() {
    echo "📊 Ctrl-Alt-Play Panel Status"
    echo "============================="

    echo "Docker Containers:"
    docker compose ps

    echo ""
    echo "SSL Certificate Status:"
    if docker compose exec nginx test -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null; then
        log_success "SSL certificate exists for $DOMAIN"
        # Show certificate expiry
        docker compose exec nginx openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null | sed 's/notAfter=/Certificate expires: /'
    else
        log_warning "No SSL certificate found for $DOMAIN"
    fi

    echo ""
    echo "Service Health:"
    if curl -s http://localhost:3000/health > /dev/null; then
        log_success "Backend application is running"
    else
        log_error "Backend application is not responding"
    fi

    if curl -s http://localhost/health > /dev/null 2>&1; then
        log_success "Nginx proxy is working"
    else
        log_warning "Nginx proxy may not be working"
    fi
}

# Renew SSL certificates
renew() {
    log "Renewing SSL certificates..."
    docker compose exec nginx certbot renew --nginx
    log_success "Certificate renewal completed"
}

# Handle command line arguments
case "${1:-}" in
    "status")
        status
        ;;
    "renew")
        renew
        ;;
    "restart")
        log "Restarting all services..."
        docker compose restart
        log_success "Services restarted"
        ;;
    *)
        main
        ;;
esac
