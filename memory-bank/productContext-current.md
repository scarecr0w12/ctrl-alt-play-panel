# Product Context

## Project Overview

**Ctrl-Alt-Play Panel** is a comprehensive open-source game server management platform built for modern gaming communities. Designed as a more feature-rich alternative to Pterodactyl Panel, with enhanced community management, game automation, and player engagement features.

## Architecture

### Multi-Database Support (Phase 3 Complete)
- **DatabaseConfigService**: Abstraction layer supporting multiple database types
- **Supported Databases**: PostgreSQL (recommended), MySQL, MariaDB, MongoDB, SQLite
- **Dynamic Configuration**: Automatic connection string generation and validation
- **Migration Support**: Seamless database switching and data migration

### Core Architecture
- **Backend**: Node.js + TypeScript + Express + Prisma ORM
- **Frontend**: React + Next.js + TypeScript + Tailwind CSS
- **Database**: Multi-database support with Prisma abstraction
- **Authentication**: JWT with refresh tokens, RBAC system
- **Deployment**: Docker + Docker Compose with dynamic generation

### Key Services
- **DatabaseConfigService**: Multi-database abstraction and configuration
- **PluginMarketplaceService**: Plugin ecosystem management
- **PluginAnalyticsService**: Usage analytics and reporting
- **AgentService**: Game server management and communication
- **AuthService**: Authentication and authorization
- **SecurityService**: Rate limiting, audit logging, monitoring

## Technologies

### Backend Stack
- Node.js 18+
- TypeScript
- Express.js
- Prisma ORM
- JWT Authentication
- Docker & Docker Compose

### Frontend Stack
- React 18
- Next.js 13+
- TypeScript
- Tailwind CSS
- Redux/Context API

### Database Support
- PostgreSQL (primary recommendation)
- MySQL 8.0+
- MariaDB 10.3+
- MongoDB 4.4+
- SQLite 3+ (development/small deployments)

### Infrastructure
- Docker containerization
- Nginx reverse proxy
- Redis caching (optional)
- PM2 process management

## Libraries & Dependencies

### Core Dependencies
- `@prisma/client` - Database ORM client
- `express` - Web framework
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `helmet` - Security headers
- `cors` - CORS handling
- `express-rate-limit` - Rate limiting

### Development Dependencies
- `typescript` - Type checking
- `nodemon` - Development hot reload
- `jest` - Testing framework
- `eslint` - Code linting
- `prettier` - Code formatting

### Frontend Dependencies
- `react` & `react-dom` - UI framework
- `next` - React framework
- `tailwindcss` - CSS framework
- `axios` - HTTP client

## Current Status

### Phase 3 Complete (v1.6.0)
- ✅ Multi-database support implementation
- ✅ Enhanced setup scripts (CLI wizard, web installer)
- ✅ Dynamic Docker compose generation
- ✅ Database migration utilities
- ✅ Integration testing framework
- ✅ Production-ready deployment options

### Production Ready Features
- Complete plugin marketplace with publishing workflow
- Advanced analytics and monitoring
- Comprehensive security implementation
- Multi-database flexibility
- Docker-based deployment
- Automated setup and configuration

**Last Updated**: 2025-01-28
