# Architectural Patterns

## Overview

Architectural decision enforcement rules for the Ctrl-Alt-Play Panel project that ensure consistency with the Panel+Agent distributed architecture. These patterns provide mandatory guidelines for maintaining system integrity, scalability, and security across all components.

## Panel+Agent Distributed Architecture

### Core Architecture Principles

**MANDATORY PATTERN**: The system follows a distributed architecture where the central Panel manages multiple external Agents across nodes. This pattern ensures fault isolation, scalability, and independent execution of services.

**Key Architectural Components:**
- **Central Panel**: Web-based control interface with Express.js backend and React frontend
- **External Agents**: Independent processes running on remote nodes
- **Communication Layer**: HTTP REST API and WebSocket real-time communication
- **Database Layer**: PostgreSQL with Prisma ORM for centralized data management
- **Service Discovery**: Automatic agent detection and registration

### Distributed Communication Patterns

**Required Communication Protocols:**
1. **HTTP REST API**: Standard CRUD operations and agent management
2. **WebSocket Events**: Real-time console streaming and status updates
3. **JWT Authentication**: Secure token-based communication
4. **Agent Discovery**: Automatic service detection and registration

**Agent Communication Pattern:**
```typescript
// Panel to Agent Command Format (REQUIRED)
interface AgentCommand {
  action: 'start' | 'stop' | 'restart' | 'status';
  serverId: string;
  timestamp: string;
  metadata: {
    requestId: string;
    userId: string;
  };
}

// Agent Response Format (REQUIRED)
interface AgentResponse {
  status: 'starting' | 'running' | 'stopped' | 'error';
  serverId: string;
  timestamp: string;
  message: string;
  data?: {
    processId?: string;
    port?: number;
    resources?: {
      cpu: string;
      memory: string;
    };
  };
}
```

### Service Isolation Patterns

**CRITICAL PATTERN**: Each agent runs as an independent process with complete fault isolation. Panel failures do not affect running agents, and agent failures do not impact the Panel or other agents.

**Implementation Requirements:**
- **Process Independence**: Agents must run as separate system processes
- **State Persistence**: Agent state persisted independently of Panel connectivity
- **Graceful Degradation**: System continues operating with partial agent connectivity
- **Recovery Mechanisms**: Automatic reconnection and state synchronization

## Database Foreign Key Management

### Foreign Key Constraint Patterns

**CRITICAL PATTERN**: All database operations must respect foreign key relationships and follow proper deletion order to prevent constraint violations.

**Required Deletion Order:**
1. **Servers** (dependent on Alts, Users, Nodes)
2. **UserPermissions** (junction table)
3. **Alts** (dependent on Ctrls)
4. **Users** (referenced by Servers)
5. **Nodes** (referenced by Servers)
6. **Ctrls** (parent of Alts)

**Implementation Example:**
```typescript
// REQUIRED: Proper cleanup order respecting foreign keys
async function cleanupDatabase(): Promise<void> {
  await prisma.server.deleteMany({});      // Delete dependent records first
  await prisma.userPermission.deleteMany({}); // Delete junction tables
  await prisma.alt.deleteMany({});         // Delete child records
  await prisma.user.deleteMany({});        // Delete parent records
  await prisma.node.deleteMany({});        // Delete parent records
  await prisma.ctrl.deleteMany({});        // Delete root records
  await prisma.permission.deleteMany({});  // Delete root records
}
```

### Database Relationship Patterns

**MANDATORY RELATIONSHIPS:**
- `Server.ownerId` → `User.id` (CASCADE on delete) - Users own servers
- `Server.nodeId` → `Node.id` (SET NULL on delete) - Servers run on nodes
- `Server.altId` → `Alt.id` (CASCADE on delete) - Servers use configuration templates
- `Alt.ctrlId` → `Ctrl.id` (CASCADE on delete) - Templates belong to categories
- `UserPermission.userId` → `User.id` (CASCADE on delete) - Permission associations
- `UserPermission.permissionId` → `Permission.id` (CASCADE on delete) - Permission associations

**Repository Pattern Requirements:**
```typescript
// REQUIRED: Service layer abstraction with proper error handling
abstract class BaseRepository<T> {
  protected abstract model: any;
  
  async create(data: Partial<T>): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictError('Duplicate entry violates unique constraint');
      }
      if (error.code === 'P2003') {
        throw new ValidationError('Foreign key constraint violation');
      }
      throw error;
    }
  }
}
```

