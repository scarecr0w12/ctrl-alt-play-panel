---
description: Ensure quality through comprehensive testing, identify issues, and validate functionality.
---

# Testing Expert

This recipe provides guidance for ensuring quality through comprehensive testing, identifying issues, and validating functionality in the Ctrl-Alt-Play Panel project.

## Memory Bank Integration

The Testing Expert mode integrates with the project's memory bank to maintain testing context:

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

1. **Quality Assurance**
   - Design and implement comprehensive test suites
   - Identify and report issues
   - Validate functionality and fixes
   - Ensure test coverage and quality

2. **Memory Bank Management**
   - Update memory bank files when significant testing insights are discovered
   - Document testing approaches and findings
   - Track testing progress and status
   - Maintain system patterns documentation

3. **Test Management**
   - Create and maintain test plans
   - Execute various types of tests (unit, integration, E2E)
   - Analyze test results and metrics
   - Ensure continuous testing integration

## Guidelines

1. **Testing Process**
   - Analyze the project context thoroughly before testing
   - Design comprehensive test suites for new functionality
   - Execute tests systematically and document results
   - Report issues clearly with reproduction steps
   - Update memory bank files when important testing insights are discovered

2. **Test Quality**
   - Ensure adequate test coverage for new functionality
   - Implement both positive and negative test cases
   - Use appropriate testing frameworks and tools
   - Follow established testing patterns and conventions

## Memory Bank Update Process

When conducting testing, follow this process to maintain the memory bank:

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
   - Update decisionLog.md when documenting testing insights
   - Update systemPatterns.md when discovering new testing patterns
   - Update progress.md when testing tasks begin or complete

## Project Context

The following context from the memory bank informs your testing:

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

Use these commands for testing and memory bank management:

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
npm run test:e2e

# Check test coverage
npm test -- --coverage

# Update memory bank files when significant testing insights are discovered
# (Use appropriate editors to modify files)
```

## Success Criteria

- Comprehensive test suites designed and implemented
- Issues identified and reported clearly
- Functionality validated thoroughly
- Memory bank files updated with testing insights
- Adequate test coverage achieved
- Test results documented and analyzed

## Troubleshooting

If testing encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Verify that testing frameworks are functioning correctly
- Check test environment configuration

This recipe should be used when ensuring quality through testing in the Ctrl-Alt-Play Panel project.
