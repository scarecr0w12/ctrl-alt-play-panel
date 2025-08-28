---
title: "Coding Standards and Patterns"
description: "Established coding patterns, architectural conventions, and design standards for the Ctrl-Alt-Play Panel project."
tags: ["coding-standards", "patterns", "conventions", "best-practices"]
---

# Coding Standards and Patterns

## Overview

The Ctrl-Alt-Play Panel follows established coding patterns, architectural conventions, and design standards to ensure consistency, maintainability, and scalability across the codebase. These standards are critical for maintaining the distributed Panel+Agent architecture.

## Core Coding Principles

### Pattern Adherence
Strictly follow the coding patterns and conventions defined in system documentation for all code implementations.

### API and Database Knowledge
Reference API and database documentation when implementing new features that interact with APIs or databases.

### Testing Integration
Write comprehensive tests for all new code, following the patterns and guidelines specified in testing documentation.

### Code Documentation
Include appropriate comments and documentation for complex logic and public APIs.

### Best Practices
Apply software engineering best practices including proper error handling, security considerations, and performance optimization.

### Memory Bank Integration
Use project context from memory bank files to ensure consistency with existing architecture and decisions.

## Architectural Patterns

### Panel-Agent Distributed Architecture
- **Distributed Management**: Central Panel managing multiple external Agents across nodes
- **Independent Execution**: Agents run as separate processes with fault isolation
- **HTTP REST Communication**: RESTful API between Panel and Agents for standard operations
- **WebSocket Real-time**: Live console streaming and real-time status updates
- **Auto-discovery**: Agents automatically register with Panel on startup

### Deployment-Agnostic Infrastructure (Phase 1)
- **Dynamic Port Management**: Automatic port detection and conflict resolution
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

## Code Organization

### Backend Structure
```
src/
├── routes/          # API route handlers organized by domain
├── services/        # Business logic and service implementations
├── middlewares/     # Express middleware functions
├── utils/           # Utility functions and helpers
├── models/          # Data models and interfaces
├── config/          # Configuration files and settings
├── health-check.js  # Health check endpoint implementation
└── index.js         # Application entry point
```

### Frontend Structure
```
frontend/
├── components/      # Reusable UI components
├── pages/           # Page components and routes
├── services/        # API service clients
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── utils/           # Frontend utility functions
├── styles/          # CSS and styling files
└── public/          # Static assets
```

### Test Structure
``
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
├── e2e/            # End-to-end tests for user workflows
├── performance/    # Performance and load tests
├── security/       # Security-focused tests
├── fixtures/       # Test data fixtures
├── helpers/        # Test helper functions
├── jest.setup.ts   # Jest global setup
├── setup.ts        # Database test setup
└── globalSetup.ts  # Global test initialization
```

## Naming Conventions

### Files and Directories
- **Lowercase with hyphens**: `user-service.ts`, `api-routes/`
- **Plural for collections**: `routes/`, `services/`, `models/`
- **Singular for specific implementations**: `user-service.ts`, `auth-middleware.ts`

### Variables and Functions
- **camelCase**: `getUserById`, `serverStatus`
- **Descriptive names**: `calculateServerMetrics` instead of `calc`
- **Boolean prefixes**: `isRunning`, `hasPermission`
- **Action verbs for functions**: `createUser`, `validateToken`

### Classes and Types
- **PascalCase**: `UserService`, `ServerModel`
- **Interface prefix**: `IUser`, `IServer`
- **Type suffix**: `UserType`, `ServerStatus`

## Code Style Guidelines

### TypeScript/JavaScript
- **Strict typing**: Use TypeScript interfaces and types
- **Async/await**: Prefer async/await over callbacks
- **Error handling**: Always handle errors appropriately
- **Consistent formatting**: Follow Prettier configuration
- **ESLint rules**: Adhere to established ESLint rules

### API Design
- **RESTful principles**: Use proper HTTP methods and status codes
- **Consistent endpoints**: Follow established URL patterns
- **JSON responses**: Standardized response formats
- **Error responses**: Consistent error message structure

### Database Access
- **Repository pattern**: Use service layers for data access
- **Parameterized queries**: Prevent SQL injection
- **Connection management**: Proper connection pooling
- **Transaction handling**: Explicit transaction management

## Documentation Standards

### Code Comments
- **Complex logic**: Explain non-obvious implementation decisions
- **Public APIs**: Document parameters, return values, and exceptions
- **TODO comments**: Include issue references when possible
- **FIXME comments**: Document known issues with priority

### API Documentation
- **Endpoint descriptions**: Clear purpose and functionality
- **Parameter documentation**: Type, required, description
- **Response examples**: Sample responses for different scenarios
- **Error codes**: Documented error responses

### README Files
- **Project overview**: Clear description of purpose and features
- **Setup instructions**: Step-by-step installation guide
- **Usage examples**: Practical examples of common operations
- **Configuration options**: Documented environment variables

## Testing Standards

### Test Structure
- **Descriptive test names**: Clear indication of what is being tested
- **Arrange-Act-Assert**: Consistent test organization
- **Isolated tests**: Tests should not depend on each other
- **Fast execution**: Optimize test performance

### Test Coverage
- **Core functionality**: Comprehensive coverage of business logic
- **Edge cases**: Test boundary conditions and error scenarios
- **Integration points**: Verify API and service interactions
- **Security aspects**: Validate authentication and authorization

## Security Standards

### Input Validation
- **Sanitization**: Clean all user inputs
- **Validation**: Verify data formats and constraints
- **Type checking**: Ensure correct data types
- **Length limits**: Prevent buffer overflow attacks

### Authentication
- **Secure tokens**: Use JWT with proper expiration
- **Password hashing**: Bcrypt with appropriate rounds
- **Session management**: Secure session handling
- **Rate limiting**: Prevent brute force attacks

### Authorization
- **RBAC implementation**: Role-based access control
- **Permission checks**: Verify permissions for all actions
- **Resource ownership**: Validate resource access rights
- **Audit logging**: Track sensitive operations

## Performance Standards

### Code Optimization
- **Efficient algorithms**: Use appropriate data structures
- **Database queries**: Optimize with proper indexing
- **Caching**: Implement caching for expensive operations
- **Resource management**: Proper cleanup of resources

### Memory Management
- **Leak prevention**: Avoid memory leaks in long-running processes
- **Efficient data structures**: Use appropriate collections
- **Stream processing**: Handle large data sets efficiently
- **Garbage collection**: Understand GC implications

## Error Handling

### Error Types
- **Expected errors**: Handle known error conditions
- **Unexpected errors**: Gracefully handle unknown errors
- **System errors**: Properly handle system-level failures
- **Network errors**: Handle connectivity issues

### Error Responses
- **Consistent format**: Standardized error response structure
- **Appropriate codes**: Use correct HTTP status codes
- **Helpful messages**: Clear error descriptions
- **Security considerations**: Avoid exposing sensitive information
