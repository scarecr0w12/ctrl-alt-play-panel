# Project Conventions

## Overview

Project-specific conventions for the Ctrl-Alt-Play Panel that define standards unique to this distributed control panel architecture. These conventions complement general coding standards and architectural patterns with project-specific requirements for memory bank integration, plugin systems, agent communication, and specialized component behaviors.

## Memory Bank Integration Requirements

### Memory Bank File Update Protocol

**MANDATORY PROCEDURE**: All significant architectural decisions, API changes, and system modifications must be documented in memory bank files following established update protocols.

**Required Memory Bank Files and Update Triggers:**

**Core System Documentation:**
- **`systemPatterns.md`**: Update when adding new coding patterns, architectural decisions, or design standards
- **`api.md`**: Update when creating new endpoints, modifying API contracts, or changing response formats
- **`database.md`**: Update when adding tables, modifying schemas, or changing foreign key relationships
- **`testing.md`**: Update when establishing new testing patterns or modifying test infrastructure

**Project Context Documentation:**
- **`productContext.md`**: Update when requirements change or new features are specified
- **`activeContext.md`**: Update when development priorities shift or active work changes
- **`decisionLog.md`**: Update when making significant architectural or technical decisions
- **`progress.md`**: Update when reaching milestones or completing major development phases

### Memory Bank Update Standards

**REQUIRED UPDATE FORMAT:**
```markdown
## [Date] - [Change Type]: [Brief Description]

### Context
Brief explanation of why this change was needed.

### Decision
What was decided and implemented.

### Implementation
Technical details of the implementation.

### Impact
Effects on other system components and future development.

### Related Changes
- Links to pull requests
- References to related memory bank updates
- Cross-references to affected documentation
```

**Update Responsibilities by Role:**
- **Code Mode**: Update `systemPatterns.md`, `api.md`, `database.md`, `testing.md` when implementing features
- **Architect Mode**: Update `productContext.md`, `decisionLog.md` when making design decisions
- **Deploy Mode**: Update `deployment.md` when modifying infrastructure or deployment processes
- **All Modes**: Update `activeContext.md` and `progress.md` when work status changes

## Plugin System Integration Standards

### Plugin Architecture Requirements

**MANDATORY PATTERN**: All plugins must follow the established plugin architecture with proper isolation, security, and lifecycle management.

**Required Plugin Structure:**
```typescript
// REQUIRED: Plugin interface implementation
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  permissions: PluginPermission[];
  entryPoint: string;
  compatibility: {
    panelVersion: string;
    nodeVersion: string;
  };
}

// REQUIRED: Plugin lifecycle hooks
interface Plugin {
  manifest: PluginManifest;
  initialize(): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  cleanup(): Promise<void>;
  handleEvent(event: PluginEvent): Promise<void>;
}
```

### Plugin Security Standards

**CRITICAL SECURITY REQUIREMENTS**: All plugins must implement comprehensive security measures with sandboxed execution and permission-based access control.

**Required Security Implementation:**
```typescript
// REQUIRED: Plugin permission system
interface PluginPermission {
  type: 'server' | 'user' | 'file' | 'network' | 'database' | 'console';
  action: string;
  resource?: string;
  conditions?: Record<string, any>;
}

// REQUIRED: Plugin sandbox environment
class PluginSandbox {
  private readonly permissions: PluginPermission[];
  private readonly resourceLimits: ResourceLimits;

  constructor(plugin: Plugin, permissions: PluginPermission[]) {
    this.permissions = permissions;
    this.resourceLimits = this.calculateLimits(plugin);
  }

  async executeInSandbox<T>(fn: () => Promise<T>): Promise<T> {
    // Validate permissions before execution
    await this.validatePermissions();
    
    // Apply resource limits
    const monitor = this.startResourceMonitoring();
    
    try {
      return await fn();
    } finally {
      monitor.stop();
    }
  }
}
```

### Plugin Development Standards

**DEVELOPMENT REQUIREMENTS**: Plugin development must follow established patterns with proper testing, documentation, and integration procedures.

