import axios, { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://dev-panel.thecgn.net/api'
  : 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string })?.message || error.message;

    // Handle specific error codes
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        toast.error('Session expired. Please log in again.');
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        if (status && status >= 400) {
          toast.error(message || 'An error occurred.');
        }
    }

    return Promise.reject(error);
  }
);

// Enhanced response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    counts?: Record<string, number>;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}

// Types for external agent integration
export interface AgentStatus {
  online: boolean;
  version?: string;
  uptime?: number;
  serverCount?: number;
  lastSeen?: Date;
  responseTime?: number;
  error?: string;
}

export interface ExternalAgent {
  id: string;
  nodeId: string;
  nodeUuid: string;
  baseUrl: string;
  apiKey: string;
  isOnline: boolean;
  lastSeen?: Date;
  version?: string;
}

export interface AgentHealthStatus {
  nodeUuid: string;
  status: AgentStatus;
  timestamp: string;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (userData: any) => api.post('/users', userData),
  update: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  delete: (id: string) => api.delete(`/users/${id}`),
  updatePassword: (id: string, passwordData: any) => api.put(`/users/${id}/password`, passwordData),
};

// User Profile API
export const userProfileApi = {
  getProfile: () => api.get('/user-profile/profile'),
  updateProfile: (profileData: {
    firstName: string;
    lastName: string;
    language?: string;
    gravatar?: boolean;
  }) => api.put('/user-profile/profile', profileData),
  changePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.put('/user-profile/change-password', passwordData),
  changeEmail: (emailData: {
    newEmail: string;
    password: string;
  }) => api.put('/user-profile/change-email', emailData),
  getActivity: (page?: number, limit?: number) => 
    api.get(`/user-profile/activity?page=${page || 1}&limit=${limit || 10}`),
};

// Ctrls API (Server Categories)
export const ctrlsApi = {
  getAll: () => api.get('/ctrls'),
  getById: (id: string) => api.get(`/ctrls/${id}`),
  create: (ctrlData: {
    name: string;
    description?: string;
    author?: string;
    version?: string;
    tags?: string[];
  }) => api.post('/ctrls', ctrlData),
  update: (id: string, ctrlData: any) => api.put(`/ctrls/${id}`, ctrlData),
  delete: (id: string) => api.delete(`/ctrls/${id}`),
  import: (importData: any) => api.post('/ctrls/import', importData),
  export: (id: string) => api.get(`/ctrls/${id}/export`),
};

// Alts API (Server Templates)
export const altsApi = {
  getAll: (ctrlId?: string) => 
    api.get(`/alts${ctrlId ? `?ctrlId=${ctrlId}` : ''}`),
  getById: (id: string) => api.get(`/alts/${id}`),
  create: (altData: {
    name: string;
    description?: string;
    ctrlId: string;
    dockerImage: string;
    startupCommand: string;
    configFiles?: any[];
    variables?: any[];
  }) => api.post('/alts', altData),
  update: (id: string, altData: any) => api.put(`/alts/${id}`, altData),
  delete: (id: string) => api.delete(`/alts/${id}`),
  clone: (id: string, name: string) => api.post(`/alts/${id}/clone`, { name }),
};

// Servers API
export const serversApi = {
  getAll: () => api.get('/servers'),
  getById: (id: string) => api.get(`/servers/${id}`),
  getStatus: (id: string) => api.get(`/servers/${id}/status`),
  create: (serverData: {
    name: string;
    description?: string;
    nodeId: string;
    altId: string;
    memory: number;
    disk: number;
    cpu: number;
    swap?: number;
    io?: number;
    environment?: Record<string, string>;
    skipScripts?: boolean;
  }) => api.post('/servers', serverData),
  start: (id: string) => api.post(`/servers/${id}/start`),
  stop: (id: string, signal?: string, timeout?: number) => 
    api.post(`/servers/${id}/stop`, { signal, timeout }),
  restart: (id: string) => api.post(`/servers/${id}/restart`),
  kill: (id: string) => api.post(`/servers/${id}/kill`),
  getNodes: () => api.get('/servers/nodes'),
  getTemplates: (ctrlId?: string) => 
    api.get(`/servers/templates${ctrlId ? `?ctrlId=${ctrlId}` : ''}`),
  getCategories: () => api.get('/servers/categories'),
};

// Monitoring API
export const monitoringApi = {
  getHealth: () => api.get('/monitoring/health'),
  getMetrics: () => api.get('/monitoring/metrics'),
  getSystemStats: () => api.get('/monitoring/system'),
};

