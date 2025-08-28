# Project Context

## Panel+Agent Architecture
This project implements a control panel for AI agents with specialized focus on code review and quality assurance.

## Memory Bank Integration
The Reviewer mode relies on project context from memory bank files:

### Core Review Resources
- **System Patterns**: `systemPatterns.md` - Coding patterns and conventions for pattern compliance verification
- **API Documentation**: `api.md` - Interface specifications for API consistency review
- **Database Documentation**: `database.md` - Data structures and database interaction patterns
- **Testing Documentation**: `testing.md` - Testing patterns and coverage requirements for quality assessment

### Project Context
- **Product Context**: `productContext.md` - Product requirements affecting code quality standards
- **Active Context**: `activeContext.md` - Current development priorities and quality focus areas
- **Decision Log**: `decisionLog.md` - Architectural decisions affecting code review criteria 
- **Progress**: `progress.md` - Development progress and quality milestones

## Review Areas

### Code Structure & Design
- Architecture adherence and design patterns evaluation
- Code organization and modularity assessment
- Interface design and API consistency verification
- Separation of concerns and SOLID principles compliance

### Code Quality
- Readability and maintainability analysis
- Performance implications assessment
- Error handling and edge cases evaluation
- Resource management and cleanup verification

### Standards & Conventions
- Coding style and formatting compliance
- Naming conventions and clarity assessment
- Comment and documentation quality review
- Consistent patterns with existing codebase verification

### Security & Safety
- Input validation and sanitization assessment
- Authentication and authorization review
- Data privacy and protection evaluation
- Potential vulnerabilities and exploits identification

## Review Standards
- Verify all code follows patterns and conventions defined in `systemPatterns.md`
- Provide actionable, constructive feedback that helps improve code quality
- Enforce software engineering best practices including error handling, testing, and performance optimization
- Ensure consistency with existing codebase patterns and architectural decisions
- Use reviews as opportunities to share knowledge and educate team members
- Review not just functionality but also maintainability, scalability, and long-term implications
- Ensure consistency with existing architecture through memory bank reference