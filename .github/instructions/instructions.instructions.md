````instructions
# GitHub Copilot Development Instructions

# Ctrl-Alt-Play Panel v1.6.0 - Game Server Management System (Production Ready)

## 🎯 Project Overview

**CURRENT STATE:** Phase 3 Multi-Database Support COMPLETE - System is production-ready with flexible database deployment options.

This is a comprehensive web-based game server management panel featuring a Panel+Agent distributed architecture, built with Node.js/TypeScript backend and Next.js/React frontend, featuring modern UI and multi-database support for diverse deployment environments.

**KEY ACHIEVEMENT:** Multi-database flexibility with support for PostgreSQL, MySQL, MariaDB, MongoDB, and SQLite, plus enhanced deployment options.

## 🏗️ Architecture & Stack (v1.6.0)

- **Backend**: Node.js 18+ with TypeScript, Express.js framework
- **Database**: Multi-database support (PostgreSQL, MySQL, MariaDB, MongoDB, SQLite) with Prisma ORM
- **Cache**: Redis for session management and caching (optional)
- **Frontend**: Next.js/React with TypeScript, TailwindCSS
- **Styling**: TailwindCSS with modern responsive design
- **External Agents**: HTTP REST API communication with separate agent projects
- **Testing**: Jest with comprehensive integration tests (21 tests, 13 passing core functionality)
- **Deployment**: Docker with dynamic compose generation, multiple setup methods

## 📁 Project Structure

```
ctrl-alt-play-panel/
├── src/
│   ├── index.ts              # Main Express server with WebSocket
│   ├── routes/
│   │   ├── files.ts          # File management API (CRUD operations)
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── monitoring.ts     # System monitoring API
│   │   └── integration/      # Plugin and marketplace APIs
│   ├── middleware/
│   ├── services/
│   │   ├── DatabaseConfigService.ts  # Multi-database abstraction (350+ lines)
│   │   ├── PluginMarketplaceService.ts
│   │   └── PluginAnalyticsService.ts
│   ├── models/
│   └── utils/
├── frontend/                 # Next.js React frontend
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── public/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/
├── scripts/
│   ├── quick-deploy.sh       # One-command deployment
│   ├── setup-frontend.sh     # Frontend setup
│   └── setup.sh             # Development setup
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
├── Dockerfile                # Application container
└── docs/                     # Public documentation
```

## 🚀 Development Context & History

### Phase 3 Completion (v1.6.0)

**Multi-Database Support Implementation:**
- **DatabaseConfigService**: Complete abstraction layer supporting 5 database types
- **Enhanced Setup Scripts**: CLI wizard, web installer, quick-deploy with database selection
- **Dynamic Docker Generation**: Automatic compose file generation based on database choice
- **Integration Testing**: Comprehensive test suite validating all setup methods

### Key Features Implemented

1. **Multi-Database Configuration** (`src/services/DatabaseConfigService.ts`):
   - PostgreSQL, MySQL, MariaDB, MongoDB, SQLite support
   - Connection string generation and validation
   - Dynamic Prisma configuration
   - Health checks and connection testing

2. **Enhanced Setup Options**:
   - **CLI Wizard**: Interactive setup with database selection (`./quick-deploy.sh --wizard`)
   - **Web Installer**: Browser-based setup interface (`./quick-deploy.sh --web`)
   - **Quick Deploy**: One-command automated setup (`./quick-deploy.sh`)

3. **Plugin Marketplace System**:
   - Complete publishing workflow with validation
   - Advanced analytics and monitoring
   - Plugin lifecycle management
   - Marketplace integration with real-time tracking

4. **Production Infrastructure**:
   - Dynamic port management with conflict resolution
   - Cross-platform Docker builds (linux/amd64, linux/arm64)
   - Comprehensive security implementation
   - Environment-agnostic deployment

### Development Evolution

1. **Phase 1**: Infrastructure modernization and deployment agnostic setup
2. **Phase 2**: Plugin marketplace and analytics implementation  
3. **Phase 3**: Multi-database support and enhanced deployment options
4. **Future**: Enterprise features, multi-tenancy, advanced monitoring

## 🔧 Development Commands

### Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Development with hot reload
npm run dev              # Backend with hot-reload
npm run dev:frontend     # Frontend development server

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test                 # Unit tests
npm run test:integration # Integration tests

# Database operations
npm run db:push          # Push database schema
npm run db:seed          # Seed database with sample data

# Linting
npm run lint
npm run type-check
```

### Setup Methods

```bash
# Quick one-command setup
./quick-deploy.sh

# Interactive CLI wizard
./quick-deploy.sh --wizard

