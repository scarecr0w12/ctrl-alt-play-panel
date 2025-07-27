import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MagnifyingGlassIcon,
  HeartIcon,
  StarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  TagIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  longDescription?: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  reviews: number;
  verified: boolean;
  published: string;
  updated: string;
  homepage?: string;
  repository?: string;
  license: string;
  compatibility: string[];
  screenshots?: string[];
  changelog?: string;
  installed: boolean;
}

const PluginMarketplacePage = () => {
  const { user } = useAuth();
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const categories = [
    'all',
    'game-servers',
    'monitoring',
    'automation',
    'integrations',
    'utilities',
    'analytics',
    'security',
    'backup',
    'optimization'
  ];

  // Mock marketplace data - in production this would come from an API
  const mockPlugins: MarketplacePlugin[] = [
    {
      id: '1',
      name: 'Server Monitor Pro',
      version: '2.1.0',
      author: 'GameTools Inc',
      description: 'Advanced server monitoring with real-time alerts and performance analytics',
      longDescription: 'A comprehensive monitoring solution that provides real-time server performance metrics, automatic alerting, and detailed analytics to help you maintain optimal server performance.',
      category: 'monitoring',
      tags: ['monitoring', 'alerts', 'performance', 'analytics'],
      downloads: 15420,
      rating: 4.8,
      reviews: 324,
      verified: true,
      published: '2024-01-15',
      updated: '2024-01-20',
      license: 'MIT',
      compatibility: ['1.0.0+'],
      installed: false
    },
    {
      id: '2',
      name: 'Auto Backup Manager',
      version: '1.5.2',
      author: 'BackupSolutions',
      description: 'Automated backup system with cloud storage support and scheduling',
      category: 'backup',
      tags: ['backup', 'automation', 'cloud', 'scheduling'],
      downloads: 8930,
      rating: 4.6,
      reviews: 156,
      verified: true,
      published: '2023-12-10',
      updated: '2024-01-18',
      license: 'GPL-3.0',
      compatibility: ['1.0.0+'],
      installed: true
    },
    {
      id: '3',
      name: 'Discord Integration',
      version: '3.0.1',
      author: 'CommunityTools',
      description: 'Connect your game panel with Discord for notifications and management',
      category: 'integrations',
      tags: ['discord', 'notifications', 'integration', 'community'],
      downloads: 23150,
      rating: 4.9,
      reviews: 892,
      verified: true,
      published: '2023-11-20',
      updated: '2024-01-22',
      license: 'MIT',
      compatibility: ['1.0.0+'],
      installed: false
    },
    {
      id: '4',
      name: 'Resource Optimizer',
      version: '1.2.0',
      author: 'OptimizationLab',
      description: 'Optimize server resources and reduce memory usage automatically',
      category: 'optimization',
      tags: ['optimization', 'performance', 'memory', 'cpu'],
      downloads: 5670,
      rating: 4.3,
      reviews: 89,
      verified: false,
      published: '2024-01-05',
      updated: '2024-01-19',
      license: 'Apache-2.0',
      compatibility: ['1.0.0+'],
      installed: false
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPlugins(mockPlugins);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.published).getTime() - new Date(a.published).getTime();
      case 'updated':
        return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      default:
        return 0;
    }
  });

  const installPlugin = async (plugin: MarketplacePlugin) => {
    setInstalling(plugin.id);
    try {
      // Simulate installation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update plugin status
      setPlugins(prev => prev.map(p => 
        p.id === plugin.id ? { ...p, installed: true } : p
      ));
    } catch (err) {
      setError('Failed to install plugin');
    } finally {
      setInstalling(null);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You need to be logged in to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Plugin Marketplace - Ctrl+Alt+Play</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Plugin Marketplace</h1>
                  <p className="mt-2 text-sm text-gray-700">
                    Discover and install plugins to extend your game panel
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest</option>
                    <option value="updated">Recently Updated</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <span className="sr-only">Dismiss</span>
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plugins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : filteredPlugins.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <div key={plugin.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
                        {plugin.verified && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" title="Verified Plugin" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">by {plugin.author}</p>
                    </div>
                    {plugin.installed && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Installed
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4">{plugin.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {plugin.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                        {tag}
                      </span>
                    ))}
                    {plugin.tags.length > 3 && (
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        +{plugin.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>{formatNumber(plugin.downloads)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(Math.floor(plugin.rating))}
                        <span>({plugin.reviews})</span>
                      </div>
                    </div>
                    <span className="text-xs">v{plugin.version}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {plugin.installed ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                      >
                        Installed
                      </button>
                    ) : (
                      <button
                        onClick={() => installPlugin(plugin)}
                        disabled={installing === plugin.id}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {installing === plugin.id ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Installing...
                          </div>
                        ) : (
                          'Install'
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedPlugin(plugin)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Plugin Details Modal */}
        {selectedPlugin && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{selectedPlugin.name}</h3>
                    {selectedPlugin.verified && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPlugin(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Plugin Information</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex">
                        <dt className="w-20 text-gray-500">Version:</dt>
                        <dd className="text-gray-900">{selectedPlugin.version}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-20 text-gray-500">Author:</dt>
                        <dd className="text-gray-900">{selectedPlugin.author}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-20 text-gray-500">Category:</dt>
                        <dd className="text-gray-900">{selectedPlugin.category}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-20 text-gray-500">License:</dt>
                        <dd className="text-gray-900">{selectedPlugin.license}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Statistics</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex">
                        <dt className="w-20 text-gray-500">Downloads:</dt>
                        <dd className="text-gray-900">{selectedPlugin.downloads.toLocaleString()}</dd>
                      </div>
                      <div className="flex items-center">
                        <dt className="w-20 text-gray-500">Rating:</dt>
                        <dd className="flex items-center space-x-1">
                          {renderStars(Math.floor(selectedPlugin.rating))}
                          <span className="text-gray-900">({selectedPlugin.reviews} reviews)</span>
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="w-20 text-gray-500">Published:</dt>
                        <dd className="text-gray-900">{new Date(selectedPlugin.published).toLocaleDateString()}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-20 text-gray-500">Updated:</dt>
                        <dd className="text-gray-900">{new Date(selectedPlugin.updated).toLocaleDateString()}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">
                    {selectedPlugin.longDescription || selectedPlugin.description}
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setSelectedPlugin(null)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {!selectedPlugin.installed && (
                  <button
                    onClick={() => {
                      installPlugin(selectedPlugin);
                      setSelectedPlugin(null);
                    }}
                    disabled={installing === selectedPlugin.id}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Install Plugin
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PluginMarketplacePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  };
};
