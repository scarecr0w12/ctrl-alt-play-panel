# 🎮 Ctrl-Alt-Play Panel

A modern, secure game server management panel built with **Panel+Agent distributed architecture**. Features real-time server control, comprehensive monitoring, and enterprise-grade security.

![Version](https://img.shields.io/github/v/tag/scarecr0w12/ctrl-alt-play-panel?label=version&color=blue)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![Architecture](https://img.shields.io/badge/Architecture-Panel%2BAgent-orange.svg)
![CI/CD](https://github.com/scarecr0w12/ctrl-alt-play-panel/workflows/CI%2FCD%20Pipeline/badge.svg)
![Security](https://img.shields.io/github/workflow/status/scarecr0w12/ctrl-alt-play-panel/Security%20Audit?label=security&logo=github)
![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)

## 🏗️ Architecture Overview

**Distributed Panel+Agent System** with external agent communication:

- **Panel**: Web interface, user management, API backend (Node.js/TypeScript)
- **External Agents**: Separate projects running on nodes for container management
- **Communication**: HTTP REST API + WebSocket for real-time events
- **Discovery**: Automatic agent discovery and health monitoring
- **Scalability**: Agents run independently and can be deployed on any node

### 🔗 External Agent Integration (v1.1.3)

The panel now communicates with external agent processes instead of embedded agent code:

- **Auto-Discovery**: Automatically finds and registers agents on known nodes
- **Health Monitoring**: Continuous health checks and status tracking
- **Command Routing**: All server operations route through external agents
- **API Management**: REST endpoints for manual agent registration and control
- **Fault Tolerance**: Graceful handling of agent disconnections and failures

**Benefits:**
- ✅ **Separation of Concerns**: Panel and agents are independent projects
- ✅ **Scalability**: Deploy multiple agents across different infrastructure
- ✅ **Reliability**: Agents can restart without affecting the panel
- ✅ **Security**: Authenticated communication using node daemon tokens
- ✅ **Flexibility**: Support for various agent implementations

## ✨ Key Features

### 🔒 Enterprise Security

- **Advanced RBAC**: 36 granular permissions across 10 categories
- **Role-based Access Control**: USER → MODERATOR → ADMIN hierarchy
- **JWT Authentication**: Secure httpOnly cookies with session management
- **Real-time Security Monitoring**: Automated threat detection and alerting
- **Comprehensive Audit Trails**: Complete action logging and analytics
- **Permission-aware UI**: Dynamic interface based on user permissions
- **Multi-platform Alerting**: Slack/Discord/Teams integration

### 🎯 Server Management

- **Multi-node distributed architecture**
- **Real-time server controls** (start/stop/restart/kill)
- **Live resource monitoring** (CPU, Memory, Disk, Network)
- **Steam Workshop integration**
- **Docker container isolation**
- **Ctrl-Alt configuration system**

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

- **Node.js 18+** and npm
- **Docker** and Docker Compose
- **PostgreSQL 14+** (provided via Docker)
- **Redis 6+** (provided via Docker)

### Installation

1. **Clone and Install**

   ```bash
   git clone https://github.com/yourusername/ctrl-alt-play-panel.git
   cd ctrl-alt-play-panel
   ./scripts/setup.sh
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   nano .env  # Edit with your secure secrets
   ```

3. **Start Services**

   ```bash
   # Start database services
   docker-compose up -d postgres redis
   
   # Initialize database
   npm run db:push
   npm run db:seed
   ```

4. **Start Application**

   ```bash
   # Development
   npm run dev
   
   # Production
   ./start.sh
   ```

**Access the panel:** <http://localhost:3000>

**Default credentials:**
- Username: `admin`
- Password: `admin123` (change immediately!)

> 📖 **Need detailed instructions?** See [QUICK_START.md](QUICK_START.md) or [INSTALLATION.md](INSTALLATION.md)

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

### Docker & Scripts

```bash
./start.sh                    # Start all services (production)
./start.sh stop              # Stop all services
./start.sh status            # Show service status
./start.sh logs              # View logs
./start.sh update            # Update and restart services

./scripts/setup.sh           # Initial setup script
./scripts/setup-frontend.sh  # Frontend-specific setup
./scripts/setup-project-automation.sh  # Git hooks and automation
```

### Version Management

```bash
./version.sh patch "Fix authentication bug"     # Bug fixes (1.2.0 → 1.2.1)
./version.sh minor "Add new features"           # New features (1.2.0 → 1.3.0)
./version.sh major "Breaking API changes"       # Breaking changes (1.2.0 → 2.0.0)
```

The version script automatically:
- Updates all package.json files
- Updates CHANGELOG.md with release notes
- Creates git commit and annotated tag
- Pushes changes to remote repository

## 📚 Documentation

### Getting Started

- **[Quick Start Guide](QUICK_START.md)** - 10-minute setup guide for new users
- **[Installation Guide](INSTALLATION.md)** - Comprehensive installation instructions
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference

### For Developers

- **[Panel+Agent API Specification](docs/development/PANEL_AGENT_API_SPEC.md)** - Complete WebSocket protocol
- **[Issue #27 Implementation](docs/development/ISSUE_27_IMPLEMENTATION.md)** - Server control architecture
- **[Development Context](docs/development/DEVELOPMENT_CONTEXT.md)** - Current project state
- **[Feature Documentation](docs/development/FEATURES.md)** - Implemented features
- **[Testing Guide](docs/TESTING.md)** - Testing procedures and frameworks

### For Deployment

- **[VPS Deployment Guide](docs/deployment/VPS_DEPLOYMENT_GUIDE.md)** - Production setup
- **[Docker Compose Files](docs/deployment/)** - Container orchestration
- **[SSL Configuration](docs/deployment/VPS_DEPLOYMENT_GUIDE.md#ssl-setup)** - HTTPS setup

### For Integration

- **[Agent Integration Guide](docs/archive/PANEL_AGENT_INTEGRATION.md)** - Agent development requirements
- **[CHANGELOG](CHANGELOG.md)** - Version history and release notes
- **[Security Guide](SECURITY.md)** - Security best practices

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
- [x] **Advanced Permission System** - 36 granular permissions with RBAC
- [x] **Server Control API** - Start/stop/restart/kill endpoints with permission checks
- [x] **WebSocket Communication** - Real-time Panel↔Agent protocol
- [x] **Enterprise Authentication** - JWT with session management and security logging
- [x] **Permission-aware Frontend** - React/Next.js with dynamic UI based on permissions
- [x] **Database Schema** - PostgreSQL with comprehensive RBAC models
- [x] **Security Monitoring** - Real-time threat detection and alerting
- [x] **Docker Deployment** - Production-ready containers

### 🔄 In Progress (Phase 2)

- [ ] **Agent Docker Integration** - Replace mock handlers with Docker API
- [ ] **Multi-node Management** - Distributed agent deployment
- [ ] **Enhanced Error Handling** - Graceful degradation and recovery

### 📋 Planned (Phase 3)

- [ ] **Advanced Monitoring** - Performance analytics and custom dashboards
- [ ] **Plugin System** - Extensible architecture for custom features
- [ ] **API Rate Limiting** - Advanced throttling and usage analytics
- [ ] **Backup & Recovery** - Automated data protection

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
