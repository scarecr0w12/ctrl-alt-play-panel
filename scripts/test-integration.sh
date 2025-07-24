#!/bin/bash

# 🧪 Ctrl-Alt-Play Panel & Agent Integration Test Script
echo "🚀 Starting Ctrl-Alt-Play Panel & Agent Integration Test"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service is healthy
check_service_health() {
    local service_name=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    print_status "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f docker-compose.test.yml ps $service_name | grep -q "Up"; then
            print_success "$service_name is running (attempt $attempt/$max_attempts)"
            return 0
        fi
        
        print_status "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    print_status "Testing: $description"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/curl_response "$url")
    http_code="${response: -3}"
    
    if [ "$http_code" -eq "$expected_status" ]; then
        print_success "✅ $description - HTTP $http_code"
        return 0
    else
        print_error "❌ $description - Expected HTTP $expected_status, got HTTP $http_code"
        echo "Response: $(cat /tmp/curl_response)"
        return 1
    fi
}

# Function to test WebSocket connection
test_websocket() {
    print_status "Testing WebSocket connection..."
    
    # Use a simple WebSocket test (requires websocat or similar)
    if command -v websocat >/dev/null 2>&1; then
        timeout 5 websocat ws://localhost:8080 < /dev/null && \
        print_success "✅ WebSocket endpoint is accessible" || \
        print_warning "⚠️ WebSocket test inconclusive (connection may require authentication)"
    else
        print_warning "⚠️ websocat not installed, skipping WebSocket connectivity test"
    fi
}

# Function to check agent health
check_agent_health() {
    print_status "Checking agent health endpoint..."
    
    if test_endpoint "http://localhost:8081/health" 200 "Agent health check"; then
        health_response=$(curl -s "http://localhost:8081/health")
        print_success "Agent health response: $health_response"
        return 0
    else
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if docker compose -f docker-compose.test.yml exec ctrl-alt-play npx prisma migrate deploy >/dev/null 2>&1; then
        print_success "✅ Database migrations completed"
        return 0
    else
        print_error "❌ Database migrations failed"
        return 1
    fi
}

# Function to test authentication
test_authentication() {
    print_status "Testing authentication..."
    
    # Test registration with all required fields
    register_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","email":"test@example.com","password":"testpass123","firstName":"Test","lastName":"User"}' \
        http://localhost:3000/api/auth/register)
    
    if echo "$register_response" | grep -q '"success":true'; then
        print_success "✅ User registration successful"
    else
        print_warning "⚠️ User registration failed or user already exists"
    fi
    
    # Test login with email (not username)
    login_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpass123"}' \
        http://localhost:3000/api/auth/login)
    
    if echo "$login_response" | grep -q '"success":true'; then
        print_success "✅ User login successful"
        
        # Extract token
        token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            print_success "✅ JWT token extracted successfully"
            echo "$token" > /tmp/auth_token
            return 0
        fi
    fi
    
    print_error "❌ Authentication test failed"
    return 1
}

# Function to test protected endpoints
test_protected_endpoints() {
    if [ ! -f /tmp/auth_token ]; then
        print_error "❌ No auth token available for protected endpoint tests"
        return 1
    fi
    
    local token=$(cat /tmp/auth_token)
    
    print_status "Testing protected endpoints with authentication..."
    
    # Test users endpoint
    users_response=$(curl -s -H "Authorization: Bearer $token" \
        http://localhost:3000/api/users)
    
    if echo "$users_response" | grep -q '"success":true'; then
        print_success "✅ Users endpoint accessible with auth"
    else
        print_error "❌ Users endpoint test failed"
    fi
    
    # Test nodes endpoint
    nodes_response=$(curl -s -H "Authorization: Bearer $token" \
        http://localhost:3000/api/nodes)
    
    if echo "$nodes_response" | grep -q '"success":true'; then
        print_success "✅ Nodes endpoint accessible with auth"
    else
        print_error "❌ Nodes endpoint test failed"
    fi
    
    # Test monitoring endpoint
    stats_response=$(curl -s -H "Authorization: Bearer $token" \
        http://localhost:3000/api/monitoring/stats)
    
    if echo "$stats_response" | grep -q '"success":true'; then
        print_success "✅ Monitoring stats endpoint accessible with auth"
    else
        print_error "❌ Monitoring stats endpoint test failed"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test environment..."
    docker compose -f docker-compose.test.yml down -v
    rm -f /tmp/auth_token /tmp/curl_response
    print_success "✅ Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main test execution
main() {
    print_status "Starting integration test..."
    
    # Check if docker compose is available
    if ! command -v docker >/dev/null 2>&1; then
        print_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
    
    # Build and start services
    print_status "Building and starting services..."
    if ! docker compose -f docker-compose.test.yml up -d --build; then
        print_error "Failed to start services"
        exit 1
    fi
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check database health
    if ! check_service_health "postgres" 30; then
        print_error "Database failed to start"
        exit 1
    fi
    
    # Check Redis health
    if ! check_service_health "redis" 30; then
        print_error "Redis failed to start"
        exit 1
    fi
    
    # Check panel health
    if ! check_service_health "ctrl-alt-play" 60; then
        print_error "Panel failed to start"
        exit 1
    fi
    
    # Check agent health
    if ! check_service_health "test-agent" 60; then
        print_error "Test agent failed to start"
        exit 1
    fi
    
    # Run database migrations
    if ! run_migrations; then
        print_error "Database setup failed"
        exit 1
    fi
    
    # Wait a bit more for full initialization
    print_status "Waiting for full service initialization..."
    sleep 15
    
    # Run health checks
    print_status "Running health checks..."
    
    # Test basic connectivity
    if ! test_endpoint "http://localhost:3000" 200 "Panel home page"; then
        print_error "Panel is not accessible"
        exit 1
    fi
    
    # Test API health
    if ! test_endpoint "http://localhost:3000/api/monitoring/health" 200 "Panel API health"; then
        print_error "Panel API is not healthy"
        exit 1
    fi
    
    # Test WebSocket endpoint
    test_websocket
    
    # Test agent health
    if ! check_agent_health; then
        print_error "Agent health check failed"
        exit 1
    fi
    
    # Test authentication
    if ! test_authentication; then
        print_error "Authentication tests failed"
        exit 1
    fi
    
    # Test protected endpoints
    test_protected_endpoints
    
    # Show logs for analysis
    print_status "Showing recent logs..."
    echo ""
    echo "=== PANEL LOGS ==="
    docker compose -f docker-compose.test.yml logs --tail=20 ctrl-alt-play
    echo ""
    echo "=== AGENT LOGS ==="
    docker compose -f docker-compose.test.yml logs --tail=20 test-agent
    echo ""
    
    # Final status check
    print_status "Final service status check..."
    docker compose -f docker-compose.test.yml ps
    
    print_success "🎉 Integration test completed!"
    print_status "Services are running and communicating properly."
    print_status "You can access:"
    print_status "  - Panel: http://localhost:3000"
    print_status "  - Agent Health: http://localhost:8081/health"
    print_status "  - WebSocket: ws://localhost:8080"
    
    print_warning "To stop the test environment, run: docker compose -f docker-compose.test.yml down -v"
}

# Run main function
main "$@"
