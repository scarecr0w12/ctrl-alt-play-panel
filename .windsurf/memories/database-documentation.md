---
title: "Database Documentation"
description: "PostgreSQL database with Prisma ORM for type-safe database operations and comprehensive foreign key relationships."
tags: ["database", "postgresql", "prisma", "orm", "rbac"]
---

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
- One-to-Many with ServerActions (action history)

### Permission Model
Granular permission definitions for RBAC implementation.

**Key Fields:**
- `id`: Unique permission identifier
- `name`: Permission name (e.g., "servers.create")
- `description`: Human-readable description
- `category`: Permission grouping (e.g., "servers", "users")
- `createdAt`: Permission creation timestamp

**Relationships:**
- Many-to-Many with Users through UserPermissions

### UserPermission Model
Junction table for User-Permission many-to-many relationships.

**Key Fields:**
- `userId`: Reference to User
- `permissionId`: Reference to Permission
- `grantedAt`: Timestamp when permission was granted
- `grantedById`: Admin user who granted the permission

### Session Model
Active user sessions for authentication management.

**Key Fields:**
- `id`: Unique session identifier
- `userId`: Associated user
- `token`: Session token
- `ipAddress`: Client IP address
- `userAgent`: Client user agent string
- `createdAt`: Session creation timestamp
- `expiresAt`: Session expiration timestamp

### ServerAction Model
Historical record of server management actions.

**Key Fields:**
- `id`: Unique action identifier
- `serverId`: Associated server
- `userId`: User who performed action
- `action`: Action type (START, STOP, RESTART, etc.)
- `details`: Additional action details
- `timestamp`: When action occurred

## Database Patterns and Implementation

### Migration Pattern
Version-controlled database schema changes with automated deployment.

**Implementation Location**: `/prisma/migrations/`

**Key Principles:**
1. **Version Control**: All schema changes tracked in Git
2. **Automated Deployment**: Migrations run automatically during deployment
3. **Rollback Capability**: Reversible schema changes when possible
4. **Environment Consistency**: Identical schema across all environments

**Migration Process:**
1. Create schema changes in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name migration_name`
3. Review generated SQL in migration file
4. Apply migration to development database
5. Update Prisma client: `npx prisma generate`

### Seed Pattern
Consistent data initialization across environments with proper dependency handling.

**Implementation Location**: `/prisma/seed.ts`

**Key Features:**
- **Environment-Specific Data**: Different seed data for development, testing, production
- **Dependency Management**: Proper ordering of related data creation
- **Idempotent Operations**: Safe to run multiple times
- **Automated Execution**: Runs during development setup

### Connection Pool Pattern
Efficient database connection management with optimal resource utilization.

**Implementation Location**: `src/services/databaseService.ts`

**Key Features:**
- **Connection Reuse**: Minimize connection creation overhead
- **Resource Limits**: Prevent database overload
- **Automatic Cleanup**: Handle connection lifecycle
- **Error Recovery**: Graceful handling of connection failures

### Backup Strategy

**Automated Backups:**
- Daily full database backups
- Point-in-time recovery capability
- Cross-region backup replication
- Automated backup validation

**Implementation Considerations:**
- Backup retention policies
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)
- Backup encryption and security
