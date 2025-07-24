# 🎮 Ctrl-Alt-Play Panel

A modern, secure game server management panel built with Node.js, TypeScript, and React.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)

## ✨ Features

### 🔒 **Security First**
- JWT authentication with secure httpOnly cookies
- Role-based access control (Admin/User)
- Protected API routes with rate limiting
- Server-side rendering for enhanced security

### 🎯 **Server Management**
- Multi-server support with real-time status
- Power controls (start/stop/restart/kill)
- Resource monitoring (CPU, Memory, Disk)
- Steam Workshop integration

### 💻 **Modern Interface**
- React/Next.js frontend with TypeScript
- Responsive design with glass morphism
- Real-time updates and notifications
- Mobile-friendly interface

### 🛠 **Developer Experience**
- Full TypeScript support
- Hot reload development
- Comprehensive API documentation
- Docker containerization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Redis (optional, for caching)

### Installation

1. **Clone and setup:**
   ```bash
   git clone https://github.com/scarecr0w12/ctrl-alt-play-panel.git
   cd ctrl-alt-play-panel
   ./scripts/setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start development servers:**
   
   **Backend (Terminal 1):**
   ```bash
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the panel:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

### Demo Credentials
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

## 📁 Project Structure

```
ctrl-alt-play-panel/
├── frontend/                 # React/Next.js frontend
│   ├── components/          # Reusable UI components
│   ├── pages/              # Next.js pages/routes
│   ├── contexts/           # React contexts
│   └── lib/                # Utilities and API client
├── src/                     # Backend source code
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middlewares/        # Express middlewares
│   └── types/              # TypeScript types
├── prisma/                  # Database schema and migrations
├── docs/                    # Documentation
│   ├── development/        # Development guides
│   ├── deployment/         # Deployment configs
│   └── archive/            # Historical docs
├── scripts/                 # Setup and utility scripts
└── public/                  # Static assets
```

## 🔧 Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run test         # Run tests
npm run migrate      # Run database migrations
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Servers
- `GET /api/servers` - List all servers
- `GET /api/servers/:id` - Get server details
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server

### Monitoring
- `GET /api/monitoring/servers/:id/current` - Current metrics
- `GET /api/monitoring/servers/:id/metrics` - Historical data

### Files
- `GET /api/files/list` - List files
- `GET /api/files/read` - Read file content
- `POST /api/files/write` - Write file content

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docs/deployment/docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ctrl_alt_play"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

**Frontend (.env.local):**
```env
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🏗 Architecture

### Backend Stack
- **Node.js 18+** with TypeScript
- **Express.js** with security middleware
- **PostgreSQL** with Prisma ORM
- **Redis** for caching and sessions
- **WebSocket** for real-time communication

### Frontend Stack
- **Next.js 14** with React 18
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Context** for state management

## 📊 Features Implemented

### ✅ Core Features
- [x] JWT Authentication system
- [x] Role-based access control
- [x] Server management (CRUD)
- [x] Real-time server monitoring
- [x] File management system
- [x] Steam Workshop integration

### ✅ Frontend Pages
- [x] Login/Authentication
- [x] Dashboard overview
- [x] Server management
- [x] Protected routes

### 🚧 In Development
- [ ] Console interface with xterm.js
- [ ] Advanced monitoring with charts
- [ ] User management (admin)
- [ ] System settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Documentation

- [Development Guide](docs/development/)
- [Deployment Guide](docs/deployment/)
- [Frontend Migration](docs/development/FRONTEND_MIGRATION_COMPLETE.md)

## 🔧 Troubleshooting

### Common Issues

**Database Connection:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
npm run migrate:reset
npm run db:seed
```

**Port Conflicts:**
```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

**Node Modules:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the gaming community**
