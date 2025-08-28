---
description: Implement features and write high-quality code aligned with the project's established patterns.
---

# Code Expert

This recipe provides guidance for implementing features and writing high-quality code aligned with the project's established patterns in the Ctrl-Alt-Play Panel project.

## Memory Bank Integration

The Code Expert mode integrates with the project's memory bank to maintain context and consistency:

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

1. **Code Implementation**
   - Write clean, maintainable TypeScript code
   - Follow established project patterns and conventions
   - Implement features according to specifications
   - Ensure code quality and consistency

2. **Memory Bank Management**
   - Update memory bank files when significant changes occur
   - Document implementation patterns with concrete examples
   - Track project progress and context
   - Maintain system patterns documentation

3. **Quality Assurance**
   - Follow mandatory coding standards
   - Implement proper error handling
   - Write comprehensive tests
   - Ensure security best practices

## Guidelines

1. **Mandatory Coding Standards**
   - ALL NEW CODE must be TypeScript with strict mode, no JavaScript files allowed
   - NO 'any' types permitted, explicit typing required
   - Follow file naming conventions (Backend camelCase, Frontend PascalCase components, kebab-case pages)
   - Implement proper error handling with try-catch blocks and custom error classes
   - Use async/await over Promises
   - Follow Prisma ORM patterns for database operations
   - Write comprehensive tests with Jest
   - Implement security measures (input validation, SQL injection prevention, etc.)

2. **Implementation Process**
   - Analyze project context before implementing features
   - Follow established patterns and conventions
   - Document significant implementation decisions
   - Update memory bank files when important changes occur
   - Write comprehensive tests for new functionality

## Memory Bank Update Process

When implementing features, follow this process to maintain the memory bank:

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
   - Update decisionLog.md when making implementation decisions
   - Update systemPatterns.md when implementing new patterns
   - Update progress.md when tasks begin or complete

## Project Context

The following context from the memory bank informs your implementation:

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

Use these commands for code implementation and memory bank management:

```bash
# Check memory bank status
ls -la memory-bank/

# Read memory bank files
cat memory-bank/productContext.md
cat memory-bank/activeContext.md
cat memory-bank/systemPatterns.md
cat memory-bank/decisionLog.md
cat memory-bank/progress.md

# Run tests
npm test
npm run test:integration

# Check code quality
npm run lint
npm run type-check

# Update memory bank files when significant changes occur
# (Use appropriate editors to modify files)
```

## Success Criteria

- Code implemented according to specifications
- Memory bank files updated when important changes occur
- Consistent with established patterns and decisions
- Follows mandatory coding standards
- Comprehensive tests written
- Security best practices implemented

## Troubleshooting

If implementation encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Check for TypeScript compilation errors
- Verify test coverage and passing tests

This recipe should be used when implementing features and writing code within the Ctrl-Alt-Play Panel project.
