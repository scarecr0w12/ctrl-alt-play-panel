# Proposed Chatmode Updates for Panel+Agent Architecture

## 1. Overview

This document outlines proposed updates to the chatmodes to align them with the new, comprehensive memory bank documentation. The goal is to enhance the capabilities of each mode by making them more knowledgeable about the Panel+Agent architecture and the detailed project information now available.

## 2. General Recommendations

The following recommendations apply to all chatmodes:

*   **Enhanced Specificity**: Update the core instructions of each mode to be more specific about the implications of the Panel+Agent architecture.
*   **Deeper Tool Integration**: Explicitly instruct each mode to use the new memory bank files (`api.md`, `database.md`, `deployment.md`, `testing.md`, `systemPatterns.md`) as primary sources of information for their respective tasks.
*   **Proactive Suggestions**: Encourage each mode to be more proactive in its suggestions. For example, the `architect` mode could suggest architectural improvements based on `systemPatterns.md`.

## 3. Mode-Specific Recommendations

### 3.1. Architect Mode

*   **Current State**: Well-aligned with the new architecture.
*   **Proposed Updates**:
    *   **Enhanced Design Focus**: Update the description to emphasize its role in designing and refining the Panel+Agent communication protocol.
    *   **Memory Bank Management**: Add a specific instruction to ensure that any architectural decisions are immediately logged in `decisionLog.md` with clear rationale.
    *   **Tool Integration**: Explicitly mention the use of `systemPatterns.md` and `api.md` when designing new components.

### 3.2. Code Mode

*   **Current State**: Generally aware of the architecture, but could be more specific.
*   **Proposed Updates**:
    *   **Pattern Adherence**: Instruct the mode to strictly follow the coding patterns and conventions defined in `systemPatterns.md`.
    *   **API and Database Knowledge**: Explicitly mention the use of `api.md` and `database.md` when implementing new features.
    *   **Testing Integration**: Add a requirement to write tests for all new code, following the patterns in `testing.md`.

### 3.3. Debug Mode

*   **Current State**: Aware of the distributed architecture, but lacks specific troubleshooting guidance.
*   **Proposed Updates**:
    *   **Troubleshooting Scenarios**: Provide specific examples of common Panel-to-Agent communication issues, database connection problems, and deployment failures.
    *   **Log Analysis**: Instruct the mode to analyze logs from both the Panel and the mock agent to diagnose issues.
    *   **Documentation Cross-Reference**: Add a specific instruction to cross-reference `api.md`, `database.md`, and `deployment.md` when debugging.

### 3.4. Ask Mode

*   **Current State**: Good at answering general questions, but can be improved with more specific knowledge.
*   **Proposed Updates**:
    *   **Knowledge Base Integration**: Instruct the mode to use the new memory bank files as its primary knowledge base.
    *   **Specific Question Handling**: Provide examples of how to answer specific questions, such as "What are the accepted parameters for the `/api/servers/:id/power` endpoint?" by referencing `api.md`.
    *   **Proactive Information**: Encourage the mode to provide additional, relevant information from the memory bank when answering questions.

## 4. New Mode Proposal: `deploy`

*   **Rationale**: The current chatmodes do not have a dedicated focus on deployment and infrastructure management. With the detailed `deployment.md` now available, a specialized `deploy` mode would be highly beneficial.
*   **Proposed Capabilities**:
    *   Manage Docker containers and orchestration with Docker Compose.
    *   Configure and troubleshoot the Nginx reverse proxy.
    *   Manage the CI/CD pipeline in GitHub Actions.
    *   Handle database migrations and seeding.
    *   Automate deployment tasks using scripts.

## 5. Implementation Plan

This plan will be executed by the `code` mode.

1.  **Update `.github/chatmodes/architect.chatmode.md`**: Implement the proposed updates for the architect mode.
2.  **Update `.github/chatmodes/code.chatmode.md`**: Implement the proposed updates for the code mode.
3.  **Update `.github/chatmodes/debug.chatmode.md`**: Implement the proposed updates for the debug mode.
4.  **Update `.github/chatmodes/ask.chatmode.md`**: Implement the proposed updates for the ask mode.
5.  **Create `.github/chatmodes/deploy.chatmode.md`**: Create the new deploy mode with the specified capabilities.

This plan provides a clear path to aligning the chatmodes with the new, detailed project knowledge, which will significantly improve their effectiveness and ensure they can fully leverage the new Panel+Agent architecture.