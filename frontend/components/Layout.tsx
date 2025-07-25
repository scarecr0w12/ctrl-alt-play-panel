import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  ServerIcon,
  FolderIcon,
  CommandLineIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Servers', href: '/servers', icon: ServerIcon },
  { name: 'Console', href: '/console', icon: CommandLineIcon },
  { name: 'Files', href: '/files', icon: FolderIcon },
  { name: 'Configurations', href: '/ctrls', icon: CogIcon, adminOnly: true },
  { name: 'Monitoring', href: '/monitoring', icon: ChartBarIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || isAdmin
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-panel-dark/95 backdrop-blur-glass border-r border-white/10
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-panel-primary to-panel-secondary rounded-xl flex items-center justify-center">
                <ServerIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Ctrl-Alt-Play</h1>
                <p className="text-xs text-gray-400">Panel v1.0</p>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-panel-secondary to-panel-accent rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {user?.firstName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-panel-dark/95 backdrop-blur-glass border-b border-white/10 px-4 sm:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            
            {title && (
              <h1 className="text-xl font-semibold text-white">
                {title}
              </h1>
            )}
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div className="status-indicator status-online" />
            <span className="text-sm text-gray-400">Panel Online</span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
