// Common types used across the application

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export interface Node {
  id: string;
  name: string;
  fqdn: string;
  scheme: 'http' | 'https';
  port: number;
  publicPort: number;
  memory: number;
  disk: number;
  locationId: string;
  isPublic: boolean;
  isBehindProxy: boolean;
  isMaintenanceMode: boolean;
  daemonToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Server {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  userId: string;
  nodeId: string;
  altId: string;
  status: ServerStatus;
  memory: number;
  disk: number;
  cpu: number;
  swap: number;
  io: number;
  image: string;
  startup: string;
  environment: Record<string, any>;
  limits: ServerLimits;
  feature_limits: ServerFeatureLimits;
  allocation: Allocation;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServerStatus {
  INSTALLING = 'installing',
  INSTALL_FAILED = 'install_failed',
  SUSPENDED = 'suspended',
  OFFLINE = 'offline',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  CRASHED = 'crashed'
}

export interface ServerLimits {
  memory: number;
  swap: number;
  disk: number;
  io: number;
  cpu: number;
  threads?: string;
  oomKiller: boolean;
}

export interface ServerFeatureLimits {
  databases: number;
  allocations: number;
  backups: number;
}

export interface Allocation {
  id: string;
  ip: string;
  port: number;
  alias?: string;
  serverId?: string;
  nodeId: string;
  isPrimary: boolean;
}

export interface Ctrl {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  alts: Alt[];
}

export interface Alt {
  id: string;
  name: string;
  description?: string;
  dockerImage: string;
  startup: string;
  configFiles: string;
  configStartup: string;
  configLogs: string;
  configStop?: string;
  ctrlId: string;
  variables: AltVariable[];
}

export interface AltVariable {
  id: string;
  name: string;
  description: string;
  envVariable: string;
  defaultValue: string;
  userViewable: boolean;
  userEditable: boolean;
  rules: string;
}

export interface Agent {
  id: string;
  nodeId: string;
  version: string;
  status: AgentStatus;
  lastHeartbeat: Date;
  systemInfo: AgentSystemInfo;
}

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error'
}

export interface AgentSystemInfo {
  platform: string;
  arch: string;
  cpuCount: number;
  totalMemory: number;
  freeMemory: number;
  totalDisk: number;
  freeDisk: number;
  uptime: number;
  dockerVersion?: string;
}

export interface LogEntry {
  id: string;
  serverId?: string;
  userId?: string;
  action: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FileManagerItem {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  permissions: string;
  modified: Date;
  isSymlink: boolean;
}

export interface ServerStats {
  memory: {
    current: number;
    limit: number;
  };
  cpu: {
    current: number;
    cores: number;
  };
  disk: {
    current: number;
    limit: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: number;
}

export interface Backup {
  id: string;
  serverId: string;
  name: string;
  size: number;
  checksum: string;
  isSuccessful: boolean;
  isLocked: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface Database {
  id: string;
  serverId: string;
  name: string;
  username: string;
  remote: string;
  maxConnections: number;
  createdAt: Date;
  updatedAt: Date;
}
