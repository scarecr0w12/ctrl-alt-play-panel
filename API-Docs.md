# API Documentation

The Ctrl-Alt-Play Panel implements a comprehensive RESTful API architecture with modern authentication, authorization, and real-time communication capabilities. The API serves as the central communication layer for the Panel+Agent distributed system.

## Authentication & Permissions

All API endpoints (except authentication) require a valid JWT token passed in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Permission System

The API uses a granular permission-based access control system with 36 specific permissions organized into 10 categories:

#### User Management Permissions
- `users.view` - View user profiles and lists
- `users.create` - Create new user accounts
- `users.edit` - Edit user information and settings
- `users.delete` - Delete user accounts
- `users.permissions` - Manage user permissions

#### Server Management Permissions
- `servers.view` - View server details and lists
- `servers.create` - Create new game servers
- `servers.edit` - Edit server configuration
- `servers.delete` - Delete servers
- `servers.start` - Start servers
- `servers.stop` - Stop servers
- `servers.restart` - Restart servers
- `servers.manage` - Full server management (bypasses ownership checks)

#### Node Management Permissions
- `nodes.view` - View node information
- `nodes.create` - Create new nodes
- `nodes.edit` - Edit node configuration
- `nodes.delete` - Delete nodes

#### Monitoring Permissions
- `monitoring.view` - View system monitoring data
- `monitoring.metrics` - Access detailed performance metrics

#### File Management Permissions
- `files.view` - View file listings
- `files.edit` - Edit file contents
- `files.upload` - Upload files to servers
- `files.download` - Download files from servers
- `files.delete` - Delete files

#### Other Permission Categories
- **API Management**: `api.keys.view`, `api.keys.create`, `api.keys.delete`
- **Workshop**: `workshop.view`, `workshop.manage`
- **Backup**: `backups.view`, `backups.create`, `backups.delete`
- **Analytics**: `analytics.view`, `analytics.export`
- **System**: `system.config`, `system.logs`, `system.maintenance`
- **Network**: `network.view`, `network.manage`

## Core API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/login` - User authentication with credentials
- `POST /api/auth/logout` - User session termination
- `POST /api/auth/refresh` - JWT token refresh
- `GET /api/auth/me` - Current user profile information
- `POST /api/auth/register` - New user registration (admin only)

### Server Management Routes (`/api/servers`)

- `GET /api/servers` - List all servers with status
- `POST /api/servers` - Create new server configuration
- `GET /api/servers/:id` - Get specific server details
- `PUT /api/servers/:id` - Update server configuration
- `DELETE /api/servers/:id` - Delete server
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server
- `POST /api/servers/:id/restart` - Restart server

### User Management Routes (`/api/users`)

- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user information
- `DELETE /api/users/:id` - Delete user

### Plugin Management Routes (`/api/plugins`)

- `GET /api/plugins` - List installed plugins
- `POST /api/plugins` - Install new plugin
- `GET /api/plugins/:name` - Get plugin details
- `PUT /api/plugins/:name` - Update plugin configuration
- `DELETE /api/plugins/:name` - Uninstall plugin

## WebSocket API

The system also provides real-time communication through WebSocket connections for live updates:

- Server status updates
- Console output streaming
- System monitoring metrics
- User notifications

To connect to the WebSocket API, establish a connection to `/socket.io` with a valid JWT token.