import { useState, useCallback } from 'react';
import { steamApi } from '../lib/api';
import toast from 'react-hot-toast';

export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  author: string;
  authorUrl?: string;
  previewUrl?: string;
  fileSize: number;
  publishedDate: string;
  updatedDate: string;
  subscriptions: number;
  rating: number;
  tags: string[];
  type: string;
}

export interface InstalledWorkshopItem {
  id: string;
  serverId: string;
  workshopId: string;
  title: string;
  installedAt: string;
  fileSize: number;
  status: 'installed' | 'updating' | 'failed';
}

export const useWorkshop = () => {
  const [searchResults, setSearchResults] = useState<WorkshopItem[]>([]);
  const [installedItems, setInstalledItems] = useState<InstalledWorkshopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchWorkshop = useCallback(async (query: string, type?: string): Promise<WorkshopItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await steamApi.search(query, type);
      const results = response.data.data || [];
      setSearchResults(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search workshop';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWorkshopItem = useCallback(async (itemId: string): Promise<WorkshopItem> => {
    setError(null);
    try {
      const response = await steamApi.getItem(itemId);
      return response.data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get workshop item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const installWorkshopItem = useCallback(async (serverId: string, itemId: string): Promise<void> => {
    setError(null);
    try {
      await steamApi.install(serverId, itemId);
      // Refresh installed items
      fetchInstalledItems(serverId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to install workshop item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const uninstallWorkshopItem = useCallback(async (serverId: string, itemId: string): Promise<void> => {
    setError(null);
    try {
      await steamApi.uninstall(serverId, itemId);
      // Remove from installed items
      setInstalledItems(prev => prev.filter(item => item.workshopId !== itemId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to uninstall workshop item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const fetchInstalledItems = useCallback(async (serverId: string) => {
    setError(null);
    try {
      const response = await steamApi.getInstalled(serverId);
      setInstalledItems(response.data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch installed items';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  return {
    searchResults,
    installedItems,
    loading,
    error,
    searchWorkshop,
    getWorkshopItem,
    installWorkshopItem,
    uninstallWorkshopItem,
    fetchInstalledItems
  };
};

export default useWorkshop;
