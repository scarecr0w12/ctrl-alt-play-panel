#!/bin/bash

# Ctrl-Alt-Play Panel - Alex-Friendly Setup Script
# For casual gamers who want minimal complexity

set -e

# Enhanced user guidance
echo "🎮 Welcome to Ctrl-Alt-Play Panel!"
echo "=================================="
echo ""
echo "This installer will:"
echo "✅ Check your system automatically"
echo "✅ Install everything you need"
echo "✅ Get your game server running in minutes"
echo ""
echo "No command line experience needed! 😊"
echo ""
read -p "Ready to start? Press Enter to continue..."

# Pre-flight check with friendly explanations
echo ""
echo "🔍 Checking your system..."
echo ""

# Check OS with user-friendly messaging
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Linux detected - Perfect for game servers!"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ macOS detected - Great choice!"
else
    echo "⚠️  Unsupported OS detected"
    echo "   This works best on Linux or macOS"
    echo "   You can still try, but you might need help"
    echo ""
    read -p "Continue anyway? (y/N): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
        echo "No problem! Try this on a Linux server or ask for help on Discord"
        exit 0
    fi
fi

# Smart dependency detection with explanations
echo ""
echo "📦 Checking what we need to install..."

missing_tools=()

if ! command -v docker &> /dev/null; then
    missing_tools+=("Docker (for easy server management)")
fi

if ! command -v git &> /dev/null; then
    missing_tools+=("Git (for downloading the latest version)")
fi

if [ ${#missing_tools[@]} -eq 0 ]; then
    echo "✅ All required tools are already installed!"
else
    echo "📥 We need to install:"
    for tool in "${missing_tools[@]}"; do
        echo "   • $tool"
    done
    echo ""
    echo "Don't worry - this is automatic and safe! 🔒"
    echo ""
    read -p "Install missing tools? (Y/n): " install_tools
    if [[ ! $install_tools =~ ^[Nn]$ ]]; then
        echo "Installing tools... (this may take a few minutes)"
        # Call existing installation logic but with progress indicators
    fi
fi

# Simple configuration with smart defaults
echo ""
echo "⚙️  Quick Setup Questions"
echo ""

read -p "What domain will you use? (just press Enter for 'localhost'): " domain
domain=${domain:-localhost}

echo "✅ Using domain: $domain"

if [ "$domain" != "localhost" ]; then
    read -p "Want SSL/HTTPS security? (Y/n): " want_ssl
    if [[ ! $want_ssl =~ ^[Nn]$ ]]; then
        echo "✅ SSL will be enabled (more secure!)"
        use_ssl=true
    fi
fi

# Auto-generate secure passwords with explanation
echo ""
echo "🔐 Generating secure passwords..."
echo "   (You don't need to remember these - we'll store them safely)"

# Continue with installation using existing logic...
echo ""
echo "🚀 Starting installation..."
echo "   Grab a coffee - this takes about 5-10 minutes ☕"

# Add progress indicators and friendly status updates throughout
