# Coding Standards

## Overview

Universal coding standards for the Ctrl-Alt-Play Panel project that apply to all modes and development activities. These standards ensure consistency, maintainability, and quality across the entire Panel+Agent distributed architecture.

## TypeScript Requirements

### Mandatory TypeScript Usage
- **ALL NEW CODE** must be written in TypeScript
- **NO JavaScript files** (.js) allowed for new development
- **Frontend and Backend**: Both must use TypeScript for type safety
- **Configuration Files**: Use TypeScript where possible (e.g., `next.config.ts`, `jest.config.ts`)

### Type Safety Standards
- **Strict Mode**: All TypeScript files must compile with `strict: true`
- **No `any` Types**: Explicit types required, `any` is prohibited except in legacy code migration
- **Interface Definitions**: Use interfaces for object shapes, types for unions/primitives
- **Generic Constraints**: Use proper generic constraints where applicable

**Example:**
```typescript
// ✅ Good - Explicit typing
interface ServerConfig {
  id: string;
  name: string;
  port: number;
  status: 'running' | 'stopped' | 'starting';
}

// ❌ Bad - Using any
function processServer(config: any): any {
  return config;
}

// ✅ Good - Proper generic constraints
function processServer<T extends ServerConfig>(config: T): T {
  return config;
}
```

## File Naming Conventions

### General File Naming
- **Backend Files**: Use `camelCase` for all backend files
  - Services: `userService.ts`, `agentDiscoveryService.ts`
  - Routes: `auth.ts`, `servers.ts`, `users.ts`
  - Utilities: `portManager.ts`, `errorHandler.ts`
  - Middleware: `auth.ts`, `authorize.ts`

- **Frontend Components**: Use `PascalCase` for React components
  - Components: `ServerCard.tsx`, `UserManagement.tsx`
  - Pages: `Dashboard.tsx`, `Settings.tsx`
  - Contexts: `AuthContext.tsx`, `WebSocketContext.tsx`

- **Configuration Files**: Use `kebab-case` or follow ecosystem conventions
  - Docker: `docker-compose.yml`, `docker-compose.prod.yml`
  - Config: `jest.config.js`, `next.config.js`
  - Env: `.env.development`, `.env.production`

### Directory Structure
- **No nested directories** deeper than 3 levels without architectural justification
- **Group by domain** not by file type (services, routes, components together)
- **Consistent naming** across similar directories (`tests/`, `src/`, `frontend/`)

**Example Structure:**
```
src/
├── routes/
│   ├── auth.ts          # Authentication routes
│   ├── servers.ts       # Server management routes
│   └── users.ts         # User management routes
├── services/
│   ├── authService.ts   # Authentication business logic
│   ├── serverService.ts # Server management logic
│   └── userService.ts   # User management logic
└── utils/
    ├── portManager.ts   # Port allocation utility
    └── validator.ts     # Input validation utility
```

## Error Handling Patterns

### Async Operation Standards
- **ALWAYS** use proper async/await error handling
- **NEVER** use unhandled promises
- **CONSISTENT** error response format across all APIs
- **GRACEFUL** degradation for non-critical failures

**Required Pattern:**
```typescript
// ✅ Good - Proper async error handling
async function createServer(config: ServerConfig): Promise<ApiResponse<Server>> {
  try {
    const server = await serverService.create(config);
    return {
      success: true,
      data: server,
      message: 'Server created successfully'
    };
  } catch (error) {
    logger.error('Server creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'SERVER_CREATION_FAILED'
    };
  }
}

// ❌ Bad - Unhandled promise
function createServer(config: ServerConfig) {
  return serverService.create(config); // No error handling
}
```

### Error Response Format
All API errors must follow the standardized format:
```typescript
interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}
```

## Import/Export Organization

### Import Order Standards
1. **External libraries** (React, Express, Prisma)
2. **Internal modules** (services, utils, types)
3. **Relative imports** (./components, ../utils)
4. **Type-only imports** at the end

**Example:**
```typescript
// External libraries
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Internal modules
import { authService } from '../services/authService';
import { validateRequest } from '../utils/validator';

// Relative imports
import { AuthMiddleware } from './middleware/auth';

// Type-only imports
import type { Request, Response } from 'express';
import type { User } from '../types/user';
```

### Export Standards
- **Default exports**: Use for main component/class per file
- **Named exports**: Use for utilities, types, interfaces
- **Barrel exports**: Use index.ts files for clean imports
- **Type exports**: Explicitly export types with `export type`

**Example:**
```typescript
// ✅ Good - Clear export strategy
export default class ServerService {
  // Main service class
}

export type { ServerConfig, ServerStatus };
export { validateServerConfig, DEFAULT_SERVER_PORT };
```

## Code Documentation Requirements

