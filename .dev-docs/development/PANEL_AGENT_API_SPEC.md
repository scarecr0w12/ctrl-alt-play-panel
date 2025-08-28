# Panel ↔ Agent Communication API Specification

## Overview

This document defines the communication protocol between the Ctrl-Alt-Play Panel and Agents, inspired by Pelican Panel/Wings architecture. The system uses a hybrid approach:

- **REST API**: Initial registration, authentication, and configuration
- **WebSocket**: Real-time commands, status updates, and log streaming

## Architecture Pattern

```text
┌─────────────────┐    WebSocket/HTTPS    ┌─────────────────┐
│  Panel (Main)   │ ←----------------→   │  Agent (Node)   │
│                 │                      │                 │
│ - Web UI        │                      │ - Docker Mgmt   │
│ - User Auth     │                      │ - Container     │
│ - Server Config │                      │   Lifecycle     │
│ - Database      │                      │ - Log Streaming │
└─────────────────┘                      └─────────────────┘
```

## Agent Registration & Authentication

### 1. Agent Registration (REST)
```http
POST /api/agents/register
Authorization: Bearer <panel_admin_token>
Content-Type: application/json

{
  "name": "node-01",
  "hostname": "192.168.1.100",
  "port": 8080,
  "capabilities": {
    "maxMemory": "16GB",
    "maxCpuCores": 8,
    "dockerVersion": "24.0.0",
    "supportedArchitectures": ["amd64", "arm64"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "agent": {
    "id": "agent_uuid",
    "token": "jwt_token_for_agent",
    "websocketUrl": "wss://panel.domain.com/ws/agents",
    "refreshToken": "refresh_token"
  }
}
```

### 2. WebSocket Connection Establishment
```javascript
// Agent connects to Panel
const ws = new WebSocket('wss://panel.domain.com/ws/agents', {
  headers: {
    'Authorization': `Bearer ${agentToken}`,
    'X-Agent-ID': agentId
  }
});
```

## Message Protocol

### Base Message Structure
```typescript
interface BaseMessage {
  id: string;          // Unique message ID for request/response matching
  type: MessageType;   // Command, response, or event
  timestamp: string;   // ISO 8601 timestamp
  agentId?: string;    // Target agent (Panel→Agent) or source (Agent→Panel)
  serverId?: string;   // Target server ID (if applicable)
}

enum MessageType {
  // Commands (Panel → Agent)
  COMMAND = 'command',
  
  // Responses (Agent → Panel)
  RESPONSE = 'response',
  
  // Events (Agent → Panel)
  EVENT = 'event',
  
  // Heartbeat
  PING = 'ping',
  PONG = 'pong'
}
```

## Server Management Commands

### 1. Server Creation
```json
{
  "id": "msg_001",
  "type": "command",
  "timestamp": "2025-01-23T10:00:00Z",
  "agentId": "agent_uuid",
  "action": "create_server",
  "payload": {
    "serverId": "server_123",
    "eggConfig": {
      "name": "minecraft-java",
      "image": "ghcr.io/pterodactyl/yolks:java_17",
      "ports": {
        "25565": 25565
      },
      "environment": {
        "SERVER_JARFILE": "server.jar",
        "MINECRAFT_VERSION": "1.20.4"
      },
      "limits": {
        "memory": "2048m",
        "cpu": "2",
        "disk": "5g"
      },
      "startup": "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}"
    }
  }
}
```

### 2. Server Control Commands
```json
{
  "id": "msg_002", 
  "type": "command",
  "timestamp": "2025-01-23T10:01:00Z",
  "agentId": "agent_uuid",
  "serverId": "server_123",
  "action": "start_server"
}

{
  "id": "msg_003",
  "type": "command", 
  "timestamp": "2025-01-23T10:02:00Z",
  "agentId": "agent_uuid",
  "serverId": "server_123",
  "action": "stop_server",
  "payload": {
    "signal": "SIGTERM",
    "timeout": 30
  }
}

{
  "id": "msg_004",
  "type": "command",
  "timestamp": "2025-01-23T10:03:00Z", 
  "agentId": "agent_uuid",
  "serverId": "server_123",
  "action": "restart_server"
}
```

### 3. Server Status Query
```json
{
  "id": "msg_005",
  "type": "command",
  "timestamp": "2025-01-23T10:04:00Z",
  "agentId": "agent_uuid", 
  "serverId": "server_123",
  "action": "get_status"
}
```

## Agent Responses

### 1. Command Acknowledgment
```json
{
  "id": "msg_002",
  "type": "response",
  "timestamp": "2025-01-23T10:01:01Z",
  "success": true,
  "message": "Server start command received",
  "data": {
    "serverId": "server_123",
    "status": "starting"
  }
}
```

