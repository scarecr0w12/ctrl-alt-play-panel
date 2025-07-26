import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import FilePreviewModal from '@/components/files/FilePreviewModal';
import FilePermissionsDialog from '@/components/files/FilePermissionsDialog';
import FileContextMenu from '@/components/files/FileContextMenu';
import BatchOperationsToolbar from '@/components/files/BatchOperationsToolbar';
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
  EyeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  permissions?: string;
  path?: string; // Added for context menu usage
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Modal states
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
  }>({ isOpen: false, filePath: '', fileName: '' });
  
  const [permissionsDialog, setPermissionsDialog] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
  }>({ isOpen: false, filePath: '', fileName: '' });
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    file: { name: string; type: 'file' | 'directory'; path: string } | null;
  }>({ isOpen: false, x: 0, y: 0, file: null });

  // Clipboard for copy/move operations
  const [clipboard, setClipboard] = useState<{
    files: string[];
    operation: 'copy' | 'move' | null;
  }>({ files: [], operation: null });

  useEffect(() => {
    if (serverId && typeof serverId === 'string') {
      loadFiles();
    }
  }, [serverId, currentPath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in inputs
      }

      // Handle shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            if (selectedFiles.length > 0) {
              e.preventDefault();
              setClipboard({ files: [...selectedFiles], operation: 'copy' });
              toast.success(`Copied ${selectedFiles.length} file(s) to clipboard`);
            }
            break;
          case 'x':
            if (selectedFiles.length > 0) {
              e.preventDefault();
              setClipboard({ files: [...selectedFiles], operation: 'move' });
              toast.success(`Cut ${selectedFiles.length} file(s) to clipboard`);
            }
            break;
          case 'v':
            if (clipboard.files.length > 0 && clipboard.operation) {
              e.preventDefault();
              handlePaste();
            }
            break;
          case 'a':
            e.preventDefault();
            selectAllFiles();
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
            if (selectedFiles.length > 0) {
              e.preventDefault();
              handleDelete();
            }
            break;
          case 'Escape':
            setSelectedFiles([]);
            setContextMenu({ ...contextMenu, isOpen: false });
            break;
          case ' ':
            if (selectedFiles.length === 1) {
              e.preventDefault();
              const file = files.find(f => f.name === selectedFiles[0]);
              if (file && file.type === 'file') {
                const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                handlePreview(filePath, file.name);
              }
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, clipboard, files, currentPath]);

  const selectAllFiles = () => {
    setSelectedFiles(filteredFiles.map(f => f.name));
  };

  const handlePaste = async () => {
    if (!clipboard.operation || clipboard.files.length === 0) return;

    try {
      if (clipboard.operation === 'copy') {
        await handleBatchCopy(currentPath);
      } else {
        await handleBatchMove(currentPath);
      }
      setClipboard({ files: [], operation: null });
    } catch (error) {
      console.error('Paste operation failed:', error);
    }
  };

  const loadFiles = async () => {
    if (typeof serverId !== 'string') return;
    
    try {
      setLoading(true);
      const response = await filesApi.getFiles(serverId as string, currentPath);
      if (response.data.success) {
        setFiles(response.data.files || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
    setClipboard({ files: [], operation: null });
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

  const handleFileRightClick = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      file: { name: file.name, type: file.type, path: filePath }
    });
  };

  const handleFileSelect = (fileName: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedFiles(prev => 
        prev.includes(fileName) 
          ? prev.filter(name => name !== fileName)
          : [...prev, fileName]
      );
    } else {
      setSelectedFiles([fileName]);
    }
  };

  const handlePreview = (filePath: string, fileName: string) => {
    setPreviewModal({
      isOpen: true,
      filePath,
      fileName
    });
  };

  const handlePermissions = (filePath: string, fileName: string) => {
    setPermissionsDialog({
      isOpen: true,
      filePath,
      fileName
    });
  };

  const handleContextAction = async (action: string) => {
    if (!contextMenu.file) return;

    const file = contextMenu.file;
    
    switch (action) {
      case 'preview':
        if (file.type === 'file') {
          handlePreview(file.path, file.name);
        }
        break;
      case 'edit':
        if (file.type === 'file' && file.path) {
          router.push(`/files/${serverId}/edit?path=${encodeURIComponent(file.path)}`);
        }
        break;
      case 'open':
        if (file.type === 'directory' && file.path) {
          navigateToPath(file.path);
        }
        break;
      case 'download':
        if (file.type === 'file' && file.path) {
          try {
            const response = await filesApi.download(serverId as string, file.path);
            const url = URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            toast.error('Failed to download file');
          }
        }
        break;
      case 'copy':
        setClipboard({ files: [file.name], operation: 'copy' });
        toast.success('File copied to clipboard');
        break;
      case 'move':
        setClipboard({ files: [file.name], operation: 'move' });
        toast.success('File cut to clipboard');
        break;
      case 'permissions':
        handlePermissions(file.path, file.name);
        break;
      case 'archive':
        if (file.type === 'directory') {
          handleSingleArchive(file.name);
        }
        break;
      case 'extract':
        if (file.type === 'file' && file.path) {
          handleExtractArchive(file.path);
        }
        break;
      case 'delete':
        setSelectedFiles([file.name]);
        handleDelete();
        break;
    }
  };

  const handleSingleArchive = async (fileName: string) => {
    try {
      const archiveName = `${fileName}.zip`;
      const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
      const archivePath = currentPath === '/' ? `/${archiveName}` : `${currentPath}/${archiveName}`;
      
      await filesApi.createArchive(serverId as string, [filePath], archivePath, 'zip');
      toast.success('Archive created successfully');
      await loadFiles();
    } catch (error) {
      toast.error('Failed to create archive');
    }
  };

  const handleExtractArchive = async (archivePath: string) => {
    try {
      const extractPath = currentPath === '/' ? '/extracted' : `${currentPath}/extracted`;
      await filesApi.extractArchive(serverId as string, archivePath, extractPath);
      toast.success('Archive extracted successfully');
      await loadFiles();
    } catch (error) {
      toast.error('Failed to extract archive');
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.length === 0 || typeof serverId !== 'string') return;
    
    if (!confirm(`Delete ${selectedFiles.length} selected item(s)?`)) return;

    try {
      const filePaths = selectedFiles.map(fileName => 
        currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      );
      
      await filesApi.batchOperation(serverId as string, 'delete', filePaths);
      toast.success(`Deleted ${selectedFiles.length} file(s)`);
      await loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to delete files:', error);
      toast.error('Failed to delete files');
    }
  };

  const handleBatchCopy = async (destination: string) => {
    if (selectedFiles.length === 0 || typeof serverId !== 'string') return;

    try {
      const filePaths = selectedFiles.map(fileName => 
        currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      );
      
      await filesApi.batchOperation(serverId as string, 'copy', filePaths, destination);
      toast.success(`Copied ${selectedFiles.length} file(s)`);
      await loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to copy files:', error);
      toast.error('Failed to copy files');
    }
  };

  const handleBatchMove = async (destination: string) => {
    if (selectedFiles.length === 0 || typeof serverId !== 'string') return;

    try {
      const filePaths = selectedFiles.map(fileName => 
        currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      );
      
      await filesApi.batchOperation(serverId as string, 'move', filePaths, destination);
      toast.success(`Moved ${selectedFiles.length} file(s)`);
      await loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to move files:', error);
      toast.error('Failed to move files');
    }
  };

  const handleBatchArchive = async (archiveName: string, format: string) => {
    if (selectedFiles.length === 0 || typeof serverId !== 'string') return;

    try {
      const filePaths = selectedFiles.map(fileName => 
        currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      );
      const archivePath = currentPath === '/' ? `/${archiveName}` : `${currentPath}/${archiveName}`;
      
      await filesApi.createArchive(serverId as string, filePaths, archivePath, format);
      toast.success('Archive created successfully');
      await loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to create archive:', error);
      toast.error('Failed to create archive');
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
                  <h1 className="text-2xl font-bold text-white">Advanced File Manager</h1>
                  <p className="text-gray-400">Server: {serverId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="flex bg-panel-darker rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-panel-primary text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-panel-primary text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                </div>

                {/* Clipboard indicator */}
                {clipboard.files.length > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-panel-primary/20 border border-panel-primary/40 rounded-lg">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-panel-primary" />
                    <span className="text-sm text-panel-primary">
                      {clipboard.files.length} file(s) {clipboard.operation === 'copy' ? 'copied' : 'cut'}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation & Search */}
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
                
                {/* Enhanced Breadcrumb Navigation */}
                <div className="flex items-center space-x-1 text-sm">
                  <button 
                    onClick={() => navigateToPath('/')}
                    className="text-panel-primary hover:text-panel-primary/80 px-2 py-1 rounded hover:bg-panel-primary/10 transition-colors"
                  >
                    Home
                  </button>
                  {getPathSegments().map((segment, index) => {
                    const segmentPath = '/' + getPathSegments().slice(0, index + 1).join('/');
                    return (
                      <span key={index} className="flex items-center space-x-1">
                        <span className="text-gray-400">/</span>
                        <button
                          onClick={() => navigateToPath(segmentPath)}
                          className="text-panel-primary hover:text-panel-primary/80 px-2 py-1 rounded hover:bg-panel-primary/10 transition-colors"
                        >
                          {segment}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Enhanced Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Quick Actions */}
                <button
                  onClick={selectAllFiles}
                  className="px-3 py-2 bg-panel-surface hover:bg-panel-light border border-white/20 rounded-lg text-white transition-colors"
                  title="Select All (Ctrl+A)"
                >
                  Select All
                </button>
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="bg-panel-darker p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300 flex-1">
                  <div className="col-span-6 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={() => {
                        if (selectedFiles.length === filteredFiles.length) {
                          setSelectedFiles([]);
                        } else {
                          selectAllFiles();
                        }
                      }}
                      className="rounded border-gray-600 bg-panel-surface text-panel-primary focus:ring-panel-primary"
                    />
                    <span>Name</span>
                  </div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-3">Modified</div>
                  <div className="col-span-1">Actions</div>
                </div>
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
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-panel-primary hover:text-panel-primary/80"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      selectedFiles.includes(file.name) ? 'bg-panel-primary/10' : ''
                    }`}
                    onContextMenu={(e) => handleFileRightClick(e, file)}
                  >
                    <div className="col-span-6 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.name)}
                        onChange={(e) => handleFileSelect(file.name, (e.nativeEvent as MouseEvent).shiftKey)}
                        className="rounded border-gray-600 bg-panel-surface text-panel-primary focus:ring-panel-primary"
                      />
                      
                      <div
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                        onClick={() => handleFileClick(file)}
                      >
                        {file.type === 'directory' ? (
                          <FolderIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        ) : (
                          <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-white hover:text-panel-primary transition-colors truncate">
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
                    
                    <div className="col-span-1 flex items-center space-x-1">
                      {file.type === 'file' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                              handlePreview(filePath, file.name);
                            }}
                            className="p-1 hover:bg-white/10 rounded"
                            title="Preview"
                          >
                            <EyeIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileClick(file);
                            }}
                            className="p-1 hover:bg-white/10 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                          handlePermissions(filePath, file.name);
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                        title="Permissions"
                      >
                        <ShieldCheckIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* File Count Summary */}
          <div className="text-center text-sm text-gray-400">
            {filteredFiles.length > 0 && (
              <span>
                Showing {filteredFiles.length} of {files.length} items
                {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
              </span>
            )}
          </div>
        </div>

        {/* Modals and Overlays */}
        <FilePreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
          serverId={serverId as string}
          filePath={previewModal.filePath}
          fileName={previewModal.fileName}
        />

        <FilePermissionsDialog
          isOpen={permissionsDialog.isOpen}
          onClose={() => setPermissionsDialog({ ...permissionsDialog, isOpen: false })}
          serverId={serverId as string}
          filePath={permissionsDialog.filePath}
          fileName={permissionsDialog.fileName}
          onPermissionsChanged={loadFiles}
        />

        <FileContextMenu
          isOpen={contextMenu.isOpen}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          file={contextMenu.file}
          onAction={handleContextAction}
        />

        <BatchOperationsToolbar
          selectedFiles={selectedFiles}
          onClearSelection={() => setSelectedFiles([])}
          onDelete={handleDelete}
          onCopy={handleBatchCopy}
          onMove={handleBatchMove}
          onArchive={handleBatchArchive}
        />
      </div>
    </Layout>
  );
}
