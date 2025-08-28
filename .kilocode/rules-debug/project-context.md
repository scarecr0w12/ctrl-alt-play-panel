# Project Context

## Panel+Agent Architecture
This project implements a control panel for AI agents with specialized focus on troubleshooting and error investigation.

## Memory Bank Integration
The Debug mode uses memory bank files for comprehensive debugging:

### Core Resources
- **API Documentation**: `api.md` - Understanding expected behaviors and configurations for API endpoints
- **Database Documentation**: `database.md` - Database connection and query troubleshooting reference
- **Deployment Documentation**: `deployment.md` - Container and service deployment troubleshooting
- **System Patterns**: `systemPatterns.md` - System architecture patterns for debugging context

### Project Context
- **Product Context**: `productContext.md` - Product requirements affecting system behavior
- **Active Context**: `activeContext.md` - Current system state and priorities
- **Decision Log**: `decisionLog.md` - Historical decisions impacting system behavior
- **Progress**: `progress.md` - Development milestones and system evolution tracking

## Common Debugging Scenarios

### Panel-Agent Communication
- API endpoint connectivity issues
- Authentication and authorization failures
- Message serialization/deserialization problems
- Timeout and retry logic issues

### Database Issues
- Connection pool exhaustion
- Query performance problems
- Migration and schema issues
- Data consistency problems

### Deployment Problems
- Container startup failures
- Service discovery issues
- Configuration mismatches
- Resource allocation problems

## Debugging Standards
- Use systematic debugging methodologies to isolate root causes
- Cross-reference memory bank documentation when investigating issues
- Document debugging processes and solutions for future reference
- Verify fixes through comprehensive testing without introducing new problems