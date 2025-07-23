# Ctrl-Alt-Play

🎮 **A comprehensive web-based game server management system** built with Node.js and TypeScript. Ctrl-Alt-Play provides a centralized interface for managing game servers across multiple remote nodes through external agents.

*Developed by [scarecr0w12](https://github.com/scarecr0w12)*

## 🏗️ Architecture Overview

Ctrl-Alt-Play is the **Panel Server** component of a distributed game server management system. It provides the web interface, user management, and coordination layer that communicates with external agents.

### 🎛️ **Panel Server** (This Project)

- **Purpose**: Web interface, user management, configuration storage, monitoring dashboard
- **Deployment**: Docker container OR direct server installation
- **Components**:
  - REST API and WebSocket server
  - PostgreSQL database for persistent storage
  - Redis for caching and session management
  - Web interface for administrators and users
- **Responsibilities**:
  - User authentication and authorization
  - Server configuration management
  - Monitoring data aggregation and visualization
  - Agent coordination and command dispatch

### 🤖 **Agent System** (Separate Project)

- **Purpose**: Remote node workers that manage Docker containers on game server hosts
- **Deployment**: Standalone binary installed directly on game server hosts
- **Communication**: Connects to this panel via WebSocket
- **Repository**: *[Link to separate agent project]*

### Communication Flow

```text
[Web Browser] ←→ [Ctrl-Alt-Play Panel] ←→ [External Agents] ←→ [Docker Containers]
     HTTPS            WebSocket             Docker API         (Game Servers)
```

## Features

- 🎮 **Multi-Game Support**: Configuration templates for various game servers (Minecraft, Rust, CS2, etc.)
- 👥 **User Management**: Role-based access control with admin, moderator, and user roles
- 📊 **Real-time Monitoring**: Live server statistics and monitoring dashboard
- 🏗️ **Agent Coordination**: WebSocket-based communication with external agents
- 📁 **File Management**: Coordinate file operations through connected agents
- 🔒 **Security**: JWT authentication, rate limiting, and security headers
- 📱 **Modern UI**: Responsive web interface (frontend to be implemented)
- 🔄 **Real-time Updates**: WebSocket connections for live data
- 📦 **Configuration Management**: Server templates and deployment configurations
- 🗄️ **Database Management**: PostgreSQL with Prisma ORM
- 🌐 **Multi-Node Support**: Coordinate multiple remote nodes through agents

## Core Components

1. **REST API** (`src/routes/`): HTTP endpoints for web interface
2. **WebSocket Server** (`src/services/SocketService.ts`): Real-time communication with agents
3. **Database Layer** (`prisma/`): PostgreSQL with Prisma ORM
4. **Authentication** (`src/middlewares/auth.ts`): JWT-based auth system
5. **Agent Communication** (`src/services/AgentService.ts`): Agent coordination layer

## Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Docker (optional, for containerized deployment)

### Quick Start

1. **Clone and Install**

   ```bash
   git clone https://github.com/scarecr0w12/ctrl-alt-play.git
   cd ctrl-alt-play
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**

   ```bash
   npm run db:generate
   npm run migrate
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

### Docker Deployment

```bash
# Start all services (panel, database, redis)
docker-compose up -d

# View logs
docker-compose logs -f ctrl-alt-play
```

### Access the Panel

- **Panel URL**: <http://localhost:3000>
- **Agent WebSocket**: `ws://localhost:8080` (for agent connections)
- **Default Admin**:
  - Email: admin@example.com
  - Password: admin123

## Agent Integration

Ctrl-Alt-Play is designed to work with external agents. Agents should:

1. **Connect via WebSocket** to `ws://panel-url:8080`
2. **Authenticate** using the `AGENT_SECRET` from environment
3. **Register** with a unique node identifier
4. **Listen** for commands from the panel
5. **Report** server status and metrics back to panel

### Agent Communication Protocol

```typescript
// Agent Registration
{
  type: 'agent_register',
  data: {
    nodeId: 'node-1',
    secret: 'agent-secret',
    capabilities: ['docker', 'monitoring']
  }
}

// Command from Panel to Agent
{
  type: 'server_start',
  data: {
    serverId: 'server-123',
    config: { /* server configuration */ }
  }
}

// Status Update from Agent to Panel
{
  type: 'server_status',
  data: {
    serverId: 'server-123',
    status: 'running',
    metrics: { /* resource usage */ }
  }
}
```

## Development

### Project Structure

```text
ctrl-alt-play/
├── src/                    # Main panel application
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Express middlewares
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── prisma/                # Database schema and migrations
├── docker/                # Docker configurations
└── tests/                 # Test suites
```

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run test suite
npm run migrate      # Run database migrations
npm run db:generate  # Generate Prisma client
```

### API Endpoints

- **Authentication**: `/api/auth/*` - Login, register, token refresh
- **Users**: `/api/users/*` - User management (admin only)
- **Servers**: `/api/servers/*` - Server configuration and management
- **Nodes**: `/api/nodes/*` - Agent node management
- **Files**: `/api/files/*` - File operation coordination

## Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ctrlaltplay

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Agent Communication
AGENT_SECRET=your-agent-secret
AGENT_PORT=8080
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## About the Developer

**Ctrl-Alt-Play** is developed and maintained by [scarecr0w12](https://github.com/scarecr0w12).

## Support

- **Repository**: [https://github.com/scarecr0w12/ctrl-alt-play](https://github.com/scarecr0w12/ctrl-alt-play)
- **Issues**: [GitHub Issues](https://github.com/scarecr0w12/ctrl-alt-play/issues)
- **Discussions**: [GitHub Discussions](https://github.com/scarecr0w12/ctrl-alt-play/discussions)
