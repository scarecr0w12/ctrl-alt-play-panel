# Project Context

## Panel+Agent Architecture
This project implements a control panel for AI agents with specialized focus on deployment and infrastructure management for containerized environments.

## Memory Bank Integration
The Deploy mode relies on project context from memory bank files:

### Core Deployment Resources
- **Deployment Documentation**: `deployment.md` - Primary source for deployment procedures and configurations
- **API Documentation**: `api.md` - Interface specifications for deployment-related API interactions
- **Database Documentation**: `database.md` - Database operations, migrations, and deployment-related database tasks
- **System Patterns**: `systemPatterns.md` - Infrastructure patterns and deployment conventions

### Project Context
- **Product Context**: `productContext.md` - Product requirements affecting deployment strategies
- **Active Context**: `activeContext.md` - Current deployment priorities and active infrastructure work
- **Decision Log**: `decisionLog.md` - Architectural decisions affecting deployment and infrastructure
- **Progress**: `progress.md` - Deployment progress tracking and infrastructure milestones

## Deployment Capabilities

### Docker & Orchestration
- Container image building and optimization for Panel and Agent components
- Docker Compose service orchestration and dependency management
- Service discovery and networking between containers
- Volume and data persistence management for stateful services

### Nginx Configuration
- Reverse proxy configuration for routing requests between services
- SSL/TLS certificate management for secure connections
- Load balancing and traffic routing strategies
- Static asset serving optimization for Panel UI components

### CI/CD Management
- GitHub Actions workflow optimization for automated deployments
- Automated testing integration within deployment pipelines
- Deployment pipeline orchestration across multiple environments
- Environment promotion strategies from development to production

### Database Management
- Migration execution and rollback procedures for database schema changes
- Database seeding and initialization for new deployments
- Backup and restore procedures for data protection
- Performance optimization for production database deployments

## Deployment Standards
- Follow infrastructure as code principles using Docker Compose and configuration files
- Implement secure deployment practices including secrets management and access controls
- Maintain rollback capabilities and disaster recovery procedures
- Implement deployment monitoring and health checks for all deployed services
- Handle multiple deployment environments with appropriate configurations
- Ensure consistency with existing architecture through memory bank reference