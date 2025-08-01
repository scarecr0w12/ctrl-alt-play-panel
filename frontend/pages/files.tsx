import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import FileManagerGrid from '@/components/FileManagerGrid';
import FileOperationsToolbar from '@/components/FileOperationsToolbar';
import FilePreviewModal from '@/components/FilePreviewModal';
import FileUploadProgress from '@/components/FileUploadProgress';
import FilePermissionsDialog from '@/components/FilePermissionsDialog';
import { useFiles, FileItem } from '@/hooks/useFiles';
import { useNotification } from '@/contexts/NotificationContext';
import {
  FolderIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export default function FilesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { serverId } = router.query;
  const { success, info } = useNotification();
  
  const {
    files,
    currentPath,
    loading,
    error,
    navigateTo,
    goUp,
    refetch,
    createFile,
    createDirectory,
    deleteFile,
    renameFile,
  } = useFiles(serverId as string);

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [permissionsFile, setPermissionsFile] = useState<FileItem | null>(null);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      const newPath = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      navigateTo(newPath);
      setSelectedFiles([]);
    } else {
      // For files, open the edit page
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

  const handleFileAction = async (action: string, file: FileItem) => {
    const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
    
    try {
      switch (action) {
        case 'preview':
          setPreviewFile(file);
          break;
        case 'edit':
          router.push(`/files/${serverId}/edit?path=${encodeURIComponent(filePath)}`);
          break;
        case 'download':
          window.open(`/api/files/download?serverId=${serverId}&path=${encodeURIComponent(filePath)}`, '_blank');
          break;
        case 'copy':
          try {
            // Copy file path to clipboard
            await navigator.clipboard.writeText(filePath);
            success(`Copied path: ${filePath}`);
          } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = filePath;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            success(`Copied path: ${filePath}`);
          }
          break;
        case 'rename':
          const newName = prompt('Enter new name:', file.name);
          if (newName && newName !== file.name) {
            const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
            await renameFile(filePath, newPath);
          }
          break;
        case 'permissions':
          setPermissionsFile(file);
          setShowPermissionsDialog(true);
          break;
        case 'delete':
          if (confirm(`Delete ${file.name}?`)) {
            await deleteFile(filePath);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} file:`, error);
    }
  };

  const handleBatchAction = async (action: string, data?: any) => {
    if (!serverId) return;

    try {
      switch (action) {
        case 'delete':
          if (selectedFiles.length === 0) return;
          if (!confirm(`Delete ${selectedFiles.length} selected item(s)?`)) return;
          
          for (const fileName of selectedFiles) {
            const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
            await deleteFile(filePath);
          }
          setSelectedFiles([]);
          break;

        case 'copy':
        case 'move':
          if (selectedFiles.length === 0) return;
          info(`${action} operation will be implemented`);
          break;

        case 'archive':
          if (selectedFiles.length === 0) return;
          info(`Archive creation (${data?.format}) will be implemented`);
          break;

        case 'upload':
          setShowUploadModal(true);
          break;

        case 'refresh':
          await refetch();
          success('File list refreshed');
          break;

        default:
          info(`${action} operation will be implemented`);
      }
    } catch (error) {
      console.error(`Failed to perform batch ${action}:`, error);
    }
  };

  const handleNewFile = async () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
        await createFile(filePath);
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const folderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
        await createDirectory(folderPath);
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  };

  const getPathSegments = () => {
    return currentPath.split('/').filter(segment => segment !== '');
  };

  const navigateUp = () => {
    goUp();
    setSelectedFiles([]);
  };

  // Filter files based on search query and filter type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'file' && file.type === 'file') ||
      (filter === 'directory' && file.type === 'directory') ||
      (filter === 'image' && file.type === 'file' && /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(file.name)) ||
      (filter === 'text' && file.type === 'file' && /\.(txt|md|log|cfg|conf|ini|json|xml|yml|yaml)$/i.test(file.name)) ||
      (filter === 'archive' && file.type === 'file' && /\.(zip|tar|gz|rar|7z)$/i.test(file.name));
    
    return matchesSearch && matchesFilter;
  });

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

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <DocumentIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Files</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
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
                  <h1 className="text-2xl font-bold text-white">Advanced File Manager</h1>
                  <p className="text-gray-400">Server: {serverId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="glass-card rounded-xl p-4">
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
                  onClick={() => navigateTo('/')}
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
                        onClick={() => navigateTo(segmentPath)}
                        className="text-panel-primary hover:text-panel-primary/80"
                      >
                        {segment}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Operations Toolbar */}
          <FileOperationsToolbar
            selectedFiles={selectedFiles}
            onBatchAction={handleBatchAction}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onUpload={() => setShowUploadModal(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
          />

          {/* File Grid */}
          <FileManagerGrid
            files={filteredFiles}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileClick={handleFileClick}
            onFileAction={handleFileAction}
            onBatchAction={handleBatchAction}
            loading={loading}
            searchQuery={searchQuery}
          />

          {/* Modals */}
          <FilePreviewModal
            file={previewFile}
            serverId={serverId as string}
            currentPath={currentPath}
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            onEdit={handleFileClick}
            onDownload={(file) => handleFileAction('download', file)}
          />

          <FileUploadProgress
            isOpen={showUploadModal}
            serverId={serverId as string}
            currentPath={currentPath}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={() => {
              setShowUploadModal(false);
              refetch();
              success('Files uploaded successfully');
            }}
          />

          <FilePermissionsDialog
            file={permissionsFile}
            serverId={serverId as string}
            currentPath={currentPath}
            isOpen={showPermissionsDialog}
            onClose={() => {
              setShowPermissionsDialog(false);
              setPermissionsFile(null);
            }}
            onPermissionsUpdated={() => {
              refetch();
              success('File permissions updated');
            }}
          />
        </div>
      </div>
    </Layout>
  );
}
