# GitHub Copilot Development Instructions

# Ctrl-Alt-Play Panel - Game Server Management System

## 🎯 Project Overview

This is a comprehensive web-based game server management panel featuring a Panel+Agent distributed architecture, built with Node.js/TypeScript backend and Next.js/React frontend, featuring modern glass morphism UI and external agent integration.

## 🏗️ Architecture & Stack

- **Backend**: Node.js 18+ with TypeScript, Express.js framework
- **Database**: PostgreSQL with Prisma ORM, foreign key constraints properly managed
- **Cache**: Redis for session management and caching
- **Frontend**: Next.js/React with TypeScript, TailwindCSS
- **Styling**: TailwindCSS with glass morphism design
- **External Agents**: HTTP REST API communication with separate agent projects
- **Testing**: Jest with comprehensive database cleanup utilities
- **Deployment**: Docker with Docker Compose, Nginx reverse proxy

## 📁 Project Structure

```
ctrl-alt-play/
├── src/
│   ├── index.ts              # Main Express server with WebSocket
│   ├── routes/
│   │   ├── files.ts          # File management API (CRUD operations)
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── monitoring.ts     # System monitoring API
│   │   └── workshop.ts       # Workshop/mods management
│   ├── middleware/
│   ├── models/
│   └── utils/
├── public/
│   ├── index.html            # Main dashboard
│   ├── files.html            # File manager with Monaco editor
│   ├── console.html          # Real-time console interface
│   └── assets/
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
├── Dockerfile                # Application container
├── deploy-to-vps.sh         # VPS deployment script
└── VPS_DEPLOYMENT_GUIDE.md   # Comprehensive deployment guide
```

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
docker-compose up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d
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
- Docker logs: `docker-compose logs`

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
