import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline';
import { FileItem } from '@/hooks/useFiles';
import { filesApi } from '@/lib/api';

interface FilePreviewModalProps {
  file: FileItem | null;
  serverId: string;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
}

interface FileContent {
  content: string;
  encoding: string;
  size: number;
  lastModified: string;
}

export default function FilePreviewModal({
  file,
  serverId,
  currentPath,
  isOpen,
  onClose,
  onEdit,
  onDownload,
}: FilePreviewModalProps) {
  const [content, setContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file && file.type === 'file') {
      loadFileContent();
    }
  }, [isOpen, file, serverId, currentPath]);

  const loadFileContent = async () => {
    if (!file || !serverId) return;
    
    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const response = await filesApi.getContent(serverId, filePath);
      setContent(response.data.data || response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const textExtensions = ['txt', 'md', 'log', 'cfg', 'conf', 'ini', 'properties', 'env'];
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'yml', 'yaml'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac'];

    if (textExtensions.includes(extension || '')) return 'text';
    if (codeExtensions.includes(extension || '')) return 'code';
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    if (audioExtensions.includes(extension || '')) return 'audio';
    
    return 'binary';
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderPreview = () => {
    if (!file || !content) return null;

    const fileType = getFileType(file.name);
    const maxPreviewSize = 1024 * 1024; // 1MB

    if (file.size > maxPreviewSize) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            File is too large to preview ({formatFileSize(file.size)})
          </p>
          <button
            onClick={() => onDownload(file)}
            className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Download File
          </button>
        </div>
      );
    }

    switch (fileType) {
      case 'text':
      case 'code':
        return (
          <div className="bg-panel-darker rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
            <pre className="text-gray-300 whitespace-pre-wrap break-words">
              {content.content}
            </pre>
          </div>
        );

      case 'image':
        const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        const imageUrl = `/api/files/download?serverId=${serverId}&path=${encodeURIComponent(filePath)}`;
        return (
          <div className="text-center">
            <img
              src={imageUrl}
              alt={file.name}
              className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjNjY2NjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
          </div>
        );

      case 'video':
        const videoPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        const videoUrl = `/api/files/download?serverId=${serverId}&path=${encodeURIComponent(videoPath)}`;
        return (
          <div className="text-center">
            <video
              controls
              className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        const audioPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        const audioUrl = `/api/files/download?serverId=${serverId}&path=${encodeURIComponent(audioPath)}`;
        return (
          <div className="text-center">
            <audio
              controls
              className="w-full max-w-md mx-auto"
              src={audioUrl}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              Preview not available for this file type
            </p>
            <div className="space-x-3">
              <button
                onClick={() => onDownload(file)}
                className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Download File
              </button>
              {['text', 'code'].includes(fileType) && (
                <button
                  onClick={() => onEdit(file)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Edit File
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{file.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                <span>Size: {formatFileSize(file.size)}</span>
                <span>Modified: {new Date(file.lastModified).toLocaleString()}</span>
                {content && (
                  <span>Type: {getFileType(file.name)}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {['text', 'code'].includes(getFileType(file.name)) && (
              <button
                onClick={() => {
                  onEdit(file);
                  onClose();
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            
            <button
              onClick={() => {
                onDownload(file);
                onClose();
              }}
              className="flex items-center space-x-2 bg-panel-primary hover:bg-panel-primary/80 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panel-primary"></div>
              <span className="ml-3 text-gray-400">Loading preview...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Error loading file: {error}</p>
              <button
                onClick={loadFileContent}
                className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </div>
    </div>
  );
}