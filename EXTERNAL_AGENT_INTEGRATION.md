# External Agent Integration Architecture

This document describes the external agent communication system implemented in the Ctrl-Alt-Play Panel v1.1.0.

## Overview

The panel now communicates with external agent processes to manage game server containers remotely. This separation allows:

- **Scalability**: Agents can run on different nodes/machines
- **Isolation**: Panel and agents are separate projects
- **Reliability**: Agents can restart independently of the panel
- **Security**: Communication via authenticated HTTP/WebSocket APIs

## Architecture Components

### 1. ExternalAgentService (`src/services/externalAgentService.ts`)

Core service for communicating with external agents via HTTP REST API.

**Key Features:**
- Agent registration and management
- Command sending (start/stop/restart/kill servers)
- Health monitoring and status checks
- Server metrics collection
- Mod installation support

**API Methods:**
```typescript
// Agent management
registerAgent(agent: ExternalAgent): void
unregisterAgent(nodeUuid: string): void
getAgentStatus(nodeUuid: string): Promise<AgentStatus>

// Server control
startServer(nodeUuid: string, serverId: string): Promise<AgentResponse>
stopServer(nodeUuid: string, serverId: string, signal?: string, timeout?: number): Promise<AgentResponse>
restartServer(nodeUuid: string, serverId: string): Promise<AgentResponse>
killServer(nodeUuid: string, serverId: string): Promise<AgentResponse>

// Server information
getServerStatus(nodeUuid: string, serverId: string): Promise<AgentResponse>
getServerLogs(nodeUuid: string, serverId: string, lines?: number): Promise<AgentResponse>
getServerMetrics(nodeUuid: string, serverId: string): Promise<AgentResponse>

// Commands and mods
sendServerCommand(nodeUuid: string, serverId: string, command: string): Promise<AgentResponse>
installMod(nodeUuid: string, serverId: string, modData: any): Promise<AgentResponse>
```

### 2. AgentDiscoveryService (`src/services/agentDiscoveryService.ts`)

Automatic discovery and health monitoring of external agents.

**Key Features:**
- Auto-discovery of agents on known nodes
- Periodic health checks (every 30 seconds)
- Agent registration from database nodes
- Manual agent registration support

**Discovery Process:**
1. Reads nodes from database
2. Attempts to connect to potential agent URLs:
   - `{node.scheme}://{node.fqdn}:{node.port + 1}`
   - `{node.scheme}://{node.fqdn}:{node.port + 100}`
   - `{node.scheme}://{node.fqdn}:8080`
   - `{node.scheme}://{node.fqdn}:3001`
3. Checks for agent discovery endpoint: `GET /api/discovery`
4. Registers agents that respond with `type: "ctrl-alt-play-agent"`

### 3. Agent Management API (`src/routes/agents.ts`)

REST API endpoints for managing external agents.

**Endpoints:**
```http
GET    /api/agents                    # List all registered agents
GET    /api/agents/:nodeUuid/status   # Get agent status
POST   /api/agents/register           # Manually register agent
DELETE /api/agents/:nodeUuid          # Unregister agent
POST   /api/agents/discover           # Force agent discovery
POST   /api/agents/:nodeUuid/command  # Send command to agent
GET    /api/agents/health/all         # Health check all agents
```

**Permissions Required:**
- `agents.view` - View agent status and list
- `agents.manage` - Register, unregister, and control agents

### 4. Updated Server Control (`src/routes/servers.ts`)

Server management endpoints now use external agents.

**Updated Endpoints:**
```http
POST /api/servers/:id/start    # Start server via external agent
POST /api/servers/:id/stop     # Stop server via external agent
POST /api/servers/:id/restart  # Restart server via external agent
POST /api/servers/:id/kill     # Kill server via external agent
```

**Flow:**
1. Validate server access permissions
2. Fetch server and node information from database
3. Get external agent service instance
4. Send command to agent via HTTP
5. Update server status in database
6. Return response to client

## Agent Communication Protocol

### Agent Discovery Endpoint

