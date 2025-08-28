# Database Documentation

## Overview

The Ctrl-Alt-Play Panel uses PostgreSQL as the primary database with Prisma ORM for type-safe database operations. The database architecture follows modern relational design principles with comprehensive foreign key relationships, RBAC implementation, and optimized schema for the Panel+Agent distributed system.

## Database Technology Stack

**Primary Database**: PostgreSQL
**ORM**: Prisma
**Location**: `/prisma/` directory
**Migrations**: Version-controlled schema changes in `/prisma/migrations/`

## Core Data Models

### User Model
Represents user accounts with authentication and role associations.

**Key Fields:**
- `id`: Unique identifier (UUID)
- `username`: Unique username for authentication
- `email`: User email address
- `passwordHash`: Bcrypt hashed password
- `role`: User role (ADMIN, USER, etc.)
- `permissions`: Associated permission relationships
- `createdAt`: Account creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**
- Many-to-Many with Permissions through UserPermissions
- One-to-Many with Servers (ownership)
- One-to-Many with Sessions (active sessions)

### Server Model
Game server configurations and status information.

**Key Fields:**
- `id`: Unique server identifier (UUID)
- `name`: Server display name
- `status`: Current server status (RUNNING, STOPPED, STARTING, etc.)
- `port`: Server port number
- `nodeId`: Associated infrastructure node
- `altId`: Configuration template reference
- `ownerId`: User ownership reference
- `dockerContainerId`: Container management reference
- `createdAt`: Server creation timestamp
- `updatedAt`: Last status update

**Relationships:**
- Many-to-One with User (owner)
- Many-to-One with Node (deployment target)
- Many-to-One with Alt (configuration template)
- One-to-Many with ServerLogs (logging)

### Node Model
Infrastructure nodes for agent deployment and server hosting.

**Key Fields:**
- `id`: Unique node identifier (UUID)
- `name`: Node display name
- `ipAddress`: Node IP address
- `port`: Agent communication port
- `status`: Node operational status
- `agentVersion`: Installed agent version
- `resources`: Available system resources
- `lastSeen`: Last communication timestamp

**Relationships:**
- One-to-Many with Servers (hosted servers)
- One-to-Many with Agents (registered agents)

### Permission Model
RBAC implementation with granular permission system.

**Key Fields:**
- `id`: Unique permission identifier
- `name`: Permission name (kebab-case)
- `category`: Permission grouping (SERVER, USER, ADMIN, etc.)
- `description`: Human-readable description
- `createdAt`: Permission creation timestamp

**Relationships:**
- Many-to-Many with Users through UserPermissions
- Many-to-Many with Roles through RolePermissions

