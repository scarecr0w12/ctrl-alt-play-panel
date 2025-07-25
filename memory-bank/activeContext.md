# Active Context

## Current Focus: Issue #27 - Server Start/Stop/Restart Controls via Panel+Agent Architecture

**Architecture Shift:** Based on research, implementing Panel+Agent distributed system (like Pelican Panel/Wings) instead of direct Docker API integration.

**Current Status:**
- ✅ Research completed on Panel+Agent architecture patterns
- ✅ API specification document created (`PANEL_AGENT_API_SPEC.md`)
- ✅ Memory bank updated with architectural decisions
- � **NEXT**: Implement WebSocket communication layer in Panel
- 📋 **PLANNED**: Update Agent service to handle Panel commands

## Current Goals

- Implementing advanced permissions and security system with granular RBAC, permission-based access control, and enhanced security features

## Active Development Tasks

- **IMMEDIATE**: WebSocket service implementation in Panel
- **NEXT**: Agent command handler updates
- **THEN**: Server control endpoint modifications
- **FINALLY**: Frontend integration with new Panel→Agent system

## Architecture Decision

**CRITICAL**: System is Panel+Agent distributed architecture, not monolithic Docker integration. Panel manages users/config, Agents handle Docker containers on remote nodes.