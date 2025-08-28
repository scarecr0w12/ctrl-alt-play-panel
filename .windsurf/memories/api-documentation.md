---
title: "API Documentation"
description: "Comprehensive RESTful API architecture with authentication, authorization, and real-time communication capabilities."
tags: ["api", "rest", "authentication", "websocket"]
---

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
- `DELETE /api/servers/:id` - Delete server configuration
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server
- `POST /api/servers/:id/restart` - Restart server
- `POST /api/servers/:id/kill` - Force kill server
- `GET /api/servers/:id/console` - Get server console output
- `POST /api/servers/:id/console` - Send command to server console
- `GET /api/servers/:id/status` - Get real-time server status
- `GET /api/servers/:id/metrics` - Get server performance metrics

### User Management Routes (`/api/users`)

**Location**: `src/routes/users.ts`
**Service**: `src/services/userService.ts`
**Middleware**: `src/middlewares/rbac.ts`

- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/:id/permissions` - Get user permissions
- `POST /api/users/:id/permissions` - Add user permissions (admin only)
- `DELETE /api/users/:id/permissions/:permissionId` - Remove user permissions (admin only)

### Permission Management Routes (`/api/permissions`)

**Location**: `src/routes/permissions.ts`
**Service**: `src/services/permissionService.ts`

- `GET /api/permissions` - List all permissions
- `GET /api/permissions/:id` - Get specific permission details

### Agent Management Routes (`/api/agents`)

**Location**: `src/routes/agents.ts`
**Service**: `src/services/agentService.ts`

- `GET /api/agents` - List all discovered agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/:id/refresh` - Refresh agent status
- `DELETE /api/agents/:id` - Remove agent from registry

### System Monitoring Routes (`/api/monitoring`)

**Location**: `src/routes/monitoring.ts`
**Service**: `src/services/monitoringService.ts`

- `GET /api/monitoring/system` - Get system resource usage
- `GET /api/monitoring/health` - Get system health status
- `GET /api/monitoring/metrics` - Get detailed system metrics

## Authentication and Authorization

### JWT Token Pattern

The system implements secure JWT-based authentication with the following characteristics:

- **HttpOnly Cookies**: Preventing XSS attacks by storing tokens in secure cookies
- **Refresh Token Rotation**: Automatic token refresh with security measures
- **Token Expiration**: Configurable token lifetimes with automatic expiration
- **Secure Transmission**: All authentication endpoints require HTTPS

### RBAC Implementation

The system implements comprehensive Role-Based Access Control with:

- **36 Granular Permissions**: Across 10 categories
- **Role Inheritance**: Hierarchical permission structure
- **Resource Ownership**: User-specific resource access
- **Permission Overrides**: Fine-grained access control
