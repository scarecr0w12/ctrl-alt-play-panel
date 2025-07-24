# Ctrl-Alt-Play Panel Source Code Documentation

## Main Application (src/index.ts)
The main server application using Express.js with WebSocket support for real-time communication.

### Key Features:
- JWT Authentication with database-backed user management
- WebSocket server for real-time console communication and server statistics
- RESTful API endpoints for server management, monitoring, and Steam Workshop integration
- Static file serving for frontend HTML files
- Docker containerization with PostgreSQL and Redis support

### Core Architecture:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

// Import routes that are working
import monitoringRoutes from './routes/monitoring';
import workshopRoutes from './routes/workshop';
import filesRoutes from './routes/files';
import authRoutes from './routes/auth';
import serversRoutes from './routes/servers';
import usersRoutes from './routes/users';
import nodesRoutes from './routes/nodes';
import ctrlsRoutes from './routes/ctrls';
import altsRoutes from './routes/alts';

// Import middleware
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';
import { AgentService } from './services/agent';
```

## Authentication System (src/routes/auth.ts)
JWT-based authentication with bcrypt password hashing and Prisma database integration.

### Register Endpoint:
- Validates all required fields (email, username, password, firstName, lastName)
- Checks for existing users by email or username
- Hashes passwords with bcrypt using configurable rounds
- Creates user with USER role and active status
- Returns JWT token valid for 7 days

### Login Endpoint:
- Validates email and password
- Verifies password with bcrypt
- Updates lastLogin timestamp
- Returns user data and JWT token

### Current User Profile:
- Validates JWT token from Authorization header
- Returns full user profile from database

## Middleware System

### Authentication Middleware (src/middlewares/auth.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { User, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(createError('Access token required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded.user;
    next();
  } catch (error) {
    return next(createError('Invalid or expired token', 403));
  }
};
```

### Role Authorization (src/middlewares/authorize.ts)
- Supports multiple user roles: ADMIN, MODERATOR, USER
- Convenience functions for common permission checks
- Validates user role against required permissions

### Error Handling (src/middlewares/errorHandler.ts)
- Custom error creation with status codes
- Comprehensive error logging with request context
- Development vs production error responses
- Async handler wrapper for route functions

## Database Models and Services

### User Management (src/routes/users.ts)
- Admin-only user CRUD operations
- Pagination support for user listings
- Password hashing for admin-created users
- Server count tracking per user
- Role-based access control

### Server Management (src/routes/servers.ts)
- Role-based server access (admin sees all, users see own)
- Server status and metrics integration
- Real-time server statistics from agents
- WebSocket communication for server control

### Node Management (src/routes/nodes.ts)
- Infrastructure node management (admin-only)
- Server allocation tracking
- Node statistics and health monitoring
- Agent communication for resource management

### Server Templates (Ctrls and Alts)
- Ctrl: Server categories/games
- Alt: Server configurations with Docker images
- Variable system for server customization
- Template-based server creation

## File Management System (src/routes/files.ts)
Comprehensive file management with security controls:

### Features:
- Directory listing with file metadata
- File read/write operations with size limits
- Directory creation and deletion
- File/directory rename and move operations
- Download functionality
- Path traversal protection
- Sandboxed file operations within base directory

### Security:
- Path sanitization prevents directory traversal
- Operations restricted to configured base directory
- File size limits for uploads/reads
- Mock file structure for demonstration

## Monitoring and Metrics (src/services/monitoringService.ts)
Real-time server monitoring with historical data:

### Metrics Collection:
- CPU, memory, disk usage
- Network I/O statistics
- Player count tracking
- Agent-based data collection

### Features:
- Historical metrics with configurable time ranges
- Graph generation for visualizations
- Alert system for resource thresholds
- Node-level aggregated monitoring

## Agent Communication System (src/services/agent.ts)
WebSocket-based communication with remote server agents:

### Core Functions:
- Agent connection management with heartbeat monitoring
- Server lifecycle management (create, start, stop, restart)
- Real-time server metrics collection
- File operations on remote servers
- Command execution and console access

### Message Types:
- System information requests
- Server status updates
- Console output streaming
- File content transfer
- Power management commands

## Steam Workshop Integration (src/services/steamWorkshopService.ts)
Steam Workshop mod/content management:

### Features:
- Workshop item search and metadata
- Server-specific mod installation
- Installation status tracking
- Agent-based deployment
- Collection and individual item support

### Database Integration:
- Cached workshop item metadata
- Installation tracking per server
- Status updates from agents
- Automatic sync with Steam API

## WebSocket Communication
Real-time bidirectional communication:

### Client-Server Communication:
- Server console command execution
- Real-time server statistics
- Power management (start/stop/restart)
- Console output streaming
- File operation results