### 2. Error Response
```json
{
  "id": "msg_003",
  "type": "response", 
  "timestamp": "2025-01-23T10:02:01Z",
  "success": false,
  "error": {
    "code": "CONTAINER_NOT_FOUND",
    "message": "Docker container for server_123 not found"
  }
}
```

### 3. Status Update
```json
{
  "id": "msg_005",
  "type": "response",
  "timestamp": "2025-01-23T10:04:01Z",
  "success": true,
  "data": {
    "serverId": "server_123",
    "status": "running",
    "containerId": "docker_container_id",
    "uptime": 3600,
    "resources": {
      "cpu": 45.2,
      "memory": {
        "used": "1024m",
        "available": "2048m"
      },
      "network": {
        "tx": 1024000,
        "rx": 2048000
      }
    },
    "players": {
      "online": 5,
      "max": 20,
      "list": ["player1", "player2", "player3", "player4", "player5"]
    }
  }
}
```

## Real-time Events

### 1. Server Status Change
```json
{
  "type": "event",
  "timestamp": "2025-01-23T10:05:00Z",
  "event": "server_status_changed",
  "data": {
    "serverId": "server_123", 
    "previousStatus": "starting",
    "currentStatus": "running",
    "pid": 1234
  }
}
```

### 2. Log Stream
```json
{
  "type": "event",
  "timestamp": "2025-01-23T10:05:30Z",
  "event": "server_log",
  "data": {
    "serverId": "server_123",
    "logLevel": "INFO",
    "message": "[10:05:30] [Server thread/INFO]: player1 joined the game"
  }
}
```

### 3. Resource Usage Update
```json
{
  "type": "event", 
  "timestamp": "2025-01-23T10:06:00Z",
  "event": "resource_update",
  "data": {
    "serverId": "server_123",
    "cpu": 52.1,
    "memory": {
      "used": "1200m", 
      "percentage": 58.5
    },
    "disk": {
      "used": "2.1g",
      "percentage": 42.0
    }
  }
}
```

## File Management Commands

### 1. File List
```json
{
  "id": "msg_006",
  "type": "command",
  "timestamp": "2025-01-23T10:07:00Z",
  "agentId": "agent_uuid",
  "serverId": "server_123", 
  "action": "list_files",
  "payload": {
    "path": "/server"
  }
}
```

### 2. File Content
```json
{
  "id": "msg_007",
  "type": "command",
  "timestamp": "2025-01-23T10:08:00Z",
  "agentId": "agent_uuid",
  "serverId": "server_123",
  "action": "get_file",
  "payload": {
    "path": "/server/server.properties"
  }
}
```

## Heartbeat & Connection Management

### 1. Heartbeat (Panel → Agent)
```json
{
  "id": "heartbeat_001",
  "type": "ping",
  "timestamp": "2025-01-23T10:09:00Z"
}
```

### 2. Heartbeat Response (Agent → Panel) 
```json
{
  "id": "heartbeat_001",
  "type": "pong", 
  "timestamp": "2025-01-23T10:09:01Z",
  "data": {
    "agentStatus": "healthy",
    "activeServers": 3,
    "systemLoad": {
      "cpu": 25.5,
      "memory": 65.2,
      "disk": 40.1
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AGENT_OFFLINE` | Target agent is not connected |
| `SERVER_NOT_FOUND` | Server ID does not exist on agent |
| `CONTAINER_NOT_FOUND` | Docker container not found |
| `INSUFFICIENT_RESOURCES` | Not enough CPU/memory/disk |
| `PERMISSION_DENIED` | Agent lacks Docker permissions |
| `DOCKER_ERROR` | Docker daemon error |
| `CONFIG_INVALID` | Egg configuration is invalid |
| `PORT_CONFLICT` | Requested port already in use |
| `AUTH_FAILED` | JWT token invalid or expired |

## Security Considerations

1. **JWT Token Rotation**: Agents should refresh tokens every 24 hours
2. **TLS/WSS Only**: All communication must be encrypted
3. **Rate Limiting**: Prevent command flooding from compromised panels
4. **Input Validation**: Sanitize all command payloads
5. **Agent Isolation**: Agents should run with minimal Docker permissions

## Implementation Priority

### Phase 1: Basic Communication
- [ ] WebSocket connection establishment
- [ ] JWT authentication
- [ ] Basic server start/stop/restart commands
- [ ] Status reporting

### Phase 2: Advanced Features  
- [ ] Real-time log streaming
- [ ] File management
- [ ] Resource monitoring
- [ ] Multi-server management

### Phase 3: Enterprise Features
- [ ] Agent health monitoring
- [ ] Automatic failover
- [ ] Load balancing
- [ ] Metrics collection

This specification provides the foundation for implementing Issue #27 (Server Start/Stop/Restart Controls) with a scalable, secure Panel+Agent architecture.
