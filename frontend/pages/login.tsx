import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ServerIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@example.com');
      setPassword('admin123');
    } else {
      setEmail('user@example.com');
      setPassword('user123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ServerIcon className="w-12 h-12 text-gradient" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">
            Ctrl-Alt-Play Panel
          </h1>
          <p className="text-white/80 mt-2">
            Professional Game Server Management
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-white">
            Welcome Back
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field w-full"
                placeholder="admin@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-white">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field w-full pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="form-checkbox h-4 w-4 text-panel-primary bg-white/10 border-white/20 rounded focus:ring-panel-primary/50"
                />
                <span className="ml-2 text-sm text-white/80">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-white/80 hover:text-white">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-black/20 rounded-lg">
            <h3 className="font-semibold mb-3 text-white">Demo Credentials:</h3>
            <div className="space-y-2">
              <button
                onClick={() => fillDemoCredentials('admin')}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors"
              >
                <div className="text-sm">
                  <span className="font-medium text-panel-primary">Admin:</span>{' '}
                  <span className="text-white/80">admin@example.com / admin123</span>
                </div>
              </button>
              <button
                onClick={() => fillDemoCredentials('user')}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors"
              >
                <div className="text-sm">
                  <span className="font-medium text-panel-secondary">User:</span>{' '}
                  <span className="text-white/80">user@example.com / user123</span>
                </div>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-white hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center space-x-2 text-sm text-white/80">
            <div className="status-indicator status-online" />
            <span>Server Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
