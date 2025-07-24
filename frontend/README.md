# Modern Frontend Setup Instructions

This document explains how to set up and use the new React/Next.js frontend to replace the static HTML pages.

## ✨ What This Solves

### 🔒 **Security Improvements**
- **No URI parameter exposure** - Sensitive data isn't passed through URLs
- **JWT token management** - Secure authentication with httpOnly cookies
- **Server-side rendering** - Better protection against client-side attacks
- **Protected routes** - Automatic redirection for unauthorized access

### 🚀 **Better User Experience**
- **Single Page Application** - Smooth navigation without page reloads
- **Real-time updates** - Live data updates without manual refresh
- **Modern UI components** - Professional, accessible interface
- **Mobile responsive** - Works perfectly on all devices

### 🛠 **Developer Benefits**
- **TypeScript** - Full type safety and better development experience
- **Component-based** - Reusable, maintainable code structure
- **API-first** - Clean separation between frontend and backend
- **Hot reload** - Instant development feedback

## 📦 Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd /home/scarecrow/ctrl-alt-play-panel/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **The frontend will be available at:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000 (proxied through Next.js)

## 🏗 Project Structure

```
frontend/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar
│   └── ProtectedRoute.tsx  # Authentication wrapper
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── lib/               # Utilities and configurations
│   └── api.ts         # API client with type safety
├── pages/             # Next.js pages (routes)
│   ├── _app.tsx       # App wrapper with providers
│   ├── index.tsx      # Home page (redirects)
│   ├── login.tsx      # Login page
│   ├── dashboard.tsx  # Main dashboard
│   └── servers.tsx    # Server management
├── styles/            # Global styles
│   └── globals.css    # Tailwind CSS + custom styles
└── package.json       # Dependencies and scripts
```

## 🔐 Authentication Flow

### **Old Way (Insecure):**
```javascript
// URL contained sensitive data
window.location.href = '/dashboard.html?token=jwt_token_here&user=admin';
```

### **New Way (Secure):**
```typescript
// Server-side authentication
const { login } = useAuth();
const success = await login(email, password);
if (success) {
  router.push('/dashboard'); // No sensitive data in URL
}
```

### **Token Management:**
- Tokens stored in secure, httpOnly cookies
- Automatic token refresh
- Secure logout with token cleanup

## 🛡 Protected Routes

All pages are automatically protected:

```typescript
// Requires authentication
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Requires admin role
<ProtectedRoute adminOnly>
  <AdminPanel />
</ProtectedRoute>
```

## 🎨 UI Components

### **Glass Morphism Design:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### **Responsive Navigation:**
- Collapsible sidebar on mobile
- Role-based menu items
- Active state indicators

### **Interactive Elements:**
- Hover effects and animations
- Loading states
- Toast notifications
- Form validation

## 🔧 API Integration

### **Type-Safe API Calls:**
```typescript
// Fully typed responses
const servers = await serversApi.getAll();
if (servers.data.success) {
  setServers(servers.data.data);
}
```

### **Error Handling:**
```typescript
// Automatic error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📱 Features Implemented

### ✅ **Core Pages**
- **Login Page** - Secure authentication with demo credentials
- **Dashboard** - Overview with server stats and recent activity
- **Servers Page** - Full server management with actions
- **Protected Routes** - Automatic authentication checks

### ✅ **Authentication**
- JWT token management
- Role-based access control
- Secure cookie storage
- Auto-logout on token expiry

### ✅ **UI/UX**
- Modern glass morphism design
- Responsive mobile layout
- Loading states and animations
- Toast notifications

## 🚀 Production Deployment

### **Build for Production:**
```bash
npm run build
npm start
```

### **Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NODE_ENV=production
```

### **Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 Migration from HTML Pages

### **1. Remove Static Files**
```bash
# Backup old files
mv public/dashboard.html public/dashboard.html.backup
mv public/login.html public/login.html.backup
mv public/console.html public/console.html.backup
```

### **2. Update Backend**
```typescript
// Remove static file serving for these routes
app.get('/dashboard', (req, res) => {
  res.redirect('http://localhost:3001/dashboard');
});
```

### **3. Update Nginx**
```nginx
# Route frontend to Next.js
location / {
    proxy_pass http://localhost:3001;
}

# Keep API on backend
location /api/ {
    proxy_pass http://localhost:3000;
}
```

## 🛠 Additional Pages to Implement

### **Console Page** (Next)
- Real-time terminal with xterm.js
- WebSocket integration
- Server power controls

### **File Manager** (Next)
- Monaco editor integration
- File upload/download
- Directory operations

### **Monitoring** (Next)
- Chart.js integration
- Real-time metrics
- Historical data

### **Settings** (Next)
- User preferences
- System configuration
- Admin tools

## 🆘 Support

If you encounter any issues:

1. **Check logs:**
   ```bash
   npm run dev  # Development logs
   ```

2. **Verify backend connection:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Clear browser cache and cookies**

4. **Restart both servers:**
   ```bash
   # Backend
   cd /home/scarecrow/ctrl-alt-play-panel
   npm run dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

## 🎯 Next Steps

1. **Install and test the frontend**
2. **Migrate remaining pages (console, files, monitoring)**
3. **Implement advanced features (charts, real-time updates)**
4. **Deploy to production with SSL/TLS**

This modern React frontend provides a significantly more secure and user-friendly experience compared to the static HTML pages!
