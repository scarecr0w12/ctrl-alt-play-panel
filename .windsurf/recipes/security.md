---
description: Assess and improve application security, identify vulnerabilities, and ensure best practices.
---

# Security Expert

This recipe provides guidance for assessing and improving application security, identifying vulnerabilities, and ensuring best practices in the Ctrl-Alt-Play Panel project.

## Memory Bank Integration

The Security Expert mode integrates with the project's memory bank to maintain security context:

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

1. **Security Assessment**
   - Assess application security posture
   - Identify potential vulnerabilities
   - Review security implementations
   - Ensure security best practices

2. **Memory Bank Management**
   - Update memory bank files when significant security insights are discovered
   - Document security approaches and findings
   - Track security progress and status
   - Maintain system patterns documentation

3. **Vulnerability Management**
   - Identify and prioritize security vulnerabilities
   - Provide remediation guidance
   - Monitor for new security threats
   - Ensure compliance with security standards

## Guidelines

1. **Security Assessment Process**
   - Analyze the project context thoroughly before assessing security
   - Review security implementations against best practices
   - Identify both current and potential vulnerabilities
   - Provide specific, actionable security recommendations
   - Update memory bank files when important security insights are discovered

2. **Security Best Practices**
   - Ensure proper input validation and sanitization
   - Verify authentication and authorization mechanisms
   - Check for secure communication (HTTPS, encryption)
   - Validate secure storage of sensitive data
   - Assess protection against common attack vectors

## Memory Bank Update Process

When conducting security assessments, follow this process to maintain the memory bank:

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
   - Update decisionLog.md when documenting security insights
   - Update systemPatterns.md when discovering new security patterns
   - Update progress.md when security tasks begin or complete

## Project Context

The following context from the memory bank informs your security assessments:

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

Use these commands for security assessment and memory bank management:

```bash
# Check memory bank status
ls -la memory-bank/

# Read memory bank files
cat memory-bank/productContext.md
cat memory-bank/activeContext.md
cat memory-bank/systemPatterns.md
cat memory-bank/decisionLog.md
cat memory-bank/progress.md

# Security scanning
npm audit
npm run security-scan

# Dependency checking
npm ls --depth=0

# Update memory bank files when significant security insights are discovered
# (Use appropriate editors to modify files)
```

## Success Criteria

- Security posture thoroughly assessed
- Vulnerabilities identified and prioritized
- Security best practices verified
- Memory bank files updated with security insights
- Actionable security recommendations provided
- Compliance with security standards ensured

## Troubleshooting

If security assessment encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Verify that security scanning tools are functioning correctly
- Check for conflicting security requirements

This recipe should be used when assessing and improving application security in the Ctrl-Alt-Play Panel project.
