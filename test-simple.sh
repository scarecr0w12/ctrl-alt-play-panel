#!/bin/bash

echo "🚀 Running Simple Panel & Agent Integration Test"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting local panel test..."

# Start the panel locally
cd /home/scarecrow/ctrl-alt-play-panel

# Kill any existing processes
pkill -f "node.*index" || true
pkill -f "npm.*dev" || true

print_status "Starting panel with npm run dev..."

# Set environment variables for the panel
export AGENT_SECRET=agent-secret

# Start the panel in the background
npm run dev > /tmp/panel.log 2>&1 &
PANEL_PID=$!

print_status "Panel started with PID: $PANEL_PID"

# Wait for panel to start
sleep 10

print_status "Testing panel connectivity..."

# Test basic connectivity
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "✅ Panel is accessible at http://localhost:3000"
else
    print_error "❌ Panel is not accessible"
    echo "Panel logs:"
    tail -20 /tmp/panel.log
    kill $PANEL_PID 2>/dev/null || true
    exit 1
fi

# Test WebSocket port
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    print_success "✅ WebSocket port 8080 is accessible"
else
    print_error "❌ WebSocket port 8080 is not accessible"
fi

print_status "Starting test agent..."

# Set environment variables for the agent
export PANEL_URL=ws://localhost:8080
export NODE_ID=test-node-1
export AGENT_SECRET=agent-secret
export HEALTH_PORT=8081

# Start test agent in the background
cd /home/scarecrow/ctrl-alt-play-panel/agent
npm run dev > /tmp/agent.log 2>&1 &
AGENT_PID=$!

print_status "Agent started with PID: $AGENT_PID"

# Wait for agent to connect
sleep 5

print_status "Testing agent health..."

# Test agent health endpoint
if curl -s http://localhost:8081/health > /dev/null 2>&1; then
    print_success "✅ Agent health endpoint accessible"
    
    # Get health response
    health_response=$(curl -s http://localhost:8081/health)
    print_success "Agent health: $health_response"
else
    print_error "❌ Agent health endpoint not accessible"
    echo "Agent logs:"
    tail -10 /tmp/agent.log
fi

print_status "Testing API endpoints..."

# Test authentication
auth_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}' \
    http://localhost:3000/api/auth/login)

if echo "$auth_response" | grep -q '"success":true'; then
    print_success "✅ Authentication working"
    
    # Extract token
    token=$(echo "$auth_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        print_success "✅ JWT token extracted"
        
        # Test protected endpoint
        users_response=$(curl -s -H "Authorization: Bearer $token" \
            http://localhost:3000/api/users)
        
        if echo "$users_response" | grep -q '"success":true'; then
            print_success "✅ Protected endpoints working"
        else
            print_error "❌ Protected endpoints failing"
        fi
    fi
else
    print_error "❌ Authentication failing"
    echo "Auth response: $auth_response"
fi

print_status "Test completed!"

print_status "Recent panel logs:"
tail -15 /tmp/panel.log

print_status "Recent agent logs:"
tail -15 /tmp/agent.log

print_status "Cleaning up..."
kill $PANEL_PID 2>/dev/null || true
kill $AGENT_PID 2>/dev/null || true

print_success "✅ Simple test completed!"
print_status "Panel: http://localhost:3000"
print_status "Agent Health: http://localhost:8081/health"
print_status "WebSocket: ws://localhost:8080"
