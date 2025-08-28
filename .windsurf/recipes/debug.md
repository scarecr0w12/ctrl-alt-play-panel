---
description: Identify, analyze, and fix issues by leveraging project history and context.
---

# Debug Expert

This recipe provides guidance for identifying, analyzing, and fixing issues in the Ctrl-Alt-Play Panel project while maintaining the project's integrity.

## Memory Bank Integration

The Debug Expert mode integrates with the project's memory bank to leverage project history and context:

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

1. **Issue Identification**
   - Analyze error messages and stack traces
   - Identify root causes of issues
   - Reproduce reported bugs
   - Document findings

2. **Memory Bank Management**
   - Update memory bank files when significant debugging insights are discovered
   - Document debugging approaches and solutions
   - Track project progress and context
   - Maintain system patterns documentation

3. **Problem Resolution**
   - Provide actionable solutions to fix issues
   - Suggest preventive measures
   - Ensure fixes align with project architecture
   - Verify that fixes don't introduce new issues

## Guidelines

1. **Debugging Process**
   - Analyze the project context thoroughly before debugging
   - Reproduce issues in a controlled environment
   - Use systematic approaches to isolate problems
   - Document debugging steps and findings
   - Update memory bank files when important insights are discovered

2. **Issue Analysis**
   - Examine error messages and stack traces carefully
   - Check recent code changes that might have introduced issues
   - Review related memory bank entries for context
   - Consider both immediate symptoms and underlying causes

## Memory Bank Update Process

When debugging issues, follow this process to maintain the memory bank:

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
   - Update decisionLog.md when documenting debugging insights
   - Update systemPatterns.md when discovering new debugging patterns
   - Update progress.md when debugging tasks begin or complete

## Project Context

The following context from the memory bank informs your debugging:

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

Use these commands for debugging and memory bank management:

```bash
# Check memory bank status
ls -la memory-bank/

# Read memory bank files
cat memory-bank/productContext.md
cat memory-bank/activeContext.md
cat memory-bank/systemPatterns.md
cat memory-bank/decisionLog.md
cat memory-bank/progress.md

# Run tests to verify fixes
npm test
npm run test:integration

# Check logs for error information
npm run logs

# Update memory bank files when significant debugging insights are discovered
# (Use appropriate editors to modify files)
```

## Success Criteria

- Issues properly identified and analyzed
- Root causes determined
- Effective solutions provided
- Memory bank files updated with debugging insights
- Fixes verified and validated
- Preventive measures suggested

## Troubleshooting

If debugging encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Check for environmental factors that might affect debugging
- Verify that test environments are properly configured

This recipe should be used when debugging issues within the Ctrl-Alt-Play Panel project.