# Web-based installer
./quick-deploy.sh --web
# Opens http://localhost:8080 in browser

# Development setup
./scripts/setup.sh
```

### Docker Development

```bash
# Development environment
docker-compose up -d

# Production environment  
docker-compose -f docker-compose.prod.yml up -d

# Build application
docker build -t ctrl-alt-play-panel .
```

## 🗄️ Database Configuration

### Supported Databases

| Database | Version | Connection Example | Best For |
|----------|---------|-------------------|----------|
| **PostgreSQL** | 12+ | `postgresql://user:pass@localhost:5432/dbname` | Production (recommended) |
| **MySQL** | 8.0+ | `mysql://user:pass@localhost:3306/dbname` | High compatibility |
| **MariaDB** | 10.3+ | `mysql://user:pass@localhost:3306/dbname` | MySQL alternative |
| **MongoDB** | 4.4+ | `mongodb://user:pass@localhost:27017/dbname` | Document-based |
| **SQLite** | 3+ | `file:./data/database.db` | Development/small deployments |

### Database Configuration

```typescript
// DatabaseConfigService usage
const dbConfig = new DatabaseConfigService();
const connectionString = await dbConfig.generateConnectionString(databaseType, config);
const isValid = await dbConfig.validateConnection(connectionString);
```

## 🎨 UI/UX Design Principles

### Modern Design Language

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Component-Based**: Reusable React components
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized loading and rendering

### Component Patterns

```tsx
// React component pattern
interface ComponentProps {
  data: DataType;
  onAction: (id: string) => void;
}

const Component: React.FC<ComponentProps> = ({ data, onAction }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Component content */}
    </div>
  );
};
```

## 🔐 Security Considerations

### Implemented Security Measures

1. **Multi-Database Security**: Connection validation and sanitization across all database types
2. **Authentication**: JWT-based auth with refresh tokens and RBAC
3. **API Security**: Rate limiting, input validation, CORS configuration
4. **File Security**: Path traversal protection, file size limits
5. **Container Security**: Trivy vulnerability scanning, minimal attack surface

### Production Security Checklist

- [ ] Configure database-specific security settings
- [ ] Set strong JWT_SECRET and database credentials
- [ ] Configure firewall rules for chosen database
- [ ] Set up SSL certificates for HTTPS
- [ ] Enable database connection encryption
- [ ] Configure monitoring and audit logging

## 🔄 WebSocket Integration

### Real-time Features

- **Console Output**: Live terminal streams
- **System Monitoring**: Real-time resource usage
- **Plugin Analytics**: Live usage statistics
- **Agent Communication**: External game server agents

### WebSocket Events

```javascript
// Client-side WebSocket handling
const ws = new WebSocket('ws://localhost:8080');
ws.on('console-output', (data) => {
  terminal.write(data.output);
});
ws.on('server-stats', (data) => {
  updateDashboard(data);
});
```

## 📊 Testing & Quality Assurance

### Testing Framework

- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: API endpoints and database operations (21 tests)
- **Database Tests**: Multi-database configuration validation
- **Setup Tests**: All deployment methods validated

### Test Categories

```bash
# Core functionality tests (13 passing)
npm run test:core

# Database configuration tests
npm run test:database

# Integration tests
npm run test:integration

# All tests
npm test
```

## 🔧 Troubleshooting Guide

### Common Development Issues

1. **Database Connection**: Verify connection string format for chosen database type
2. **Port Conflicts**: Check ports 3000, 8080, and database-specific ports
3. **Setup Script Issues**: Ensure proper permissions and dependencies
4. **TypeScript Errors**: Run `npm run type-check` for compilation issues

### Database-Specific Issues

1. **PostgreSQL**: Check if service is running and credentials are correct
2. **MySQL/MariaDB**: Verify authentication method and user permissions
3. **MongoDB**: Ensure connection string includes proper authentication
4. **SQLite**: Check file permissions and directory access

## 📝 Code Style & Patterns

### TypeScript Patterns

