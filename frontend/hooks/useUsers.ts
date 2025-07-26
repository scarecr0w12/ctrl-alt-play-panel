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

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
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
