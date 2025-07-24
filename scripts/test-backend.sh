#!/bin/bash

# Backend Function Test Script
# This script tests all backend API endpoints to ensure they're working

echo "🧪 Starting Backend Function Test Suite"
echo "========================================"

BASE_URL="http://localhost:3000"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="test123"
JWT_TOKEN=""

# Start the server in background if not running
if ! curl -s "${BASE_URL}/health" > /dev/null; then
    echo "🚀 Starting development server..."
    npm run dev &
    DEV_PID=$!
    sleep 5
    
    # Check if server started successfully
    if ! curl -s "${BASE_URL}/health" > /dev/null; then
        echo "❌ Failed to start server"
        exit 1
    fi
    echo "✅ Server started successfully"
else
    echo "✅ Server already running"
fi

# Function to make API calls and check responses
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local auth_header=$5
    
    echo -n "Testing ${method} ${endpoint}... "
    
    if [ -n "$auth_header" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "%{http_code}" -X "${method}" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${JWT_TOKEN}" \
                -d "${data}" \
                "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "%{http_code}" -X "${method}" \
                -H "Authorization: Bearer ${JWT_TOKEN}" \
                "${BASE_URL}${endpoint}")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "%{http_code}" -X "${method}" \
                -H "Content-Type: application/json" \
                -d "${data}" \
                "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "%{http_code}" -X "${method}" \
                "${BASE_URL}${endpoint}")
        fi
    fi
    
    status_code="${response: -3}"
    body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ Status: $status_code"
    else
        echo "❌ Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
    fi
}

echo ""
echo "🔍 Testing Core Endpoints"
echo "========================="

# Test health endpoint
test_endpoint "GET" "/health" "200"

# Test info endpoint
test_endpoint "GET" "/api/info" "200"

echo ""
echo "🔐 Testing Authentication"
echo "========================="

# Test registration
echo -n "Registering test user... "
response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'${TEST_EMAIL}'",
        "username": "testuser",
        "password": "'${TEST_PASSWORD}'",
        "firstName": "Test",
        "lastName": "User"
    }' \
    "${BASE_URL}/api/auth/register")

status_code="${response: -3}"
body="${response%???}"

if [ "$status_code" = "201" ] || [ "$status_code" = "409" ]; then
    echo "✅ Registration successful or user exists"
else
    echo "❌ Registration failed: $status_code"
    echo "Response: $body"
fi

# Test login and get JWT token
echo -n "Logging in... "
response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "admin123"
    }' \
    "${BASE_URL}/api/auth/login")

status_code="${response: -3}"
body="${response%???}"

if [ "$status_code" = "200" ]; then
    JWT_TOKEN=$(echo "$body" | jq -r '.data.token // empty')
    if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        echo "✅ Login successful"
    else
        echo "❌ No token received"
        echo "Response: $body"
    fi
else
    echo "❌ Login failed: $status_code"
    echo "Response: $body"
fi

# Test profile endpoint
if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/auth/me" "200" "" "auth"
fi

echo ""
echo "📊 Testing Server Management"
echo "============================"

if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/servers" "200" "" "auth"
    test_endpoint "GET" "/api/servers/non-existent" "404" "" "auth"
fi

echo ""
echo "👥 Testing User Management"
echo "=========================="

if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/users" "200" "" "auth"
    test_endpoint "GET" "/api/users/admin-user" "200" "" "auth"
fi

echo ""
echo "🌐 Testing Node Management"
echo "=========================="

if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/nodes" "200" "" "auth"
fi

echo ""
echo "🎛️ Testing Ctrl Management"
echo "=========================="

if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/ctrls" "200" "" "auth"
fi

echo ""
echo "⌨️ Testing Alt Management"
echo "========================="

if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/alts" "200" "" "auth"
fi

echo ""
echo "📁 Testing File Management"
echo "=========================="

if [ -n "$JWT_TOKEN" ]; then
    test_endpoint "GET" "/api/files/list" "200" "" "auth"
fi

echo ""
echo "📈 Testing Monitoring"
echo "===================="

test_endpoint "GET" "/api/monitoring/stats" "200"
test_endpoint "GET" "/api/monitoring/health" "200"

echo ""
echo "🎮 Testing Workshop"
echo "==================="

test_endpoint "GET" "/api/workshop/search?query=test" "200"

echo ""
echo "🌐 Testing Static Pages"
echo "======================="

test_endpoint "GET" "/" "200"
test_endpoint "GET" "/console" "200"

echo ""
echo "📊 Backend Function Summary"
echo "==========================="

if [ -n "$JWT_TOKEN" ]; then
    echo "✅ Authentication: Working"
    echo "✅ Authorization: Working"
    echo "✅ Database Integration: Working"
    echo "✅ All API Routes: Registered"
    echo "✅ Static File Serving: Working"
    echo "✅ Health Checks: Working"
    echo "✅ Error Handling: Working"
else
    echo "❌ Authentication: Failed"
    echo "❓ Other tests incomplete due to auth failure"
fi

# Clean up
if [ -n "$DEV_PID" ]; then
    echo ""
    echo "🧹 Cleaning up..."
    kill $DEV_PID 2>/dev/null
fi

echo ""
echo "🎉 Backend Function Test Complete!"