```typescript
// Service class pattern
export class DatabaseConfigService {
  async generateConnectionString(
    dbType: DatabaseType,
    config: DatabaseConfig
  ): Promise<string> {
    try {
      // Implementation
      return connectionString;
    } catch (error) {
      throw new DatabaseConfigError(`Failed to generate connection: ${error.message}`);
    }
  }
}

// API response pattern
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

### Error Handling

- Use custom error classes for different error types
- Always provide meaningful error messages
- Log errors with appropriate levels and context
- Return consistent API response format

## 🎯 Future Development Directions

### Planned Features (Post Phase 3)

1. **Enterprise Features**:
   - Multi-tenancy implementation
   - Advanced monitoring and observability
   - Performance optimizations

2. **Advanced Plugin Features**:
   - Dependency management system
   - Automatic update notifications
   - Plugin verification and security

3. **Scalability Enhancements**:
   - Load balancing and clustering
   - Advanced backup and recovery
   - Monitoring dashboards

### Architecture Considerations

- Database clustering for high availability
- Microservices architecture for complex deployments
- CDN integration for global distribution
- Advanced caching strategies

## 🔄 Development Workflow

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: description"
git push origin feature/new-feature

# Database migration
npm run db:push
git add prisma/migrations/
git commit -m "feat: add database migration"
```

### Testing Strategy

- Test all database configurations before deployment
- Validate setup scripts across different environments
- Integration tests for critical user flows
- Performance tests for multi-database scenarios

## 📞 Support & Documentation

### Key Documentation Files

- `README.md`: Project overview with multi-database support
- `INSTALLATION.md`: Multi-database installation guide
- `CHANGELOG.md`: Version history with v1.6.0 features
- `docs/TESTING.md`: Testing framework documentation
- `docs/PLUGIN_DEVELOPMENT.md`: Plugin development guide

### Development Notes

- Server runs on port 3000 (configurable with dynamic port management)
- WebSocket server on port 8080
- Database configuration handled by DatabaseConfigService
- All database operations use Prisma abstraction
- Setup scripts detect and configure optimal database settings

## 🎯 Copilot Assistance Areas

When working on this project, GitHub Copilot should focus on:

1. **Multi-Database Operations**: Database-agnostic queries and configuration
2. **API Development**: RESTful endpoints with proper error handling
3. **React Components**: Modern, accessible frontend components
4. **Database Migrations**: Prisma schema and migration management
5. **Docker Configuration**: Multi-database container orchestration
6. **Testing**: Comprehensive test coverage for all database types
7. **Security**: Input validation and database-specific security measures

Remember: This is a production-ready game server management panel with multi-database flexibility as a core feature. Always consider database compatibility, validate configurations, and implement proper error handling for all database operations.

````

## 🚀 Development Context & History

### Initial Requirements

User requested: "Continue: 'Continue to iterate?'" leading to implementation of a Pelican Panel-inspired game server management system with:

- File management system with drag-drop upload
- Real-time console with WebSocket communication
- Professional dashboard with monitoring
- Monaco editor integration
- Modern glass morphism UI design

### Key Features Implemented

1. **File Management System** (`src/routes/files.ts`):
   - Complete REST API: GET /list, GET /read, POST /write, POST /mkdir, DELETE /delete, POST /rename, GET /download
   - Security: Path traversal protection, file size limits, access control
   - Frontend: Monaco editor, drag-drop upload, context menus, file browser

2. **Real-time Console** (`public/console.html`):
   - WebSocket integration for live terminal output
   - xterm.js terminal emulator
   - Server power controls (start/stop/restart)
   - Resource monitoring with Chart.js

3. **Professional Dashboard** (`public/index.html`):
   - Live server statistics and monitoring
   - Glass morphism design with TailwindCSS
   - Navigation to file manager and console
   - Real-time updates via WebSocket

4. **Backend Server** (`src/index.ts`):
   - Express.js with TypeScript
   - WebSocket server for real-time communication
   - Security middleware (helmet, cors, rate limiting)
   - File upload handling with multer

### Development Evolution

1. **Phase 1**: Basic project setup and structure
2. **Phase 2**: File management API implementation
3. **Phase 3**: Frontend interfaces with Monaco editor
4. **Phase 4**: WebSocket integration for real-time features
5. **Phase 5**: Professional UI with glass morphism
6. **Phase 6**: Production deployment configuration
7. **Phase 7**: VPS deployment scripts and guides

## 🔧 Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Linting
npm run lint
npm run lint:fix
```

### Docker Development

```bash
# Build and run locally
npm run docker:build
npm run docker:run

# Full development environment
docker compose up -d

# Production environment
docker compose -f docker-compose.prod.yml up -d
```

### VPS Deployment

```bash
# Configure VPS details in deploy-to-vps.sh first
./deploy-to-vps.sh setup    # Initial deployment
./deploy-to-vps.sh update   # Update deployment
./deploy-to-vps.sh logs     # View logs
./deploy-to-vps.sh restart  # Restart services
```

## 🎨 UI/UX Design Principles

### Design Language

- **Glass Morphism**: Frosted glass effects with backdrop-blur
- **Modern Color Scheme**: Dark theme with accent colors
- **Responsive Design**: Mobile-first approach
- **Professional Feel**: Clean, minimal, functional

### Component Patterns

```css
/* Glass morphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

/* Gradient buttons */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🔐 Security Considerations

