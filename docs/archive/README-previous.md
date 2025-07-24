# 🎮 Ctrl-Alt-Play Panel

> **A comprehensive web-based game server management system with modern UI and real-time capabilities**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-ready-blue)](https://www.typescriptlang.org/)

## 🌟 Overview

Ctrl-Alt-Play Panel is a production-ready game server management system inspired by Pelican Panel, featuring a modern glass morphism UI, real-time monitoring, and comprehensive file management capabilities. Built with security and performance in mind.

## 🎮 Terminology

In Ctrl-Alt-Play, we use a theme-consistent naming convention:

- **🎛️ Ctrl** - Server categories/groups (e.g., "Minecraft Servers", "FPS Games", "Survival Games")
- **⌨️ Alt** - Individual server configurations/templates (e.g., "Minecraft Java 1.21", "Rust Vanilla", "CS2 Competitive")

This replaces traditional "Nest/Egg" terminology with something that aligns with our "Ctrl-Alt-Play" branding while maintaining the same hierarchical structure: Ctrls contain multiple Alts, and users deploy servers based on specific Alt configurations.

## ✨ Key Features

### 🎯 **Core Functionality**
- **📁 Advanced File Management** - Monaco editor, drag-drop uploads, directory operations
- **💻 Real-time Console** - Live terminal with xterm.js, command execution
- **📊 Live Monitoring** - Real-time charts, resource usage, server statistics
- **🔐 Security First** - Path validation, upload restrictions, rate limiting
- **🌐 Modern UI** - Glass morphism design, responsive layout, professional feel

### 🛠️ **Technical Features**
- **⚡ WebSocket Integration** - Real-time communication on port 8080
- **🐳 Docker Ready** - Complete containerization with production configs
- **🔌 RESTful API** - Comprehensive API for automation and integration
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🚀 Production Ready** - VPS deployment automation included

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel
docker-compose up -d
```

### Option 2: Local Development
```bash
git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
cd ctrl-alt-play-panel
npm install
cp .env.example .env
npm run dev
```

**Access Points:**
- 🌐 **Dashboard**: http://localhost:3002
- 📁 **File Manager**: http://localhost:3002/files.html  
- 💻 **Console**: http://localhost:3002/console.html

## 🏗️ Architecture

### **Backend Stack**
- **Node.js 18+** with TypeScript
- **Express.js** with security middleware
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **WebSocket** for real-time communication

### **Frontend Technologies**
- **Monaco Editor** for code editing
- **xterm.js** for terminal interface
- **Chart.js** for monitoring graphs
- **TailwindCSS** with glass morphism
- **Native WebSocket** for real-time updates

## 🔌 API Documentation

### File Management API
```bash
GET    /api/files/list?path=<path>     # List directory contents
GET    /api/files/read?path=<path>     # Read file content
POST   /api/files/write               # Write file content
POST   /api/files/mkdir               # Create directory
DELETE /api/files/delete              # Delete file/folder
POST   /api/files/rename              # Rename file/folder
GET    /api/files/download?path=<path> # Download file
```

### WebSocket Events
```javascript
// Console output streaming
ws.on('console-output', (data) => terminal.write(data.output));

// Live monitoring data
ws.on('server-stats', (data) => updateCharts(data));

// File system notifications
ws.on('file-changes', (data) => refreshFileList());
```

## 🚀 Production Deployment

### VPS Deployment (Automated)
```bash
# Configure your VPS details in deploy-to-vps.sh
./deploy-to-vps.sh setup    # Initial deployment
./deploy-to-vps.sh update   # Update deployment
./deploy-to-vps.sh logs     # View logs
```

### Manual Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Production Features:**
- 🔒 SSL/TLS with nginx reverse proxy
- 🛡️ Security hardening and firewall configuration
- 📈 Health checks and monitoring
- 🔄 Automatic restarts and log rotation
- 📦 Optimized container builds

## 🔐 Security Features

- ✅ **Path Traversal Protection** - All file paths validated
- ✅ **Upload Restrictions** - File size and type limitations
- ✅ **Rate Limiting** - API endpoint protection
- ✅ **Input Validation** - Comprehensive request validation
- ✅ **Security Headers** - Helmet middleware integration
- ✅ **CORS Configuration** - Controlled cross-origin access

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose

### Development Commands
```bash
npm run dev          # Development with hot reload
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix lint issues
```

### Project Structure
```
src/
├── index.ts              # Main server (WebSocket + Express)
├── routes/
│   ├── files.ts          # File management API
│   ├── auth.ts           # Authentication
│   ├── monitoring.ts     # System monitoring
│   └── workshop.ts       # Workshop/mods
├── middleware/           # Express middleware
├── models/              # Data models
└── utils/               # Utility functions

public/
├── index.html           # Dashboard interface
├── files.html           # File manager with Monaco
├── console.html         # Real-time console
└── assets/             # Static assets
```

## 📚 Documentation

- 📖 **[Development Guide](.copilot/instructions.md)** - Comprehensive development instructions
- 🚀 **[VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)** - Production deployment guide
- 🔧 **[Setup Guide](.copilot/setup-guide.md)** - Quick setup instructions
- 📝 **[Session Context](.copilot/session-context.md)** - Complete development history

## 🤝 Contributing

We welcome contributions! The project includes comprehensive GitHub Copilot instructions for seamless development continuation.

### Getting Started
1. Read the [Development Guide](.copilot/instructions.md)
2. Check [Session Context](.copilot/session-context.md) for full project history
3. Follow the [Setup Guide](.copilot/setup-guide.md) for quick start

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Inspired by**: Pelican Panel and modern game server management solutions
- **Built with**: Modern web technologies and security best practices
- **Designed for**: Production use with comprehensive deployment automation

---

**Ready to manage your game servers with style?** 🎮✨