**Required Plugin Development Process:**
1. **Manifest Creation**: Define plugin manifest with explicit permissions
2. **Security Review**: Security implications assessment for all requested permissions
3. **API Compliance**: Use only approved Panel API endpoints and patterns
4. **Testing**: Comprehensive testing including permission validation and resource limits
5. **Documentation**: Complete plugin documentation including installation and usage
6. **Certification**: Plugin certification process for security and compatibility

## Agent Service Communication Protocols

### Agent Discovery and Registration

**MANDATORY PROTOCOL**: Agent discovery and registration must follow standardized protocols ensuring reliable service mesh operation.

**Required Discovery Implementation:**
```typescript
// REQUIRED: Agent discovery service
interface AgentDiscoveryConfig {
  discoveryInterval: number;
  healthCheckInterval: number;
  maxRetries: number;
  timeoutMs: number;
  nodeNetworks: string[];
  excludePorts: number[];
}

class AgentDiscoveryService {
  async discoverAgents(config: AgentDiscoveryConfig): Promise<Agent[]> {
    const discoveredAgents: Agent[] = [];
    
    // Scan configured network ranges
    for (const network of config.nodeNetworks) {
      const networkAgents = await this.scanNetwork(network, config);
      discoveredAgents.push(...networkAgents);
    }
    
    // Validate and register discovered agents
    for (const agent of discoveredAgents) {
      await this.validateAgent(agent);
      await this.registerAgent(agent);
    }
    
    return discoveredAgents;
  }

  private async scanNetwork(network: string, config: AgentDiscoveryConfig): Promise<Agent[]> {
    // Implementation must respect timeout and retry limits
    // Must handle network errors gracefully
    // Must validate agent certificates and authentication
  }
}
```

### Agent Communication Standards

**PROTOCOL REQUIREMENTS**: All agent communication must use standardized message formats with proper authentication and error handling.

**Required Communication Patterns:**
```typescript
// REQUIRED: Agent command protocol
interface AgentCommand {
  id: string;
  action: 'start' | 'stop' | 'restart' | 'status' | 'update' | 'configure';
  serverId: string;
  timestamp: string;
  authentication: {
    token: string;
    userId: string;
  };
  metadata: {
    requestId: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    timeout: number;
  };
  payload?: Record<string, any>;
}

// REQUIRED: Agent response protocol
interface AgentResponse {
  commandId: string;
  status: 'success' | 'error' | 'timeout' | 'pending';
  serverId: string;
  timestamp: string;
  executionTime: number;
  message: string;
  data?: {
    processId?: string;
    port?: number;
    resources?: ResourceUsage;
    logs?: string[];
    errors?: string[];
  };
  nextAction?: string;
}
```

### Agent Health Monitoring

**MONITORING REQUIREMENTS**: All agents must implement comprehensive health monitoring with automatic recovery and alerting.

**Required Health Check Implementation:**
```typescript
// REQUIRED: Agent health monitoring
interface AgentHealthStatus {
  agentId: string;
  nodeId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unreachable';
  lastSeen: string;
  uptime: number;
  version: string;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  services: ServiceHealth[];
  errors: string[];
  warnings: string[];
}

class AgentHealthMonitor {
  async checkAgentHealth(agentId: string): Promise<AgentHealthStatus> {
    try {
      const response = await this.sendHealthCheck(agentId);
      return this.processHealthResponse(response);
    } catch (error) {
      return this.handleHealthCheckFailure(agentId, error);
    }
  }

  private async handleHealthCheckFailure(agentId: string, error: Error): Promise<AgentHealthStatus> {
    // Implement automatic recovery attempts
    // Log failure for monitoring systems
    // Trigger alerts if necessary
    // Return appropriate health status
  }
}
```

## File Manager Security Requirements

### File System Access Control

**SECURITY-FIRST REQUIREMENT**: File manager operations must implement comprehensive access control with path validation, permission checking, and audit logging.

