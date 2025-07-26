import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, Permission } from '@/contexts/PermissionContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  adminOnly = false,
  fallback = null 
}: PermissionGuardProps) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-panel-primary"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return fallback;
  }

  // Check admin requirement
  if (adminOnly && !isAdmin) {
    return fallback;
  }

  // Root admin bypass
  if (user?.rootAdmin) {
    return <>{children}</>;
  }

  // Check specific permission
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll && !hasAllPermissions(permissions)) {
      return fallback;
    }
    if (!requireAll && !hasAnyPermission(permissions)) {
      return fallback;
    }
  }

  return <>{children}</>;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  adminOnly = false,
  permission,
  permissions,
  requireAll = false
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionLoading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !permissionLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Admin only check
      if (adminOnly && !isAdmin) {
        router.push('/dashboard');
        return;
      }

      // Permission checks (skip for root admin)
      if (!user?.rootAdmin) {
        // Check specific permission
        if (permission && !hasPermission(permission)) {
          router.push('/dashboard');
          return;
        }

        // Check multiple permissions
        if (permissions && permissions.length > 0) {
          if (requireAll && !hasAllPermissions(permissions)) {
            router.push('/dashboard');
            return;
          }
          if (!requireAll && !hasAnyPermission(permissions)) {
            router.push('/dashboard');
            return;
          }
        }
      }
    }
  }, [isAuthenticated, isAdmin, loading, permissionLoading, router, adminOnly, permission, permissions, requireAll, user?.rootAdmin, hasPermission, hasAnyPermission, hasAllPermissions]);

  // Show loading while checking authentication and permissions
  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-panel-primary mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not authorized
  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  // Permission checks (skip for root admin)
  if (!user?.rootAdmin) {
    if (permission && !hasPermission(permission)) {
      return null;
    }

    if (permissions && permissions.length > 0) {
      if (requireAll && !hasAllPermissions(permissions)) {
        return null;
      }
      if (!requireAll && !hasAnyPermission(permissions)) {
        return null;
      }
    }
  }

  return <>{children}</>;
}
