import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const lastAuthState = useRef(isAuthenticated);

  useEffect(() => {
    // Reset redirect flag when auth state changes from false to true
    if (lastAuthState.current !== isAuthenticated) {
      if (isAuthenticated) {
        hasRedirected.current = false;
      }
      lastAuthState.current = isAuthenticated;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only redirect after loading is complete AND we have definitive auth state
    // Prevent multiple redirects with hasRedirected flag
    if (!loading && !hasRedirected.current) {
      if (!isAuthenticated) {
        console.log('🔒 [PROTECTED] Not authenticated - redirecting to login');
        hasRedirected.current = true;
        router.push('/login');
      } else if (adminOnly && !isAdmin) {
        console.log('🔒 [PROTECTED] Not admin - redirecting to dashboard');
        hasRedirected.current = true;
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, loading, router, adminOnly]);

  // Show loading while checking authentication
  if (loading) {
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
  if (!isAuthenticated || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