### Implemented Security Measures

1. **Path Traversal Protection**: All file paths validated and sanitized
2. **File Size Limits**: Configurable upload size restrictions
3. **Rate Limiting**: API endpoint protection
4. **CORS Configuration**: Controlled cross-origin access
5. **Helmet Integration**: Security headers
6. **Input Validation**: Express-validator for all inputs

### Production Security Checklist

- [ ] Change all default passwords in .env
- [ ] Set strong JWT_SECRET and AGENT_SECRET
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificates
- [ ] Enable automatic security updates
- [ ] Configure monitoring and logging

## 🔄 WebSocket Integration

### Real-time Features

- **Console Output**: Live terminal streams
- **File Changes**: Real-time file system updates
- **Server Monitoring**: Live resource usage
- **Agent Communication**: External game server agents

### WebSocket Events

```javascript
// Client-side WebSocket handling
const ws = new WebSocket('ws://localhost:8080');
ws.on('console-output', (data) => {
  terminal.write(data.output);
});
ws.on('server-stats', (data) => {
  updateCharts(data);
});
```

## 📊 Monitoring & Logging

### Implemented Monitoring

- **System Resources**: CPU, Memory, Disk usage
- **Application Metrics**: Request counts, response times
- **Real-time Charts**: Chart.js integration
- **Log Management**: Winston logger with rotation

### Log Locations

- Application logs: `./logs/app.log`
- Error logs: `./logs/error.log`
- Access logs: Nginx access logs
- Docker logs: `docker compose logs`

## 🔧 Troubleshooting Guide

### Common Development Issues

1. **Port Conflicts**: Check if ports 3000, 8080, 5432, 6379 are available
2. **TypeScript Errors**: Run `npm run build` to check compilation
3. **WebSocket Connection**: Verify WebSocket server is running on port 8080
4. **File Permissions**: Ensure upload directories are writable

### Production Issues

1. **Services Won't Start**: Check Docker logs and system resources
2. **Database Connection**: Verify PostgreSQL connection string
3. **Agent Communication**: Check port 8080 accessibility and AGENT_SECRET

## 📝 Code Style & Patterns

### TypeScript Patterns

```typescript
// Route handler pattern
export const listFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    // Implementation
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// WebSocket event handling
ws.on('message', (message: string) => {
  const data = JSON.parse(message);
  handleWebSocketMessage(data);
});
```

### Error Handling

- Always use try-catch blocks in async functions
- Return consistent API response format
- Log errors with appropriate levels
- Provide user-friendly error messages

## 🎯 Future Development Directions

### Planned Features

1. **User Management**: Multi-user support with roles
2. **Plugin System**: Extensible architecture
3. **Advanced Monitoring**: Metrics dashboard
4. **Backup System**: Automated backups
5. **Multi-server Support**: Manage multiple game servers

### Scalability Considerations

- Database optimization for larger datasets
- Redis clustering for high availability
- Load balancing for multiple instances
- CDN integration for static assets

## 🔄 Development Workflow

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: description"
git push origin feature/new-feature

# Deployment
git checkout main
git merge feature/new-feature
./deploy-to-vps.sh update
```

### Testing Strategy

- Unit tests for API endpoints
- Integration tests for WebSocket communication
- E2E tests for critical user flows
- Performance tests for file operations

## 📞 Support & Documentation

### Key Documentation Files

- `README.md`: Project overview and quick start
- `VPS_DEPLOYMENT_GUIDE.md`: Comprehensive deployment guide
- `PROJECT_PLAN.md`: Detailed project planning
- `FEATURES.md`: Feature specifications
- `.env.example`: Environment configuration template

### Development Notes

- Server runs on port 3002 in development
- WebSocket server on port 8080
- File API endpoints under `/api/files/*`
- All file operations are validated for security
- Monaco editor integrated for code editing
- Real-time console uses xterm.js

## 🎯 Copilot Assistance Areas

When working on this project, GitHub Copilot should focus on:

1. **API Development**: RESTful endpoints with proper error handling
2. **WebSocket Integration**: Real-time communication patterns
3. **Security**: Input validation and sanitization
4. **File Operations**: Safe file system interactions
5. **UI Components**: Modern, responsive interface elements
6. **Docker Configuration**: Container optimization
7. **Database Operations**: Efficient queries and migrations

Remember: This is a production-ready game server management panel with security as a top priority. Always validate inputs, sanitize file paths, and implement proper error handling.
