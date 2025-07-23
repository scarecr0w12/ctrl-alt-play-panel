# Project Setup Guide - Ctrl-Alt-Play Panel
Quick setup guide for continuing development in any environment

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development
```bash
# Development mode (port 3002)
npm run dev

# Or with Docker
docker-compose up -d
```

## 📋 Key Information

### Access Points
- **Development Server**: http://localhost:3002
- **Dashboard**: http://localhost:3002/
- **File Manager**: http://localhost:3002/files.html
- **Console**: http://localhost:3002/console.html
- **WebSocket**: ws://localhost:8080

### API Endpoints
- `GET /api/files/list?path=<path>` - List directory
- `GET /api/files/read?path=<path>` - Read file
- `POST /api/files/write` - Write file
- `POST /api/files/mkdir` - Create directory
- `DELETE /api/files/delete` - Delete file/folder
- `POST /api/files/rename` - Rename file/folder

### Project Structure
```
src/index.ts           # Main server
src/routes/files.ts    # File management API
public/index.html      # Dashboard
public/files.html      # File manager with Monaco editor
public/console.html    # Real-time console
```

## 🔧 Development Commands
```bash
npm run dev            # Development with hot reload
npm run build          # Build for production
npm start              # Start production server
npm test               # Run tests
npm run lint           # Lint code
```

## 🐳 Docker Commands
```bash
docker-compose up -d              # Start development environment
docker-compose -f docker-compose.prod.yml up -d  # Production
./deploy-to-vps.sh setup          # Deploy to VPS
```

## 📖 Documentation
- `.copilot/instructions.md` - Complete development guide
- `.copilot/session-context.md` - Full development history
- `VPS_DEPLOYMENT_GUIDE.md` - Production deployment
- `README.md` - Project overview

## 🎯 Current Features
✅ File management with Monaco editor
✅ Real-time console with WebSocket
✅ Professional dashboard
✅ Glass morphism UI
✅ Production-ready Docker setup
✅ VPS deployment automation

## 🔐 Security Notes
- All file paths are validated for security
- Upload size limits enforced
- Rate limiting on API endpoints
- CORS and security headers configured
- Production environment variables required

## 🆘 Quick Troubleshooting
- **Port conflicts**: Check ports 3002, 8080, 5432, 6379
- **TypeScript errors**: Run `npm run build`
- **WebSocket issues**: Verify port 8080 is available
- **File permissions**: Ensure logs/ and uploads/ are writable

Ready to continue development! 🚀
