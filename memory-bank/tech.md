# Technology Stack

## Core Technologies

### Backend

- **Node.js**: JavaScript runtime environment (v18+)
- **TypeScript**: Strongly typed programming language for JavaScript
- **Express.js**: Web application framework for Node.js
- **PostgreSQL**: Relational database for data persistence
- **Prisma ORM**: Type-safe database client and ORM
- **Redis**: In-memory data store for caching and session management
- **WebSocket**: Real-time communication protocol
- **Socket.IO**: Library for real-time web applications

### Frontend

- **React**: JavaScript library for building user interfaces
- **Next.js**: React framework with static export capability
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Type safety for frontend components
- **Axios**: Promise-based HTTP client
- **Chart.js**: JavaScript charting library for metrics visualization
- **Monaco Editor**: Code editor for configuration editing
- **xterm.js**: Terminal emulator for console access

### Security

- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing library
- **Helmet.js**: HTTP security headers
- **CORS**: Cross-Origin Resource Sharing configuration
- **Rate Limiting**: Protection against brute force attacks
- **Content Security Policy**: XSS protection

### Deployment

- **Docker**: Containerization platform
- **Docker Compose**: Multi-container Docker applications
- **Nginx**: Web server and reverse proxy
- **Let's Encrypt**: SSL certificate automation

## Development Environment

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+
- Git

### Setup Instructions

1. **Clone Repository**
   ```bash
   git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
   cd ctrl-alt-play-panel
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with appropriate values
   ```

4. **Start Development Services**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Database Setup**
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

### Development Workflow

- **Backend Development**: `npm run dev` (runs on port 3000)
- **Frontend Development**: `cd frontend && npm run dev` (runs on port 3001)
- **Database Management**: `npx prisma studio` (runs on port 5555)
- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Testing**: `npm run test`

## Key Dependencies

### Backend Dependencies

- **express**: Web framework for Node.js
- **@prisma/client**: Database ORM and client
- **jsonwebtoken**: JWT implementation
- **bcryptjs**: Password hashing
- **socket.io**: WebSocket implementation
- **winston**: Logging library
- **joi**: Schema validation
- **helmet**: Security headers
- **cors**: CORS middleware
- **axios**: HTTP client

### Frontend Dependencies

- **react**: UI library
- **next**: React framework
- **tailwindcss**: CSS framework
- **axios**: HTTP client
- **socket.io-client**: WebSocket client
- **chart.js**: Data visualization
- **react-monaco-editor**: Code editor component
- **xterm**: Terminal emulator
- **headlessui**: Accessible UI components
- **heroicons**: Icon set

### Development Dependencies

- **typescript**: Type system
- **eslint**: Code linting
- **jest**: Testing framework
- **supertest**: API testing
- **nodemon**: Development server with hot reload
- **prettier**: Code formatting
- **husky**: Git hooks

## Build and Deployment

### Build Process

1. **Backend Build**
   ```bash
   npm run build
   ```

2. **Frontend Build**
   ```bash
   cd frontend && npm run build
   ```

3. **Docker Build**
   ```bash
   docker-compose build
   ```

### Production Deployment

1. **Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Nginx Configuration**
   - Reverse proxy to backend (port 3000)
   - Serve static frontend files
   - SSL termination

## Technical Constraints

- **Security-First Approach**: All features must prioritize security
- **Distributed Architecture**: Panel+Agent pattern for scalability
- **Type Safety**: TypeScript throughout the codebase
- **Containerization**: Docker for consistent deployment
- **Database**: PostgreSQL for relational data
- **Real-time Communication**: WebSocket for live updates
- **Mobile Responsiveness**: All interfaces must work on mobile devices
- **External Agent Communication**: Support for distributed agent deployment

## Tool Usage Patterns

### Version Management

```bash
# Patch version (bug fixes)
./version.sh patch "Fix authentication bug"

# Minor version (new features)
./version.sh minor "Add server backup functionality"

# Major version (breaking changes)
./version.sh major "Redesign Panel+Agent API protocol"
```

### Database Management

```bash
# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test tests/integration/ctrl-alt-system.test.ts

# Run with coverage
npm test -- --coverage
```

## Performance Considerations

- **Database Indexing**: Proper indexes for frequently queried fields
- **Connection Pooling**: Optimized database connections
- **Redis Caching**: Frequently accessed data cached in Redis
- **Static Export**: Frontend served as static files for performance
- **Docker Multi-stage Builds**: Optimized container images
- **Rate Limiting**: Protection against abuse
- **Pagination**: Large data sets are paginated