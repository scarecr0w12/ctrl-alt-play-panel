# System Patterns

## Architectural Patterns

- **Single-Service Architecture**: Express.js backend serving both API and static frontend files
- **Domain-Driven Route Organization**: API routes organized by business domain (auth, servers, users, monitoring)
- **Middleware Chain Pattern**: Layered middleware for authentication, authorization, security, and error handling
- **WebSocket Service Layer**: Dedicated service for real-time communication with proper connection management

## Design Patterns

- **Repository Pattern**: Service layer abstraction for data access with Prisma ORM
- **Middleware Pattern**: Express.js middleware chain for cross-cutting concerns
- **Authentication Context**: React context for secure client-side authentication state
- **Static Export Pattern**: Next.js static export for enhanced security and performance

## Common Idioms

- **Security-First**: Every endpoint and component designed with security as primary concern
- **TypeScript Everywhere**: Full type safety across frontend and backend
- **Glass Morphism UI**: Consistent visual design language with modern aesthetics
- **Error Boundary Pattern**: Comprehensive error handling and graceful degradation

## RESTful API Design Pattern

All API routes follow consistent RESTful patterns with proper HTTP methods (GET, POST, PUT, DELETE), standardized error handling, and JWT authentication middleware. Routes are organized by domain (auth, servers, users, etc.) with clear separation of concerns.

**Implementation Examples:**

- src/routes/auth.ts - Authentication endpoints
- src/routes/servers.ts - Server management CRUD
- src/routes/users.ts - User management APIs
- src/middlewares/auth.ts - JWT authentication middleware

## Glass Morphism Design System

Frontend uses glass morphism design with consistent dark theme, responsive layouts, and modern UI components. TailwindCSS provides utility-first styling with custom theme configuration for glass effects, gradients, and professional gaming aesthetic.

**Implementation Examples:**

- frontend/styles/globals.css - Glass morphism base styles
- frontend/pages/dashboard.tsx - Main dashboard layout
- frontend/components/Layout.tsx - Common layout wrapper
- Glass card components with backdrop-blur effects

## Security-First Architecture

Security implemented through multiple layers: JWT authentication with httpOnly cookies, role-based access control, Helmet.js security headers, CORS configuration, rate limiting, input validation, and proper error handling. Authentication state managed securely without localStorage exposure.

**Implementation Examples:**

- src/middlewares/auth.ts - JWT authentication middleware
- src/middlewares/authorize.ts - Role-based authorization
- src/index.ts - Helmet and CORS configuration
- frontend/contexts/AuthContext.tsx - Secure auth state management


## Panel-Agent Communication Protocol

Hybrid REST API + WebSocket communication pattern where Panel sends commands via WebSocket to Agents and receives real-time status updates. Agents maintain persistent WebSocket connections for low-latency communication while using JWT tokens for authentication. Commands are JSON messages with action types (start, stop, restart, status) and server IDs.

### Examples

- Panel sends {action: 'start', serverId: '123'} via WebSocket
- Agent responds with {status: 'starting', serverId: '123', timestamp: '...'}
- Agent streams logs via {type: 'log', serverId: '123', data: 'Server starting...'}
- Panel authenticates with JWT in WebSocket upgrade headers
