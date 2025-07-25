# Ctrl-Alt-Play Panel: AI Development Instructions

## 🏗️ System Architecture

This is a **Panel+Agent distributed architecture** for game server management:

- **Panel** (this repo): Web interface, API, user management, database (Node.js/TypeScript + Next.js frontend)
- **External Agents**: Separate projects that run on nodes, manage Docker containers via HTTP REST API
- **Communication**: Panel sends commands to agents via HTTP, agents respond with JSON
- **Database**: PostgreSQL with Prisma ORM, includes Ctrl/Alt system for server configurations

### Key Architectural Pattern: External Agent Communication

```typescript
// All server operations route through ExternalAgentService
const agentService = ExternalAgentService.getInstance();
await agentService.startServer(nodeUuid, serverId);
await agentService.sendCommand(nodeUuid, {action: 'restart_server', serverId, payload: {}});
```

Agents are discovered via `AgentDiscoveryService` and managed via `/api/agents` endpoints.

## 🤖 AI Integration & Memory Bank System

This project has sophisticated AI agent integration with context preservation:

### Memory Bank Architecture
```
memory-bank/
├── brief.md          # Project overview and goals
├── product.md        # Product context and requirements  
├── context.md        # Current working focus
├── architecture.md   # System design decisions
├── progress.md       # Done/Doing/Next tracking
└── tech.md          # Technology stack details
```

### AI Chat Modes (`.github/*.chatmode.md`)
- **Architect Mode**: System design, architectural decisions, memory bank management
- **Code Mode**: Implementation tasks, debugging, code review
- **Ask Mode**: Questions, clarification, knowledge queries
- **Debug Mode**: Troubleshooting, error analysis, issue resolution

### Memory Bank Operations
```typescript
// Always update context when switching focus
await memory_bank_update_context({
  context: "Implementing external agent console integration"
});

// Log architectural decisions
await memory_bank_log_decision({
  decision: "Use HTTP REST API for agent communication",
  rationale: "Better security and scalability than embedded services"
});

// Track progress consistently
await memory_bank_update_progress({
  done: ["External agent HTTP API implementation"],
  doing: ["Console integration with agents"],
  next: ["File management via agents", "Real-time WebSocket replacement"]
});
```

## 🚀 Development Workflow

### Multi-Project Setup
```bash
# Backend (this repo)
npm run dev                    # Start backend on :3000
npm run type-check            # TypeScript validation
npm run test                  # Jest tests with PostgreSQL

# Frontend (separate Next.js app)
cd frontend && npm run dev    # Start frontend on :3001 with API proxy

# Full stack development
docker-compose up -d          # PostgreSQL + Redis + Both apps
```

### Database Operations
```bash
npx prisma migrate dev        # Apply schema changes
npx prisma db seed           # Seed with default permissions/users
npx prisma studio            # Visual database browser
```

## 🔑 Project-Specific Patterns

### Ctrl/Alt System (NOT Nest/Egg)
- **Ctrl**: Server categories/templates (like Pterodactyl eggs)
- **Alt**: Individual server configurations within a ctrl
- Models: `Ctrl`, `Alt`, `Server` - always use these terms, never "nest/egg"

### Permission System
```typescript
// Always check permissions via middleware
// 36 granular permissions across 10 categories (users, servers, agents, etc.)
app.use('/api/servers', authorize(['servers.view', 'servers.manage']));
```

### API Response Pattern
```typescript
// Consistent response format across all endpoints
res.json({ 
  success: true, 
  data: result,
  meta: { pagination, counts } 
});
// Error format
res.status(400).json({ 
  success: false, 
  error: 'validation_failed',
  message: 'User-friendly message' 
});
```

### External Agent Integration
```typescript
// File operations via agents (not local filesystem)
const result = await externalAgentService.listFiles(nodeUuid, serverId, '/path');
// Server control via agents
await externalAgentService.startServer(nodeUuid, serverId);
```

## 🧪 Testing Strategy

### Frontend Testing (Jest + React Testing Library)
```bash
cd frontend && npm test       # 5/8 tests passing (label accessibility issues remain)
```
Current test setup: Jest with Next.js integration, module mapping for `@/` imports.

### Backend Testing
```bash
npm test                      # Unit tests with Docker PostgreSQL
npm run test:integration     # Integration tests with real database
```

## 🐳 Docker & Deployment

### Development
```bash
docker-compose up -d          # Local dev with hot reload
```

### Production
- Uses multi-stage Dockerfile with production target
- Nginx reverse proxy via `nginx/nginx.conf`
- Health checks on `/health` endpoint
- Ports: 3000 (API), 3001 (Frontend), 8080 (Agent WebSocket)

## 🔐 Security Context

- JWT tokens in httpOnly cookies (not localStorage)
- Path traversal protection in file operations
- Rate limiting on all endpoints  
- Agent authentication via node `daemonToken`
- 36-permission RBAC system (USER → MODERATOR → ADMIN)

## 🚨 Common Gotchas

1. **Model Names**: Always use Ctrl/Alt, never Nest/Egg
2. **Agent Communication**: All server operations must go through `ExternalAgentService`
3. **Frontend API**: Next.js proxies `/api/*` to backend `:3000`
4. **File Paths**: Use absolute paths, validate for traversal attacks
5. **Testing**: Frontend tests need React Testing Library setup, 3 tests failing on accessibility
6. **Database**: Run migrations before seeding, use `prisma db reset` for clean slate
7. **Memory Bank**: Always update context and progress when switching tasks
8. **AI Chat Modes**: Use appropriate mode for task type (architect/code/ask/debug)

## 📁 Key Files for AI Context

### Core Architecture
- `src/services/externalAgentService.ts` - Agent communication patterns
- `src/routes/*.ts` - API endpoint patterns with permissions
- `prisma/schema.prisma` - Database schema (Ctrl/Alt models)
- `src/middlewares/authorize.ts` - Permission checking patterns

### Frontend Patterns  
- `frontend/components/` - React component patterns with glass morphism design
- `frontend/hooks/` - Custom React hooks (useAgents, useAuth, etc.)
- `frontend/lib/` - API client and utility functions

### AI Integration
- `memory-bank/*.md` - Context preservation files for AI agents
- `.github/*.chatmode.md` - AI chat mode configurations
- `.copilot/instructions.md` - Legacy GitHub Copilot instructions (312 lines)
- `.kilocode/rules/memory-bank.md` - Memory bank system specification

### DevOps & Testing
- `.github/workflows/ci.yml` - CI/CD pipeline for testing
- `docker-compose*.yml` - Development and production Docker configurations
- `tests/` - Jest test suites with PostgreSQL integration

## 🎯 Current Development Focus

**External Agent Integration** - The primary development focus is completing the transition to a fully distributed Panel+Agent architecture:

1. **Console Integration**: Real-time console access through external agents
2. **File Management**: Remote file operations via agent system  
3. **WebSocket Enhancement**: Improved real-time communication protocols
4. **Configuration Deployment**: Streamlined config management through agents

**Recent Milestones**: Backend external agent communication complete, agent discovery service operational, PR #32 under review for frontend integration.

## 🔄 AI Agent Workflow

When working on this project:

1. **Check Context**: Review `memory-bank/context.md` for current focus
2. **Choose Mode**: Select appropriate chat mode (architect/code/ask/debug)
3. **Update Progress**: Log completed tasks and next steps
4. **Preserve Context**: Update memory bank files when changing focus areas
5. **Follow Patterns**: Use established architectural patterns for consistency
