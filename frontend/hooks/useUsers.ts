import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../lib/api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    USER: number;
    MODERATOR: number;
    ADMIN: number;
  };
  recentSignups: number;
  recentActivity: number;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user: {
    username: string;
    email: string;
  };
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getAll();
      setUsers(response.data.data || response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData: CreateUserData) => {
    try {
      await usersApi.create(userData);
      toast.success('User created successfully');
      await fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateUser = async (id: string, userData: UpdateUserData) => {
    try {
      await usersApi.update(id, userData);
      toast.success('User updated successfully');
      await fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersApi.delete(id);
      toast.success('User deleted successfully');
      await fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkDeleteUsers = async (userIds: string[]) => {
    try {
      await usersApi.bulkDelete(userIds);
      toast.success(`${userIds.length} user(s) deleted successfully`);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete users';
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkUpdateRole = async (userIds: string[], role: string) => {
    try {
      await usersApi.bulkUpdateRole(userIds, role);
      toast.success(`Role updated for ${userIds.length} user(s)`);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user roles';
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkUpdateStatus = async (userIds: string[], isActive: boolean) => {
    try {
      await usersApi.bulkUpdateStatus(userIds, isActive);
      toast.success(`Status updated for ${userIds.length} user(s)`);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    bulkUpdateRole,
    bulkUpdateStatus,
  };
};

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getStats();
      setStats(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export const useUserActivity = (page: number = 1, limit: number = 10) => {
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getActivity(page, limit);
      setActivities(response.data.data || response.data.activities || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user activity';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activities,
    loading,
    error,
    total,
    refetch: fetchActivity,
  };
};

export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getById(userId);
      setUser(response.data.data || response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
};
