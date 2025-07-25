import axios from 'axios';

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

// Types for external agent integration
export interface AgentStatus {
  online: boolean;
  version?: string;
  uptime?: number;
  serverCount?: number;
  lastSeen?: Date;
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
