/**
 * Plugin SDK Type Definitions
 * Comprehensive TypeScript definitions for plugin development
 */

export interface PluginConfig {
  name: string;
  version: string;
  author: string;
  description?: string;
  permissions?: PluginPermissions;
  dependencies?: PluginDependency[];
  apis?: ApiDefinition[];
  hooks?: HookDefinition[];
}

export interface PluginPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  network: boolean;
  database: boolean;
  filesystem: boolean;
  routes: boolean;
  hooks: boolean;
}

export interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

export interface ApiDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  middleware?: string[];
  auth?: boolean;
  description?: string;
  parameters?: ParameterDefinition[];
  responses?: ResponseDefinition[];
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  validation?: ValidationRule[];
}

export interface ResponseDefinition {
  status: number;
  description: string;
  schema?: object;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

export interface HookDefinition {
  name: string;
  type: 'before' | 'after' | 'replace';
  target: string;
  handler: string;
  priority?: number;
}

export interface PluginContext {
  name: string;
  version: string;
  config: PluginConfig;
  logger: PluginLogger;
  database: PluginDatabase;
  api: PluginApi;
  events: PluginEvents;
  hooks: PluginHooks;
}

export interface PluginLogger {
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
  debug(message: string, meta?: object): void;
  child(options: object): PluginLogger;
}

export interface PluginDatabase {
  query(sql: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (tx: PluginTransaction) => Promise<T>): Promise<T>;
  model(name: string): PluginModel;
}

export interface PluginTransaction {
  query(sql: string, params?: any[]): Promise<any>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface PluginModel {
  create(data: object): Promise<any>;
  findMany(filter?: object): Promise<any[]>;
  findUnique(filter: object): Promise<any>;
  update(filter: object, data: object): Promise<any>;
  delete(filter: object): Promise<any>;
}

export interface PluginApi {
  get(path: string, options?: RequestOptions): Promise<ApiResponse>;
  post(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse>;
  put(path: string, data?: any, options?: RequestOptions): Promise<ApiResponse>;
  delete(path: string, options?: RequestOptions): Promise<ApiResponse>;
  registerRoute(definition: ApiDefinition): void;
  unregisterRoute(path: string, method: string): void;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  auth?: boolean;
}

export interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

export interface PluginEvents {
  emit(event: string, data?: any): void;
  on(event: string, handler: (data?: any) => void): void;
  off(event: string, handler?: (data?: any) => void): void;
  once(event: string, handler: (data?: any) => void): void;
}

export interface PluginHooks {
  register(definition: HookDefinition): void;
  unregister(name: string): void;
  trigger(name: string, data?: any): Promise<any>;
}

// Development-specific types
export interface DevServerOptions {
  port: number;
  host?: string;
  watch?: boolean;
  hotReload?: boolean;
  cors?: boolean;
}

export interface BuildOptions {
  output: string;
  production: boolean;
  minify?: boolean;
  sourceMaps?: boolean;
  bundleAnalyzer?: boolean;
}

export interface TestOptions {
  watch: boolean;
  coverage: boolean;
  verbose?: boolean;
  testPattern?: string;
  reporters?: string[];
}

export interface DocGenerationOptions {
  output: string;
  format: 'html' | 'markdown' | 'json';
  includeExamples?: boolean;
  includeApi?: boolean;
  template?: string;
}

// Plugin template types
export interface PluginTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
  dependencies?: string[];
  instructions?: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'number';
  default?: any;
  description?: string;
  required?: boolean;
}

// Testing types
export interface MockConfig {
  database?: boolean;
  api?: boolean;
  events?: boolean;
  filesystem?: boolean;
}

export interface TestCase {
  name: string;
  description?: string;
  setup?: () => Promise<void>;
  test: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestSuite {
  name: string;
  cases: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

// Frontend types (for React components)
export interface PluginComponentProps {
  plugin: PluginConfig;
  context: PluginContext;
  onUpdate?: (data: any) => void;
}

export interface PluginHookReturn<T = any> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UsePluginApiOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  autoFetch?: boolean;
}