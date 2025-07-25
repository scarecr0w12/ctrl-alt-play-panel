# System Architecture

## Overview

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
**Location**: `/src/` directory

Key components:
- **API Routes** (`/src/routes/`): RESTful endpoints organized by domain
- **Services** (`/src/services/`): Business logic and data access
- **Middlewares** (`/src/middlewares/`): Authentication, authorization, and security
- **Types** (`/src/types/`): TypeScript definitions and interfaces

### Frontend Application

**Technology**: React/Next.js with TypeScript and static export
**Location**: `/frontend/` directory

Key components:
- **Pages** (`/frontend/pages/`): Route-based page components
- **Components** (`/frontend/components/`): Reusable UI components
- **Contexts** (`/frontend/contexts/`): React context providers
- **Styles** (`/frontend/styles/`): TailwindCSS styling

### Database Layer

**Technology**: PostgreSQL with Prisma ORM
**Location**: `/prisma/` directory

Key models:
- **User**: User accounts with role and permission associations
- **Server**: Game server configurations and status
- **Node**: Infrastructure nodes for agent deployment
- **Permission**: RBAC implementation with roles and permissions
- **Ctrl/Alt**: Game configuration templates (similar to nests/eggs)

### External Agent Communication

**Technology**: HTTP REST API client
**Location**: `/src/services/externalAgentService.ts`

Key features:
- **Agent Registration**: Register and manage external agents
- **Command Relay**: Send commands to remote agents
- **Health Monitoring**: Check agent status and health
- **Metrics Collection**: Gather performance metrics

### Agent Discovery Service

**Technology**: Automatic agent detection and registration
**Location**: `/src/services/agentDiscoveryService.ts`

Key features:
- **Auto-discovery**: Find agents on known nodes
- **Health Checks**: Periodic status verification
- **Registration**: Add discovered agents to the system
- **Failure Handling**: Graceful handling of disconnections

## Key Design Decisions

1. **Distributed Architecture**: Panel+Agent pattern for scalability and separation of concerns
2. **External Agent Communication**: HTTP REST API instead of embedded WebSocket services
3. **Static Frontend Export**: Enhanced security through static file serving
4. **Comprehensive RBAC**: 36 granular permissions across 10 categories
5. **JWT with httpOnly Cookies**: Secure authentication preventing XSS attacks
6. **TypeScript Throughout**: Type safety across frontend and backend
7. **Docker Containerization**: Consistent deployment with multi-stage builds

## Security Architecture

The system implements a multi-layered security approach:

1. **Authentication Layer**
   - JWT-based authentication with httpOnly cookies
   - Session management with IP tracking
   - Token rotation and validation

2. **Authorization Layer**
   - Role-based access control with 36 granular permissions
   - Resource ownership validation
   - Permission inheritance and overrides

3. **Infrastructure Security**
   - Helmet.js security headers
   - CORS configuration
   - Rate limiting
   - Input validation

4. **Monitoring & Auditing**
   - Comprehensive security logging
   - Real-time threat detection
   - Multi-platform alerting

## Deployment Architecture

The system is containerized using Docker:

1. **Panel Container**
   - Node.js application with Express
   - Static frontend files
   - Nginx for serving static content

2. **Database Container**
   - PostgreSQL with persistent volume
   - Prisma migrations

3. **Redis Container**
   - Session storage
   - Caching
   - Rate limiting

4. **Agent Containers**
   - Deployed on separate nodes
   - Connected to Docker daemon
   - Independent lifecycle

## File Structure

```
ctrl-alt-play-panel/
├── src/                    # Panel backend source
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── middlewares/       # Auth, validation, etc.
│   └── types/             # TypeScript definitions
├── frontend/              # React/Next.js frontend
│   ├── components/        # UI components
│   ├── pages/             # Route pages
│   └── styles/            # TailwindCSS styles
├── prisma/                # Database schema and migrations
├── docs/                  # Documentation
├── scripts/               # Automation scripts
└── .kilocode/             # Memory bank and project context
```

## Critical Implementation Paths

1. **Authentication Flow**
   - `src/routes/auth.ts` → `src/services/authService.ts` → `src/middlewares/auth.ts`
   - `frontend/contexts/AuthContext.tsx` → `frontend/pages/_app.tsx`

2. **Server Control Flow**
   - `frontend/pages/servers.tsx` → `src/routes/servers.ts` → `src/services/externalAgentService.ts`
   - Agent communication → Docker container management

3. **Permission System**
   - `src/services/permissionService.ts` → `src/middlewares/permissions.ts`
   - `frontend/contexts/PermissionContext.tsx` → `frontend/components/PermissionGuard.tsx`

4. **Agent Discovery**
   - `src/services/agentDiscoveryService.ts` → `src/routes/agents.ts`
   - Node database records → Agent auto-discovery