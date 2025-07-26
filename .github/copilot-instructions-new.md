# AI Development Instructions for Ctrl-Alt-Play Panel

## 🏗️ System Architecture: Panel + Agent Model

This is a distributed game server management system with **Panel+Agent architecture** inspired by Pterodactyl/Pelican Panel:

- **Panel** (this repo): Web interface, API, user management, database (Node.js/TypeScript + React/Next.js frontend)
- **External Agents**: Separate projects that run on nodes, manage Docker containers via HTTP REST API
- **Communication**: Panel sends commands to agents via HTTP, agents respond with JSON. Real-time updates use WebSockets.
- **Key Service**: `src/services/externalAgentService.ts` is the single point of contact for all agent interactions.

```typescript
// All server operations route through ExternalAgentService
import { ExternalAgentService } from './services/externalAgentService';
const agentService = ExternalAgentService.getInstance();
await agentService.startServer(nodeUuid, serverId);
```

## 🔑 Project-Specific Patterns & Conventions

### 1. Ctrl/Alt System (NEVER "Nest/Egg")
- **Ctrl**: Server categories/templates (similar to Pterodactyl "nests")
- **Alt**: Server configuration templates (similar to Pterodactyl "eggs")
- **Critical**: Always use "Ctrl/Alt" terminology, never "Nest/Egg"
- **Models**: See `prisma/schema.prisma` for `Ctrl`, `Alt`, `AltVariable` models
- **Import/Export**: Pterodactyl egg JSON compatibility (see `CTRL_ALT_SYSTEM.md`)

### 2. 36-Permission RBAC System
- **Granular Control**: 36 permissions across 10 categories (users, servers, nodes, monitoring, files, API, workshop, audit, settings, security)
- **Implementation**: `src/middlewares/authorize.ts` - middleware checks permission strings
- **Hierarchy**: USER → MODERATOR → ADMIN → ROOT ADMIN
- **Pattern**: Always use `authorize(['permission.name'])` middleware

```typescript
// Permission check pattern
import { authorize } from '../middlewares/authorize';
router.get('/servers', authorize(['servers.view']), serverController.getAllServers);
```

### 3. API Response Format
```typescript
// Success response
{ success: true, data: result, meta?: { pagination } }
// Error response  
{ success: false, error: 'error_code', message: 'User message' }
```

### 4. Frontend Modern Architecture
- **Next.js 14** with TypeScript and Server-Side Rendering
- **Security**: JWT tokens in httpOnly cookies (NOT localStorage)
- **Glass Morphism Design**: `frontend/styles/globals.css` for custom styling
- **State Management**: React Context for auth, custom hooks for data
- **Notification System**: Advanced toast/notification system in `frontend/docs/NOTIFICATION_SYSTEM.md`

## 🚀 Development Workflow

### Full Stack Setup
```bash
# Services
docker-compose up -d postgres redis

# Database  
npm run db:push && npm run db:seed

# Backend (Terminal 1)
npm run dev                    # :3000

# Frontend (Terminal 2)  
cd frontend && npm run dev     # :3001
```

### Testing Framework
- **Backend**: Jest with Supertest, PostgreSQL integration (`npm test`)
- **Frontend**: Jest + React Testing Library (`cd frontend && npm test`)
- **Coverage**: Currently 2.54% - needs improvement
- **CI/CD**: `.github/workflows/ci.yml` - comprehensive pipeline
- **Test Files**: `tests/auth.test.ts`, `tests/api-validation.test.ts`, `tests/integration.test.ts`

### Version Management
```bash
./version.sh patch "Bug fixes"     # 1.0.0 → 1.0.1
./version.sh minor "New features"  # 1.0.0 → 1.1.0  
./version.sh major "Breaking"      # 1.0.0 → 2.0.0
```

## 🛠️ Implementation Status & Context

### ✅ Major Features Complete
- **Modern Frontend Migration**: React/Next.js with secure authentication (`docs/development/FRONTEND_MIGRATION_COMPLETE.md`)
- **Server Control API**: Start/stop/restart/kill operations via agents (`docs/development/ISSUE_27_IMPLEMENTATION.md`)
- **UI Component Library**: Comprehensive component system (PR #40)
- **File Manager**: Advanced file operations with Monaco editor (PR #43)
- **User Management**: Enterprise admin panel with bulk operations (PR #44)
- **Agent Management**: Comprehensive agent administration (PR #45)
- **Monitoring Dashboard**: Advanced system monitoring (PR #47)

### 🔄 Current Development Focus (from memory-bank/progress.md)
- Evaluating remaining PRs for completion
- Addressing CI/CD check failures on PR #42 (Configuration Templates)
- Reviewing PR #38 and PR #3 for potential completion

## 📁 Critical Files for AI Context

### Core Architecture
- `src/services/externalAgentService.ts` - Agent communication patterns
- `src/routes/*.ts` - API endpoint patterns with permissions  
- `src/middlewares/authorize.ts` - Permission checking implementation
- `prisma/schema.prisma` - Database models (Ctrl/Alt system)

### Frontend Patterns
- `frontend/components/` - React component library with glass morphism design
- `frontend/lib/api.ts` - Type-safe API client with interceptors
- `frontend/contexts/AuthContext.tsx` - Secure authentication state
- `frontend/hooks/` - Custom hooks (useAuth, useNotifications, useToast)

### Documentation & Specifications  
- `CTRL_ALT_SYSTEM.md` - Complete Ctrl/Alt system documentation
- `API_DOCUMENTATION.md` - 36-permission API specification
- `docs/development/ISSUE_27_IMPLEMENTATION.md` - Panel+Agent architecture details
- `docs/TESTING.md` - Testing framework and CI/CD pipeline
- `frontend/docs/NOTIFICATION_SYSTEM.md` - Advanced notification system

### AI Memory Bank
- `memory-bank/progress.md` - Current development status and next steps
- `memory-bank/activeContext.md` - Current working focus  
- `memory-bank/` - Context preservation across AI sessions

## 🔒 Security & Best Practices

### Authentication & Authorization
- **JWT Tokens**: Secure httpOnly cookies, automatic refresh
- **Permission Checks**: Always use `authorize()` middleware
- **Resource Ownership**: Users can only access their resources unless they have management permissions
- **Rate Limiting**: Login attempts, API operations

### Panel↔Agent Security
- **Encrypted Communication**: WSS (WebSocket Secure)
- **Token Authentication**: JWT-based agent verification
- **Command Validation**: Input sanitization and validation

### Code Quality
- **TypeScript**: Strict mode with comprehensive typing
- **ESLint**: Consistent code formatting
- **Testing**: Jest for unit tests, integration tests for APIs
- **Conventional Commits**: Structured commit messages

## 🚨 Common Gotchas & Critical Notes

1. **Terminology**: ALWAYS use "Ctrl/Alt", NEVER "Nest/Egg"
2. **Agent Communication**: All server operations MUST go through `ExternalAgentService`
3. **Frontend Security**: JWT tokens in httpOnly cookies, not localStorage
4. **API Responses**: Use consistent success/error format
5. **Permissions**: Check permissions before any resource access
6. **Testing**: Database tests require PostgreSQL service running
7. **Memory Bank**: Update context when switching focus areas

## 🎯 Development Priorities

**Current Phase**: Completing remaining PRs and addressing CI/CD issues
**Next Phase**: Enhanced Docker integration, multi-node deployment, advanced monitoring
**Long-term**: Plugin system, API rate limiting, backup & recovery

Always check `memory-bank/progress.md` for the most current development status and priorities.
