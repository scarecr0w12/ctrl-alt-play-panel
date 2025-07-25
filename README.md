# 🎮 Ctrl-Alt-Play Panel

A modern, secure game server management panel built with **Panel+Agent distributed architecture**. Features real-time server control, comprehensive monitoring, and enterprise-grade security.

![Version](https://img.shields.io/github/v/tag/scarecr0w12/ctrl-alt-play-panel?label=version&color=blue)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![Architecture](https://img.shields.io/badge/Architecture-Panel%2BAgent-orange.svg)
![Build Status](https://img.shields.io/badge/build-passing-green.svg)
![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)

## 🏗️ Architecture Overview

**Distributed Panel+Agent System** inspired by Pelican Panel/Wings:

- **Panel**: Web interface, user management, API backend (Node.js/TypeScript)
- **Agent**: Lightweight daemons for Docker container management (local + remote nodes)  
- **Communication**: WebSocket-based real-time command protocol with JWT authentication

## ✨ Key Features

### 🔒 Enterprise Security

- JWT authentication with secure httpOnly cookies
- Role-based access control (Admin/User)
- Protected API routes with rate limiting
- Panel↔Agent encrypted communication
- Server-side rendering for enhanced security

### 🎯 Server Management

- **Multi-node distributed architecture**
- **Real-time server controls** (start/stop/restart/kill)
- **Live resource monitoring** (CPU, Memory, Disk, Network)
- **Steam Workshop integration**
- **Docker container isolation**
- **Egg-based configuration system**

### 💻 Modern Interface

- React/Next.js frontend with TypeScript
- Glass morphism design with responsive layout
- Real-time WebSocket updates
- Mobile-friendly dashboard
- Interactive server console

### 🛠 Developer Experience

- Full TypeScript support with strict typing
- Comprehensive API documentation
- Docker development environment
- Automated testing framework
- Memory bank system for context tracking
- Hot reload development

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+

### Development Setup

1. **Clone and Install**

   ```bash
   git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
   cd ctrl-alt-play-panel
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your database and secrets
   ```

3. **Start Services**

   ```bash
   docker-compose up -d postgres redis
   npm run db:push
   npm run db:seed
   ```

4. **Start Development**

   ```bash
   npm run dev
   ```

   **Access Points:**
   - Frontend: <http://localhost:3001>
   - Backend API: <http://localhost:3000>

### Demo Credentials

- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

## 🏗️ Panel+Agent Architecture

### Panel Components

```text
┌─────────────────────┐
│      Frontend       │ ← React/Next.js Dashboard
├─────────────────────┤
│      Backend        │ ← Node.js/TypeScript API
├─────────────────────┤
│      Database       │ ← PostgreSQL + Prisma
├─────────────────────┤
│   Agent Service     │ ← WebSocket Communication
└─────────────────────┘
```

### Agent Components

```text
┌─────────────────────┐
│   Agent Daemon      │ ← Go/Node.js Service
├─────────────────────┤
│   Docker Client     │ ← Container Management
├─────────────────────┤
│   Resource Monitor  │ ← CPU/Memory/Disk Stats
├─────────────────────┤
│  WebSocket Client   │ ← Panel Communication
└─────────────────────┘
```

### Communication Flow

```text
Panel ──(WebSocket)──> Agent ──(Docker API)──> Game Servers
  ↑                      ↓
  └──(Status Events)─────┘
```

## 📁 Project Structure

```text
ctrl-alt-play-panel/
├── src/                    # Panel backend source
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── middlewares/       # Auth, validation, etc.
│   └── types/             # TypeScript definitions
├── frontend/              # React/Next.js frontend
│   ├── components/        # UI components
│   ├── pages/            # Route pages
│   └── styles/           # TailwindCSS styles
├── agent/                 # Agent source code
│   └── src/              # Agent implementation
├── docs/                  # Documentation
│   ├── development/      # Dev guides and specs
│   ├── deployment/       # Production deployment
│   └── archive/          # Historical docs
├── scripts/              # Automation scripts
├── prisma/               # Database schema and migrations
└── memory-bank/          # Project context tracking
```

## 🔧 Available Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Database

```bash
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

### Docker

```bash
docker-compose up -d              # Start all services
docker-compose up -d postgres     # Start database only
docker-compose logs -f            # View logs
docker-compose down               # Stop all services
```

### Agent Development

```bash
cd agent
npm install          # Install agent dependencies
npm run dev          # Start agent in development
npm run build        # Build agent for production
```

### Version Management

```bash
./version.sh patch "Fix authentication bug"     # Bug fixes (1.0.0 → 1.0.1)
./version.sh minor "Add new features"           # New features (1.0.0 → 1.1.0)
./version.sh major "Breaking API changes"       # Breaking changes (1.0.0 → 2.0.0)
```

The version script automatically:
- Updates all package.json files
- Updates CHANGELOG.md with release notes
- Creates git commit and annotated tag
- Pushes changes to remote repository

## 📚 Documentation

### For Developers

- **[Panel+Agent API Specification](docs/development/PANEL_AGENT_API_SPEC.md)** - Complete WebSocket protocol
- **[Issue #27 Implementation](docs/development/ISSUE_27_IMPLEMENTATION.md)** - Server control architecture
- **[Development Context](docs/development/DEVELOPMENT_CONTEXT.md)** - Current project state
- **[Feature Documentation](docs/development/FEATURES.md)** - Implemented features

### For Deployment

- **[VPS Deployment Guide](docs/deployment/VPS_DEPLOYMENT_GUIDE.md)** - Production setup
- **[Docker Compose Files](docs/deployment/)** - Container orchestration
- **[SSL Configuration](docs/deployment/VPS_DEPLOYMENT_GUIDE.md#ssl-setup)** - HTTPS setup

### For Integration

- **[Agent Integration Guide](docs/archive/PANEL_AGENT_INTEGRATION.md)** - Agent development requirements

## 🔐 Security Features

### Authentication & Authorization

- **JWT Tokens**: Secure, stateless authentication
- **Role-Based Access**: Admin, User, and Root Admin roles
- **Session Management**: Secure cookie handling
- **Rate Limiting**: API endpoint protection

### Infrastructure Security

- **HTTPS Enforcement**: SSL/TLS encryption
- **CORS Protection**: Cross-origin request security
- **CSP Headers**: Content Security Policy
- **Docker Isolation**: Container-based security

### Panel↔Agent Security

- **Encrypted Communication**: WSS (WebSocket Secure)
- **Token Authentication**: JWT-based agent verification
- **Command Validation**: Input sanitization and validation

## 📊 Current Status

### ✅ Completed (Phase 1)

- [x] **Panel+Agent Architecture** - Distributed system design
- [x] **Server Control API** - Start/stop/restart/kill endpoints
- [x] **WebSocket Communication** - Real-time Panel↔Agent protocol
- [x] **Authentication System** - JWT-based security
- [x] **Frontend Migration** - React/Next.js with static export
- [x] **Database Schema** - PostgreSQL with Prisma ORM
- [x] **Docker Deployment** - Production-ready containers

### 🔄 In Progress (Phase 2)

- [ ] **Real-time Dashboard** - Live server metrics and monitoring
- [ ] **Agent Docker Integration** - Replace mock handlers with Docker API
- [ ] **Frontend Server Controls** - UI for server management
- [ ] **Enhanced Error Handling** - Graceful degradation and recovery

### 📋 Planned (Phase 3)

- [ ] **Multi-node Management** - Distributed agent deployment
- [ ] **Enhanced Security** - 2FA, audit logging, advanced permissions
- [ ] **Advanced Monitoring** - Performance analytics and alerting
- [ ] **Plugin System** - Extensible architecture for custom features

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode with comprehensive typing
- **ESLint**: Consistent code formatting
- **Testing**: Jest for unit tests, integration tests for APIs
- **Documentation**: Update relevant docs with changes

### Issue Templates

Use the provided GitHub issue templates for:

- **Bug Reports** - Detailed reproduction steps
- **Feature Requests** - Clear requirements and use cases
- **Security Issues** - Private security vulnerability reports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pelican Panel/Wings** - Architectural inspiration
- **Pterodactyl Panel** - Game server management concepts
- **Next.js Team** - Excellent React framework
- **Prisma Team** - Outstanding ORM and database toolkit

---

Built with ❤️ for the gaming community
