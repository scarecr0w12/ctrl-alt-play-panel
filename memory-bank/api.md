# API Documentation

## Overview

The Ctrl-Alt-Play Panel implements a comprehensive RESTful API architecture with modern authentication, authorization, and real-time communication capabilities. The API serves as the central communication layer for the Panel+Agent distributed system.

## API Architecture

### RESTful Design Pattern

All API routes follow consistent RESTful patterns with proper HTTP methods (GET, POST, PUT, DELETE), standardized error handling, and JWT authentication middleware. Routes are organized by domain with clear separation of concerns.

**Core Principles:**
- **Resource-Based URLs**: Endpoints represent resources, not actions
- **HTTP Method Semantics**: Proper use of GET, POST, PUT, DELETE methods
- **Stateless Communication**: Each request contains all necessary information
- **Standard Status Codes**: Consistent HTTP status code usage
- **JSON Data Format**: All requests and responses use JSON

### Communication Protocols

The system uses multiple communication protocols optimized for different use cases:

1. **HTTP REST API**: Standard operations and agent management
2. **WebSocket**: Real-time events, console streaming, and status updates
3. **JWT Authentication**: Secure communication with token-based auth
4. **Agent Discovery**: Automatic detection and registration of agents

## Core API Endpoints

### Authentication Routes (`/api/auth`)

**Location**: `src/routes/auth.ts`
**Service**: `src/services/authService.ts`
**Middleware**: `src/middlewares/auth.ts`

- `POST /api/auth/login` - User authentication with credentials
- `POST /api/auth/logout` - User session termination
- `POST /api/auth/refresh` - JWT token refresh
- `GET /api/auth/me` - Current user profile information
- `POST /api/auth/register` - New user registration (admin only)

### Server Management Routes (`/api/servers`)

**Location**: `src/routes/servers.ts`
**Service**: `src/services/externalAgentService.ts`

- `GET /api/servers` - List all servers with status
- `POST /api/servers` - Create new server configuration
- `GET /api/servers/:id` - Get specific server details
- `PUT /api/servers/:id` - Update server configuration
- `DELETE /api/servers/:id` - Remove server
- `POST /api/servers/:id/start` - Start server instance
- `POST /api/servers/:id/stop` - Stop server instance
- `POST /api/servers/:id/restart` - Restart server instance

### User Management Routes (`/api/users`)

**Location**: `src/routes/users.ts`

- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Remove user (admin only)

### Agent Management Routes (`/api/agents`)

**Location**: `src/routes/agents.ts`
**Service**: `src/services/agentDiscoveryService.ts`

- `GET /api/agents` - List all registered agents
- `POST /api/agents/discover` - Trigger agent discovery process
- `GET /api/agents/:id/health` - Check agent health status
- `POST /api/agents/:id/command` - Send command to specific agent

## External Agent Communication

### Agent Registration Protocol

External agents automatically register with the Panel using the following process:

1. **Discovery Process**: Panel scans known nodes for available agents
2. **Health Check**: Verification of agent responsiveness
3. **Registration**: Add discovered agents to the system database
4. **Authentication**: JWT token exchange for secure communication

### Agent Command Protocol

The Panel communicates with external agents via HTTP REST API:

**Command Format:**
```json
{
  "action": "start|stop|restart|status",
  "serverId": "server-uuid",
  "timestamp": "2025-07-28T00:00:00.000Z",
  "metadata": {
    "requestId": "request-uuid",
    "userId": "user-uuid"
  }
}
```

**Response Format:**
```json
{
  "status": "starting|running|stopped|error",
  "serverId": "server-uuid",
  "timestamp": "2025-07-28T00:00:00.000Z",
  "message": "Operation status message",
  "data": {
    "processId": "process-id",
    "port": 25565,
    "resources": {
      "cpu": "15%",
      "memory": "2.1GB"
    }
  }
}
```

### Agent Discovery Service

**Location**: `src/services/agentDiscoveryService.ts`

Key features:
- **Auto-discovery**: Find agents on known nodes
- **Health Checks**: Periodic status verification
- **Registration**: Add discovered agents to the system
- **Failure Handling**: Graceful handling of disconnections

