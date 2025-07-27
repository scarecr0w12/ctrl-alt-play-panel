#!/bin/bash

# Smart Domain-Independent Setup Script for Ctrl-Alt-Play Panel
# Automatically detects domain, IP, and SSL configuration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_error() { print_message "$RED" "❌ $1"; }
print_success() { print_message "$GREEN" "✅ $1"; }
print_warning() { print_message "$YELLOW" "⚠️  $1"; }
print_info() { print_message "$BLUE" "ℹ️  $1"; }

# Detect server's public IP
detect_public_ip() {
    local ip=""
    
    # Try multiple services to get public IP
    for service in "ifconfig.me" "ipinfo.io/ip" "icanhazip.com" "ident.me"; do
        ip=$(curl -s --max-time 5 "$service" 2>/dev/null | tr -d '\n' || true)
        if [[ -n "$ip" && "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "$ip"
            return 0
        fi
    done
    
    # Fallback to local IP if public IP detection fails
    ip=$(hostname -I | awk '{print $1}' 2>/dev/null || true)
    if [[ -n "$ip" ]]; then
        echo "$ip"
        return 0
    fi
    
    echo "localhost"
}

# Check if SSL certificates exist
check_ssl_certificates() {
    local ssl_dir="${SCRIPT_DIR}/nginx/ssl"
    
    if [[ -f "$ssl_dir/fullchain.pem" && -f "$ssl_dir/privkey.pem" ]]; then
        print_success "SSL certificates found"
        return 0
    else
        print_info "No SSL certificates found"
        return 1
    fi
}

# Configure domain and SSL settings
configure_domain_ssl() {
    local public_ip=""
    local domain=""
    local use_ssl="false"
    local frontend_url=""
    
    print_info "Configuring domain-independent setup..."
    
    # Detect public IP
    print_info "Detecting public IP address..."
    public_ip=$(detect_public_ip)
    print_success "Detected public IP: $public_ip"
    
    # Check for existing domain configuration
    if [[ -f "$ENV_FILE" ]]; then
        domain=$(grep "^DOMAIN=" "$ENV_FILE" | cut -d'=' -f2 2>/dev/null || echo "")
        current_ssl=$(grep "^USE_SSL=" "$ENV_FILE" | cut -d'=' -f2 2>/dev/null || echo "false")
    fi
    
    # Check SSL certificates
    if check_ssl_certificates; then
        use_ssl="true"
        if [[ -n "$domain" && "$domain" != "localhost" && "$domain" != "$public_ip" ]]; then
            frontend_url="https://$domain"
            print_success "SSL enabled with domain: $domain"
        else
            frontend_url="https://$public_ip"
            print_success "SSL enabled with IP: $public_ip"
        fi
    else
        use_ssl="false"
        if [[ -n "$domain" && "$domain" != "localhost" && "$domain" != "$public_ip" ]]; then
            frontend_url="http://$domain"
            print_info "SSL disabled, using domain: $domain"
        else
            frontend_url="http://$public_ip"
            print_info "SSL disabled, using IP: $public_ip"
        fi
    fi
    
    # Update environment file
    print_info "Updating environment configuration..."
    
    # Create or update .env file
    if [[ -f "$ENV_FILE" ]]; then
        # Update existing values
        sed -i "s|^USE_SSL=.*|USE_SSL=$use_ssl|" "$ENV_FILE"
        sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$frontend_url|" "$ENV_FILE"
        
        # Add domain if not exists
        if ! grep -q "^DOMAIN=" "$ENV_FILE"; then
            echo "DOMAIN=${domain:-$public_ip}" >> "$ENV_FILE"
        elif [[ -z "$domain" ]]; then
            sed -i "s|^DOMAIN=.*|DOMAIN=$public_ip|" "$ENV_FILE"
        fi
    else
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    print_success "Configuration updated:"
    print_info "  Domain/IP: ${domain:-$public_ip}"
    print_info "  SSL: $use_ssl"
    print_info "  Frontend URL: $frontend_url"
    print_info "  Public IP: $public_ip"
}

# Setup nginx configuration
setup_nginx() {
    local nginx_conf="${SCRIPT_DIR}/nginx/nginx.conf"
    local nginx_domain_conf="${SCRIPT_DIR}/nginx/nginx-domain-independent.conf"
    
    print_info "Setting up domain-independent nginx configuration..."
    
    # Backup existing config
    if [[ -f "$nginx_conf" ]]; then
        cp "$nginx_conf" "${nginx_conf}.backup.$(date +%s)"
        print_info "Backed up existing nginx configuration"
    fi
    
    # Use the domain-independent configuration
    if [[ -f "$nginx_domain_conf" ]]; then
        cp "$nginx_domain_conf" "$nginx_conf"
        print_success "Applied domain-independent nginx configuration"
    else
        print_error "Domain-independent nginx configuration not found"
        exit 1
    fi
}

# Create SSL directory structure
setup_ssl_directory() {
    local ssl_dir="${SCRIPT_DIR}/nginx/ssl"
    
    if [[ ! -d "$ssl_dir" ]]; then
        mkdir -p "$ssl_dir"
        print_success "Created SSL directory: $ssl_dir"
    fi
    
    # Create placeholder files if no certificates exist
    if [[ ! -f "$ssl_dir/fullchain.pem" ]]; then
        cat > "$ssl_dir/README.md" << 'EOF'
# SSL Certificates

Place your SSL certificates here:
- fullchain.pem (certificate chain)
- privkey.pem (private key)

For Let's Encrypt certificates, you can use:
```bash
sudo certbot --nginx -d your-domain.com
# Then copy the certificates:
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/
sudo chown $(whoami):$(whoami) ./nginx/ssl/*.pem
```

For self-signed certificates (testing only):
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/privkey.pem \
  -out ./nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```
EOF
        print_info "Created SSL setup instructions"
    fi
}

# Test the configuration
test_configuration() {
    print_info "Testing configuration..."
    
    # Test nginx config syntax
    if docker compose -f docker-compose.prod.yml exec nginx nginx -t >/dev/null 2>&1; then
        print_success "Nginx configuration is valid"
    else
        print_warning "Nginx configuration test failed (this is normal if containers aren't running)"
    fi
    
    # Show final configuration
    local frontend_url=$(grep "^FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2)
    local use_ssl=$(grep "^USE_SSL=" "$ENV_FILE" | cut -d'=' -f2)
    
    print_success "Setup complete!"
    print_info ""
    print_info "🌐 Access your panel at:"
    print_info "   Frontend: $frontend_url"
    
    if [[ "$use_ssl" == "true" ]]; then
        print_info "   HTTP will redirect to HTTPS"
    else
        print_info "   Using HTTP (SSL disabled)"
    fi
    
    print_info ""
    print_info "📝 Configuration details:"
    print_info "   - Domain independent: ✅ Works with any domain or IP"
    print_info "   - SSL auto-detection: ✅ Enables SSL if certificates found"
    print_info "   - Multi-access: ✅ Accessible via domain, IP, or localhost"
}

# Main execution
main() {
    print_info "🚀 Starting domain-independent setup for Ctrl-Alt-Play Panel"
    print_info ""
    
    configure_domain_ssl
    setup_nginx
    setup_ssl_directory
    test_configuration
    
    print_info ""
    print_success "✨ Domain-independent setup complete!"
    print_info ""
    print_info "You can now:"
    print_info "1. Access via any domain pointing to this server"
    print_info "2. Access via the server's IP address"
    print_info "3. Add SSL certificates to enable HTTPS"
    print_info "4. Use different domains without reconfiguration"
}

# Run main function
main "$@"