**Required Security Implementation:**
```typescript
// REQUIRED: File manager security service
interface FileOperation {
  operation: 'read' | 'write' | 'delete' | 'create' | 'move' | 'copy';
  path: string;
  userId: string;
  serverId?: string;
  metadata: {
    timestamp: string;
    sessionId: string;
    ipAddress: string;
  };
}

class FileManagerSecurity {
  async validateFileOperation(operation: FileOperation): Promise<boolean> {
    // Validate path is within allowed boundaries
    await this.validatePath(operation.path);
    
    // Check user permissions for the operation
    await this.checkUserPermissions(operation.userId, operation.operation, operation.path);
    
    // Validate server ownership if applicable
    if (operation.serverId) {
      await this.validateServerOwnership(operation.userId, operation.serverId);
    }
    
    // Log operation for audit trail
    await this.logFileOperation(operation);
    
    return true;
  }

  private async validatePath(path: string): Promise<void> {
    // Prevent directory traversal attacks
    if (path.includes('..') || path.includes('~')) {
      throw new SecurityError('Invalid path detected: directory traversal attempt');
    }
    
    // Ensure path is within allowed directories
    const allowedPaths = await this.getAllowedPaths();
    const normalizedPath = this.normalizePath(path);
    
    if (!allowedPaths.some(allowed => normalizedPath.startsWith(allowed))) {
      throw new SecurityError('Path access denied: outside allowed directories');
    }
  }
}
```

### File Upload and Download Security

**CRITICAL SECURITY PATTERNS**: File transfers must implement comprehensive security measures including virus scanning, file type validation, and size limits.

**Required Security Measures:**
```typescript
// REQUIRED: File transfer security
interface FileTransferConfig {
  maxFileSize: number;
  allowedExtensions: string[];
  blockedExtensions: string[];
  virusScanEnabled: boolean;
  encryptionRequired: boolean;
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
}

class FileTransferSecurity {
  async validateFileUpload(file: File, config: FileTransferConfig): Promise<void> {
    // Validate file size
    if (file.size > config.maxFileSize) {
      throw new ValidationError(`File size exceeds limit: ${config.maxFileSize} bytes`);
    }
    
    // Validate file extension
    const extension = this.getFileExtension(file.name);
    if (config.blockedExtensions.includes(extension)) {
      throw new SecurityError(`File type blocked: ${extension}`);
    }
    
    if (config.allowedExtensions.length > 0 && !config.allowedExtensions.includes(extension)) {
      throw new SecurityError(`File type not allowed: ${extension}`);
    }
    
    // Virus scan if enabled
    if (config.virusScanEnabled) {
      await this.scanForVirus(file);
    }
    
    // Validate file content matches extension
    await this.validateFileContent(file, extension);
  }
}
```

## Console Component Authentication Patterns

### Console Access Control

**AUTHENTICATION REQUIREMENT**: Console access must implement multi-layer authentication with session management and command authorization.

**Required Authentication Implementation:**
```typescript
// REQUIRED: Console authentication service
interface ConsoleSession {
  sessionId: string;
  userId: string;
  serverId: string;
  permissions: string[];
  startTime: string;
  lastActivity: string;
  ipAddress: string;
  authenticated: boolean;
  mfaVerified?: boolean;
}

class ConsoleAuthenticationService {
  async authenticateConsoleAccess(userId: string, serverId: string): Promise<ConsoleSession> {
    // Validate user has console permissions
    await this.validateConsolePermissions(userId, serverId);
    
    // Check server ownership or shared access
    await this.validateServerAccess(userId, serverId);
    
    // Create authenticated session
    const session = await this.createConsoleSession(userId, serverId);
    
    // Enable session monitoring
    this.startSessionMonitoring(session);
    
    return session;
  }

  async authorizeCommand(sessionId: string, command: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    
    // Validate session is still active
    await this.validateSession(session);
    
    // Check command against user permissions
    return await this.checkCommandPermissions(session.permissions, command);
  }
}
```

### Console Command Filtering