## Authentication & Authorization

### JWT Authentication Pattern

**Implementation**: `src/middlewares/auth.ts`

- **httpOnly Cookies**: Secure authentication preventing XSS attacks
- **Token Rotation**: Automatic token refresh for extended sessions
- **IP Tracking**: Session security with IP validation
- **Secure Headers**: HTTP security headers via Helmet.js

### Role-Based Access Control (RBAC)

**Implementation**: `src/middlewares/authorize.ts`

- **36 Granular Permissions**: Across 10 categories
- **Role Inheritance**: Hierarchical permission structure
- **Resource Ownership**: User-specific resource access
- **Permission Overrides**: Fine-grained access control

## WebSocket Real-Time Communication

### Event Types

- `metrics:update` - System performance metrics
- `server:status` - Server status changes
- `console:output` - Real-time console streaming
- `agent:connected` - Agent registration events
- `agent:disconnected` - Agent disconnection events

### Connection Management

**Frontend Integration**: `frontend/contexts/WebSocketContext.tsx`

```typescript
interface WebSocketEvents {
  'metrics:update': (data: SystemMetrics) => void;
  'server:status': (data: ServerStatus) => void;
  'console:output': (data: ConsoleData) => void;
}
```

## API Security

### Security Layers

1. **Authentication Layer**
   - JWT-based authentication with httpOnly cookies
   - Session management with IP tracking
   - Token rotation and validation

2. **Authorization Layer**
   - Role-based access control with granular permissions
   - Resource ownership validation
   - Permission inheritance and overrides

3. **Infrastructure Security**
   - Helmet.js security headers
   - CORS configuration
   - Rate limiting
   - Input validation

### Request Validation

All API endpoints implement:
- **Input Sanitization**: Preventing injection attacks
- **Schema Validation**: Request/response format verification
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Secure error messages without information leakage

## Error Handling

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific validation errors"
    },
    "timestamp": "2025-07-28T00:00:00.000Z",
    "requestId": "request-uuid"
  }
}
```

### HTTP Status Codes

- **200 OK**: Successful operation
- **201 Created**: Resource successfully created
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

## API Client Integration

### Frontend API Client

**Location**: `frontend/lib/api.ts`

TypeScript interfaces for type-safe API communication:

```typescript
interface ApiClient {
  auth: AuthAPI;
  servers: ServerAPI;
  users: UserAPI;
  agents: AgentAPI;
}
```

### External Client Authentication

```typescript
// JWT Authentication Header
headers: {
  'Authorization': `Bearer ${jwt_token}`,
  'Content-Type': 'application/json'
}
```

## Performance Considerations

### Optimization Strategies

- **Connection Pooling**: Efficient database connection management
- **Response Caching**: Strategic caching of frequently accessed data
- **Pagination**: Large dataset handling with cursor-based pagination
- **Compression**: Response compression for bandwidth optimization
- **Request Debouncing**: Frontend optimization for real-time updates

### Monitoring & Metrics

- **Response Time Tracking**: Performance monitoring for all endpoints
- **Error Rate Monitoring**: Automatic alerting for high error rates
- **Throughput Analysis**: API usage patterns and capacity planning
- **Health Check Endpoints**: Automated service status monitoring

## Implementation References

### Critical Implementation Paths

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

### File Organization

```
src/
├── routes/            # API endpoints
│   ├── auth.ts       # Authentication endpoints
│   ├── servers.ts    # Server management CRUD
│   ├── users.ts      # User management APIs
│   └── agents.ts     # Agent management APIs
├── services/         # Business logic
│   ├── authService.ts
│   ├── externalAgentService.ts
│   └── agentDiscoveryService.ts
└── middlewares/      # Request processing
    ├── auth.ts       # JWT authentication middleware
    └── authorize.ts  # RBAC authorization
```

This API architecture provides a robust, secure, and scalable foundation for the Panel+Agent distributed system with comprehensive authentication, real-time communication, and external service integration capabilities.