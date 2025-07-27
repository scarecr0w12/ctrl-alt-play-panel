#!/bin/bash

# Comprehensive Plugin System Testing Script
# This script tests the entire plugin system including CLI tools, API endpoints, and database integration

set -e

echo "🚀 Starting Comprehensive Plugin System Tests"
echo "============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a test and check its result
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_status $BLUE "Testing: $test_name"
    
    if eval "$test_command"; then
        print_status $GREEN "✅ $test_name - PASSED"
        return 0
    else
        print_status $RED "❌ $test_name - FAILED"
        return 1
    fi
}

# Variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_SCRIPT="$PROJECT_ROOT/scripts/plugin-tools/cli.js"
TEST_PLUGIN_NAME="test-plugin-system"
TEST_PLUGIN_PATH="$PROJECT_ROOT/sample-plugins/$TEST_PLUGIN_NAME"
BACKEND_PID=""
FAILED_TESTS=0
TOTAL_TESTS=0

# Cleanup function
cleanup() {
    print_status $YELLOW "🧹 Cleaning up test environment..."
    
    # Stop backend if running
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    # Clean up test plugins
    if [ -d "$TEST_PLUGIN_PATH" ]; then
        rm -rf "$TEST_PLUGIN_PATH"
    fi
    
    # Clean up database test data
    cd "$PROJECT_ROOT"
    npx prisma db execute --stdin <<< "DELETE FROM plugins WHERE name LIKE 'test-plugin%';" 2>/dev/null || true
    
    print_status $BLUE "Cleanup completed."
}

# Set up trap for cleanup
trap cleanup EXIT

# Change to project directory
cd "$PROJECT_ROOT"

print_status $YELLOW "📋 Pre-flight checks..."

# Check if required files exist
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ ! -f "$CLI_SCRIPT" ]; then
    print_status $RED "❌ CLI script not found at $CLI_SCRIPT"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    print_status $GREEN "✅ CLI script found"
fi

# Check if package.json has plugin scripts
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if grep -q "plugin:" package.json; then
    print_status $GREEN "✅ Plugin scripts found in package.json"
else
    print_status $RED "❌ Plugin scripts not found in package.json"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Check if Prisma schema has Plugin models
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if grep -q "model Plugin" prisma/schema.prisma; then
    print_status $GREEN "✅ Plugin models found in Prisma schema"
else
    print_status $RED "❌ Plugin models not found in Prisma schema"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

print_status $YELLOW "🗄️  Setting up test environment..."

# Generate Prisma client
print_status $BLUE "Generating Prisma client..."
npx prisma generate

# Apply database migrations
print_status $BLUE "Applying database migrations..."
npx prisma db push --force-reset

print_status $YELLOW "🔧 Testing CLI Tools..."

# Test 1: Create Plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Create Plugin" "node '$CLI_SCRIPT' create '$TEST_PLUGIN_NAME'"; then
    # Check if plugin files were created
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -f "$TEST_PLUGIN_PATH/plugin.js" ] && [ -f "$TEST_PLUGIN_PATH/plugin.yaml" ]; then
        print_status $GREEN "✅ Plugin files created successfully"
    else
        print_status $RED "❌ Plugin files not created"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 2: Validate Plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Validate Plugin" "node '$CLI_SCRIPT' validate '$TEST_PLUGIN_PATH'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 3: Install Plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Install Plugin" "node '$CLI_SCRIPT' install '$TEST_PLUGIN_PATH'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 4: List Plugins
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "List Plugins" "node '$CLI_SCRIPT' list | grep -q '$TEST_PLUGIN_NAME'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 5: Enable Plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Enable Plugin" "node '$CLI_SCRIPT' enable '$TEST_PLUGIN_NAME'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 6: Disable Plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Disable Plugin" "node '$CLI_SCRIPT' disable '$TEST_PLUGIN_NAME'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 7: Uninstall Plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Uninstall Plugin" "node '$CLI_SCRIPT' uninstall '$TEST_PLUGIN_NAME'"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

print_status $YELLOW "🌐 Testing Backend Integration..."

# Start the backend server for API testing
print_status $BLUE "Starting backend server..."
npm run build > /dev/null 2>&1 || true
timeout 30 npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 5

# Test Backend Health
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Backend Health Check" "curl -f http://localhost:3000/health > /dev/null 2>&1"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Re-install plugin for API testing
node "$CLI_SCRIPT" install "$TEST_PLUGIN_PATH" > /dev/null 2>&1 || true

# Test API Endpoints
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "GET /api/plugins" "curl -f http://localhost:3000/api/plugins > /dev/null 2>&1"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "GET /api/plugins/$TEST_PLUGIN_NAME" "curl -f http://localhost:3000/api/plugins/$TEST_PLUGIN_NAME > /dev/null 2>&1"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "POST /api/plugins/$TEST_PLUGIN_NAME/enable" "curl -f -X POST http://localhost:3000/api/plugins/$TEST_PLUGIN_NAME/enable > /dev/null 2>&1"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "POST /api/plugins/$TEST_PLUGIN_NAME/disable" "curl -f -X POST http://localhost:3000/api/plugins/$TEST_PLUGIN_NAME/disable > /dev/null 2>&1"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

