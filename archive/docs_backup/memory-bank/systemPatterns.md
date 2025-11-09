# System Patterns

## Architectural Patterns

### Panel-Agent Distributed Architecture
- **Distributed Management**: Central Panel managing multiple external Agents across nodes
- **Independent Execution**: Agents run as separate processes with fault isolation
- **HTTP REST Communication**: RESTful API between Panel and Agents for standard operations
- **WebSocket Real-time**: Live console streaming and real-time status updates
- **Auto-discovery**: Agents automatically register with Panel on startup

### Deployment-Agnostic Infrastructure (Phase 1)
- **Dynamic Port Management**: Automatic port detection and conflict resolution (`src/utils/portManager.ts`)
- **Environment Variable Configuration**: Zero-hardcoded configuration with template-based setup
- **Cross-Platform Docker**: Multi-stage builds supporting linux/amd64 and linux/arm64
- **Zero-Dependency Deployment**: Works on any Linux distribution without external requirements
- **Flexible Service Discovery**: Automatic service detection and registration

### Modern Web Architecture
- **Single-Service Architecture**: Express.js backend serving both API and static frontend files
- **Domain-Driven Route Organization**: API routes organized by business domain (auth, servers, users, monitoring)
- **Middleware Chain Pattern**: Layered middleware for authentication, authorization, security, and error handling
- **Static Export Pattern**: Next.js static export for enhanced security and performance

## Design Patterns

### Infrastructure Patterns
- **Port Manager Pattern**: Centralized port allocation with conflict detection and resolution
- **Environment Template Pattern**: Configuration templates for different deployment scenarios
- **Health Check Pattern**: Comprehensive service monitoring with automated status reporting
- **Service Discovery Pattern**: Automatic detection and registration of distributed services

### Data Access Patterns
- **Repository Pattern**: Service layer abstraction for data access with Prisma ORM
- **Connection Pool Pattern**: Efficient database connection management
- **Migration Pattern**: Version-controlled database schema changes
- **Seed Pattern**: Consistent data initialization across environments

### Security Patterns
- **Authentication Context**: React context for secure client-side authentication state
- **JWT Token Pattern**: Secure authentication with httpOnly cookies preventing XSS
- **RBAC Pattern**: Role-based access control with 36 granular permissions
- **Security Header Pattern**: Comprehensive HTTP security headers with Helmet.js

### Testing Patterns
- **Mock Service Pattern**: Complete external service mocking for environment-agnostic testing
- **Test Database Pattern**: Isolated test database with proper cleanup and foreign key handling
- **Cross-Platform Testing**: Validation across Ubuntu, Windows, macOS environments
- **CI/CD Pipeline Pattern**: Automated testing with security scanning and deployment validation

## Common Idioms

### Development Idioms
- **Security-First**: Every endpoint and component designed with security as primary concern
- **TypeScript Everywhere**: Full type safety across frontend and backend
- **Error Boundary Pattern**: Comprehensive error handling and graceful degradation
- **Glass Morphism UI**: Consistent visual design language with modern aesthetics

### Infrastructure Idioms
- **Zero Configuration**: Automatic detection and configuration of system requirements
- **Conflict Resolution**: Automatic detection and resolution of resource conflicts
- **Health Monitoring**: Continuous monitoring with automated alerting and recovery
- **Documentation as Code**: Comprehensive documentation generated from code and configuration

## Implementation Patterns

### RESTful API Design Pattern
All API routes follow consistent RESTful patterns with proper HTTP methods (GET, POST, PUT, DELETE), standardized error handling, and JWT authentication middleware. Routes are organized by domain (auth, servers, users, etc.) with clear separation of concerns.

**Implementation Examples:**
- `src/routes/auth.ts` - Authentication endpoints
- `src/routes/servers.ts` - Server management CRUD
- `src/routes/users.ts` - User management APIs
- `src/middlewares/auth.ts` - JWT authentication middleware

### Dynamic Port Management Pattern
**CRITICAL PATTERN**: Automatic port detection and conflict resolution for deployment-agnostic systems. The `PortManager` class provides centralized port allocation with range scanning, conflict detection, and automatic alternative assignment.

**Implementation Examples:**
- `src/utils/portManager.ts` - Central port management utility
- `.env.development` - Environment-specific port configuration
- `docker-compose.yml` - Container port mapping with environment variables
- `test-port-management.js` - Cross-platform port testing validation

### Environment-Agnostic Testing Pattern
**CRITICAL PATTERN**: Complete external service mocking enabling tests to run in any environment without dependencies. Mock implementations for Prisma, Redis, Steam API, and all external services ensure consistent test execution.

**Implementation Examples:**
- `tests/jest.setup.ts` - Comprehensive service mocking setup
- `tests/setup.ts` - Test database management with foreign key handling
- `.env.test` - Test environment configuration
- `.github/workflows/ci.yml` - Cross-platform CI/CD pipeline

### Glass Morphism Design System
Frontend uses glass morphism design with consistent dark theme, responsive layouts, and modern UI components. TailwindCSS provides utility-first styling with custom theme configuration for glass effects, gradients, and professional gaming aesthetic.

**Implementation Examples:**
- `frontend/styles/globals.css` - Glass morphism base styles
- `frontend/pages/dashboard.tsx` - Main dashboard layout
- `frontend/components/Layout.tsx` - Common layout wrapper
- Glass card components with backdrop-blur effects

### Security-First Architecture
Security implemented through multiple layers: JWT authentication with httpOnly cookies, role-based access control, Helmet.js security headers, CORS configuration, rate limiting, input validation, and proper error handling.

**Implementation Examples:**
- `src/middlewares/auth.ts` - JWT authentication middleware
- `src/middlewares/authorize.ts` - Role-based authorization
- `src/index.ts` - Helmet and CORS configuration
- `frontend/contexts/AuthContext.tsx` - Secure auth state management

### Database Foreign Key Management Pattern
**CRITICAL PATTERN**: Proper database cleanup order respecting foreign key constraints. The `cleanupTestDatabase()` function demonstrates correct deletion order: dependent records (Servers) must be deleted before their parent records (Alts).

**Implementation Examples:**
- `tests/setup.ts` - cleanupTestDatabase() with proper deletion order
- `tests/globalSetup.ts` - Jest global database initialization  
- `tests/globalTeardown.ts` - Jest global database cleanup
- `prisma/seed.ts` - Seeding with foreign key awareness

### Deployment Automation Pattern
**NEW PATTERN**: One-command deployment scripts with automatic environment detection, dependency installation, and configuration generation. Cross-distribution compatibility with package manager detection.

**Implementation Examples:**
- `scripts/quick-deploy.sh` - Automated deployment script
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment documentation
- `.env.production.template` - Production environment template
- `src/health-check.js` - Deployment validation and monitoring

### Agent Communication Protocol
Panel-Agent HTTP REST API communication where Panel sends commands via HTTP to external Agent projects. Agents run as separate services on nodes, discovered via AgentDiscoveryService, and managed through `/api/agents` endpoints.

**Communication Examples:**
- Panel sends `{action: 'start', serverId: '123'}` via HTTP POST
- Agent responds with `{status: 'starting', serverId: '123', timestamp: '...'}`
- Real-time updates via WebSocket for console streaming and status changes
- Panel authenticates with JWT in request headers