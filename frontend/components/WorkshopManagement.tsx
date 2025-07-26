import React, { useState } from 'react';
import { 
  Button, 
  Modal, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent
} from '@/components/ui';
import { useWorkshop, WorkshopItem, InstalledWorkshopItem } from '@/hooks/useWorkshop';
import { useServers } from '@/hooks';
import { 
  MagnifyingGlassIcon,
  CloudArrowDownIcon,
  TrashIcon,
  StarIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  ServerIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WorkshopManagement: React.FC = () => {
  const { 
    searchResults, 
    installedItems, 
    loading, 
    searchWorkshop, 
    installWorkshopItem, 
    uninstallWorkshopItem, 
    fetchInstalledItems 
  } = useWorkshop();
  
  const { servers } = useServers();
  
  // State for modals and forms
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showUninstallModal, setShowUninstallModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkshopItem | null>(null);
  const [selectedInstalledItem, setSelectedInstalledItem] = useState<InstalledWorkshopItem | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'installed'>('search');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search workshop items
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    try {
      await searchWorkshop(searchTerm, searchType || undefined);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Load installed items for selected server
  const handleServerChange = (serverId: string) => {
    setSelectedServerId(serverId);
    if (serverId) {
      fetchInstalledItems(serverId);
    }
  };

  // Install workshop item
  const handleInstall = async () => {
    if (!selectedItem || !selectedServerId) return;
    
    setIsSubmitting(true);
    try {
      await installWorkshopItem(selectedServerId, selectedItem.id);
      setShowInstallModal(false);
      setSelectedItem(null);
      toast.success('Workshop item installed successfully!');
      
      // Refresh installed items if we're viewing the same server
      if (activeTab === 'installed') {
        fetchInstalledItems(selectedServerId);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Uninstall workshop item
  const handleUninstall = async () => {
    if (!selectedInstalledItem || !selectedServerId) return;
    
    setIsSubmitting(true);
    try {
      await uninstallWorkshopItem(selectedServerId, selectedInstalledItem.workshopId);
      setShowUninstallModal(false);
      setSelectedInstalledItem(null);
      toast.success('Workshop item uninstalled successfully!');
    } catch (error) {
      console.error('Uninstallation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInstallModal = (item: WorkshopItem) => {
    setSelectedItem(item);
    setShowInstallModal(true);
  };

  const openUninstallModal = (item: InstalledWorkshopItem) => {
    setSelectedInstalledItem(item);
    setShowUninstallModal(true);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Star rating component
  const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <StarIcon 
          key={i} 
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">({rating}/5)</span>
    </div>
  );

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors = {
      installed: 'bg-green-100 text-green-800',
      updating: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop Management</h1>
          <p className="text-gray-600 mt-1">Browse and manage Steam Workshop content for your servers</p>
        </div>
      </div>

      {/* Server Selection */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Server
              </label>
              <select
                value={selectedServerId}
                onChange={(e) => handleServerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a server...</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            <span>Browse Workshop</span>
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`${
              activeTab === 'installed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <ServerIcon className="h-4 w-4" />
            <span>Installed Items ({installedItems.length})</span>
          </button>
        </nav>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search workshop items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon />}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="maps">Maps</option>
                    <option value="mods">Mods</option>
                    <option value="collections">Collections</option>
                  </select>
                </div>
                <div>
                  <Button onClick={handleSearch} loading={loading} className="w-full">
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({searchResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try searching for maps, mods, or collections
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {item.previewUrl && (
                        <img 
                          src={item.previewUrl} 
                          alt={item.title}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <UserIcon className="h-4 w-4" />
                          <span>{item.author}</span>
                        </div>
                        
                        <StarRating rating={item.rating} />
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>{new Date(item.publishedDate).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Size: {formatFileSize(item.fileSize)}
                        </div>
                        
                        {item.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <TagIcon className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          size="sm"
                          onClick={() => openInstallModal(item)}
                          disabled={!selectedServerId}
                          className="w-full"
                        >
                          <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                          Install
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Installed Tab */}
      {activeTab === 'installed' && (
        <Card>
          <CardHeader>
            <CardTitle>Installed Workshop Items ({installedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedServerId ? (
              <div className="text-center py-12">
                <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No server selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please select a server to view installed workshop items
                </p>
              </div>
            ) : installedItems.length === 0 ? (
              <div className="text-center py-12">
                <CloudArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items installed</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Browse the workshop to install items for this server
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Installed
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {installedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500">ID: {item.workshopId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(item.fileSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.installedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openUninstallModal(item)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Install Confirmation Modal */}
      <Modal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Install Workshop Item"
        description="Confirm installation of this workshop item"
        size="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              {selectedItem.previewUrl && (
                <img 
                  src={selectedItem.previewUrl} 
                  alt={selectedItem.title}
                  className="w-20 h-20 object-cover rounded-md"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{selectedItem.title}</h3>
                <p className="text-sm text-gray-600">{selectedItem.author}</p>
                <p className="text-sm text-gray-500">Size: {formatFileSize(selectedItem.fileSize)}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                This item will be installed on: <strong>
                  {servers.find(s => s.id === selectedServerId)?.name || 'Selected Server'}
                </strong>
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInstallModal(false)}
              >
                Cancel
              </Button>
              <Button
                loading={isSubmitting}
                onClick={handleInstall}
              >
                Install Item
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Uninstall Confirmation Modal */}
      <Modal
        isOpen={showUninstallModal}
        onClose={() => setShowUninstallModal(false)}
        title="Uninstall Workshop Item"
        description="Are you sure you want to uninstall this item?"
        size="md"
      >
        {selectedInstalledItem && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  This will permanently remove the workshop item
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Item: <strong>{selectedInstalledItem.title}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUninstallModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                loading={isSubmitting}
                onClick={handleUninstall}
              >
                Uninstall Item
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkshopManagement;
