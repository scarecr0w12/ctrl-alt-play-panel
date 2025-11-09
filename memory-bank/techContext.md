# Technical Context: Technology Stack and Architecture

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript (strict mode)
- **Framework**: Express.js with comprehensive middleware architecture
- **Database**: Multi-database support with Prisma ORM
  - PostgreSQL (primary recommendation)
  - MySQL/MariaDB (stable support)
  - SQLite (development/small deployments)
  - MongoDB (experimental support)
- **Authentication**: JWT with bcrypt hashing and refresh tokens
- **Cache**: Redis for session management and performance
- **Real-time**: WebSocket with Socket.IO for live updates
- **API**: RESTful APIs with comprehensive OpenAPI documentation

### Frontend
- **Framework**: React 18+ with Next.js (App Router)
- **Language**: TypeScript with strict type checking
- **Styling**: CSS Modules with responsive design
- **State Management**: React Context + custom hooks
- **Real-time**: Socket.IO client for live updates
- **Build**: Next.js with optimized production builds

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local/staging, production-ready configs
- **Reverse Proxy**: Nginx with SSL termination
- **SSL**: Let's Encrypt with automated certificate management
- **Process Management**: PM2 for Node.js process management
- **Monitoring**: Built-in health checks and logging

### Development Tools
- **IDE**: Cursor with custom modes and MCP servers
- **Testing**: Jest for unit/integration tests with comprehensive coverage
- **Linting**: ESLint with TypeScript rules
- **Code Quality**: Prettier for formatting, Husky for git hooks
- **Documentation**: Auto-generated API docs, comprehensive README files
- **CI/CD**: GitHub Actions with automated testing and deployment

## Architecture Patterns

### Panel+Agent Distributed System
- **Panel**: Central management hub (web interface, API, database)
- **Agent**: Distributed server management nodes (game servers, monitoring)
- **Communication**: RESTful APIs + WebSocket for real-time coordination
- **Service Discovery**: Dynamic agent registration with health monitoring

### Plugin Architecture
- **SDK**: Comprehensive plugin development kit with TypeScript support
- **Marketplace**: Plugin discovery, installation, and update management
- **Isolation**: Secure plugin execution environment
- **API**: Plugin-specific APIs for extending core functionality

### Security Model
- **Authentication**: JWT-based with role-based access control (RBAC)
- **Authorization**: Fine-grained permissions with audit logging
- **Input Validation**: Comprehensive request validation and sanitization
- **Rate Limiting**: API protection with abuse prevention
- **Encryption**: Sensitive data encryption at rest and in transit

## Development Constraints

### Requirements
- **Node.js**: Minimum version 18.0.0
- **TypeScript**: Strict mode enabled, no JavaScript files allowed
- **Database**: Must support Prisma ORM migrations
- **Docker**: All components must be containerizable
- **Security**: Enterprise-grade security requirements

### Performance Targets
- **API Response**: <200ms for standard operations
- **Real-time Updates**: <100ms WebSocket latency
- **Database**: Optimized queries with proper indexing
- **Memory Usage**: Efficient resource utilization for containers
- **Concurrent Users**: Support for 1000+ concurrent panel users

### Compatibility
- **Browsers**: Modern browsers with ES2020+ support
- **Operating Systems**: Linux (primary), Windows, macOS
- **Databases**: Multiple database engine support
- **Deployment**: Cloud-native with container orchestration support