## API Design Standards

### RESTful API Patterns

**MANDATORY PATTERN**: All API endpoints must follow consistent RESTful design with proper HTTP methods, status codes, and response formats.

**Required API Structure:**
```typescript
// REQUIRED: Consistent API response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

// REQUIRED: Standard error response
interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}
```

### Route Organization Pattern

**MANDATORY STRUCTURE**: API routes must be organized by business domain with clear separation of concerns.

**Required Route Structure:**
```
src/routes/
├── auth.ts      # Authentication endpoints (/api/auth/*)
├── servers.ts   # Server management (/api/servers/*)
├── users.ts     # User management (/api/users/*)
├── agents.ts    # Agent management (/api/agents/*)
└── monitoring.ts # System monitoring (/api/monitoring/*)
```

**Route Implementation Pattern:**
```typescript
// REQUIRED: Route handler pattern with middleware chain
router.post('/servers',
  authenticate,           // JWT authentication
  authorize('server:create'), // RBAC authorization
  validate(serverSchema), // Input validation
  async (req: Request, res: Response) => {
    try {
      const server = await serverService.create(req.body, req.user.id);
      res.status(201).json({
        success: true,
        data: server,
        message: 'Server created successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (error) {
      next(error); // Let error middleware handle it
    }
  }
);
```

### Authentication & Authorization Patterns

**SECURITY-FIRST REQUIREMENT**: All API endpoints must implement proper authentication and authorization.

**Required Security Stack:**
- **JWT Authentication**: httpOnly cookies preventing XSS attacks
- **RBAC Authorization**: 36 granular permissions across 10 categories
- **Input Validation**: Schema validation for all requests
- **Security Headers**: Helmet.js with CORS configuration

```typescript
// REQUIRED: Authentication middleware pattern
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

// REQUIRED: Authorization middleware pattern
function authorize(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'insufficient permissions',
        code: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }
    next();
  };
}
```

## Security-First Architecture

### Multi-Layer Security Pattern

**CRITICAL REQUIREMENT**: Security must be implemented at every architectural layer with defense-in-depth strategy.

**Required Security Layers:**
1. **Infrastructure Security**: Helmet.js headers, CORS, rate limiting
2. **Authentication Layer**: JWT with httpOnly cookies, session management
3. **Authorization Layer**: RBAC with granular permissions
4. **Input Validation**: Schema validation and sanitization
5. **Data Security**: Parameterized queries, encryption at rest
6. **Network Security**: HTTPS only, secure WebSocket connections

### Security Implementation Patterns

**MANDATORY SECURITY PATTERNS:**
```typescript
// REQUIRED: Input validation and sanitization
async function validateAndSanitizeInput<T>(
  data: unknown,
  schema: ZodSchema<T>
): Promise<T> {
  // Validate against schema
  const validated = schema.parse(data);
  
  // Sanitize string inputs
  if (typeof validated === 'object') {
    for (const [key, value] of Object.entries(validated)) {
      if (typeof value === 'string') {
        validated[key] = validator.escape(value.trim());
      }
    }
  }
  
  return validated;
}

// REQUIRED: Secure database query pattern
async function updateServer(id: string, data: Partial<Server>): Promise<Server> {
  // Always use parameterized queries
  return await prisma.server.update({
    where: { id }, // Prisma automatically parameterizes
    data: data     // Never use string concatenation
  });
}
```

### Permission System Architecture

**RBAC IMPLEMENTATION REQUIREMENT**: System must implement role-based access control with 36 granular permissions across 10 categories.

**Required Permission Categories:**
1. **SERVER_***: Server management operations
2. **USER_***: User account management
3. **ADMIN_***: Administrative functions
4. **FILE_***: File system operations
5. **CONSOLE_***: Console access and commands
6. **BACKUP_***: Backup and restore operations
7. **DATABASE_***: Database management
8. **NETWORK_***: Network configuration
9. **MONITORING_***: System monitoring
10. **PLUGIN_***: Plugin management

## Component Separation and Dependency Management

### Service Layer Pattern

**MANDATORY PATTERN**: Business logic must be separated into service classes with clear responsibilities and dependencies.

