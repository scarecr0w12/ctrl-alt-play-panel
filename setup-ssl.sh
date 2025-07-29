#!/bin/bash

# Automatic SSL Certificate Setup Script for Ctrl-Alt-Play Panel
# This script automatically obtains and configures Let's Encrypt SSL certificates

set -e

# Configuration
DOMAIN="${DOMAIN:-dev-test.thecgn.net}"
EMAIL="${CERTBOT_EMAIL:-admin@thecgn.net}"
WEBROOT="/var/www/certbot"
NGINX_CONF_DIR="/etc/nginx"
SSL_CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root. Use sudo."
        exit 1
    fi
}

# Install required packages
install_dependencies() {
    log "Installing required packages..."

    # Update package list
    apt-get update -qq

    # Install required packages
    apt-get install -y certbot nginx-core curl wget

    log_success "Dependencies installed successfully"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."

    # Create webroot directory for ACME challenge
    mkdir -p "$WEBROOT"
    chown -R www-data:www-data "$WEBROOT"

    # Create SSL directory if it doesn't exist
    mkdir -p /etc/letsencrypt

    log_success "Directories created successfully"
}

# Check if domain is accessible
check_domain_accessibility() {
    log "Checking domain accessibility..."

    # Try to resolve the domain
    if ! nslookup "$DOMAIN" > /dev/null 2>&1; then
        log_error "Domain $DOMAIN cannot be resolved. Please check DNS configuration."
        exit 1
    fi

    # Check if domain points to this server
    DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)
    SERVER_IP=$(curl -s https://ipinfo.io/ip || curl -s http://checkip.amazonaws.com || echo "unknown")

    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        log_warning "Domain $DOMAIN ($DOMAIN_IP) may not point to this server ($SERVER_IP)"
        log_warning "SSL certificate generation might fail if DNS is not properly configured"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Domain $DOMAIN correctly points to this server ($SERVER_IP)"
    fi
}

# Configure Nginx for ACME challenge
setup_nginx_acme() {
    log "Configuring Nginx for ACME challenge..."

    # Create initial Nginx configuration for HTTP only (ACME challenge)
    cat > /etc/nginx/sites-available/ctrl-alt-play << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
        try_files \$uri =404;
    }

    # Temporary redirect to app for initial setup
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/ctrl-alt-play /etc/nginx/sites-enabled/ctrl-alt-play

    # Remove default site if it exists
    rm -f /etc/nginx/sites-enabled/default

    # Test and reload Nginx
    nginx -t && systemctl reload nginx

    log_success "Nginx configured for ACME challenge"
}

# Obtain SSL certificate
obtain_ssl_certificate() {
    log "Obtaining SSL certificate from Let's Encrypt..."

    # Check if certificate already exists and is valid
    if [ -f "$SSL_CERT_DIR/fullchain.pem" ]; then
        if openssl x509 -checkend 2592000 -noout -in "$SSL_CERT_DIR/fullchain.pem" > /dev/null 2>&1; then
            log_success "Valid SSL certificate already exists for $DOMAIN"
            return 0
        else
            log_warning "Existing certificate is expiring soon or invalid, renewing..."
        fi
    fi

    # Obtain certificate using webroot method
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN" \
        --non-interactive

    if [ $? -eq 0 ]; then
        log_success "SSL certificate obtained successfully for $DOMAIN"
    else
        log_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Configure Nginx with SSL
setup_nginx_ssl() {
    log "Configuring Nginx with SSL..."

    # Create full SSL-enabled Nginx configuration
    cat > /etc/nginx/sites-available/ctrl-alt-play << EOF
# HTTP Server (Port 80) - Redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
        try_files \$uri =404;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server (Port 443)
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration
    ssl_certificate $SSL_CERT_DIR/fullchain.pem;
    ssl_certificate_key $SSL_CERT_DIR/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate $SSL_CERT_DIR/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Application routes
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }
}
EOF

    # Test and reload Nginx
    nginx -t && systemctl reload nginx

    log_success "Nginx configured with SSL successfully"
}

# Setup automatic certificate renewal
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."

    # Create renewal script
    cat > /usr/local/bin/renew-ssl-cert << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

    chmod +x /usr/local/bin/renew-ssl-cert

    # Add cron job for automatic renewal (twice daily)
    echo "0 12 * * * /usr/local/bin/renew-ssl-cert" | crontab -

    log_success "Automatic renewal configured"
}

# Test SSL certificate
test_ssl_certificate() {
    log "Testing SSL certificate..."

    # Wait a moment for Nginx to fully reload
    sleep 3

    # Test HTTPS connectivity
    if curl -s -I "https://$DOMAIN" > /dev/null 2>&1; then
        log_success "SSL certificate is working correctly"
        log_success "Your site is now accessible at: https://$DOMAIN"
    else
        log_warning "SSL test failed, but certificate was installed. Please check manually."
    fi
}

# Main execution
main() {
    log "🔒 Starting automatic SSL setup for Ctrl-Alt-Play Panel"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"
    echo

    check_root
    install_dependencies
    setup_directories
    check_domain_accessibility
    setup_nginx_acme
    obtain_ssl_certificate
    setup_nginx_ssl
    setup_auto_renewal
    test_ssl_certificate

    echo
    log_success "🎉 SSL setup completed successfully!"
    log_success "Your Ctrl-Alt-Play Panel is now accessible at:"
    log_success "  HTTP:  http://$DOMAIN (redirects to HTTPS)"
    log_success "  HTTPS: https://$DOMAIN"
    echo
    log "Certificate will automatically renew every 12 hours"
    log "You can manually renew with: certbot renew"
}

# Handle command line arguments
case "${1:-}" in
    "test")
        test_ssl_certificate
        ;;
    "renew")
        certbot renew --post-hook "systemctl reload nginx"
        ;;
    *)
        main
        ;;
esac
