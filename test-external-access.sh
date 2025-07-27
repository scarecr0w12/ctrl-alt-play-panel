#!/bin/bash

echo "🔍 Testing external access to dev-panel.thecgn.net..."
echo ""

# Test basic connectivity
echo "📡 Testing basic connectivity..."
echo "Domain resolution:"
nslookup dev-panel.thecgn.net
echo ""

echo "Server public IP:"
curl -s ifconfig.me
echo ""
echo ""

# Test local access
echo "🏠 Testing local access..."
echo "Localhost HTTP:"
curl -I http://localhost 2>/dev/null | head -1
echo "Domain HTTP (local):"
curl -I http://dev-panel.thecgn.net 2>/dev/null | head -1
echo ""

# Test ports
echo "🔌 Testing port accessibility..."
echo "Port 80 status:"
ss -tlnp | grep :80
echo "Port 443 status:"
ss -tlnp | grep :443
echo ""

# Test from external perspective
echo "🌐 Testing external connectivity..."
echo "Attempting to test external access (this might timeout if blocked)..."
timeout 10 curl -I http://dev-panel.thecgn.net &
PID=$!
wait $PID
EXIT_CODE=$?
if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ External access test timed out (likely blocked)"
elif [ $EXIT_CODE -eq 0 ]; then
    echo "✅ External access working"
else
    echo "⚠️  External access test failed with code: $EXIT_CODE"
fi
echo ""

# Check cloud provider metadata (if available)
echo "☁️  Checking cloud provider info..."
# Try to detect if this is a major cloud provider
if curl -s --max-time 2 http://169.254.169.254/metadata/instance >/dev/null 2>&1; then
    echo "Azure VM detected"
elif curl -s --max-time 2 http://169.254.169.254/latest/meta-data/ >/dev/null 2>&1; then
    echo "AWS EC2 detected"
elif curl -s --max-time 2 http://metadata.google.internal/computeMetadata/v1/ -H "Metadata-Flavor: Google" >/dev/null 2>&1; then
    echo "Google Cloud detected"
else
    echo "Cloud provider: Unknown or VPS"
fi
echo ""

# Check for common blocking issues
echo "🛡️  Checking for common issues..."
echo "UFW Status:"
sudo ufw status 2>/dev/null || echo "UFW not available"
echo ""

# Test nginx configuration
echo "⚙️  Nginx configuration check..."
docker compose -f docker-compose.prod.yml exec nginx nginx -t 2>/dev/null && echo "✅ Nginx config valid" || echo "❌ Nginx config invalid"
echo ""

echo "📊 Service status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Diagnosis complete!"
echo ""
echo "If external access is still failing, check:"
echo "1. Cloud provider security groups/firewall rules"
echo "2. VPS provider firewall settings"
echo "3. Network administrator restrictions"
echo "4. ISP blocking (try from different network)"
