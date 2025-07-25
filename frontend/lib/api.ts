import axios, { AxiosResponse } from 'axios';

// Configure base URL for API calls
const api = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Token will be added by AuthContext
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on 401
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Server interfaces
interface Server {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  status: 'installing' | 'install_failed' | 'suspended' | 'offline' | 'starting' | 'running' | 'stopping' | 'crashed';
  memory: number;
  disk: number;
  cpu: number;
  user: {
    username: string;
  };
  node: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServerMetrics {
  id: string;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkRx: number;
  networkTx: number;
  playerCount: number;
  timestamp: string;
}

interface MonitoringStats {
  total: number;
  running: number;
  stopped: number;
  cpu: number;
  memory: number;
  memoryTotal: number;
  players: number;
  timestamp: string;
}

interface Ctrl {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  alts?: Alt[];
  _count?: {
    alts: number;
  };
}

interface Alt {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  author: string;
  dockerImages: any;
  startup: string;
  configFiles: any;
  configStartup: any;
  configLogs: any;
  configStop?: string;
  scriptInstall?: string;
  scriptEntry: string;
  scriptContainer: string;
  copyScriptFrom?: string;
  features?: any;
  fileDenylist?: any;
  forceOutgoingIp: boolean;
  createdAt: string;
  updatedAt: string;
  ctrlId: string;
  ctrl?: Ctrl;
  variables?: AltVariable[];
  _count?: {
    servers: number;
  };
}

interface AltVariable {
  id: string;
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  userViewable: boolean;
  userEditable: boolean;
  rules: string;
  createdAt: string;
  updatedAt: string;
  altId: string;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse>('/api/auth/login', { email, password }),
  
  register: (userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<ApiResponse>('/api/auth/register', userData),
};

// Servers API
export const serversApi = {
  getAll: () => api.get<ApiResponse<Server[]>>('/api/servers'),
  
  getById: (id: string) => api.get<ApiResponse<Server>>(`/api/servers/${id}`),
  
  getStatus: (id: string) => api.get<ApiResponse>(`/api/servers/${id}/status`),
  
  getMetrics: (id: string, params?: { 
    from?: string; 
    to?: string; 
    interval?: string; 
  }) => api.get<ApiResponse<ServerMetrics[]>>(`/api/servers/${id}/metrics`, { params }),
  
  create: (serverData: {
    name: string;
    description?: string;
    nodeId: string;
    altId: string;
    memory: number;
    disk: number;
    cpu: number;
  }) => api.post<ApiResponse<Server>>('/api/servers', serverData),
  
  update: (id: string, updates: Partial<Server>) => 
    api.patch<ApiResponse<Server>>(`/api/servers/${id}`, updates),
  
  delete: (id: string) => api.delete<ApiResponse>(`/api/servers/${id}`),
  
  start: (id: string) => api.post<ApiResponse>(`/api/servers/${id}/start`),
  
  stop: (id: string) => api.post<ApiResponse>(`/api/servers/${id}/stop`),
  
  restart: (id: string) => api.post<ApiResponse>(`/api/servers/${id}/restart`),
  
  kill: (id: string) => api.post<ApiResponse>(`/api/servers/${id}/kill`),
};

// Monitoring API
export const monitoringApi = {
  getServerMetrics: (serverId: string) =>
    api.get<ApiResponse<ServerMetrics>>(`/api/monitoring/servers/${serverId}/current`),
  
  getHistoricalMetrics: (serverId: string, params?: {
    from?: string;
    to?: string;
    interval?: string;
  }) => api.get<ApiResponse<ServerMetrics[]>>(`/api/monitoring/servers/${serverId}/metrics`, { params }),
  
  getStats: () => api.get<ApiResponse<MonitoringStats>>('/api/monitoring/stats'),
  
  collectMetrics: () => api.post<ApiResponse>('/api/monitoring/collect'),
};

// Files API
export const filesApi = {
  list: (path: string = '/') => 
    api.get<ApiResponse>('/api/files/list', { params: { path } }),
  
  read: (path: string) => 
    api.get<ApiResponse<{ content: string }>>('/api/files/read', { params: { path } }),
  
  write: (path: string, content: string) => 
    api.post<ApiResponse>('/api/files/write', { path, content }),
  
  delete: (path: string) => 
    api.delete<ApiResponse>('/api/files/delete', { params: { path } }),
  
  createDirectory: (path: string) => 
    api.post<ApiResponse>('/api/files/directory', { path }),
  
  upload: (formData: FormData) => 
    api.post<ApiResponse>('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Workshop API
export const workshopApi = {
  search: (query: string, page?: number) => 
    api.get<ApiResponse>('/api/workshop/search', { 
      params: { query, page } 
    }),
  
  getItem: (id: string) => 
    api.get<ApiResponse>(`/api/workshop/items/${id}`),
  
  install: (serverId: string, itemId: string) => 
    api.post<ApiResponse>(`/api/workshop/servers/${serverId}/install`, { itemId }),
};

// Ctrl management (Categories)
export const ctrlsApi = {
  getAll: () => api.get<ApiResponse<Ctrl[]>>('/api/ctrls'),
  getById: (id: string) => api.get<ApiResponse<Ctrl>>(`/api/ctrls/${id}`),
  create: (data: Partial<Ctrl>) => api.post<ApiResponse<Ctrl>>('/api/ctrls', data),
  update: (id: string, data: Partial<Ctrl>) => api.put<ApiResponse<Ctrl>>(`/api/ctrls/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/api/ctrls/${id}`),
};

// Alt management (Server configurations)
export const altsApi = {
  getAll: (ctrlId?: string) => 
    api.get<ApiResponse<Alt[]>>('/api/alts', { 
      params: ctrlId ? { ctrlId } : {} 
    }),
  getById: (id: string) => api.get<ApiResponse<Alt>>(`/api/alts/${id}`),
  create: (data: Partial<Alt>) => api.post<ApiResponse<Alt>>('/api/alts', data),
  update: (id: string, data: Partial<Alt>) => api.put<ApiResponse<Alt>>(`/api/alts/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/api/alts/${id}`),
  import: (ctrlId: string, altData: any) => 
    api.post<ApiResponse<Alt>>(`/api/alts/import`, { ctrlId, altData }),
  export: (id: string) => api.get<ApiResponse<any>>(`/api/alts/${id}/export`),
};

// Health check
export const healthApi = {
  check: () => api.get<{ status: string; timestamp: string; uptime: number }>('/health'),
};

export default api;
