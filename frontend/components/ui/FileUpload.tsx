import React, { useRef, useState } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { ProgressBar } from './Loading';

export interface FileUploadProps {
  onFileSelect?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  dragActiveClassName?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
  uploadProgress?: number;
  uploading?: boolean;
}

export interface FileItem {
  file: File;
  id: string;
  preview?: string;
  error?: string;
  uploadProgress?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUpload,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className,
  dragActiveClassName,
  children,
  showPreview = true,
  uploadProgress,
  uploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    
    if (accept && !accept.split(',').some(type => 
      file.type.match(type.trim().replace('*', '.*'))
    )) {
      return 'File type not supported';
    }
    
    return null;
  };

  const handleFiles = (newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    
    if (!multiple) {
      const singleFile = fileArray[0];
      if (singleFile) {
        const error = validateFile(singleFile);
        const fileItem: FileItem = {
          file: singleFile,
          id: Date.now().toString(),
          error: error || undefined,
        };
        
        if (singleFile.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            fileItem.preview = e.target?.result as string;
            setFiles([fileItem]);
          };
          reader.readAsDataURL(singleFile);
        } else {
          setFiles([fileItem]);
        }
        
        if (!error) {
          onFileSelect?.([singleFile]);
        }
      }
      return;
    }

    const validFiles: FileItem[] = [];
    const totalFiles = files.length + fileArray.length;
    
    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    fileArray.forEach((file) => {
      const error = validateFile(file);
      const fileItem: FileItem = {
        file,
        id: Date.now().toString() + Math.random(),
        error: error || undefined,
      };
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileItem.preview = e.target?.result as string;
          setFiles(prev => [...prev, fileItem]);
        };
        reader.readAsDataURL(file);
      } else {
        validFiles.push(fileItem);
      }
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }

    const validFileObjects = validFiles
      .filter(item => !item.error)
      .map(item => item.file);
    
    if (validFileObjects.length > 0) {
      onFileSelect?.(validFileObjects);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleUpload = async () => {
    const validFiles = files.filter(item => !item.error).map(item => item.file);
    if (validFiles.length > 0 && onUpload) {
      await onUpload(validFiles);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors cursor-pointer hover:border-blue-400',
          isDragActive && 'border-blue-500 bg-blue-50',
          isDragActive && dragActiveClassName,
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        {children || (
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept ? `Supported formats: ${accept}` : 'Any file type'}
                {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
              </p>
            </div>
          </div>
        )}

        {uploading && uploadProgress !== undefined && (
          <div className="mt-4">
            <ProgressBar value={uploadProgress} showLabel />
          </div>
        )}
      </div>

      {/* File Preview */}
      {showPreview && files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <DocumentIcon className="w-10 h-10 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-500">{fileItem.error}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileItem.id);
                  }}
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {onUpload && files.some(file => !file.error) && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleUpload}
                disabled={uploading || !files.some(file => !file.error)}
                loading={uploading}
              >
                Upload Files
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Simple File Upload Component (for basic use cases)
export interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
}

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onFileSelect,
  accept,
  disabled = false,
  className,
  buttonText = 'Choose File',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
      >
        <CloudArrowUpIcon className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>
    </div>
  );
};