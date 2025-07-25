# Ctrl-Alt-Play Panel: System Architecture

## Overview

This document contains the architectural decisions, design patterns, and component structure for the Ctrl-Alt-Play Panel game server management system. The architecture follows security-first principles with a single-service design optimized for game server administration.

## Architectural Decisions

- Adopted Panel+Agent distributed architecture for better scalability and separation of concerns
- Implemented external agent communication via HTTP REST API instead of embedded services
- Added automatic agent discovery service for seamless node integration
- Used Prisma ORM for type-safe database operations
- Implemented comprehensive RBAC with 36 granular permissions
- Integrated WebSocket for real-time updates and monitoring
- Used JWT with httpOnly cookies for secure authentication



- Panel+Agent distributed architecture with WebSocket communication
- Agent-based Docker container management for server isolation
- JSON/YAML egg configuration system for game server templates
- JWT-based authentication between Panel and Agents
- REST API + WebSocket hybrid communication protocol



### Core Architecture Decisions

1. **Single-Service Architecture**: Express.js backend serving both API and static frontend files for simplified deployment and maintenance
2. **Static Frontend Export**: Next.js static export over server-side rendering for enhanced security and performance
3. **PostgreSQL with Prisma**: Relational database over NoSQL for data integrity and type safety in game server management
4. **JWT with httpOnly Cookies**: Secure authentication over localStorage to prevent XSS token exposure
5. **Glass Morphism Design**: Modern UI/UX design system for professional gaming aesthetic
6. **Docker Multi-stage Builds**: Optimized production images with minimal attack surface

## Design Considerations

- Security-first approach with comprehensive audit trails and monitoring
- Scalable architecture supporting multiple agents across distributed infrastructure
- Fault tolerance with graceful agent disconnection handling
- Real-time communication for responsive user experience
- Type safety throughout the application with TypeScript
- Production-ready with Docker containerization and monitoring



- Security: JWT tokens with expiration for Panel↔Agent auth
- Scalability: Multiple Agents per Panel for distributed deployment
- Real-time updates: WebSocket for live server status and logs
- Configuration management: Git-based egg repository system
- Error handling: Graceful degradation when Agents disconnect
- Performance: Efficient message routing and connection pooling



- Security-first architecture with proper input validation
- Scalable single-service design with clear separation of concerns
- WebSocket integration for real-time features
- Docker containerization for consistent deployment
- Static frontend export for enhanced security
- Role-based access control throughout the system



## Components

### Panel Web Interface

Express.js API server with React/Next.js frontend serving the management interface

**Responsibilities:**

- User authentication and authorization
- Web UI serving and API endpoints
- External agent management and discovery
- Database operations and data persistence
- Real-time WebSocket communication
- Security monitoring and audit logging

### External Agent Communication

HTTP REST API client for communicating with separate agent processes

**Responsibilities:**

- Agent registration and discovery
- Command relay to remote agents
- Health monitoring and status tracking
- Server control and management commands
- Metrics collection and aggregation

### Agent Discovery Service

Automatic discovery and health monitoring of external agents

**Responsibilities:**

- Automatic agent detection on known nodes
- Periodic health checks and status updates
- Agent registration and deregistration
- Connection failure handling and recovery

### Database Layer

PostgreSQL database with Prisma ORM for data persistence

**Responsibilities:**

- User and permission management
- Server and node configuration storage
- Audit trail and security logging
- Metrics and monitoring data
- System configuration and settings

### Real-time Communication

WebSocket layer for live updates and notifications

**Responsibilities:**

- Live server status updates
- Real-time monitoring data
- User interface notifications
- Agent communication events





### Ctrl-Alt-Play Panel

Web interface and API backend for user management, server orchestration, and monitoring

**Responsibilities:**

- User authentication and authorization
- Server deployment and configuration
- Agent management and health monitoring
- Web UI serving and API endpoints
- Database operations and data persistence

### Ctrl-Alt-Play Agent

Lightweight daemon running on server nodes to manage Docker containers

**Responsibilities:**

- Docker container lifecycle management
- Real-time server status reporting
- Log streaming and file management
- Resource monitoring and reporting
- WebSocket connection to Panel

### Egg Configuration System

JSON/YAML templates defining game server configurations

**Responsibilities:**

- Docker image specifications
- Port and environment variable definitions
- Startup command templates
- Resource limit configurations
- Steam Workshop integration settings

### WebSocket Communication Layer

Real-time bidirectional communication between Panel and Agents

**Responsibilities:**

- Server start/stop/restart commands
- Live log streaming
- Resource usage updates
- Agent health monitoring
- File transfer coordination





### Express.js API Server

Main backend service handling REST API, authentication, and WebSocket connections

**Responsibilities:**

- API endpoint routing
- JWT authentication middleware
- WebSocket server management
- Static file serving
- Security headers and CORS

### PostgreSQL Database

Primary data store using Prisma ORM

**Responsibilities:**

- User and server data persistence
- Role-based access control
- Metrics and monitoring data
- Steam Workshop item tracking

### Redis Cache

In-memory cache for performance

**Responsibilities:**

- Session management
- Temporary data caching
- Rate limiting storage

### React/Next.js Frontend

Modern frontend with static export

**Responsibilities:**

- User interface rendering
- Client-side routing
- Authentication flow
- Real-time data display
- Administrative interfaces

### WebSocket Service

Real-time communication layer

**Responsibilities:**

- Live server status updates
- Console output streaming
- Agent communication
- Real-time monitoring data

### Agent Communication Framework

External agent connection system

**Responsibilities:**

- Agent registration and authentication
- Command relay to remote servers
- Status monitoring
- Resource metrics collection



