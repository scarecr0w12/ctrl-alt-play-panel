#!/bin/bash

# Game Panel Setup Script
echo "🎮 Game Panel Setup Script"
echo "=========================="

# Check for required tools
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ All prerequisites found!"

# Create environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your configuration before proceeding"
else
    echo "✅ Environment file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing agent dependencies..."
cd agent
npm install
cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads game-servers

echo "🗄️  Setting up database..."
# Generate Prisma client
npm run db:generate

echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the services:"
echo "   - Development: npm run dev"
echo "   - Production: docker-compose up -d"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "Access the panel at: http://localhost:3000"
