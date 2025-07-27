/**
 * Advanced File Manager Component
 * Comprehensive file management with bulk operations, drag-drop, and real-time sync
 * Inspired by Pterodactyl and Pelican Panel file managers
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  Copy,
  Move,
  Edit3,
  Eye,
  Search,
  MoreVertical,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Archive,
  Scissors,
  Clipboard,
  Check,
  X,
  ArrowUp,
  Grid,
  List,
  SortAsc,
  Filter,
  Share2
} from 'lucide-react';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
  owner: string;
  path: string;
  is_symlink?: boolean;
  mime_type?: string;
}

interface FileManagerProps {
  serverId: string;
  initialPath?: string;
  readonly?: boolean;
  className?: string;
}

export type { FileItem, FileManagerProps };

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'size' | 'modified' | 'type';
type SortOrder = 'asc' | 'desc';

export const FileManager: React.FC<FileManagerProps> = ({
  serverId,
  initialPath = '/',
  readonly = false,
  className = ''
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [clipboardItems, setClipboardItems] = useState<{ items: string[]; operation: 'copy' | 'cut' }>({ items: [], operation: 'copy' });
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; file?: FileItem } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${serverId}/files?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        setCurrentPath(path);
      } else {
        console.error('Failed to load directory:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  // Filter and sort files
  const processedFiles = React.useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'modified':
          aValue = a.modified.getTime();
          bValue = b.modified.getTime();
          break;
        case 'type':
          aValue = a.type === 'directory' ? '0' : (a.mime_type || 'z');
          bValue = b.type === 'directory' ? '0' : (b.mime_type || 'z');
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [files, searchQuery, sortField, sortOrder]);

  // File operations
  const handleFileSelect = (fileName: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(fileName)) {
        newSelected.delete(fileName);
      } else {
        newSelected.add(fileName);
      }
      setSelectedFiles(newSelected);
    } else {
      setSelectedFiles(new Set([fileName]));
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === processedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(processedFiles.map(f => f.name)));
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles(new Set());
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateToPath(parentPath);
  };

  // File upload handling
  const handleFileUpload = async (files: FileList) => {
    if (!files.length || readonly) return;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
            loadDirectory(currentPath); // Refresh directory
          }
        };

        xhr.open('POST', `/api/servers/${serverId}/files/upload`);
        xhr.send(formData);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
  };

  // Drag and drop handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0 || readonly) return;

    const confirmed = window.confirm(`Delete ${selectedFiles.size} selected item(s)?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/servers/${serverId}/files/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: Array.from(selectedFiles).map(name => `${currentPath}/${name}`)
        })
      });

      if (response.ok) {
        loadDirectory(currentPath);
        setSelectedFiles(new Set());
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleCopyToClipboard = () => {
    setClipboardItems({
      items: Array.from(selectedFiles),
      operation: 'copy'
    });
  };

  const handleCutToClipboard = () => {
    setClipboardItems({
      items: Array.from(selectedFiles),
      operation: 'cut'
    });
  };

  const handlePasteFromClipboard = async () => {
    if (clipboardItems.items.length === 0 || readonly) return;

    try {
      const response = await fetch(`/api/servers/${serverId}/files/bulk-${clipboardItems.operation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: clipboardItems.items.map(name => `${currentPath}/${name}`),
          destination: currentPath
        })
      });

      if (response.ok) {
        loadDirectory(currentPath);
        if (clipboardItems.operation === 'cut') {
          setClipboardItems({ items: [], operation: 'copy' });
        }
      }
    } catch (error) {
      console.error('Paste error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder className="w-5 h-5 text-blue-400" />;
    }
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const pathSegments = currentPath.split('/').filter(Boolean);

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">File Manager</h3>
          
          {/* Path breadcrumb */}
          <nav className="flex items-center space-x-1 text-sm">
            <button
              onClick={() => navigateToPath('/')}
              className="text-blue-400 hover:text-blue-300"
            >
              /
            </button>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-500">/</span>
                <button
                  onClick={() => navigateToPath('/' + pathSegments.slice(0, index + 1).join('/'))}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadDirectory(currentPath)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center space-x-2">
          {!readonly && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm">
                <FolderPlus className="w-4 h-4" />
                <span>New Folder</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm">
                <FilePlus className="w-4 h-4" />
                <span>New File</span>
              </button>
            </>
          )}

          {currentPath !== '/' && (
            <button
              onClick={navigateUp}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Up</span>
            </button>
          )}
        </div>

        {selectedFiles.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {selectedFiles.size} selected
            </span>
            
            {!readonly && (
              <>
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 text-gray-400 hover:text-white"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCutToClipboard}
                  className="p-2 text-gray-400 hover:text-white"
                  title="Cut"
                >
                  <Scissors className="w-4 h-4" />
                </button>

                <button
                  onClick={handleBulkDelete}
                  className="p-2 text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {clipboardItems.items.length > 0 && !readonly && (
          <button
            onClick={handlePasteFromClipboard}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
          >
            <Clipboard className="w-4 h-4" />
            <span>Paste ({clipboardItems.items.length})</span>
          </button>
        )}
      </div>

      {/* File list */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative ${isDragging ? 'bg-blue-500/10 border-2 border-dashed border-blue-500' : ''}`}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
            <div className="text-blue-400 text-lg font-medium">
              Drop files here to upload
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="p-4">
            {viewMode === 'list' ? (
              <div className="space-y-1">
                {/* Header */}
                <div className="flex items-center py-2 px-3 text-sm font-medium text-gray-400 border-b border-gray-700">
                  <div className="flex items-center space-x-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === processedFiles.length && processedFiles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => {
                    setSortField('name');
                    setSortOrder(sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}>
                    Name
                    {sortField === 'name' && (
                      <SortAsc className={`inline w-4 h-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                  <div className="w-20 text-right cursor-pointer" onClick={() => {
                    setSortField('size');
                    setSortOrder(sortField === 'size' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}>
                    Size
                  </div>
                  <div className="w-40 text-right cursor-pointer" onClick={() => {
                    setSortField('modified');
                    setSortOrder(sortField === 'modified' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}>
                    Modified
                  </div>
                  <div className="w-20 text-center">Actions</div>
                </div>

                {/* File rows */}
                {processedFiles.map((file) => (
                  <div
                    key={file.name}
                    className={`flex items-center py-2 px-3 rounded-md hover:bg-gray-800 ${
                      selectedFiles.has(file.name) ? 'bg-blue-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.name)}
                        onChange={() => handleFileSelect(file.name, false)}
                        className="rounded bg-gray-700 border-gray-600"
                      />
                    </div>
                    
                    <div
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => {
                        if (file.type === 'directory') {
                          navigateToPath(`${currentPath}/${file.name}`.replace('//', '/'));
                        }
                      }}
                    >
                      {getFileIcon(file)}
                      <span className="text-white">{file.name}</span>
                      {file.is_symlink && (
                        <span className="text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded">
                          symlink
                        </span>
                      )}
                    </div>

                    <div className="w-20 text-right text-sm text-gray-400">
                      {file.type === 'file' ? formatFileSize(file.size) : '-'}
                    </div>

                    <div className="w-40 text-right text-sm text-gray-400">
                      {formatDate(file.modified)}
                    </div>

                    <div className="w-20 flex justify-center">
                      <button className="p-1 text-gray-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {processedFiles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No files match your search' : 'This directory is empty'}
                  </div>
                )}
              </div>
            ) : (
              /* Grid view */
              <div className="grid grid-cols-6 gap-4">
                {processedFiles.map((file) => (
                  <div
                    key={file.name}
                    className={`p-4 border border-gray-700 rounded-lg hover:bg-gray-800 cursor-pointer ${
                      selectedFiles.has(file.name) ? 'border-blue-500 bg-blue-500/20' : ''
                    }`}
                    onClick={(e) => {
                      if (file.type === 'directory') {
                        navigateToPath(`${currentPath}/${file.name}`.replace('//', '/'));
                      } else {
                        handleFileSelect(file.name, e.shiftKey || false);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {getFileIcon(file)}
                      <span className="text-sm text-white text-center truncate w-full">
                        {file.name}
                      </span>
                      {file.type === 'file' && (
                        <span className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="border-t border-gray-700 p-4">
          <h4 className="text-sm font-medium text-white mb-2">Uploading Files</h4>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center space-x-3">
                <span className="text-sm text-gray-400 flex-1 truncate">{fileName}</span>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-12 text-right">
                  {Math.round(progress)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleFileUpload(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default FileManager;
