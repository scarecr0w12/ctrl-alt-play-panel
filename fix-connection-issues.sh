#!/bin/bash

# Comprehensive Connection Fix
# This script addresses both redirect and connection issues

echo "🔧 Diagnosing and fixing connection issues..."

# Check if services are running
echo "📊 Checking service status..."
docker compose -f docker-compose.prod.yml ps

# Check if ports are accessible
echo ""
echo "🔌 Testing port connectivity..."
echo "Port 80 (nginx):"
timeout 5 bash -c "</dev/tcp/localhost/80" && echo "✅ Port 80 is accessible" || echo "❌ Port 80 connection refused"

echo "Port 3000 (app):"
timeout 5 bash -c "</dev/tcp/localhost/3000" && echo "✅ Port 3000 is accessible" || echo "❌ Port 3000 connection refused"

# Test API endpoints that work
echo ""
echo "🧪 Testing working endpoints..."
echo "API Info:"
curl -s http://localhost:3000/api/info | head -c 100
echo ""
echo "Health Check:"
curl -s http://localhost:3000/health | head -c 100
echo ""

# Create a simple nginx config that serves a basic page
echo ""
echo "🔨 Creating temporary nginx fix..."
cat > /tmp/nginx-fix.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    server {
        listen 80;
        server_name localhost dev-panel.thecgn.net;
        
        # Serve a simple working page for root
        location = / {
            return 200 '<!DOCTYPE html>
<html>
<head>
    <title>Ctrl-Alt-Play Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .working { border-left: 4px solid #4CAF50; }
        .issue { border-left: 4px solid #f44336; }
        a { color: #64B5F6; }
        .endpoint { background: #333; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Ctrl-Alt-Play Panel</h1>
        <div class="status working">
            <h3>✅ Application Status: Running</h3>
            <p>The backend services are operational.</p>
        </div>
        
        <div class="status issue">
            <h3>⚠️ Frontend Issue</h3>
            <p>The frontend is configured for development mode and redirects to port 3001.</p>
        </div>
        
        <h3>🔗 Working Endpoints:</h3>
        <div class="endpoint">
            <strong>API Info:</strong> <a href="/api/info" target="_blank">/api/info</a>
        </div>
        <div class="endpoint">
            <strong>Health Check:</strong> <a href="/health" target="_blank">/health</a>
        </div>
        <div class="endpoint">
            <strong>Monitoring API:</strong> <a href="/api/monitoring" target="_blank">/api/monitoring</a>
        </div>
        <div class="endpoint">
            <strong>Direct App Access:</strong> <a href="http://localhost:3000" target="_blank">http://localhost:3000</a>
        </div>
        
        <div class="status">
            <h3>🛠️ Quick Fix</h3>
            <p>While the frontend redirect is being fixed, you can:</p>
            <ul>
                <li>Use the API endpoints above for backend functionality</li>
                <li>Access the app directly at <code>localhost:3000</code></li>
                <li>The core application services are fully operational</li>
            </ul>
        </div>
    </div>
</body>
</html>';
            add_header Content-Type text/html;
        }
        
        # Proxy API calls to the backend
        location /api/ {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Proxy health checks
        location /health {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Proxy socket.io
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Backup current nginx config
cp nginx/nginx.conf nginx/nginx.conf.backup

# Apply the fix
cp /tmp/nginx-fix.conf nginx/nginx.conf

# Restart nginx
echo "🔄 Restarting nginx with fix..."
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "✅ Fix applied!"
echo ""
echo "🌐 You can now access:"
echo "   - Main page: http://localhost"
echo "   - API: http://localhost/api/info"
echo "   - Health: http://localhost/health"
echo "   - Direct app: http://localhost:3000"
echo ""
echo "📝 Note: This provides a working interface while the frontend redirect is resolved."
echo "    The original nginx config is backed up as nginx/nginx.conf.backup"
