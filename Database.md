# Database Documentation

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
- Many-to-One with Node
- Many-to-One with Alt (configuration template)

### Node Model
Infrastructure nodes that host game servers.

**Key Fields:**
- `id`: Unique node identifier (UUID)
- `name`: Node display name
- `hostname`: Node hostname or IP address
- `port`: Agent communication port
- `token`: Authentication token for agent communication
- `status`: Node status (ONLINE, OFFLINE, MAINTENANCE)
- `createdAt`: Node creation timestamp
- `updatedAt`: Last status update

**Relationships:**
- One-to-Many with Servers

### Alt Model
Configuration templates for game servers (Ctrl/Alt system).

**Key Fields:**
- `id`: Unique template identifier (UUID)
- `name`: Template display name
- `description`: Template description
- `type`: Template type (GAME, VOICE, DATABASE, etc.)
- `ctrlConfig`: Control configuration (installation, update, uninstall)
- `altConfig`: Runtime configuration (start, stop, status)
- `createdAt`: Template creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships:**
- One-to-Many with Servers

## Multi-Database Support

The system supports multiple database backends through a unified abstraction layer:

1. **PostgreSQL** (recommended for production)
2. **MySQL** / **MariaDB** (great compatibility)
3. **MongoDB** (document-based, flexible schema)
4. **SQLite** (perfect for development and small deployments)

### Database Configuration Service

The DatabaseConfigService provides a unified interface for all supported databases:

```typescript
interface DatabaseConfigService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}
```

## Migration System

The system uses Prisma Migrate for database schema management:

1. **Schema Definition**: `/prisma/schema.prisma`
2. **Migration Files**: `/prisma/migrations/`
3. **Migration Commands**:
   - `npx prisma migrate dev` - Create and apply migrations during development
   - `npx prisma migrate deploy` - Apply migrations in production
   - `npx prisma migrate reset` - Reset database to initial state

### Migration Workflow

1. Modify schema in `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name`
3. Prisma generates migration files in `/prisma/migrations/`
4. Review generated migration files
5. Commit migration files to version control

## Seeding System

The system includes a data seeding mechanism for initial setup:

1. **Seed Script**: `/prisma/seed.ts`
2. **Seed Commands**:
   - `npx prisma db seed` - Run seed script
   - `npm run seed` - Alternative seed command

### Seed Data

The seed script populates:
- Default user roles and permissions
- Sample server templates
- Initial configuration settings
- System default values

## Backup Strategy

### Automated Backups

- Daily full database backups
- Point-in-time recovery capability
- Backup retention policies
- Automated backup validation

### Backup Commands

```bash
# Create a backup
./backup.sh

# Restore from backup
./restore.sh /path/to/backup

# List backups
./backup.sh --list
```

### Backup Configuration

Backup settings can be configured in the environment:

```
# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH=/backups
```

## Performance Optimization

### Connection Pooling

The system uses connection pooling for efficient database access:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});
```

### Query Optimization

Best practices for database queries:
1. Use indexed fields in WHERE clauses
2. Limit result sets with pagination
3. Use eager loading for related data
4. Avoid N+1 query problems
5. Use database transactions for consistency

### Monitoring

Database performance monitoring includes:
- Query execution time tracking
- Connection pool utilization
- Database size monitoring
- Slow query detection