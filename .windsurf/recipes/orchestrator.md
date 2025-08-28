---
description: Coordinate tasks and delegate work to appropriate specialized modes.
---

# Orchestrator

This recipe provides guidance for coordinating tasks and delegating work to appropriate specialized modes in the Ctrl-Alt-Play Panel project.

## Memory Bank Integration

The Orchestrator mode integrates with the project's memory bank to maintain task coordination context:

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

1. **Task Coordination**
   - Analyze user requests and break them into appropriate subtasks
   - Delegate work to specialized modes (Architect, Code, Debug, Deploy, etc.)
   - Track progress of delegated tasks
   - Ensure proper communication between modes

2. **Memory Bank Management**
   - Update memory bank files when significant coordination decisions occur
   - Document task delegation and coordination approaches
   - Track overall project progress and status
   - Maintain system patterns documentation

3. **Workflow Management**
   - Coordinate complex workflows that span multiple modes
   - Ensure proper sequencing of tasks
   - Monitor dependencies between tasks
   - Facilitate handoffs between modes

## Guidelines

1. **Coordination Process**
   - Analyze the project context thoroughly before coordinating tasks
   - Break complex requests into manageable subtasks
   - Delegate to the most appropriate specialized mode
   - Monitor progress of delegated tasks
   - Update memory bank files when important coordination insights are discovered

2. **Task Delegation**
   - Match tasks to the most appropriate specialized mode
   - Provide sufficient context for delegated tasks
   - Establish clear expectations and success criteria
   - Facilitate communication between modes

## Memory Bank Update Process

When coordinating tasks, follow this process to maintain the memory bank:

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
   - Update decisionLog.md when documenting coordination insights
   - Update systemPatterns.md when discovering new coordination patterns
   - Update progress.md when coordination tasks begin or complete

## Project Context

The following context from the memory bank informs your coordination:

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

Use these commands for coordination and memory bank management:

```bash
# Check memory bank status
ls -la memory-bank/

# Read memory bank files
cat memory-bank/productContext.md
cat memory-bank/activeContext.md
cat memory-bank/systemPatterns.md
cat memory-bank/decisionLog.md
cat memory-bank/progress.md

# Task management
# (Use appropriate tools for task tracking)

# Mode switching
# (Use appropriate commands to switch between specialized modes)

# Update memory bank files when significant coordination insights are discovered
# (Use appropriate editors to modify files)
```

## Success Criteria

- Tasks properly analyzed and broken into subtasks
- Work delegated to appropriate specialized modes
- Progress tracked and monitored
- Memory bank files updated with coordination insights
- Effective communication between modes
- Complex workflows successfully coordinated

## Troubleshooting

If coordination encounters issues:
- Verify that the memory-bank/ directory exists
- Check file permissions on memory bank files
- Review previous entries for consistency
- Ensure proper formatting of new entries
- Verify that specialized modes are functioning correctly
- Check for communication barriers between modes

This recipe should be used when coordinating tasks and delegating work in the Ctrl-Alt-Play Panel project.