### Ctrl/Alt Models
Game configuration templates (similar to Pterodactyl's nests/eggs concept).

**Alt Model (Configuration Template):**
- `id`: Unique template identifier
- `name`: Template display name
- `description`: Template description
- `dockerImage`: Base Docker image
- `startup`: Startup command template
- `config`: JSON configuration schema
- `variables`: Environment variables
- `ctrlId`: Parent Ctrl reference

**Ctrl Model (Game Category):**
- `id`: Unique category identifier
- `name`: Category name (Minecraft, CS2, etc.)
- `description`: Category description
- `alts`: Available configuration templates

**Relationships:**
- Ctrl: One-to-Many with Alts
- Alt: Many-to-One with Ctrl, One-to-Many with Servers

## Data Access Patterns

### Repository Pattern
Service layer abstraction for data access with Prisma ORM provides clean separation between business logic and data persistence.

**Implementation Examples:**
- `src/services/userService.ts` - User data operations
- `src/services/serverService.ts` - Server management
- `src/services/permissionService.ts` - RBAC operations

**Pattern Benefits:**
- Type-safe database operations
- Centralized query logic
- Consistent error handling
- Transaction support

### Connection Pool Pattern
Efficient database connection management through Prisma's built-in connection pooling.

**Configuration:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Connection Management:**
- Automatic connection pooling
- Connection lifecycle management
- Query optimization
- Transaction support

### Migration Pattern
Version-controlled database schema changes ensure consistent database state across environments.

**Migration Structure:**
```
prisma/migrations/
├── 20250723211845_initial_schema/
├── 20250723234130_rename_nests_to_ctrls_and_eggs_to_alts/
└── 20250727000015_update_schema/
```

**Migration Workflow:**
1. Schema changes in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev`
3. Apply to production: `npx prisma migrate deploy`
4. Update Prisma client: `npx prisma generate`

### Seed Pattern
Consistent data initialization across environments with proper dependency handling.

**Implementation**: `prisma/seed.ts`

**Seed Data:**
- Default administrative user
- Basic permission set (36 granular permissions)
- Default roles and role-permission associations
- Sample Ctrl/Alt configurations
- Development test data

## Database Foreign Key Management

### Critical Pattern: Proper Deletion Order

**CRITICAL IMPLEMENTATION**: Database cleanup must respect foreign key constraints. Dependent records must be deleted before their parent records.

**Correct Deletion Order:**
1. **Servers** (dependent on Alts, Users, Nodes)
2. **UserPermissions** (junction table)
3. **Alts** (dependent on Ctrls)
4. **Users** (referenced by Servers)
5. **Nodes** (referenced by Servers)
6. **Ctrls** (parent of Alts)

**Implementation Example:**
```typescript
// tests/setup.ts - cleanupTestDatabase()
async function cleanupTestDatabase() {
  // Delete in proper order respecting foreign keys
  await prisma.server.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.alt.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.node.deleteMany({});
  await prisma.ctrl.deleteMany({});
  await prisma.permission.deleteMany({});
}
```

### Foreign Key Relationships

**Server Dependencies:**
- `Server.ownerId` → `User.id` (CASCADE on delete)
- `Server.nodeId` → `Node.id` (SET NULL on delete)
- `Server.altId` → `Alt.id` (CASCADE on delete)

**Alt Dependencies:**
- `Alt.ctrlId` → `Ctrl.id` (CASCADE on delete)

**Permission Dependencies:**
- `UserPermission.userId` → `User.id` (CASCADE on delete)
- `UserPermission.permissionId` → `Permission.id` (CASCADE on delete)

## Security Considerations

### Data Security Patterns

1. **Password Security**
   - Bcrypt hashing with salt rounds
   - No plain text password storage
   - Secure password reset flows

2. **Session Management**
   - JWT token storage in httpOnly cookies
   - Session invalidation on logout
   - IP-based session validation

3. **Data Validation**
   - Prisma schema validation
   - Input sanitization at API layer
   - SQL injection prevention through parameterized queries

4. **Audit Logging**
   - User action tracking
   - Data modification logs
   - Security event monitoring

### Permission System Architecture

**36 Granular Permissions across 10 categories:**

1. **SERVER_***: Server management permissions
2. **USER_***: User management permissions
3. **ADMIN_***: Administrative permissions
4. **FILE_***: File system permissions
5. **CONSOLE_***: Console access permissions
6. **BACKUP_***: Backup management permissions
7. **DATABASE_***: Database access permissions
8. **NETWORK_***: Network configuration permissions
9. **MONITORING_***: System monitoring permissions
10. **PLUGIN_***: Plugin management permissions

**RBAC Implementation:**
- Role-based permission inheritance
- User-specific permission overrides
- Resource ownership validation
- Context-aware authorization

## Performance Optimization

### Query Optimization

**Indexing Strategy:**
- Primary keys (UUID) with B-tree indexes
- Foreign key indexes for join optimization
- Composite indexes for complex queries
- Unique constraints for data integrity

**Query Patterns:**
- Selective field inclusion with Prisma `select`
- Relationship preloading with `include`
- Pagination with cursor-based navigation
- Aggregation queries for metrics

### Connection Management

**Pool Configuration:**
- Connection limit based on database capacity
- Connection timeout settings
- Query timeout protection
- Connection health monitoring

**Performance Monitoring:**
- Query execution time tracking
- Slow query identification
- Connection pool utilization
- Database resource monitoring

## Development Patterns

### Test Database Management

**Environment Isolation:**
- Separate test database instance
- Automated test data cleanup
- Foreign key constraint handling
- Parallel test execution support

**Test Setup Pattern:**
```typescript
// tests/setup.ts
beforeEach(async () => {
  await cleanupTestDatabase();
  await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Environment Configuration

**Database URL Configuration:**
```bash
# Development
DATABASE_URL="postgresql://user:pass@localhost:5432/ctrl_alt_play_dev"

# Test
DATABASE_URL="postgresql://user:pass@localhost:5432/ctrl_alt_play_test"

# Production
DATABASE_URL="postgresql://user:pass@host:5432/ctrl_alt_play_prod"
```

## Deployment Considerations

### Production Database Setup

**Container Configuration:**
- PostgreSQL container with persistent volumes
- Automated backup scheduling
- Health check monitoring
- Resource limit configuration

**Migration Deployment:**
- Automated migration execution
- Rollback procedures
- Zero-downtime deployments
- Schema versioning

### Backup Strategy

**Automated Backups:**
- Daily full database backups
- Point-in-time recovery capability
- Backup verification procedures
- Disaster recovery planning

**Data Retention:**
- 30-day backup retention
- Archived long-term storage
- Compliance with data regulations
- Secure backup encryption

## File Organization

```
prisma/
├── schema.prisma          # Database schema definition
├── seed.ts               # Data seeding script
└── migrations/           # Version-controlled schema changes
    ├── 20250723211845_/  # Initial schema
    ├── 20250723234130_/  # Ctrl/Alt rename
    └── 20250727000015_/  # Schema updates
```

## Critical Implementation References

### Database Integration Points

1. **Service Layer Integration**
   - `src/services/` - Business logic with Prisma operations
   - Type-safe database operations
   - Transaction management
   - Error handling patterns

2. **Testing Integration**
   - `tests/setup.ts` - Test database management
   - `tests/globalSetup.ts` - Jest database initialization
   - `tests/globalTeardown.ts` - Jest database cleanup
   - Foreign key constraint handling

3. **Migration Management**
   - Version-controlled schema evolution
   - Production deployment procedures
   - Rollback capabilities
   - Data integrity validation

This database architecture provides a robust, scalable, and secure foundation for the Panel+Agent distributed system with comprehensive data relationships, security patterns, and performance optimization.