import React, { useState, useEffect } from 'react';
import { 
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  FolderOpenIcon,
  TrashIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface FileContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  file: {
    name: string;
    type: 'file' | 'directory';
    path: string;
  } | null;
  onAction: (action: string) => void;
}

export default function FileContextMenu({ 
  isOpen, 
  x, 
  y, 
  onClose, 
  file, 
  onAction 
}: FileContextMenuProps) {
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen) {
      // Calculate menu position to keep it within viewport
      const menuWidth = 200;
      const menuHeight = 300;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      // Adjust horizontal position
      if (x + menuWidth > viewportWidth) {
        adjustedX = viewportWidth - menuWidth - 10;
      }
      
      // Adjust vertical position
      if (y + menuHeight > viewportHeight) {
        adjustedY = viewportHeight - menuHeight - 10;
      }
      
      setMenuStyle({
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        zIndex: 1000,
      });
    }
  }, [isOpen, x, y]);

  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAction = (action: string) => {
    onAction(action);
    onClose();
  };

  if (!isOpen || !file) return null;

  const menuItems: Array<{
    type?: 'separator';
    label?: string;
    icon?: React.ReactNode;
    action?: string;
    shortcut?: string;
    danger?: boolean;
  }> = [
    // Preview/Open actions
    ...(file.type === 'file' ? [
      {
        label: 'Preview',
        icon: <EyeIcon className="h-4 w-4" />,
        action: 'preview',
        shortcut: 'Space'
      },
      {
        label: 'Edit',
        icon: <PencilIcon className="h-4 w-4" />,
        action: 'edit',
        shortcut: 'Enter'
      }
    ] : [
      {
        label: 'Open',
        icon: <FolderOpenIcon className="h-4 w-4" />,
        action: 'open',
        shortcut: 'Enter'
      }
    ]),
    
    // Download action
    ...(file.type === 'file' ? [
      {
        label: 'Download',
        icon: <ArrowDownTrayIcon className="h-4 w-4" />,
        action: 'download',
        shortcut: 'Ctrl+D'
      }
    ] : []),
    
    // Separator
    { type: 'separator' },
    
    // File operations
    {
      label: 'Copy',
      icon: <DocumentDuplicateIcon className="h-4 w-4" />,
      action: 'copy',
      shortcut: 'Ctrl+C'
    },
    {
      label: 'Move',
      icon: <ShareIcon className="h-4 w-4" />,
      action: 'move',
      shortcut: 'Ctrl+X'
    },
    
    // Separator
    { type: 'separator' },
    
    // Properties
    {
      label: 'Permissions',
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      action: 'permissions',
      shortcut: 'Ctrl+I'
    },
    
    // Archive actions for directories
    ...(file.type === 'directory' ? [
      {
        label: 'Create Archive',
        icon: <ArchiveBoxIcon className="h-4 w-4" />,
        action: 'archive',
        shortcut: ''
      }
    ] : []),
    
    // Extract action for archive files
    ...(file.type === 'file' && isArchiveFile(file.name) ? [
      {
        label: 'Extract',
        icon: <ArchiveBoxIcon className="h-4 w-4" />,
        action: 'extract',
        shortcut: ''
      }
    ] : []),
    
    // Separator
    { type: 'separator' },
    
    // Dangerous actions
    {
      label: 'Delete',
      icon: <TrashIcon className="h-4 w-4" />,
      action: 'delete',
      shortcut: 'Del',
      danger: true
    }
  ];

  return (
    <div
      style={menuStyle}
      className="bg-panel-surface border border-white/20 rounded-lg shadow-xl py-2 min-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div 
              key={index} 
              className="border-t border-white/10 my-1" 
            />
          );
        }

        return (
          <button
            key={index}
            onClick={() => item.action && handleAction(item.action)}
            className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
              item.danger 
                ? 'text-red-400 hover:bg-red-500/20' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            
            {item.shortcut && (
              <span className={`text-xs ${
                item.danger ? 'text-red-400/70' : 'text-gray-400'
              }`}>
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function isArchiveFile(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const archiveExtensions = ['zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz'];
  return archiveExtensions.includes(extension || '');
}