print_status $YELLOW "🧪 Running Jest Test Suite..."

# Run the comprehensive Jest tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test "Jest Plugin System Tests" "npm test -- tests/plugin-system.test.ts"; then
    :
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

print_status $YELLOW "🔍 Testing Sample Plugins..."

# Test hello-world sample plugin
HELLO_WORLD_PATH="$PROJECT_ROOT/sample-plugins/hello-world"
if [ -d "$HELLO_WORLD_PATH" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "Validate Hello World Plugin" "node '$CLI_SCRIPT' validate '$HELLO_WORLD_PATH'"; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if run_test "Install Hello World Plugin" "node '$CLI_SCRIPT' install '$HELLO_WORLD_PATH'"; then
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test "Enable Hello World Plugin" "node '$CLI_SCRIPT' enable hello-world"; then
                # Clean up
                node "$CLI_SCRIPT" disable hello-world > /dev/null 2>&1 || true
                node "$CLI_SCRIPT" uninstall hello-world > /dev/null 2>&1 || true
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    print_status $YELLOW "⚠️  Hello World sample plugin not found, skipping..."
fi

print_status $YELLOW "📊 Testing Performance..."

# Performance test: Install multiple plugins
print_status $BLUE "Performance Test: Installing 5 plugins..."
START_TIME=$(date +%s)

for i in {1..5}; do
    PERF_PLUGIN_NAME="perf-test-$i"
    PERF_PLUGIN_PATH="$PROJECT_ROOT/sample-plugins/$PERF_PLUGIN_NAME"
    
    # Create minimal plugin
    mkdir -p "$PERF_PLUGIN_PATH"
    cat > "$PERF_PLUGIN_PATH/plugin.yaml" << EOF
name: $PERF_PLUGIN_NAME
version: 1.0.0
author: Test
description: Performance test plugin $i
main: plugin.js
permissions:
  routes: false
  database: false
  filesystem: false
  network: false
EOF

    cat > "$PERF_PLUGIN_PATH/plugin.js" << EOF
const { PluginBase } = require('../../sdk/PluginBase');

class PerfTestPlugin extends PluginBase {
  constructor(context) {
    super(context);
    this.name = '$PERF_PLUGIN_NAME';
    this.version = '1.0.0';
  }

  async install() { return { success: true }; }
  async enable() { return { success: true }; }
  async disable() { return { success: true }; }
  async uninstall() { return { success: true }; }
}

module.exports = PerfTestPlugin;
EOF

    node "$CLI_SCRIPT" install "$PERF_PLUGIN_PATH" > /dev/null 2>&1 || true
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $DURATION -lt 30 ]; then
    print_status $GREEN "✅ Performance Test - Installed 5 plugins in ${DURATION}s (< 30s)"
else
    print_status $RED "❌ Performance Test - Took ${DURATION}s (should be < 30s)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Clean up performance test plugins
for i in {1..5}; do
    PERF_PLUGIN_NAME="perf-test-$i"
    PERF_PLUGIN_PATH="$PROJECT_ROOT/sample-plugins/$PERF_PLUGIN_NAME"
    node "$CLI_SCRIPT" uninstall "$PERF_PLUGIN_NAME" > /dev/null 2>&1 || true
    rm -rf "$PERF_PLUGIN_PATH" 2>/dev/null || true
done

print_status $YELLOW "🔧 Testing Error Handling..."

# Test error handling with invalid plugin
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if ! node "$CLI_SCRIPT" install "/invalid/path" > /dev/null 2>&1; then
    print_status $GREEN "✅ Error Handling - Invalid path rejected correctly"
else
    print_status $RED "❌ Error Handling - Should reject invalid paths"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test malformed plugin.yaml
MALFORMED_PATH="$PROJECT_ROOT/sample-plugins/malformed-test"
mkdir -p "$MALFORMED_PATH"
echo "invalid: yaml: content: [" > "$MALFORMED_PATH/plugin.yaml"
echo "module.exports = {};" > "$MALFORMED_PATH/plugin.js"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if ! node "$CLI_SCRIPT" validate "$MALFORMED_PATH" > /dev/null 2>&1; then
    print_status $GREEN "✅ Error Handling - Malformed YAML rejected correctly"
else
    print_status $RED "❌ Error Handling - Should reject malformed YAML"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

rm -rf "$MALFORMED_PATH"

print_status $YELLOW "📈 Final Results"
print_status $YELLOW "==============="

PASSED_TESTS=$((TOTAL_TESTS - FAILED_TESTS))
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

print_status $BLUE "Total Tests: $TOTAL_TESTS"
print_status $GREEN "Passed: $PASSED_TESTS"
print_status $RED "Failed: $FAILED_TESTS"
print_status $BLUE "Success Rate: $SUCCESS_RATE%"

if [ $FAILED_TESTS -eq 0 ]; then
    print_status $GREEN "🎉 All tests passed! Plugin system is working correctly."
    exit 0
else
    print_status $RED "⚠️  Some tests failed. Please check the plugin system implementation."
    exit 1
fi
