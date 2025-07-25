# CTRL+ALT+Play Panel API Documentation

## 🔐 Authentication & Permissions

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
- **Audit Logs**: `audit.view`, `audit.export`
- **System Settings**: `settings.view`, `settings.edit`
- **Security**: `security.sessions`, `security.logs`, `security.config`

### Role Hierarchy

1. **USER** (Default): Basic permissions for own resources
2. **MODERATOR**: Enhanced permissions for server management
3. **ADMIN**: Full administrative permissions
4. **ROOT ADMIN**: All permissions (bypass all checks)

---

## 📚 API Endpoints

### Authentication Routes

#### POST /api/auth/login
**Description**: Authenticate user and receive JWT token  
**Permission**: None (public)  
**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/register
**Description**: Register new user account  
**Permission**: None (public)  
**Body**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST /api/auth/logout
**Description**: Logout and invalidate session  
**Permission**: Valid JWT required

---

### User Management Routes

#### GET /api/users
**Description**: Get paginated list of all users  
**Permission**: `users.view`  
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### GET /api/users/:id
**Description**: Get specific user details  
**Permission**: `users.view`

#### POST /api/users
**Description**: Create new user account  
**Permission**: `users.create`  
**Body**:
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "USER"
}
```

#### PATCH /api/users/:id
**Description**: Update user information  
**Permission**: `users.edit`  
**Body**: Any combination of user fields to update

#### DELETE /api/users/:id
**Description**: Delete user account  
**Permission**: `users.delete`  
**Note**: Cannot delete users with existing servers

#### GET /api/users/:id/servers
**Description**: Get servers owned by specific user  
**Permission**: `users.view` OR `servers.view`  
**Note**: Users can only see their own servers unless they have `servers.manage`

---

### Server Management Routes

#### GET /api/servers
**Description**: Get list of servers  
**Permission**: `servers.view`  
**Note**: Returns user's own servers unless they have `servers.manage`

#### GET /api/servers/:id
**Description**: Get specific server details  
**Permission**: `servers.view` OR `servers.manage`  
**Note**: Users can only see their own servers unless they have `servers.manage`

#### GET /api/servers/:id/status
**Description**: Get real-time server status  
**Permission**: `servers.view` OR `servers.manage`

#### POST /api/servers/:id/start
**Description**: Start a server  
**Permission**: `servers.start` OR `servers.manage`  
**Resource Ownership**: Required (unless user has `servers.manage`)

#### POST /api/servers/:id/stop
**Description**: Stop a server  
**Permission**: `servers.stop` OR `servers.manage`  
**Resource Ownership**: Required (unless user has `servers.manage`)  
**Body** (optional):
```json
{
  "signal": "SIGTERM",
  "timeout": 30
}
```

#### POST /api/servers/:id/restart
**Description**: Restart a server  
**Permission**: `servers.restart` OR `servers.manage`  
**Resource Ownership**: Required (unless user has `servers.manage`)

#### POST /api/servers/:id/kill
**Description**: Force kill a server (emergency stop)  
**Permission**: `servers.manage`  
**Note**: Only users with full server management can force kill

---

### Node Management Routes

#### GET /api/nodes
**Description**: Get list of all nodes  
**Permission**: `nodes.view`

#### GET /api/nodes/:id
**Description**: Get specific node details  
**Permission**: `nodes.view`

#### POST /api/nodes
**Description**: Create new node  
**Permission**: `nodes.create`  
**Body**:
```json
{
  "name": "Node Name",
  "fqdn": "node.example.com",
  "port": 8080,
  "memory": 16384,
  "disk": 1000000
}
```

#### PATCH /api/nodes/:id
**Description**: Update node configuration  
**Permission**: `nodes.edit`

#### DELETE /api/nodes/:id
**Description**: Delete node  
**Permission**: `nodes.delete`  
**Note**: Cannot delete nodes with existing servers

#### GET /api/nodes/:id/stats
**Description**: Get node statistics  
**Permission**: `nodes.view`

#### GET /api/nodes/:id/servers
**Description**: Get servers on specific node  
**Permission**: `nodes.view`

---

### Monitoring Routes

#### GET /api/monitoring/servers/:id/metrics
**Description**: Get server performance metrics history  
**Permission**: `monitoring.view` OR `servers.view`  
**Query Parameters**:
- `timeRange`: `1h`, `6h`, `24h`, `7d`, `30d` (default: `24h`)

#### GET /api/monitoring/nodes/:id/metrics
**Description**: Get node performance metrics  
**Permission**: `monitoring.view`

#### POST /api/monitoring/collect
**Description**: Trigger manual metrics collection  
**Permission**: `monitoring.view`

#### GET /api/monitoring/alerts
**Description**: Get system alerts  
**Permission**: `monitoring.view`

#### POST /api/monitoring/alerts/:id/acknowledge
**Description**: Acknowledge an alert  
**Permission**: `monitoring.view`

---

## 🔒 Security Features

### Resource Ownership
Users can only access resources they own unless they have management permissions:
- Server operations require ownership OR `servers.manage`
- File operations require server ownership OR `files.manage`
- User data requires self-access OR `users.view`

### Rate Limiting
Sensitive operations are rate-limited:
- Login attempts: 5 attempts per 15 minutes
- Password resets: 3 attempts per hour
- API key generation: 10 per hour

### Session Management
- JWT tokens include session validation
- Session tracking with IP address and user agent
- Automatic session cleanup for expired sessions

### Security Logging
All security events are logged:
- Authentication attempts (success/failure)
- Permission denials
- Resource access
- Administrative actions
- Suspicious activity

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 🚨 Error Codes

- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `422` - Validation Error (invalid input data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🔧 Development Notes

### Testing Permissions
Use the permission test endpoints to verify user permissions:
```bash
# Check user permissions
GET /api/users/:id/permissions

# Test specific permission
GET /api/permissions/check?permission=servers.view&userId=:id
```

### Security Best Practices
1. Always validate user permissions before resource access
2. Use resource ownership checks for user-specific data
3. Log all administrative actions for audit trails
4. Implement proper rate limiting on sensitive endpoints
5. Validate all input data before processing

### Permission Debugging
Check the application logs for permission denial events:
```bash
# View security logs
tail -f logs/security.log | grep PERMISSION_DENIED
```
