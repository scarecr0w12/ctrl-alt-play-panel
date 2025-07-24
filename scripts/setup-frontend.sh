#!/bin/bash

# Ctrl-Alt-Play Panel - Modern Frontend Setup Script
echo "🎮 Setting up Modern React Frontend for Ctrl-Alt-Play Panel"
echo "================================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the ctrl-alt-play-panel root directory"
    exit 1
fi

# Create frontend directory if it doesn't exist
if [ ! -d "frontend" ]; then
    echo "📁 Creating frontend directory..."
    mkdir frontend
fi

cd frontend

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "❌ Error: Frontend package.json not found"
    echo "Please ensure all frontend files are properly created"
    exit 1
fi

# Install backend dependencies if needed
echo "🔧 Checking backend dependencies..."
cd ..
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development servers:"
echo ""
echo "Terminal 1 (Backend):"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "🌐 Access the application:"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:3000"
echo ""
echo "👤 Demo Credentials:"
echo "  Admin: admin@example.com / admin123"
echo "  User:  user@example.com / user123"
echo ""
echo "📚 For more information, see frontend/README.md"
