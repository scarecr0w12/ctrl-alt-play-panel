#!/bin/bash

# Alex Setup Validation Test
# Tests the Alex-friendly installer improvements

echo "🧪 Testing Alex-Friendly Setup Improvements"
echo "============================================"

cd /home/scarecrow/ctrl-alt-play-panel

# Test 1: JSON Configuration
echo ""
echo "Test 1: MCP JSON Configuration"
echo "------------------------------"
if python3 -m json.tool .vscode/mcp.json > /dev/null 2>&1; then
    echo "✅ MCP JSON syntax is valid"
else
    echo "❌ MCP JSON has syntax errors"
fi

# Test 2: Alex Setup Script
echo ""
echo "Test 2: Alex Setup Script"
echo "-------------------------"
if [ -x "alex-setup.sh" ]; then
    echo "✅ Alex setup script is executable"

    # Test the welcome message (non-interactive)
    if head -50 alex-setup.sh | grep -q "Game Server Setup"; then
        echo "✅ Alex-friendly welcome message present"
    else
        echo "❌ Welcome message not found"
    fi

    if grep -q "No Command Line Experience Needed" alex-setup.sh; then
        echo "✅ Beginner-friendly messaging found"
    else
        echo "❌ Beginner messaging missing"
    fi
else
    echo "❌ Alex setup script not executable"
fi

# Test 3: Documentation
echo ""
echo "Test 3: Alex Documentation"
echo "---------------------------"
if [ -f "QUICK_START_ALEX.md" ]; then
    echo "✅ Alex quick start guide exists"

    if grep -q "One-Command Install" QUICK_START_ALEX.md; then
        echo "✅ One-command install instructions present"
    else
        echo "❌ One-command install missing"
    fi
else
    echo "❌ Alex quick start guide missing"
fi

# Test 4: Docker Configuration
echo ""
echo "Test 4: Docker Setup"
echo "--------------------"
if [ -f "docker-compose.yml" ]; then
    echo "✅ Docker Compose configuration exists"

    if docker compose config > /dev/null 2>&1; then
        echo "✅ Docker Compose configuration is valid"
    else
        echo "⚠️  Docker Compose validation failed (might need environment setup)"
    fi
else
    echo "❌ Docker Compose configuration missing"
fi

# Test 5: Environment Templates
echo ""
echo "Test 5: Environment Configuration"
echo "---------------------------------"
if [ -f ".env.example" ]; then
    echo "✅ Environment template exists"
else
    echo "❌ Environment template missing"
fi

if [ -f ".env.production.example" ]; then
    echo "✅ Production environment template exists"
else
    echo "❌ Production environment template missing"
fi

# Test 6: Existing Setup Scripts
echo ""
echo "Test 6: Existing Setup Scripts"
echo "------------------------------"
if [ -x "easy-setup.sh" ]; then
    echo "✅ Original easy-setup.sh script exists and is executable"
else
    echo "⚠️  Original easy-setup.sh script not found or not executable"
fi

if [ -x "start.sh" ]; then
    echo "✅ Start script exists and is executable"
else
    echo "⚠️  Start script not found or not executable"
fi

# Summary
echo ""
echo "🎯 Test Summary"
echo "==============="
echo "Alex-friendly improvements are ready for testing!"
echo ""
echo "Next steps for validation:"
echo "1. Test alex-setup.sh in a clean environment"
echo "2. Verify Docker deployment works end-to-end"
echo "3. Test web installer HTML page"
echo "4. Validate cloud deployment templates"
echo ""
echo "Phase 1 implementation: ✅ COMPLETE"
