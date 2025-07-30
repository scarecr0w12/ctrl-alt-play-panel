/**
 * Plugin system type definitions and interfaces
 */

import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';

/**
 * Plugin metadata structure from plugin.yaml
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author: string;
  license?: string;
  main?: string;
  compatibility?: {
    min_panel_version?: string;
    max_panel_version?: string;
  };
  permissions?: PluginPermissions;
  dependencies?: {
    npm?: string[];
    plugins?: string[];
  };
  settings?: PluginSetting[];
  integration_points?: {
    navigation?: NavigationItem[];
    dashboard_widgets?: DashboardWidget[];
    api_endpoints?: ApiEndpoint[];
  };
}

/**
 * Plugin permissions structure
 */
export interface PluginPermissions {
  database?: {
    read?: string[];
    write?: string[];
    schema?: boolean;
  };
  filesystem?: {
    read?: string[];
    write?: string[];
  };
  api?: {
    create_endpoints?: boolean;
    access_existing?: string[];
  };
  frontend?: {
    add_navigation?: boolean;
    extend_pages?: string[];
  };
  external?: {
    network_access?: boolean;
    agent_communication?: boolean;
  };
}

/**
 * Plugin setting definition
 */
export interface PluginSetting {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  required?: boolean;
  default?: string | number | boolean;
  description?: string;
  options?: { value: string | number | boolean; label: string }[];
}

/**
 * Navigation item definition
 */
export interface NavigationItem {
  title: string;
  path: string;
  icon?: string;
  permissions?: string[];
}

/**
 * Dashboard widget definition
 */
export interface DashboardWidget {
  name: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
  permissions?: string[];
}

/**
 * API endpoint definition
 */
export interface ApiEndpoint {
  path: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  permissions?: string[];
}

/**
 * Plugin context provided to plugins
 */
export interface PluginContext {
  pluginName: string;
  pluginPath: string;
  getData: (key: string) => Promise<unknown>;
  setData: (key: string, value: unknown) => Promise<void>;
  logger: Logger;
}

/**
 * Route handler function type
 */
export type RouteHandler = (req: Request, res: Response, next?: NextFunction) => void | Promise<void>;

/**
 * Plugin API call interface
 */
export interface PluginAPICall {
  endpoint: string;
  method?: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
}
