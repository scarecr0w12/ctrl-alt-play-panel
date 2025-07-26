import React, { useState, useCallback } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { filesApi } from '@/lib/api';

interface FileUploadProgressProps {
  isOpen: boolean;
  serverId: string;
  currentPath: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function FileUploadProgress({
  isOpen,
  serverId,
  currentPath,
  onClose,
  onUploadComplete,
}: FileUploadProgressProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  }, []);

  const addFiles = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    const { file, id } = uploadFile;
    
    try {
      // Update status to uploading
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));

      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      
      // For large files, we could implement chunked upload
      const isLargeFile = file.size > 10 * 1024 * 1024; // 10MB
      
      if (isLargeFile) {
        await uploadFileInChunks(uploadFile, filePath);
      } else {
        await uploadFileDirectly(uploadFile, filePath);
      }

      // Mark as completed
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'completed' as const, progress: 100 } : f
      ));

    } catch (error) {
      // Mark as error
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ));
    }
  };

  const uploadFileDirectly = async (uploadFile: UploadFile, filePath: string) => {
    const { file, id } = uploadFile;
    
    // Convert file to base64
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 content
        const base64Content = result.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadFiles(prev => prev.map(f => 
        f.id === id && f.progress < 90 
          ? { ...f, progress: f.progress + 10 } 
          : f
      ));
    }, 100);

    try {
      await filesApi.upload(serverId, filePath, {
        content: fileContent,
        encoding: 'base64',
        totalSize: file.size
      });

      clearInterval(progressInterval);
      
      // Set progress to 100%
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: 100 } : f
      ));

    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const uploadFileInChunks = async (uploadFile: UploadFile, filePath: string) => {
    const { file, id } = uploadFile;
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Convert chunk to base64
      const reader = new FileReader();
      const chunkContent = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Content = result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(chunk);
      });

      // Upload chunk
      await filesApi.uploadProgress(serverId, filePath, {
        content: chunkContent,
        encoding: 'base64',
        totalSize: file.size,
        chunkIndex,
        totalChunks
      });

      // Update progress
      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      setUploadFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress } : f
      ));
    }
  };

  const startUpload = async () => {
    if (uploadFiles.length === 0 || uploading) return;

    setUploading(true);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const uploadFile of uploadFiles) {
        if (uploadFile.status === 'pending') {
          await uploadFile(uploadFile);
        }
      }

      // Call completion callback after a short delay
      setTimeout(() => {
        onUploadComplete();
      }, 1000);

    } finally {
      setUploading(false);
    }
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const retryFailed = () => {
    setUploadFiles(prev => prev.map(f => 
      f.status === 'error' ? { ...f, status: 'pending' as const, error: undefined } : f
    ));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getProgressColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-panel-primary';
      default:
        return 'bg-gray-500';
    }
  };

  const totalFiles = uploadFiles.length;
  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;
  const pendingFiles = uploadFiles.filter(f => f.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Upload Files</h2>
            <p className="text-gray-400 text-sm mt-1">
              Upload to: {currentPath}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-panel-primary bg-panel-primary/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white mb-2">
              Drag and drop files here, or{' '}
              <label className="text-panel-primary hover:text-panel-primary/80 cursor-pointer">
                browse to upload
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
            <p className="text-gray-400 text-sm">
              Support for multiple files and large file uploads
            </p>
          </div>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="flex-1 overflow-auto px-6">
            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="bg-panel-surface rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(uploadFile.status)}
                      <div>
                        <p className="text-white text-sm font-medium">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'pending' && (
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(uploadFile.status)}`}
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>

                  {/* Status Text */}
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-400">
                      {uploadFile.status === 'uploading' && `${uploadFile.progress}%`}
                      {uploadFile.status === 'completed' && 'Completed'}
                      {uploadFile.status === 'error' && `Error: ${uploadFile.error}`}
                      {uploadFile.status === 'pending' && 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          {totalFiles > 0 && (
            <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
              <span>
                {totalFiles} total • {completedFiles} completed • {errorFiles} failed • {pendingFiles} pending
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-x-2">
              {errorFiles > 0 && (
                <button
                  onClick={retryFailed}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Retry Failed
                </button>
              )}
              {completedFiles > 0 && (
                <button
                  onClick={clearCompleted}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Clear Completed
                </button>
              )}
            </div>

            <div className="space-x-3">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              {pendingFiles > 0 && (
                <button
                  onClick={startUpload}
                  disabled={uploading}
                  className="bg-panel-primary hover:bg-panel-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {uploading ? 'Uploading...' : `Upload ${pendingFiles} Files`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}