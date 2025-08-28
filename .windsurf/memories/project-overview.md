---
title: "Ctrl-Alt-Play Panel Project Overview"
description: "Comprehensive overview of the Ctrl-Alt-Play Panel project architecture, patterns, and key components."
tags: ["project-overview", "architecture", "panel-agent"]
---

# Ctrl-Alt-Play Panel Project Overview

## Panel+Agent Distributed Architecture

The Ctrl-Alt-Play Panel implements a control panel for AI agents with specialized chatmodes for different technical domains. It follows a distributed architecture pattern where:

- **Distributed Management**: Central Panel managing multiple external Agents across nodes
- **Independent Execution**: Agents run as separate processes with fault isolation
- **HTTP REST Communication**: RESTful API between Panel and Agents for standard operations
- **WebSocket Real-time**: Live console streaming and real-time status updates
- **Auto-discovery**: Agents automatically register with Panel on startup

## Key Architectural Components

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

## Core Design Patterns

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
