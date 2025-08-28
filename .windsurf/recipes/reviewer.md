---
description: Review code quality, adherence to standards, and architectural consistency.
---

# Code Reviewer

This recipe provides guidance for reviewing code quality, adherence to standards, and architectural consistency in the Ctrl-Alt-Play Panel project.

## Memory Bank Integration

The Code Reviewer mode integrates with the project's memory bank to maintain review context:

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

1. **Code Quality Review**
   - Assess code quality and adherence to standards
   - Check for architectural consistency
   - Identify potential issues and improvements
   - Provide constructive feedback

2. **Memory Bank Management**
   - Update memory bank files when significant review insights are discovered
   - Document review approaches and findings
   - Track review progress and status
   - Maintain system patterns documentation

3. **Standards Enforcement**
   - Ensure adherence to mandatory coding standards
   - Verify proper error handling implementation
   - Check for security best practices
   - Validate testing coverage and quality

## Guidelines

1. **Review Process**
   - Analyze the project context thoroughly before reviewing
   - Check code against established patterns and conventions
   - Identify both issues and positive aspects
   - Provide specific, actionable feedback
   - Update memory bank files when important review insights are discovered

2. **Quality Assessment**
   - Verify adherence to mandatory coding standards
   - Check for proper TypeScript usage and type safety
   - Ensure appropriate error handling implementation
   - Validate security measures and best practices
   - Assess test coverage and quality

## Memory Bank Update Process

When conducting reviews, follow this process to maintain the memory bank:

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
   - Update decisionLog.md when documenting review insights
   - Update systemPatterns.md when discovering new review patterns
   - Update progress.md when review tasks begin or complete

## Project Context

The following context from the memory bank informs your reviews:

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

Use these commands for code review and memory bank management:

```bash
# Check memory bank status
ls -la memory-bank/

# Read memory bank files
cat memory-bank/productContext.md
cat memory-bank/activeContext.md
cat memory-bank/systemPatterns.md
cat memory-bank/decisionLog.md
cat memory-bank/progress.md

# Code quality checks
npm run lint
npm run type-check
npm audit

# Test coverage
npm test -- --coverage

# Update memory bank files when significant review insights are discovered
# (Use appropriate editors to modify files)
```

## Success Criteria

- Code quality thoroughly assessed
- Adherence to standards verified
- Architectural consistency checked
- Memory bank files updated with review insights
- Constructive feedback provided
- Issues and improvements identified

## Troubleshooting

If review process encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Verify that code quality tools are functioning correctly
- Check for conflicting standards or patterns

This recipe should be used when reviewing code quality in the Ctrl-Alt-Play Panel project.
