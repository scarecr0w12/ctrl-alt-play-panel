import React, { useState, useCallback } from 'react';
import {
  FolderIcon,
  DocumentIcon,
  TrashIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { FileItem } from '@/hooks/useFiles';

interface FileManagerGridProps {
  files: FileItem[];
  selectedFiles: string[];
  onFileSelect: (fileName: string) => void;
  onFileClick: (file: FileItem) => void;
  onFileAction: (action: string, file: FileItem) => void;
  onBatchAction: (action: string, files: string[]) => void;
  loading: boolean;
  searchQuery?: string;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  file: FileItem | null;
}

export default function FileManagerGrid({
  files,
  selectedFiles,
  onFileSelect,
  onFileClick,
  onFileAction,
  onBatchAction,
  loading,
  searchQuery = '',
}: FileManagerGridProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    file: null,
  });
  const [dragOver, setDragOver] = useState(false);

  // Handle right-click context menu
  const handleContextMenu = useCallback((event: React.MouseEvent, file: FileItem) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      file,
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          files.forEach(file => {
            if (!selectedFiles.includes(file.name)) {
              onFileSelect(file.name);
            }
          });
          break;
        case 'c':
          if (selectedFiles.length > 0) {
            event.preventDefault();
            onBatchAction('copy', selectedFiles);
          }
          break;
        case 'x':
          if (selectedFiles.length > 0) {
            event.preventDefault();
            onBatchAction('cut', selectedFiles);
          }
          break;
        case 'v':
          event.preventDefault();
          onBatchAction('paste', []);
          break;
      }
    } else if (event.key === 'Delete' && selectedFiles.length > 0) {
      event.preventDefault();
      onBatchAction('delete', selectedFiles);
    }
  }, [selectedFiles, files, onFileSelect, onBatchAction]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', closeContextMenu);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', closeContextMenu);
    };
  }, [handleKeyDown, closeContextMenu]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onBatchAction('upload', droppedFiles.map(f => f.name));
    }
  }, [onBatchAction]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <FolderIcon className="h-5 w-5 text-blue-400" />;
    }
    
    // File type icons based on extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconClasses = "h-5 w-5";
    
    switch (extension) {
      case 'txt':
      case 'md':
      case 'log':
        return <DocumentIcon className={`${iconClasses} text-gray-400`} />;
      case 'json':
      case 'yml':
      case 'yaml':
      case 'xml':
        return <DocumentIcon className={`${iconClasses} text-green-400`} />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <DocumentIcon className={`${iconClasses} text-yellow-400`} />;
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
        return <DocumentIcon className={`${iconClasses} text-purple-400`} />;
      default:
        return <DocumentIcon className={`${iconClasses} text-gray-400`} />;
    }
  };

  const isAllSelected = files.length > 0 && files.every(file => selectedFiles.includes(file.name));
  const isIndeterminate = selectedFiles.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      selectedFiles.forEach(fileName => onFileSelect(fileName));
    } else {
      // Select all
      files.forEach(file => {
        if (!selectedFiles.includes(file.name)) {
          onFileSelect(file.name);
        }
      });
    }
  };

  const filteredFiles = searchQuery
    ? files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  return (
    <div
      className={`glass-card rounded-xl overflow-hidden ${
        dragOver ? 'ring-2 ring-panel-primary' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Table Header */}
      <div className="bg-panel-darker p-4 border-b border-white/10">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
          <div className="col-span-6 flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAll}
              className="rounded border-gray-600 bg-panel-surface text-panel-primary focus:ring-panel-primary"
            />
            <span>Name</span>
          </div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3">Modified</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* File List */}
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
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <div className="col-span-6 flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.name)}
                  onChange={() => onFileSelect(file.name)}
                  className="rounded border-gray-600 bg-panel-surface text-panel-primary focus:ring-panel-primary"
                />
                
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => onFileClick(file)}
                >
                  {getFileIcon(file)}
                  <span className="text-white hover:text-panel-primary transition-colors">
                    {file.name}
                  </span>
                </div>
              </div>
              
              <div className="col-span-2 text-gray-400 text-sm">
                {file.type === 'file' ? formatFileSize(file.size || 0) : '-'}
              </div>
              
              <div className="col-span-3 text-gray-400 text-sm">
                {formatDate(file.lastModified)}
              </div>
              
              <div className="col-span-1 flex items-center space-x-1">
                {file.type === 'file' && (
                  <>
                    <button
                      onClick={() => onFileAction('preview', file)}
                      className="p-1 hover:bg-white/10 rounded"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => onFileAction('edit', file)}
                      className="p-1 hover:bg-white/10 rounded"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => onFileAction('download', file)}
                      className="p-1 hover:bg-white/10 rounded"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && contextMenu.file && (
        <div
          className="fixed z-50 bg-panel-darker border border-white/20 rounded-lg shadow-lg py-2 min-w-48"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.file.type === 'file' ? (
            <>
              <button
                onClick={() => {
                  onFileAction('preview', contextMenu.file!);
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => {
                  onFileAction('edit', contextMenu.file!);
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  onFileAction('download', contextMenu.file!);
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download</span>
              </button>
              <hr className="my-2 border-white/10" />
            </>
          ) : (
            <button
              onClick={() => {
                onFileClick(contextMenu.file!);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <FolderIcon className="h-4 w-4" />
              <span>Open</span>
            </button>
          )}
          <button
            onClick={() => {
              onFileAction('copy', contextMenu.file!);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            <span>Copy</span>
          </button>
          <button
            onClick={() => {
              onFileAction('rename', contextMenu.file!);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Rename</span>
          </button>
          <button
            onClick={() => {
              onFileAction('permissions', contextMenu.file!);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center space-x-2"
          >
            <CheckIcon className="h-4 w-4" />
            <span>Permissions</span>
          </button>
          <hr className="my-2 border-white/10" />
          <button
            onClick={() => {
              onFileAction('delete', contextMenu.file!);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-600/20 flex items-center space-x-2"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-panel-primary/20 border-2 border-dashed border-panel-primary rounded-xl flex items-center justify-center">
          <div className="text-center">
            <ArrowDownTrayIcon className="h-16 w-16 text-panel-primary mx-auto mb-4" />
            <p className="text-xl font-semibold text-white">Drop files to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}