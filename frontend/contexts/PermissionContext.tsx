import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Permission definitions that match the backend
export const PERMISSIONS = {
  // User Management
  'users.view': 'View user information',
  'users.create': 'Create new users',
  'users.edit': 'Edit user information',
  'users.delete': 'Delete users',
  'users.manage.permissions': 'Manage user permissions',
  'users.manage.roles': 'Manage user roles',
  
  // Server Management
  'servers.view': 'View servers',
  'servers.create': 'Create new servers',
  'servers.edit': 'Edit server configuration',
  'servers.delete': 'Delete servers',
  'servers.start': 'Start servers',
  'servers.stop': 'Stop servers',
  'servers.restart': 'Restart servers',
  'servers.manage': 'Full server management',
  
  // File Management
  'files.view': 'View files',
  'files.upload': 'Upload files',
  'files.download': 'Download files',
  'files.edit': 'Edit files',
  'files.delete': 'Delete files',
  
  // Node Management
  'nodes.view': 'View nodes',
  'nodes.create': 'Create new nodes',
  'nodes.edit': 'Edit node configuration',
  'nodes.delete': 'Delete nodes',
  
  // Monitoring
  'monitoring.view': 'View monitoring data',
  'monitoring.metrics': 'View detailed metrics',
  'monitoring.alerts': 'Manage alerts',
  
  // API Management
  'api.keys.view': 'View API keys',
  'api.keys.create': 'Create API keys',
  'api.keys.revoke': 'Revoke API keys',
  
  // Workshop
  'workshop.view': 'View workshop content',
  'workshop.manage': 'Manage workshop content',
  
  // Audit Logs
  'audit.view': 'View audit logs',
  'audit.export': 'Export audit logs',
  
  // System Settings
  'system.settings.view': 'View system settings',
  'system.settings.edit': 'Edit system settings',
  
  // Security
  'security.view': 'View security logs',
  'security.manage': 'Manage security settings',
} as const;

export type Permission = keyof typeof PERMISSIONS;

interface UserPermissions {
  permissions: Permission[];
  role: string;
}

interface PermissionContextType {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPermissions();
    } else {
      setPermissions([]);
    }
  }, [isAuthenticated, user]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/permissions');
      
      if (response.data.success) {
        setPermissions(response.data.data.permissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Root admin has all permissions
    if (user.role === 'ADMIN' && (user as any).rootAdmin) return true;
    
    return permissions.includes(permission);
  };

  const hasAnyPermission = (checkPermissions: Permission[]): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Root admin has all permissions
    if (user.role === 'ADMIN' && (user as any).rootAdmin) return true;
    
    return checkPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (checkPermissions: Permission[]): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Root admin has all permissions
    if (user.role === 'ADMIN' && (user as any).rootAdmin) return true;
    
    return checkPermissions.every(permission => permissions.includes(permission));
  };

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
