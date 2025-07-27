import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { filesApi } from '@/lib/api';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  filePath: string;
  fileName: string;
}

export default function FilePreviewModal({ 
  isOpen, 
  onClose, 
  serverId, 
  filePath, 
  fileName 
}: FilePreviewModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'image' | 'unsupported'>('unsupported');

  useEffect(() => {
    if (isOpen && filePath) {
      determinePreviewType();
      loadFileContent();
    }
  }, [isOpen, filePath]);

  const determinePreviewType = () => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Text file extensions
    const textExtensions = [
      'txt', 'log', 'conf', 'config', 'ini', 'properties', 'yaml', 'yml', 
      'json', 'xml', 'html', 'css', 'js', 'ts', 'md', 'sh', 'bat', 'py',
      'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sql'
    ];
    
    // Image file extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    
    if (textExtensions.includes(extension)) {
      setPreviewType('text');
    } else if (imageExtensions.includes(extension)) {
      setPreviewType('image');
    } else {
      setPreviewType('unsupported');
    }
  };

  const loadFileContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (previewType === 'text') {
        const response = await filesApi.getContent(serverId, filePath);
        if (response.data.success) {
          setContent(response.data.content || '');
        } else {
          setError('Failed to load file content');
        }
      }
    } catch (err) {
      setError('Error loading file content');
      console.error('File preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    switch (previewType) {
      case 'text':
        return <DocumentTextIcon className="h-6 w-6 text-blue-400" />;
      case 'image':
        return <PhotoIcon className="h-6 w-6 text-green-400" />;
      default:
        return <DocumentIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panel-primary"></div>
          <span className="ml-2 text-gray-400">Loading preview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <EyeSlashIcon className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      );
    }

    switch (previewType) {
      case 'text':
        return (
          <div className="bg-panel-darker rounded-lg p-4 border border-white/10">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96 font-mono">
              {content}
            </pre>
          </div>
        );
        
      case 'image':
        return (
          <div className="flex justify-center bg-panel-darker rounded-lg p-4 border border-white/10">
            <img 
              src={`/api/files/download?serverId=${serverId}&path=${encodeURIComponent(filePath)}`}
              alt={fileName}
              className="max-w-full max-h-96 object-contain rounded"
              onError={() => setError('Failed to load image')}
            />
          </div>
        );
        
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400">Preview not available for this file type</p>
              <p className="text-sm text-gray-500 mt-1">
                Supported: Text files, configuration files, images
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-panel-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              {getFileIcon()}
              <div>
                <Dialog.Title className="text-lg font-semibold text-white">
                  {fileName}
                </Dialog.Title>
                <p className="text-sm text-gray-400">{filePath}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-8rem)]">
            {renderPreview()}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-white/10 bg-panel-darker">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            
            {previewType !== 'unsupported' && (
              <button
                onClick={() => {
                  window.open(`/api/files/download?serverId=${serverId}&path=${encodeURIComponent(filePath)}`, '_blank');
                }}
                className="px-4 py-2 bg-panel-primary hover:bg-panel-primary/80 text-white rounded-lg transition-colors"
              >
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}