// Agents API
export const agentsApi = {
  getAll: () => api.get('/agents'),
  getById: (id: string) => api.get(`/agents/${id}`),
  register: (agentData: { nodeUuid: string; baseUrl: string; apiKey: string }) => 
    api.post('/agents/register', agentData),
  unregister: (id: string) => api.delete(`/agents/${id}`),
  getStatus: (id: string) => api.get(`/agents/${id}/status`),
  sendCommand: (id: string, command: any) => api.post(`/agents/${id}/command`, command),
  healthCheck: () => api.get('/agents/health'),
  healthCheckAll: () => api.get('/agents/health-all'),
  discover: () => api.post('/agents/discover'),
};

// Nodes API
export const nodesApi = {
  getAll: () => api.get('/nodes'),
  getById: (id: string) => api.get(`/nodes/${id}`),
  create: (nodeData: any) => api.post('/nodes', nodeData),
  update: (id: string, nodeData: any) => api.patch(`/nodes/${id}`, nodeData),
  delete: (id: string) => api.delete(`/nodes/${id}`),
  getStats: (id: string) => api.get(`/nodes/${id}/stats`),
  getServers: (id: string) => api.get(`/nodes/${id}/servers`),
};

// Files API
export const filesApi = {
  getFiles: (serverId: string, path: string = '/') => 
    api.get(`/files/list?serverId=${serverId}&path=${encodeURIComponent(path)}`),
  
  getContent: (serverId: string, filePath: string) => 
    api.get(`/files/read?serverId=${serverId}&path=${encodeURIComponent(filePath)}`),
  
  updateContent: (serverId: string, filePath: string, content: string) => 
    api.post(`/files/write`, { serverId, path: filePath, content }),
  
  create: (serverId: string, path: string, type: 'file' | 'directory', content?: string) => {
    if (type === 'directory') {
      return api.post('/files/mkdir', { serverId, path });
    } else {
      return api.post('/files/write', { serverId, path, content: content || '' });
    }
  },
  
  delete: (serverId: string, path: string) => 
    api.delete(`/files/delete?serverId=${serverId}&path=${encodeURIComponent(path)}`),
  
  rename: (serverId: string, oldPath: string, newPath: string) => 
    api.post('/files/rename', { serverId, oldPath, newPath }),
  
  upload: (serverId: string, path: string, fileOrData: File | { content: string; encoding?: string; totalSize?: number }) => {
    if (fileOrData instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrData);
      formData.append('serverId', serverId);
      formData.append('path', path);
      return api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      return api.post('/files/upload', {
        serverId,
        path,
        ...fileOrData
      });
    }
  },
  
  uploadProgress: (serverId: string, path: string, data: { 
    content: string; 
    encoding?: string; 
    totalSize?: number; 
    chunkIndex?: number; 
    totalChunks?: number; 
  }) => 
    api.post('/files/upload-progress', { serverId, path, ...data }),
  
  download: (serverId: string, filePath: string) => 
    api.get(`/files/download?serverId=${serverId}&path=${encodeURIComponent(filePath)}`, {
      responseType: 'blob'
    }),
  
  getInfo: (serverId: string, filePath: string) => 
    api.get(`/files/info?serverId=${serverId}&path=${encodeURIComponent(filePath)}`),
  
  // Enhanced file operations
  search: (serverId: string, path: string, query: string, fileType?: string) => 
    api.get(`/files/search?serverId=${serverId}&path=${encodeURIComponent(path)}&query=${encodeURIComponent(query)}${fileType ? `&fileType=${fileType}` : ''}`),
  
  batchOperation: (serverId: string, operation: 'delete' | 'move' | 'copy', files: string[], destination?: string) => 
    api.post('/files/batch', { serverId, operation, files, destination }),
  
  getPermissions: (serverId: string, filePath: string) => 
    api.get(`/files/permissions?serverId=${serverId}&path=${encodeURIComponent(filePath)}`),
  
  setPermissions: (serverId: string, filePath: string, permissions: string) => 
    api.post('/files/permissions', { serverId, path: filePath, permissions }),
  
  createArchive: (serverId: string, files: string[], archivePath: string, format: 'zip' | 'tar' | 'tar.gz') => 
    api.post('/files/archive', { serverId, operation: 'create', files, archivePath, format }),
  
  extractArchive: (serverId: string, archivePath: string, format: 'zip' | 'tar' | 'tar.gz') => 
    api.post('/files/archive', { serverId, operation: 'extract', archivePath, format }),
  
  getHealth: () => api.get('/files/health'),
};

// Steam Workshop API
export const steamApi = {
  search: (query: string, type?: string) => 
    api.get(`/steam/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
  getItem: (id: string) => api.get(`/steam/item/${id}`),
  install: (serverId: string, itemId: string) => 
    api.post(`/steam/install`, { serverId, itemId }),
  getInstalled: (serverId: string) => api.get(`/steam/installed/${serverId}`),
  uninstall: (serverId: string, itemId: string) => 
    api.delete(`/steam/installed/${serverId}/${itemId}`),
};

export default api;