### Agent Communication:
- Separate WebSocket server on port 8080
- Authentication via bearer tokens
- Heartbeat monitoring for connection health
- Command forwarding to appropriate agents

## Docker Integration
Complete containerization support:

### Multi-Stage Dockerfile:
- Alpine Linux base for minimal footprint
- OpenSSL libraries for Prisma compatibility
- Public file serving for frontend
- Environment-based configuration

### Docker Compose:
- Panel service with database connectivity
- Test agent for development
- PostgreSQL database with persistent storage
- Redis for caching and sessions

### Health Checks:
- Application health endpoint
- Database connectivity verification
- Service dependency management

## Database Schema (Prisma)
Comprehensive data model supporting:

### User System:
- Users with roles and authentication
- Profile management with activity tracking
- Multi-factor authentication support

### Server Infrastructure:
- Nodes (physical/virtual servers)
- Servers (game server instances)
- Allocations (IP/port assignments)
- Templates (Ctrls and Alts)

### Monitoring:
- Server metrics with timestamps
- Alert system with severity levels
- Historical data retention

### Workshop Integration:
- Steam Workshop item cache
- Installation tracking
- Server-specific mod lists

## API Endpoints Summary

### Authentication (/api/auth)
- POST /register - User registration
- POST /login - User authentication
- POST /refresh - Token refresh
- POST /logout - Session termination
- GET /me - Current user profile

### Server Management (/api/servers)
- GET / - List servers (role-based)
- GET /:id - Server details
- GET /:id/status - Current server status

### User Management (/api/users) - Admin only
- GET / - List all users with pagination
- GET /:id - User details
- POST / - Create new user
- PATCH /:id - Update user
- DELETE /:id - Delete user
- GET /:id/servers - User's servers

### Node Management (/api/nodes) - Admin only
- GET / - List nodes
- GET /:id - Node details
- POST / - Create node
- PATCH /:id - Update node
- DELETE /:id - Delete node
- GET /:id/stats - Node statistics
- GET /:id/servers - Node servers

### Template Management (/api/ctrls, /api/alts) - Admin only
- CRUD operations for server templates
- Variable management for customization
- Server creation from templates

### File Management (/api/files)
- GET /list - Directory listing
- GET /read - File content
- POST /write - Save file
- POST /mkdir - Create directory
- DELETE /delete - Remove files/directories
- POST /rename - Rename/move operations
- GET /download - File download

### Monitoring (/api/monitoring)
- GET /servers/:id/metrics - Historical metrics
- GET /servers/:id/current - Current metrics
- GET /servers/:id/graph - Metric graphs
- GET /nodes/:id/metrics - Node metrics
- POST /collect - Trigger collection
- GET /alerts - System alerts
- GET /stats - System statistics
- GET /health - Health status

### Steam Workshop (/api/workshop)
- GET /search - Search workshop items
- GET /items/:id - Item details
- POST /servers/:id/install - Install item
- DELETE /servers/:id/items/:id - Remove item
- GET /servers/:id/items - Installed items
- POST /webhook/status - Status updates
- POST /sync - Sync with Steam

## Environment Configuration
Required environment variables:

### Database:
- DATABASE_URL - PostgreSQL connection string
- REDIS_URL - Redis connection for sessions

### Authentication:
- JWT_SECRET - Token signing secret
- BCRYPT_ROUNDS - Password hashing rounds

### Services:
- PORT - Application port (default: 3000)
- AGENT_PORT - Agent WebSocket port (default: 8080)
- NODE_ENV - Environment mode

### Rate Limiting:
- RATE_LIMIT_WINDOW - Time window in minutes
- RATE_LIMIT_MAX - Max requests per window

## Development Features
Development-friendly features for testing:

### Mock Data:
- Sample file structure for file management
- Realistic server statistics
- Workshop item demonstrations
- Agent simulation capabilities

### Integration Testing:
- Docker Compose test environment
- Database migration automation
- Authentication test framework
- WebSocket connection testing

### Logging:
- Winston-based logging system
- Configurable log levels
- File and console output
- Error tracking with context

## Production Considerations

### Security:
- Helmet for security headers
- CORS configuration
- Rate limiting protection
- JWT token expiration
- Path traversal prevention
- Input validation and sanitization

### Performance:
- Compression middleware
- Database query optimization
- Connection pooling
- Caching strategies
- Efficient file operations

### Monitoring:
- Health check endpoints
- Error logging and tracking
- Performance metrics
- Agent connectivity monitoring
- Resource usage alerts

### Scalability:
- Stateless application design
- Database-backed sessions
- Horizontal scaling support
- Load balancer compatibility
- Container orchestration ready

This comprehensive documentation covers the complete Ctrl-Alt-Play Panel architecture, from authentication and authorization to real-time server management and Steam Workshop integration. The system is designed for production deployment with Docker containerization and supports multiple game servers through a flexible template system.