External agents must implement this endpoint for auto-discovery:

```http
GET /api/discovery
```

**Response:**
```json
{
  "type": "ctrl-alt-play-agent",
  "version": "1.0.0",
  "name": "Ctrl-Alt-Play Agent",
  "nodeUuid": "node-uuid-here"
}
```

### Command API

Agents must implement this endpoint for receiving commands:

```http
POST /api/command
Authorization: Bearer {node.daemonToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "start_server|stop_server|restart_server|kill_server|get_server_status|get_server_logs|get_server_metrics|install_mod|send_server_command",
  "serverId": "server-uuid",
  "payload": {
    // Action-specific data
  }
}
```

**Response:**
```json
{
  "success": true|false,
  "data": {}, // Action-specific response data
  "error": "Error message if success=false",
  "message": "Optional status message"
}
```

### Status API

Agents should implement this endpoint for health checks:

```http
GET /api/status
Authorization: Bearer {node.daemonToken}
```

**Response:**
```json
{
  "online": true,
  "version": "1.0.0",
  "uptime": 3600,
  "serverCount": 5,
  "lastSeen": "2025-07-25T03:00:00Z"
}
```

## Integration with Existing Services

### MonitoringService

Updated to use `ExternalAgentService.getServerMetrics()` instead of embedded agent.

### SteamWorkshopService

Updated to use `ExternalAgentService.installMod()` for mod installations.

### SocketService

Continues to work as before, receiving metrics from external agents via the monitoring service.

## Environment Variables

```env
# Agent discovery settings
AGENT_DISCOVERY_INTERVAL=300000    # Discovery interval in ms (5 minutes)
AGENT_HEALTH_CHECK_INTERVAL=30000  # Health check interval in ms (30 seconds)
AGENT_CONNECTION_TIMEOUT=5000      # Connection timeout in ms (5 seconds)
```

## Database Schema

The existing schema supports external agents:

- **Node.daemonToken** - Used as API key for agent authentication
- **Node.uuid** - Used as agent identifier
- **Node.fqdn, port, scheme** - Used for agent URL construction

## Security

1. **Authentication**: Agents authenticate using the node's `daemonToken`
2. **Authorization**: Only panel can send commands to agents
3. **Validation**: All commands are validated before sending
4. **Timeout**: All agent requests have configurable timeouts
5. **Error Handling**: Failed agent communication is logged and handled gracefully

## Development & Testing

### Manual Agent Registration

```bash
# Register an agent manually
curl -X POST http://localhost:3000/api/agents/register \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nodeUuid": "node-uuid-here",
    "baseUrl": "http://agent-host:8080",
    "apiKey": "optional-custom-api-key"
  }'
```

### Force Agent Discovery

```bash
# Trigger agent discovery
curl -X POST http://localhost:3000/api/agents/discover \
  -H "Authorization: Bearer {jwt_token}"
```

### Check Agent Status

```bash
# List all agents
curl http://localhost:3000/api/agents \
  -H "Authorization: Bearer {jwt_token}"

# Health check all agents
curl http://localhost:3000/api/agents/health/all \
  -H "Authorization: Bearer {jwt_token}"
```

## Next Steps

1. **Agent Project**: Create separate ctrl-alt-play-agent project
2. **WebSocket Support**: Add WebSocket communication for real-time events
3. **Load Balancing**: Support multiple agents per node
4. **Failover**: Automatic failover between agents
5. **Metrics Aggregation**: Collect and aggregate metrics from all agents
6. **Agent Deployment**: Automated agent deployment and updates

## Migration from Embedded Agents

The panel has been successfully updated to use external agents:

- ✅ Removed embedded `AgentService`
- ✅ Created `ExternalAgentService` for HTTP communication
- ✅ Added `AgentDiscoveryService` for auto-discovery
- ✅ Updated server control endpoints
- ✅ Updated monitoring and workshop services
- ✅ Added agent management API
- ✅ Maintained backward compatibility with existing database schema

All server control operations now route through external agents, making the system more scalable and maintainable.