**Required Service Structure:**
```typescript
// REQUIRED: Service class pattern with dependency injection
class ServerService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly agentService: AgentService,
    private readonly portManager: PortManager
  ) {}

  async createServer(config: ServerConfig, userId: string): Promise<Server> {
    // Validate configuration
    await this.validateServerConfig(config);
    
    // Allocate port
    const port = await this.portManager.allocatePort();
    
    // Create database record
    const server = await this.prisma.server.create({
      data: { ...config, port, ownerId: userId }
    });
    
    // Register with agent
    await this.agentService.registerServer(server);
    
    return server;
  }
}
```

### Deployment-Agnostic Infrastructure

**CRITICAL PATTERN**: System must support zero-dependency deployment on any Linux distribution with automatic configuration.

**Required Infrastructure Patterns:**
- **Dynamic Port Management**: Automatic port conflict resolution
- **Environment Detection**: Automatic system configuration
- **Cross-Platform Docker**: Multi-architecture container support
- **Health Monitoring**: Comprehensive service monitoring

```typescript
// REQUIRED: Port Manager pattern for deployment agnostic infrastructure
class PortManager {
  private readonly defaultPort: number;
  private readonly scanRange: { min: number; max: number };
  private readonly excludePorts: number[];

  async allocatePort(): Promise<number> {
    // Try default port first
    if (await this.isPortAvailable(this.defaultPort)) {
      return this.defaultPort;
    }

    // Scan range for available port
    for (let port = this.scanRange.min; port <= this.scanRange.max; port++) {
      if (!this.excludePorts.includes(port) && await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error('No available ports in range');
  }
}
```

### Testing Architecture Patterns

**ENVIRONMENT-AGNOSTIC REQUIREMENT**: All tests must run without external dependencies using comprehensive mocking.

**Required Testing Patterns:**
- **Complete Service Mocking**: Prisma, Redis, external APIs fully mocked
- **Cross-Platform Testing**: Ubuntu, Windows, macOS compatibility
- **Foreign Key Aware Cleanup**: Proper test data cleanup order
- **Isolated Test Environment**: Each test runs with clean state

## Monitoring and Health Patterns

### Health Check Architecture

**MANDATORY PATTERN**: All services must implement comprehensive health checks with automatic recovery.

**Required Health Check Implementation:**
```typescript
// REQUIRED: Service health check pattern
interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  details: {
    database?: boolean;
    redis?: boolean;
    agents?: number;
    uptime?: number;
  };
}

class HealthService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAgents()
    ]);

    return {
      service: 'ctrl-alt-play-panel',
      status: this.determineOverallStatus(checks),
      timestamp: new Date().toISOString(),
      details: this.extractHealthDetails(checks)
    };
  }
}
```

### Service Discovery Pattern

**AUTOMATIC DISCOVERY REQUIREMENT**: System must automatically discover and register agents without manual configuration.

**Implementation Pattern:**
```typescript
// REQUIRED: Agent discovery service pattern
class AgentDiscoveryService {
  async discoverAgents(): Promise<Agent[]> {
    const discoveredAgents: Agent[] = [];
    
    // Scan known nodes for agents
    for (const node of await this.getKnownNodes()) {
      try {
        const agent = await this.probeAgent(node);
        if (agent) {
          await this.registerAgent(agent);
          discoveredAgents.push(agent);
        }
      } catch (error) {
        logger.warn(`Failed to discover agent on ${node.ipAddress}:${node.port}`);
      }
    }
    
    return discoveredAgents;
  }
}
```

## Enforcement and Compliance

### Architecture Review Requirements

**MANDATORY REVIEWS**: All architectural changes must be reviewed for compliance with these patterns.

**Review Checklist:**
- [ ] Follows Panel+Agent distributed architecture
- [ ] Respects database foreign key constraints
- [ ] Implements proper RESTful API design
- [ ] Includes comprehensive security measures
- [ ] Maintains service separation and clean dependencies
- [ ] Supports deployment-agnostic infrastructure
- [ ] Includes proper testing with mocking
- [ ] Implements health monitoring and discovery

### Breaking Change Protocol

**ARCHITECTURAL CHANGE REQUIREMENT**: Any changes to core architectural patterns must follow the established change management process.

**Required Process:**
1. **Documentation Update**: Update memory bank files first
2. **Impact Assessment**: Analyze effects on all system components
3. **Migration Plan**: Provide clear migration path
4. **Testing Validation**: Ensure cross-platform test compatibility
5. **Team Communication**: Announce changes to all development teams

This architectural patterns document ensures consistent implementation of the Panel+Agent distributed architecture while maintaining security, scalability, and maintainability across all system components.