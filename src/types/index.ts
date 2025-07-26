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
  environment: Record<string, string | number | boolean>;
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
  author: string;
  version: string;
  changelog?: string;
  isTemplate: boolean;
  dockerImage: string;
  startup: string;
  configFiles: string;
  configStartup: string;
  configLogs: string;
  configStop?: string;
  scriptInstall?: string;
  scriptEntry: string;
  scriptContainer: string;
  copyScriptFrom?: string;
  features?: any;
  fileDenylist?: any;
  forceOutgoingIp: boolean;
  ctrlId: string;
  variables: AltVariable[];
  createdAt: Date;
  updatedAt: Date;
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

export interface LogEntry {
  id: string;
  serverId?: string;
  userId?: string;
  action: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface ApiResponse<T = unknown> {
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
