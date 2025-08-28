---
description: Deploy and manage the application infrastructure with proper validation and monitoring.
---

# Deploy Expert

This recipe provides guidance for deploying and managing the Ctrl-Alt-Play Panel application infrastructure with proper validation and monitoring.

## Memory Bank Integration

The Deploy Expert mode integrates with the project's memory bank to maintain deployment context and history:

1. **Memory Bank Initialization**
   - Check if the memory-bank/ directory exists
   - If it exists, read all memory bank files
   - If it doesn't exist, inform the user about creating one

2. **Memory Bank Files**
   - productContext.md - Project overview and requirements
   - activeContext.md - Current focus and open questions
   - systemPatterns.md - Established patterns and conventions
   - decisionLog.md - Previous decisions and rationale
   - progress.md - Task tracking and status

## Core Responsibilities

1. **Deployment Management**
   - Deploy application using appropriate methods (Docker, CLI wizard, web installer)
   - Validate deployment environments
   - Monitor deployment health and performance
   - Troubleshoot deployment issues

2. **Memory Bank Management**
   - Update memory bank files when significant deployment changes occur
   - Document deployment approaches and solutions
   - Track deployment progress and status
   - Maintain system patterns documentation

3. **Infrastructure Management**
   - Manage containerized services (PostgreSQL, Redis)
   - Configure environment variables and secrets
   - Set up networking and service discovery
   - Implement monitoring and alerting

## Guidelines

1. **Deployment Process**
   - Analyze the project context thoroughly before deployment
   - Validate environment configuration
   - Use appropriate deployment method for the target environment
   - Monitor deployment health and performance
   - Document deployment steps and findings
   - Update memory bank files when important deployment insights are discovered

2. **Environment Validation**
   - Check system requirements (Node.js, Docker, etc.)
   - Verify environment variables and configuration
   - Test database connectivity
   - Validate service dependencies

## Memory Bank Update Process

When managing deployments, follow this process to maintain the memory bank:

1. **Check Memory Bank Status**
   - Verify that the memory-bank/ directory exists
   - If it doesn't exist, inform the user

2. **Read Relevant Memory Bank Files**
   - Read productContext.md for project overview
   - Read activeContext.md for current focus
   - Read systemPatterns.md for established patterns
   - Read decisionLog.md for previous decisions
   - Read progress.md for current task status

3. **Update Memory Bank Files**
   - Update decisionLog.md when documenting deployment insights
   - Update systemPatterns.md when discovering new deployment patterns
   - Update progress.md when deployment tasks begin or complete

## Project Context

The following context from the memory bank informs your deployment:

### Product Context
Refer to `memories/product-context.md` for overall product vision and requirements.

### Active Context
Refer to `memories/active-context.md` for current development status and priorities.

### Decision Log
Refer to `memories/decision-log.md` for architectural and technical decisions.

### System Patterns
Refer to `memories/architectural-patterns-conventions.md` for design principles and patterns.

### Progress
Refer to `memories/progress-tracking.md` for development milestones and current progress.

## Tools and Commands

Use these commands for deployment and memory bank management:

```bash
# Check memory bank status
ls -la memory-bank/

# Read memory bank files
cat memory-bank/productContext.md
cat memory-bank/activeContext.md
cat memory-bank/systemPatterns.md
cat memory-bank/decisionLog.md
cat memory-bank/progress.md

# Deployment commands
./quick-deploy.sh
./easy-setup.sh
./easy-ssl-setup.sh
./docker-launcher.sh

# Docker management
docker-compose up -d
docker-compose ps
docker-compose logs

# Environment validation
node --version
docker --version
npm ls --depth=0

# Health checks
curl http://localhost:3000/api/health

# Update memory bank files when significant deployment insights are discovered
# (Use appropriate editors to modify files)
```

## Success Criteria

- Application deployed successfully
- All services running and healthy
- Environment properly configured
- Memory bank files updated with deployment insights
- Deployment validated and monitored
- Troubleshooting completed if needed

## Troubleshooting

If deployment encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Check deployment logs for error information
- Verify environment configuration
- Test service connectivity

This recipe should be used when deploying and managing the Ctrl-Alt-Play Panel application.
