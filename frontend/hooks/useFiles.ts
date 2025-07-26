import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../lib/api';
import toast from 'react-hot-toast';

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: string;
  permissions: string;
  owner?: string;
  group?: string;
}

export interface FileContent {
  content: string;
  encoding: string;
  size: number;
  lastModified: string;
}

export const useFiles = (serverId: string, initialPath = '/') => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (path: string) => {
    if (!serverId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await filesApi.getFiles(serverId, path);
      setFiles(response.data.data || response.data);
      setCurrentPath(path);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [fetchFiles, currentPath]);

  const navigateTo = (path: string) => {
    fetchFiles(path);
  };

  const goUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateTo(parentPath);
  };

  const createFile = async (path: string, content = '') => {
    try {
      await filesApi.create(serverId, path, 'file', content);
      toast.success('File created successfully');
      await fetchFiles(currentPath); // Refresh current directory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create file';
      toast.error(errorMessage);
      throw err;
    }
  };

  const createDirectory = async (path: string) => {
    try {
      await filesApi.create(serverId, path, 'directory');
      toast.success('Directory created successfully');
      await fetchFiles(currentPath); // Refresh current directory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create directory';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      await filesApi.delete(serverId, path);
      toast.success('File deleted successfully');
      await fetchFiles(currentPath); // Refresh current directory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      toast.error(errorMessage);
      throw err;
    }
  };

  const renameFile = async (oldPath: string, newPath: string) => {
    try {
      await filesApi.rename(serverId, oldPath, newPath);
      toast.success('File renamed successfully');
      await fetchFiles(currentPath); // Refresh current directory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename file';
      toast.error(errorMessage);
      throw err;
    }
  };

  const uploadFile = async (path: string, file: File) => {
    try {
      await filesApi.upload(serverId, path, file);
      toast.success('File uploaded successfully');
      await fetchFiles(currentPath); // Refresh current directory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    files,
    currentPath,
    loading,
    error,
    navigateTo,
    goUp,
    refetch: () => fetchFiles(currentPath),
    createFile,
    createDirectory,
    deleteFile,
    renameFile,
    uploadFile,
  };
};

export const useFileContent = (serverId: string, filePath: string | null) => {
  const [content, setContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const fetchContent = useCallback(async () => {
    if (!serverId || !filePath) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await filesApi.getContent(serverId, filePath);
      setContent(response.data.data || response.data);
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch file content';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [serverId, filePath]);

  useEffect(() => {
    if (filePath) {
      fetchContent();
    } else {
      setContent(null);
    }
  }, [fetchContent, filePath]);

  const saveContent = async (newContent: string) => {
    if (!serverId || !filePath) return;
    
    try {
      await filesApi.updateContent(serverId, filePath, newContent);
      toast.success('File saved successfully');
      setIsDirty(false);
      // Update the content state with the new content
      setContent(prev => prev ? { ...prev, content: newContent } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateContent = (newContent: string) => {
    setContent(prev => prev ? { ...prev, content: newContent } : null);
    setIsDirty(true);
  };

  return {
    content,
    loading,
    error,
    isDirty,
    refetch: fetchContent,
    saveContent,
    updateContent,
  };
};