### Function Documentation
- **ALL public functions** must have JSDoc comments
- **Complex logic** must be documented with inline comments
- **API endpoints** must document parameters, responses, and error cases
- **Type definitions** must include descriptions for complex types

**Required JSDoc Format:**
```typescript
/**
 * Creates a new server instance with the provided configuration.
 * 
 * @param config - Server configuration object with name, port, and settings
 * @param userId - ID of the user creating the server for ownership assignment
 * @returns Promise resolving to the created server object
 * @throws {ValidationError} When server configuration is invalid
 * @throws {ConflictError} When server name already exists
 * 
 * @example
 * ```typescript
 * const server = await createServer({
 *   name: 'My Game Server',
 *   port: 25565,
 *   gameType: 'minecraft'
 * }, 'user-123');
 * ```
 */
async function createServer(config: ServerConfig, userId: string): Promise<Server> {
  // Implementation
}
```

### Inline Comments
- **Why, not what**: Explain the reasoning behind complex logic
- **Business context**: Include domain-specific explanations
- **TODOs**: Use consistent TODO format with date and assignee
- **Performance notes**: Document performance-critical sections

**Example:**
```typescript
// Port allocation starts from 25565 to avoid conflicts with common services
// This range is specifically chosen for game servers (Minecraft default: 25565)
const startPort = 25565;

// TODO: 2025-07-28 - Implement dynamic port range configuration (assigned: @dev-team)
// Currently hardcoded, should be configurable per deployment environment
const portRange = { min: 25565, max: 30000 };
```

## Code Quality Standards

### Linting and Formatting
- **ESLint**: Must pass all ESLint rules without warnings
- **Prettier**: Automatic code formatting on save
- **TypeScript**: Zero TypeScript errors required for commits
- **Import sorting**: Automatic import organization

**Required ESLint Configuration:**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "prefer-const": "error"
  }
}
```

### Performance Standards
- **Database queries**: Must use proper indexing and efficient queries
- **Memory management**: Avoid memory leaks in long-running processes
- **Async operations**: Use connection pooling and proper resource cleanup
- **Bundle size**: Monitor and optimize frontend bundle sizes

### Security Standards
- **Input validation**: All user inputs must be validated and sanitized
- **SQL injection prevention**: Use parameterized queries only
- **XSS prevention**: Proper output encoding and CSP headers
- **Authentication**: JWT tokens in httpOnly cookies only

**Example Security Pattern:**
```typescript
// ✅ Good - Input validation and sanitization
async function updateServerName(serverId: string, name: string): Promise<void> {
  // Validate input
  if (!serverId || !name) {
    throw new ValidationError('Server ID and name are required');
  }
  
  // Sanitize input
  const sanitizedName = validator.escape(name.trim());
  
  // Validate length and characters
  if (sanitizedName.length < 1 || sanitizedName.length > 50) {
    throw new ValidationError('Server name must be 1-50 characters');
  }
  
  // Use parameterized query
  await prisma.server.update({
    where: { id: serverId },
    data: { name: sanitizedName }
  });
}
```

## Integration Requirements

### Memory Bank Integration
- **ALWAYS** reference memory bank files for architectural decisions
- **UPDATE** memory bank when making significant changes
- **CONSISTENT** with established patterns in systemPatterns.md
- **FOLLOW** API patterns documented in api.md

### Testing Integration
- **Unit tests** required for all new functions and methods
- **Integration tests** required for API endpoints
- **Type safety tests** for complex type definitions
- **Mock external dependencies** following testing.md patterns

### Database Integration
- **Foreign key awareness** in all database operations
- **Transaction support** for multi-table operations
- **Proper cleanup order** respecting database constraints
- **Migration safety** for schema changes

## Enforcement

### Pre-commit Hooks
- TypeScript compilation check
- ESLint validation
- Prettier formatting
- Test execution for changed files

### CI/CD Pipeline
- Full TypeScript compilation
- Complete test suite execution
- Code coverage validation
- Security vulnerability scanning

### Code Review Requirements
- **Type safety**: All reviewers must verify proper TypeScript usage
- **Pattern adherence**: Code must follow established architectural patterns
- **Documentation**: Public APIs must be properly documented
- **Security**: Security implications must be reviewed

## Migration Guidelines

### Legacy JavaScript Code
- **Gradual migration**: Convert JavaScript files to TypeScript incrementally
- **Type definitions**: Add proper types during migration
- **Testing**: Ensure test coverage during migration
- **Documentation**: Update documentation during conversion

### Breaking Changes
- **Version migration**: Document breaking changes in CHANGELOG.md
- **Backward compatibility**: Maintain compatibility where possible
- **Migration scripts**: Provide automated migration tools when needed
- **Team communication**: Announce breaking changes to all team members

This coding standards document ensures consistent, maintainable, and secure code across the entire Panel+Agent distributed architecture while maintaining alignment with the established system patterns and architectural decisions.