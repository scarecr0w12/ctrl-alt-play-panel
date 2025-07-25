import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { filesApi } from '@/lib/api';
import {
  FolderIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FolderPlusIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  permissions?: string;
}

export default function FilesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { serverId } = router.query;
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    if (serverId && typeof serverId === 'string') {
      loadFiles();
    }
  }, [serverId, currentPath]);

  const loadFiles = async () => {
    if (typeof serverId !== 'string') return;
    
    try {
      setLoading(true);
      const response = await filesApi.list(currentPath);
      if (response.data.success) {
        setFiles(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      const newPath = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      navigateToPath(newPath);
    } else {
      // Open file for editing or viewing
      router.push(`/files/${serverId}/edit?path=${encodeURIComponent(currentPath)}/${encodeURIComponent(file.name)}`);
    }
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(name => name !== fileName)
        : [...prev, fileName]
    );
  };

  const handleDelete = async () => {
    if (selectedFiles.length === 0 || typeof serverId !== 'string') return;
    
    if (!confirm(`Delete ${selectedFiles.length} selected item(s)?`)) return;

    try {
      for (const fileName of selectedFiles) {
        const filePath = currentPath === '/' 
          ? `/${fileName}` 
          : `${currentPath}/${fileName}`;
        await filesApi.delete(filePath);
      }
      await loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  };

  const getPathSegments = () => {
    return currentPath.split('/').filter(segment => segment !== '');
  };

  const navigateUp = () => {
    const segments = getPathSegments();
    if (segments.length === 0) return;
    
    segments.pop();
    const newPath = segments.length === 0 ? '/' : `/${segments.join('/')}`;
    navigateToPath(newPath);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!serverId) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <DocumentIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Server Selected</h2>
            <p className="text-gray-400">Please select a server to view files.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-panel-primary/20 rounded-lg flex items-center justify-center">
                  <FolderIcon className="w-6 h-6 text-panel-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">File Manager</h1>
                  <p className="text-gray-400">Server: {serverId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  <span>Upload</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={selectedFiles.length === 0}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete ({selectedFiles.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={navigateUp}
                  disabled={currentPath === '/'}
                  className="p-2 bg-panel-surface hover:bg-panel-light disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  ←
                </button>
                
                <div className="flex items-center space-x-1 text-sm">
                  <button 
                    onClick={() => navigateToPath('/')}
                    className="text-panel-primary hover:text-panel-primary/80"
                  >
                    /
                  </button>
                  {getPathSegments().map((segment, index) => {
                    const segmentPath = '/' + getPathSegments().slice(0, index + 1).join('/');
                    return (
                      <span key={index} className="flex items-center space-x-1">
                        <span className="text-gray-400">/</span>
                        <button
                          onClick={() => navigateToPath(segmentPath)}
                          className="text-panel-primary hover:text-panel-primary/80"
                        >
                          {segment}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="bg-panel-darker p-4 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-3">Modified</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panel-primary mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading files...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-8 text-center">
                  <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchQuery ? 'No files match your search' : 'No files in this directory'}
                  </p>
                </div>
              ) : (
                filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      selectedFiles.includes(file.name) ? 'bg-panel-primary/10' : ''
                    }`}
                  >
                    <div className="col-span-6 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.name)}
                        onChange={() => handleFileSelect(file.name)}
                        className="rounded border-gray-600 bg-panel-surface text-panel-primary focus:ring-panel-primary"
                      />
                      
                      <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        {file.type === 'directory' ? (
                          <FolderIcon className="h-5 w-5 text-blue-400" />
                        ) : (
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-white hover:text-panel-primary transition-colors">
                          {file.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-gray-400 text-sm">
                      {file.type === 'file' ? formatFileSize(file.size || 0) : '-'}
                    </div>
                    
                    <div className="col-span-3 text-gray-400 text-sm">
                      {formatDate(file.modified)}
                    </div>
                    
                    <div className="col-span-1">
                      {file.type === 'file' && (
                        <button
                          onClick={() => handleFileClick(file)}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
