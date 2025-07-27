# Ctrl-Alt-Play Panel

<div align="center">
  <h3>🎮 Advanced Game Server Management Platform</h3>
  <p><em>Complete marketplace integration • Plugin ecosystem • Production-ready infrastructure</em></p>
  
  ![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
  ![TypeScript](https://img.shields.io/badge/typescript-ready-blue.svg)
</div>

---

## 🚀 Quick Start

Get up and running in minutes with our automated installer:

```bash
# Clone the repository
git clone <repository-url>
cd ctrl-alt-play-panel

# Run the easy setup script
chmod +x easy-setup.sh
./easy-setup.sh
```

The installer will guide you through:

- ✅ Dependency installation
- ✅ Environment configuration  
- ✅ Database setup
- ✅ SSL configuration
- ✅ Service deployment

## 📋 Features

### 🎯 Core System

- **Game Server Management**: Complete lifecycle management for game servers
- **Plugin System**: Advanced plugin architecture with CLI development tools
- **User Management**: JWT-based authentication with role-based authorization
- **Real-time Dashboard**: Live server statistics and management interface

### 🏪 Marketplace Integration

- **Plugin Publishing**: Complete workflow for plugin distribution
- **Analytics System**: Comprehensive usage tracking and reporting
- **Plugin Discovery**: Advanced search and categorization
- **Version Management**: Automated versioning and update system

### 🔧 Developer Tools

- **CLI Tools**: Complete development toolkit for plugin creation
- **API Documentation**: Comprehensive REST API with OpenAPI specification
- **Testing Framework**: Full test suite with integration testing
- **Development Environment**: Hot-reload development setup

### 🏗️ Infrastructure

- **Docker Support**: Full containerization with production configurations
- **Database Management**: PostgreSQL with Prisma ORM and migrations
- **Caching Layer**: Redis integration for performance optimization
- **Security**: Comprehensive security middleware and monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Redis Cache   │    │   File Storage  │
│   (Socket.IO)   │    │   (Sessions)    │    │   (Uploads)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## � Documentation

### Getting Started

- [📥 Installation Guide](./docs/INSTALLATION.md)
- [⚙️ Configuration](./docs/CONFIGURATION.md)
- [🚀 Quick Start](./docs/QUICK_START.md)

### Development

- [🛠️ Development Setup](./docs/development/DEVELOPMENT.md)
- [🔌 Plugin Development](./docs/development/PLUGIN_DEVELOPMENT.md)
- [📝 API Reference](./API_DOCUMENTATION.md)
- [🧪 Testing Guide](./docs/TESTING.md)

### Deployment

- [🐳 Docker Deployment](./docs/deployment/DOCKER.md)
- [☁️ Cloud Deployment](./docs/deployment/CLOUD.md)
- [🔒 Security Guide](./SECURITY.md)

### Project Information

- [📈 Project Status](./PROJECT_STATUS_CURRENT.md)
- [🔄 Changelog](./CHANGELOG.md)
- [🗺️ Next Steps](./docs/NEXT_STEPS.md)

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js 16+ with TypeScript
- **Framework**: Express.js with middleware architecture
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt hashing
- **Cache**: Redis for session management
- **Real-time**: WebSocket with Socket.IO

### Frontend

- **Framework**: React 18 with Next.js 13+
- **Styling**: Tailwind CSS with component library
- **State Management**: React Context with hooks
- **Type Safety**: TypeScript with strict configuration

### Infrastructure

- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: Nginx with SSL termination
- **Process Management**: PM2 for production deployment
- **Monitoring**: Custom health checks and logging

## 🏃‍♂️ Development

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose (optional)

### Manual Setup

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:push
npm run db:seed

# Start development servers
npm run dev              # Backend with hot-reload
npm run dev:frontend     # Frontend development server
```

### Available Scripts

```bash
npm run build           # Build for production
npm run start           # Start production server
npm run dev             # Development with hot-reload
npm run test            # Run test suite
npm run db:push         # Push database schema
npm run db:seed         # Seed database with sample data
npm run lint            # Lint TypeScript code
npm run type-check      # TypeScript type checking
```

## 🧪 Testing

Comprehensive test suite covering:

- Unit tests for all services
- Integration tests for API endpoints
- End-to-end testing for critical workflows

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📦 Deployment

### Docker Deployment (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Development environment
docker-compose up -d
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start with PM2
npm run start:prod
```

## 🔒 Security

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting and DDoS protection
- **HTTPS**: SSL/TLS encryption for all communications
- **Security Headers**: Comprehensive security middleware

See [SECURITY.md](./SECURITY.md) for detailed security information.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: Comprehensive guides and API references
- **Issues**: [GitHub Issues](../../issues) for bug reports and feature requests
- **Discussions**: [GitHub Discussions](../../discussions) for community support

## 🗺️ Roadmap

### Phase 3 Completion (Current - v1.5.0)

- ✅ Advanced marketplace integration
- ✅ Plugin publishing workflow
- ✅ Analytics and dashboard system
- ✅ Production deployment infrastructure

### Phase 4 (v1.6.0 - Q2 2025)

- 🔄 Enhanced frontend marketplace interface
- 🔄 Advanced plugin features and management
- 🔄 Enterprise user management
- 🔄 Enhanced monitoring and analytics

### Long-term (v2.0.0+)

- 🔮 Multi-game support expansion
- 🔮 Cloud-native deployment options
- 🔮 Advanced marketplace features
- 🔮 Mobile application support

---

<div align="center">
  <p><strong>Built with ❤️ for the gaming community</strong></p>
  <p><em>Ready for production • Scalable • Secure</em></p>
</div>

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
