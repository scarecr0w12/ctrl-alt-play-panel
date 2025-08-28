# Project Context

## Panel+Agent Architecture
This project implements a control panel for AI agents with specialized focus on code implementation and development. The Code mode operates within the distributed Panel+Agent architecture, where the central Panel manages multiple external Agents across nodes, requiring robust code implementation that supports fault isolation, scalability, and independent service execution.

## Memory Bank Integration
The Code mode leverages comprehensive project context from memory bank files to ensure consistent, high-quality code implementation that aligns with established architectural patterns and development standards.

### Core Technical Documentation
These files provide essential technical guidance for all code implementation activities:

- **System Patterns**: [`/memory-bank/systemPatterns.md`](/memory-bank/systemPatterns.md) - Comprehensive coding patterns, architectural decisions, and implementation standards that must be followed for all code development. This is the primary reference for maintaining consistency across the codebase.

- **API Documentation**: [`/memory-bank/api.md`](/memory-bank/api.md) - Complete interface specifications, endpoint definitions, request/response formats, and API contract requirements. Essential for implementing any features that interact with REST APIs or service interfaces.

- **Database Documentation**: [`/memory-bank/database.md`](/memory-bank/database.md) - Database schema definitions, relationship mappings, foreign key constraints, and data access patterns. Critical for implementing features involving data persistence and ensuring proper database operations.

- **Testing Documentation**: [`/memory-bank/testing.md`](/memory-bank/testing.md) - Testing strategies, patterns, mocking approaches, and coverage requirements. Guides the implementation of comprehensive test suites for all new code features.

- **Deployment Documentation**: [`/memory-bank/deployment.md`](/memory-bank/deployment.md) - Deployment processes, infrastructure configuration, environment management, and CI/CD pipeline requirements that affect code implementation decisions.

### Project Context Resources
These files provide broader project understanding essential for informed development decisions:

- **Product Context**: [`/memory-bank/productContext.md`](/memory-bank/productContext.md) - Product requirements, feature specifications, user stories, and business logic that inform implementation priorities and functional requirements.

- **Active Context**: [`/memory-bank/activeContext.md`](/memory-bank/activeContext.md) - Current development priorities, active sprint work, immediate tasks, and ongoing implementation efforts that guide daily coding activities.

- **Decision Log**: [`/memory-bank/decisionLog.md`](/memory-bank/decisionLog.md) - Record of architectural and technical decisions that directly impact code implementation approaches, technology choices, and design patterns.

- **Progress Tracking**: [`/memory-bank/progress.md`](/memory-bank/progress.md) - Development milestones, feature completion status, technical debt tracking, and implementation progress that helps prioritize coding efforts.

### Architectural Resources
These files provide essential architectural context for system-level code implementation:

- **Architecture Overview**: [`/memory-bank/architecture.md`](/memory-bank/architecture.md) - High-level system architecture, component relationships, service boundaries, and integration patterns that guide code structure and implementation approach.

- **Project Brief**: [`/memory-bank/projectBrief.md`](/memory-bank/projectBrief.md) - Project scope, objectives, technical requirements, and constraints that influence implementation decisions and code architecture.

### Specialized Resources
Additional resources that support specific aspects of code development:

- **Architect Mode Context**: [`/memory-bank/architect.md`](/memory-bank/architect.md) - Architectural patterns, design decisions, and system design principles that inform code structure and implementation patterns.

## Code Implementation Standards
The Code mode enforces strict development standards to ensure high-quality, maintainable, and secure code:

### Core Implementation Requirements
- **Pattern Adherence**: Strictly follow coding patterns and conventions defined in [`/memory-bank/systemPatterns.md`](/memory-bank/systemPatterns.md)
- **API Compliance**: Implement all API interactions according to specifications in [`/memory-bank/api.md`](/memory-bank/api.md)
- **Database Integrity**: Respect all foreign key constraints and relationships documented in [`/memory-bank/database.md`](/memory-bank/database.md)
- **Testing Coverage**: Write comprehensive tests following patterns specified in [`/memory-bank/testing.md`](/memory-bank/testing.md)

### Quality Assurance Standards
- **TypeScript First**: All new code must be written in TypeScript with strict type safety
- **Security Implementation**: Apply defense-in-depth security patterns with input validation and proper authentication
- **Performance Optimization**: Implement efficient database queries, memory management, and async operation handling
- **Documentation Requirements**: Include JSDoc comments for all public functions and complex business logic

### Architecture Consistency
- **Distributed Design**: Ensure all code supports the Panel+Agent distributed architecture with proper service isolation
- **Error Handling**: Implement comprehensive async/await error handling with graceful degradation
- **Service Integration**: Follow established patterns for inter-service communication and agent management
- **Memory Bank Alignment**: Regularly reference and update memory bank files when implementing significant changes