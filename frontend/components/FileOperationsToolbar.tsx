import React, { useState } from 'react';
import {
  ArrowUpTrayIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  FolderPlusIcon,
  DocumentPlusIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface FileOperationsToolbarProps {
  selectedFiles: string[];
  onBatchAction: (action: string, data?: any) => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

export default function FileOperationsToolbar({
  selectedFiles,
  onBatchAction,
  onNewFile,
  onNewFolder,
  onUpload,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
}: FileOperationsToolbarProps) {
  const [showArchiveOptions, setShowArchiveOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const handleArchive = (format: 'zip' | 'tar' | 'tar.gz') => {
    onBatchAction('archive', { format, files: selectedFiles });
    setShowArchiveOptions(false);
  };

  const filterOptions = [
    { value: 'all', label: 'All Files' },
    { value: 'file', label: 'Files Only' },
    { value: 'directory', label: 'Folders Only' },
    { value: 'image', label: 'Images' },
    { value: 'text', label: 'Text Files' },
    { value: 'archive', label: 'Archives' },
  ];

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        {/* Left Side - Main Actions */}
        <div className="flex items-center space-x-3">
          {/* New File/Folder */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewFile}
              className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              title="Create New File"
            >
              <DocumentPlusIcon className="h-4 w-4" />
              <span>New File</span>
            </button>
            
            <button
              onClick={onNewFolder}
              className="flex items-center space-x-2 bg-panel-surface hover:bg-panel-light text-white px-3 py-2 rounded-lg transition-colors text-sm"
              title="Create New Folder"
            >
              <FolderPlusIcon className="h-4 w-4" />
              <span>New Folder</span>
            </button>
          </div>

          {/* Upload */}
          <button
            onClick={onUpload}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            title="Upload Files"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            <span>Upload</span>
          </button>

          {/* Batch Operations */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center space-x-2 border-l border-white/20 pl-3">
              <span className="text-sm text-gray-400">
                {selectedFiles.length} selected:
              </span>
              
              <button
                onClick={() => onBatchAction('copy')}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                title="Copy Selected"
              >
                <DocumentDuplicateIcon className="h-3 w-3" />
                <span>Copy</span>
              </button>
              
              <button
                onClick={() => onBatchAction('move')}
                className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                title="Move Selected"
              >
                <span>Move</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowArchiveOptions(!showArchiveOptions)}
                  className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-sm"
                  title="Create Archive"
                >
                  <ArchiveBoxIcon className="h-3 w-3" />
                  <span>Archive</span>
                </button>
                
                {showArchiveOptions && (
                  <div className="absolute top-full left-0 mt-1 bg-panel-darker border border-white/20 rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={() => handleArchive('zip')}
                      className="w-full px-3 py-1 text-left text-white hover:bg-white/10 text-sm"
                    >
                      ZIP Archive
                    </button>
                    <button
                      onClick={() => handleArchive('tar')}
                      className="w-full px-3 py-1 text-left text-white hover:bg-white/10 text-sm"
                    >
                      TAR Archive
                    </button>
                    <button
                      onClick={() => handleArchive('tar.gz')}
                      className="w-full px-3 py-1 text-left text-white hover:bg-white/10 text-sm"
                    >
                      TAR.GZ Archive
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onBatchAction('delete')}
                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                title="Delete Selected"
              >
                <TrashIcon className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Search and Filter */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary text-sm w-64"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="flex items-center space-x-2 bg-panel-surface hover:bg-panel-light text-white px-3 py-2 rounded-lg transition-colors text-sm"
              title="Filter Files"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filter</span>
              {filter !== 'all' && (
                <span className="bg-panel-primary px-2 py-0.5 rounded-full text-xs">
                  {filterOptions.find(opt => opt.value === filter)?.label}
                </span>
              )}
            </button>
            
            {showFilterOptions && (
              <div className="absolute top-full right-0 mt-1 bg-panel-darker border border-white/20 rounded-lg shadow-lg py-1 z-10 min-w-48">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onFilterChange(option.value);
                      setShowFilterOptions(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-white/10 text-sm ${
                      filter === option.value
                        ? 'text-panel-primary bg-panel-primary/10'
                        : 'text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Options Row */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Keyboard shortcuts:</span>
            <span className="bg-panel-surface px-2 py-1 rounded font-mono">Ctrl+A</span>
            <span>Select all</span>
            <span className="bg-panel-surface px-2 py-1 rounded font-mono">Ctrl+C</span>
            <span>Copy</span>
            <span className="bg-panel-surface px-2 py-1 rounded font-mono">Delete</span>
            <span>Delete selected</span>
          </div>
          
          <button
            onClick={() => onBatchAction('refresh')}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm"
            title="Refresh View"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}