# Project Context

## Panel+Agent Architecture
This project implements a control panel for AI agents with specialized focus on system design, technical planning, and strategic problem-solving. The Orchestrator mode coordinates within the distributed Panel+Agent architecture, where the central Panel manages multiple external Agents across nodes, requiring comprehensive architectural oversight that ensures fault isolation, scalability, and independent service execution.

## Memory Bank Integration
The Orchestrator mode leverages comprehensive project context from memory bank files to coordinate multi-mode work, ensure documentation updates, and maintain alignment with established patterns, business requirements, and technical constraints.

### Architectural Design Resources
These files provide essential architectural guidance for all system design and planning activities:

- **Architecture Overview**: [`/memory-bank/architecture.md`](/memory-bank/architecture.md) - High-level system architecture, component relationships, service boundaries, and integration patterns. Primary reference for understanding the complete system design and architectural decisions.

- **System Patterns**: [`/memory-bank/systemPatterns.md`](/memory-bank/systemPatterns.md) - Comprehensive architectural patterns, design decisions, and implementation standards that guide system structure. Essential for maintaining consistency and following established architectural principles.

- **Decision Log**: [`/memory-bank/decisionLog.md`](/memory-bank/decisionLog.md) - Complete record of architectural and technical decisions with rationale, impact analysis, and implementation considerations. Critical for understanding the evolution of system design and avoiding architectural debt.

- **Project Brief**: [`/memory-bank/projectBrief.md`](/memory-bank/projectBrief.md) - Project scope, objectives, technical requirements, and constraints that define the architectural boundaries and influence system design decisions.

- **Architect Mode Context**: [`/memory-bank/architect.md`](/memory-bank/architect.md) - Architectural patterns, design methodologies, and system design principles specific to architectural planning and decision-making processes.

### Technical Context Resources
These files provide technical context essential for informed architectural decisions:

- **API Documentation**: [`/memory-bank/api.md`](/memory-bank/api.md) - Complete interface specifications, endpoint definitions, and service contracts that define system boundaries and integration patterns for architectural planning.

- **Database Documentation**: [`/memory-bank/database.md`](/memory-bank/database.md) - Database schema definitions, relationship mappings, and data architecture patterns that influence system design and data flow architecture.

- **Deployment Documentation**: [`/memory-bank/deployment.md`](/memory-bank/deployment.md) - Infrastructure architecture, deployment patterns, and environment configurations that affect system design and architectural scalability requirements.

- **Testing Documentation**: [`/memory-bank/testing.md`](/memory-bank/testing.md) - Testing architecture strategies and quality assurance patterns that influence system design for testability and maintainability.

### Project Context Resources
These files provide broader project understanding essential for architectural alignment:

- **Product Context**: [`/memory-bank/productContext.md`](/memory-bank/productContext.md) - Product requirements, feature specifications, and business logic that drive architectural decisions and system design priorities.

- **Active Context**: [`/memory-bank/activeContext.md`](/memory-bank/activeContext.md) - Current development priorities, active architectural work, and immediate design tasks that guide architectural focus and decision-making.

- **Progress Tracking**: [`/memory-bank/progress.md`](/memory-bank/progress.md) - Architectural milestones, design completion status, and system evolution tracking that helps prioritize architectural improvements and technical debt resolution.

## Architectural Design Standards
The Orchestrator mode enforces comprehensive design standards to ensure scalable, maintainable, and secure system architecture:

### Core Architectural Requirements
- **Pattern Adherence**: Strictly follow architectural patterns and design principles defined in [`/memory-bank/systemPatterns.md`](/memory-bank/systemPatterns.md)
- **Decision Documentation**: Document all architectural decisions in [`/memory-bank/decisionLog.md`](/memory-bank/decisionLog.md) with rationale and impact analysis
- **System Integration**: Ensure all designs align with the overall architecture documented in [`/memory-bank/architecture.md`](/memory-bank/architecture.md)
- **Technical Alignment**: Validate architectural decisions against technical constraints in [`/memory-bank/projectBrief.md`](/memory-bank/projectBrief.md)

### Design Quality Standards
- **Distributed Architecture**: Design systems that support the Panel+Agent distributed model with proper service isolation and fault tolerance
- **Scalability Planning**: Architect solutions that can scale horizontally and vertically within the established infrastructure patterns
- **Security Architecture**: Integrate security considerations at every architectural layer with defense-in-depth strategies
- **Performance Design**: Architect systems with performance optimization and resource efficiency as core design principles

### Architectural Consistency
- **System Boundaries**: Maintain clear service boundaries and integration patterns consistent with the Panel+Agent architecture
- **Data Architecture**: Design data flows and persistence patterns that respect database relationships and constraints
- **API Design**: Architect service interfaces that follow established API patterns and integration standards
- **Memory Bank Alignment**: Regularly reference and update memory bank files when making significant architectural decisions or changes

## Decision Logging Requirements
All architectural decisions must be comprehensively documented in [`/memory-bank/decisionLog.md`](/memory-bank/decisionLog.md) with:

### Required Decision Documentation
- **Context**: Business and technical context that drove the architectural decision
- **Rationale**: Detailed reasoning behind the chosen architectural approach
- **Alternatives**: Other architectural options considered and reasons for rejection
- **Impact Analysis**: Effects on system components, performance, and future development
- **Implementation Considerations**: Technical requirements and constraints for implementation
- **Alignment Verification**: Confirmation that decisions align with established system patterns and project objectives

### Decision Review Process
- **Stakeholder Input**: Gather input from relevant stakeholders and technical teams
- **Pattern Compliance**: Verify decisions comply with established architectural patterns
- **Risk Assessment**: Evaluate architectural risks and mitigation strategies
- **Future Impact**: Consider long-term implications and system evolution
- **Documentation Updates**: Update relevant memory bank files when decisions affect system architecture

## Strategic Planning Integration
The Orchestrator mode integrates strategic planning and coordination with technical architecture to ensure system designs support business objectives and technical requirements while maintaining alignment with the Panel+Agent distributed architecture principles.