**SECURITY FILTERING REQUIREMENT**: All console commands must be filtered and validated before execution with comprehensive logging and monitoring.

**Required Command Filtering:**
```typescript
// REQUIRED: Console command filter
interface CommandFilter {
  name: string;
  pattern: RegExp;
  action: 'allow' | 'block' | 'warn' | 'require-approval';
  requiredPermission?: string;
  logLevel: 'info' | 'warn' | 'error';
}

class ConsoleCommandFilter {
  private readonly dangerousCommands: CommandFilter[] = [
    {
      name: 'system-shutdown',
      pattern: /^(shutdown|halt|reboot|poweroff)/i,
      action: 'require-approval',
      requiredPermission: 'ADMIN_SYSTEM_CONTROL',
      logLevel: 'warn'
    },
    {
      name: 'file-deletion',
      pattern: /^(rm|del|delete).*(-rf|-r|\/)/i,
      action: 'warn',
      requiredPermission: 'FILE_DELETE',
      logLevel: 'warn'
    }
  ];

  async filterCommand(sessionId: string, command: string): Promise<CommandFilterResult> {
    const session = await this.getSession(sessionId);
    
    // Check against all filters
    for (const filter of this.getAllFilters()) {
      if (filter.pattern.test(command)) {
        const result = await this.processFilter(session, command, filter);
        
        // Log the command attempt
        await this.logCommandAttempt(session, command, filter, result);
        
        return result;
      }
    }
    
    // Command not matched by any filter - allow by default
    return { allowed: true, requiresApproval: false };
  }
}
```

## Component Integration Standards

### Inter-Component Communication

**COMMUNICATION REQUIREMENTS**: Components must use standardized communication patterns with proper error handling and state synchronization.

**Required Communication Patterns:**
```typescript
// REQUIRED: Component message protocol
interface ComponentMessage {
  id: string;
  type: 'event' | 'command' | 'query' | 'response';
  source: string;
  target: string;
  timestamp: string;
  payload: Record<string, any>;
  metadata: {
    correlationId?: string;
    replyTo?: string;
    priority: number;
  };
}

// REQUIRED: Component event bus
class ComponentEventBus {
  async publishMessage(message: ComponentMessage): Promise<void> {
    // Validate message format
    await this.validateMessage(message);
    
    // Route to appropriate handlers
    const handlers = await this.getHandlers(message.target);
    
    // Execute handlers with proper error handling
    await Promise.allSettled(
      handlers.map(handler => this.executeHandler(handler, message))
    );
  }

  async subscribeToEvents(component: string, eventTypes: string[]): Promise<void> {
    // Register component as event handler
    // Implement proper cleanup on component shutdown
    // Handle handler failures gracefully
  }
}
```

### State Management Standards

**STATE SYNCHRONIZATION REQUIREMENT**: Components must implement consistent state management with proper synchronization and persistence.

**Required State Management:**
```typescript
// REQUIRED: Component state management
interface ComponentState {
  componentId: string;
  version: number;
  data: Record<string, any>;
  lastUpdated: string;
  checksum: string;
}

class ComponentStateManager {
  async updateState(componentId: string, updates: Partial<ComponentState>): Promise<void> {
    // Validate state changes
    await this.validateStateChange(componentId, updates);
    
    // Apply optimistic updates
    const newState = await this.applyUpdates(componentId, updates);
    
    // Persist to database
    await this.persistState(newState);
    
    // Notify other components of state change
    await this.broadcastStateChange(componentId, newState);
  }

  async synchronizeState(componentId: string): Promise<ComponentState> {
    // Get latest state from all sources
    const localState = await this.getLocalState(componentId);
    const persistedState = await this.getPersistedState(componentId);
    
    // Resolve conflicts if any
    const resolvedState = await this.resolveStateConflicts(localState, persistedState);
    
    // Update local state
    await this.updateLocalState(componentId, resolvedState);
    
    return resolvedState;
  }
}
```

## Development Environment Standards

### Local Development Setup

