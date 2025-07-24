#!/bin/bash

# Test Panel+Agent Server Control Implementation
# This script tests the new server start/stop/restart endpoints

echo "🧪 Testing Panel+Agent Server Control Implementation"
echo "=================================================="

# Panel API Base URL
PANEL_URL="http://localhost:3000"
API_BASE="$PANEL_URL/api"

# Test credentials (you may need to update these)
TEST_USER="admin"
TEST_PASS="admin123"

echo "1. 🔐 Authenticating with Panel..."
AUTH_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}")

# Extract token (assuming JSON response with token field)
TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed. Response: $AUTH_RESPONSE"
  echo "   Make sure Panel is running and credentials are correct"
  exit 1
fi

echo "✅ Authentication successful"

echo ""
echo "2. 📋 Getting server list..."
SERVERS_RESPONSE=$(curl -s -X GET "$API_BASE/servers" \
  -H "Authorization: Bearer $TOKEN")

echo "Servers response: $SERVERS_RESPONSE"

# Extract first server ID (assuming JSON array with servers)
SERVER_ID=$(echo $SERVERS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SERVER_ID" ]; then
  echo "⚠️  No servers found. Creating a test server would require more setup."
  echo "   For now, we'll test with a mock server ID"
  SERVER_ID="test-server-123"
fi

echo "🎮 Using server ID: $SERVER_ID"

echo ""
echo "3. 🚀 Testing server START command..."
START_RESPONSE=$(curl -s -X POST "$API_BASE/servers/$SERVER_ID/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Start response: $START_RESPONSE"

echo ""
echo "4. ⏸️  Testing server STOP command..."
STOP_RESPONSE=$(curl -s -X POST "$API_BASE/servers/$SERVER_ID/stop" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"signal":"SIGTERM","timeout":30}')

echo "Stop response: $STOP_RESPONSE"

echo ""
echo "5. 🔄 Testing server RESTART command..."
RESTART_RESPONSE=$(curl -s -X POST "$API_BASE/servers/$SERVER_ID/restart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Restart response: $RESTART_RESPONSE"

echo ""
echo "6. 📊 Testing server STATUS..."
STATUS_RESPONSE=$(curl -s -X GET "$API_BASE/servers/$SERVER_ID/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Status response: $STATUS_RESPONSE"

echo ""
echo "✅ Panel+Agent API tests completed!"
echo "   Check responses above for success/error messages"
echo ""
echo "💡 To test full Panel→Agent communication:"
echo "   1. Start the Panel: npm start"
echo "   2. Start the Agent: cd agent && npm start"
echo "   3. Run this test script"
