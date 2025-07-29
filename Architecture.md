# System Architecture

The Ctrl-Alt-Play Panel employs a distributed Panel+Agent architecture that separates central management from execution nodes. This architecture provides improved scalability, fault isolation, and flexibility compared to monolithic approaches.

## Core Architecture

### Panel+Agent Distributed System

The system consists of two primary components:

1. **Panel (Central Management)**
   - Web interface and API backend (Node.js/TypeScript)
   - User management, authentication, and authorization
   - Server configuration and template management
   - Agent discovery and communication
   - Monitoring and metrics aggregation
   - Administrative dashboard

2. **External Agents (Node Execution)**
   - Run as separate projects on individual nodes/machines
   - Docker container lifecycle management
   - Game server operations (start/stop/restart)
   - File system operations
   - Resource monitoring and reporting
   - Independent operation with fault tolerance

### Communication Protocol

The Panel and Agents communicate through:
- **HTTP REST API**: For standard operations and agent management
- **WebSocket**: For real-time events, console streaming, and status updates
- **JWT Authentication**: Secure communication with token-based auth
- **Agent Discovery**: Automatic detection and registration of agents

## Key Components

### Panel Server

**Technology**: Express.js application with TypeScript

Key components:
- **API Routes** (`/src/routes/`): RESTful endpoints organized by domain
- **Services** (`/src/services/`): Business logic and data access
- **Middlewares** (`/src/middlewares/`): Authentication, authorization, and security
- **Types** (`/src/types/`): TypeScript definitions and interfaces

### Frontend Application

**Technology**: Next.js/React with TypeScript

Key components:
- **Pages** (`/frontend/pages/`): Next.js pages with static export
- **Components** (`/frontend/components/`): Reusable React components
- **Hooks** (`/frontend/hooks/`): Custom React hooks for state management
- **Context** (`/frontend/context/`): React context for global state
- **Styles** (`/frontend/styles/`): TailwindCSS and custom CSS

### Database Layer

**Technology**: PostgreSQL with Prisma ORM

Key components:
- **Schema** (`/prisma/schema.prisma`): Database schema definition
- **Migrations** (`/prisma/migrations/`): Version-controlled schema changes
- **Client** (`/prisma/client/`): Generated Prisma client
- **Seeding** (`/prisma/seed/`): Initial data population

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

## Deployment Patterns

### Zero-Dependency Architecture

- **No External Requirements**: Works on any Linux distribution without additional dependencies
- **Automatic Configuration**: Self-configuring system with intelligent defaults
- **Environment Detection**: Automatic adaptation to deployment environment
- **Cross-Distribution Support**: Compatible with Ubuntu, CentOS, Debian, Alpine, and other distributions

### Dynamic Port Management System

- **Automatic Port Detection**: Scans for available ports in configurable ranges
- **Conflict Resolution**: Prevents port conflicts in shared development environments
- **Environment Agnostic**: Works across any Linux distribution without dependencies
- **Docker-Aware**: Integrates with Docker port mapping and container orchestration

### Multi-Platform Docker Support

- **Multi-Stage Builds**: Optimized Docker images for production deployment
- **Cross-Platform Support**: linux/amd64 and linux/arm64 architectures
- **Security Scanning**: Automated vulnerability detection in container images
- **Health Monitoring**: Built-in container health checks and monitoring

## Scalability Considerations

1. **Horizontal Scaling**: Multiple agents can be deployed across different nodes
2. **Load Distribution**: Panel can handle multiple concurrent agent connections
3. **Fault Isolation**: Agent failures don't affect the panel or other agents
4. **Resource Management**: Each agent manages its own resources independently
5. **Database Optimization**: Connection pooling and efficient queries for high concurrency