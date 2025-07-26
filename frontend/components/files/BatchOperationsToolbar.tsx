import React, { useState } from 'react';
import {
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface BatchOperationsToolbarProps {
  selectedFiles: string[];
  onClearSelection: () => void;
  onDelete: () => void;
  onCopy: (destination: string) => void;
  onMove: (destination: string) => void;
  onArchive: (archiveName: string, format: string) => void;
}

export default function BatchOperationsToolbar({
  selectedFiles,
  onClearSelection,
  onDelete,
  onCopy,
  onMove,
  onArchive
}: BatchOperationsToolbarProps) {
  const [showDestinationInput, setShowDestinationInput] = useState<'copy' | 'move' | null>(null);
  const [showArchiveInput, setShowArchiveInput] = useState(false);
  const [destination, setDestination] = useState('');
  const [archiveName, setArchiveName] = useState('');
  const [archiveFormat, setArchiveFormat] = useState('zip');

  const handleCopyMove = (operation: 'copy' | 'move') => {
    if (!destination.trim()) return;
    
    if (operation === 'copy') {
      onCopy(destination);
    } else {
      onMove(destination);
    }
    
    setDestination('');
    setShowDestinationInput(null);
  };

  const handleArchive = () => {
    if (!archiveName.trim()) return;
    
    const fullArchiveName = archiveName.endsWith(`.${archiveFormat}`) 
      ? archiveName 
      : `${archiveName}.${archiveFormat}`;
    
    onArchive(fullArchiveName, archiveFormat);
    setArchiveName('');
    setShowArchiveInput(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      setShowDestinationInput(null);
      setShowArchiveInput(false);
      setDestination('');
      setArchiveName('');
    }
  };

  if (selectedFiles.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-panel-surface border border-white/20 rounded-xl shadow-xl p-4 min-w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Destination Input */}
        {showDestinationInput && (
          <div className="mb-4 p-3 bg-panel-darker rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, () => handleCopyMove(showDestinationInput))}
                placeholder="Enter destination path (e.g., /backup/)"
                className="flex-1 px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary"
                autoFocus
              />
              <button
                onClick={() => handleCopyMove(showDestinationInput)}
                disabled={!destination.trim()}
                className="px-4 py-2 bg-panel-primary hover:bg-panel-primary/80 disabled:bg-panel-primary/50 text-white rounded-lg transition-colors"
              >
                {showDestinationInput === 'copy' ? 'Copy' : 'Move'}
              </button>
            </div>
          </div>
        )}

        {/* Archive Input */}
        {showArchiveInput && (
          <div className="mb-4 p-3 bg-panel-darker rounded-lg border border-white/10">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, handleArchive)}
                  placeholder="Enter archive name"
                  className="flex-1 px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-panel-primary"
                  autoFocus
                />
                
                <div className="relative">
                  <select
                    value={archiveFormat}
                    onChange={(e) => setArchiveFormat(e.target.value)}
                    className="appearance-none bg-panel-surface border border-white/20 rounded-lg px-3 py-2 pr-8 text-white focus:outline-none focus:border-panel-primary"
                  >
                    <option value="zip">ZIP</option>
                    <option value="tar">TAR</option>
                    <option value="tar.gz">TAR.GZ</option>
                  </select>
                  <ChevronDownIcon className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                
                <button
                  onClick={handleArchive}
                  disabled={!archiveName.trim()}
                  className="px-4 py-2 bg-panel-primary hover:bg-panel-primary/80 disabled:bg-panel-primary/50 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setShowDestinationInput('copy');
              setShowArchiveInput(false);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            <span>Copy</span>
          </button>
          
          <button
            onClick={() => {
              setShowDestinationInput('move');
              setShowArchiveInput(false);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            <ShareIcon className="h-4 w-4" />
            <span>Move</span>
          </button>
          
          <button
            onClick={() => {
              setShowArchiveInput(true);
              setShowDestinationInput(null);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            <span>Archive</span>
          </button>
          
          <div className="w-px h-6 bg-white/20 mx-2" />
          
          <button
            onClick={onDelete}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-3 text-xs text-gray-400">
          Tip: Use keyboard shortcuts - Ctrl+C (copy), Ctrl+X (move), Del (delete)
        </div>
      </div>
    </div>
  );
}