**STANDARDIZED DEVELOPMENT ENVIRONMENT**: All developers must use consistent development environment setup with proper tooling and configuration.

**Required Development Stack:**
- **Node.js**: Version 18+ with npm/yarn for package management
- **TypeScript**: Latest stable version with strict mode enabled
- **Database**: PostgreSQL with Prisma ORM for development
- **Testing**: Jest with comprehensive mocking setup
- **Linting**: ESLint with TypeScript rules and Prettier formatting
- **Git Hooks**: Pre-commit hooks for code quality validation

**Required Environment Configuration:**
```bash
# REQUIRED: Environment variables for development
DATABASE_URL="postgresql://localhost:5432/ctrl_alt_play_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="development-secret-key"
NODE_ENV="development"
LOG_LEVEL="debug"
PLUGIN_DIRECTORY="./plugins"
AGENT_DISCOVERY_NETWORKS="192.168.1.0/24,10.0.0.0/8"
```

### Testing Environment Standards

**ISOLATED TESTING ENVIRONMENT**: All tests must run in isolated environments with complete external service mocking.

**Required Testing Setup:**
```typescript
// REQUIRED: Test environment configuration
const testConfig = {
  database: {
    url: 'postgresql://localhost:5432/ctrl_alt_play_test',
    resetBetweenTests: true,
    seedData: './tests/fixtures/seed-data.sql'
  },
  mocking: {
    redis: true,
    externalAPIs: true,
    fileSystem: true,
    network: true
  },
  coverage: {
    threshold: {
      global: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90
      }
    }
  }
};
```

## Documentation Standards

### Component Documentation Requirements

**COMPREHENSIVE DOCUMENTATION**: All components must include complete documentation covering API, configuration, security, and troubleshooting.

**Required Documentation Structure:**
```markdown
# Component Name

## Overview
Brief description of component purpose and responsibilities.

## Architecture
Integration with Panel+Agent architecture and other components.

## API Reference
Complete API documentation with examples.

## Configuration
All configuration options and environment variables.

## Security
Security considerations and implementation details.

## Testing
Testing approach and coverage requirements.

## Troubleshooting
Common issues and resolution steps.

## Changelog
Version history and breaking changes.
```

### API Documentation Standards

**STANDARDIZED API DOCUMENTATION**: All API endpoints must be documented using OpenAPI/Swagger with comprehensive examples and error cases.

**Required API Documentation Format:**
```yaml
# REQUIRED: OpenAPI specification format
paths:
  /api/servers:
    post:
      summary: Create new server
      description: Creates a new server instance with the provided configuration
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServerConfig'
            examples:
              minecraft-server:
                summary: Minecraft server example
                value:
                  name: "My Minecraft Server"
                  gameType: "minecraft"
                  port: 25565
      responses:
        '201':
          description: Server created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '400':
          description: Invalid server configuration
        '403':
          description: Insufficient permissions
        '409':
          description: Server name already exists
```

## Enforcement and Compliance

### Convention Validation

**AUTOMATED VALIDATION**: Project conventions must be validated through automated tools and processes.

**Required Validation Tools:**
- **Memory Bank Validation**: Automated checks for memory bank file consistency
- **Plugin Security Scanning**: Security validation for all plugins
- **API Compliance Testing**: Automated testing of API contract compliance
- **Documentation Coverage**: Validation of documentation completeness
- **Convention Adherence**: Automated checking of project-specific patterns

### Compliance Monitoring

**CONTINUOUS MONITORING**: Project convention compliance must be continuously monitored with reporting and alerting.

**Required Monitoring:**
- **Convention Violations**: Track and report violations of project conventions
- **Documentation Drift**: Monitor documentation consistency with implementation
- **Security Compliance**: Continuous security compliance monitoring
- **Performance Impact**: Monitor performance impact of convention adherence
- **Developer Experience**: Track developer productivity and convention usability

This project conventions document ensures consistent implementation of project-specific requirements while maintaining alignment with the Panel+Agent distributed architecture and established development standards.