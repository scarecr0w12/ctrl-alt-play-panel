import { useState, useEffect, useCallback } from 'react';
import { userProfileApi } from '../lib/api';
import toast from 'react-hot-toast';

export interface UserProfile {
  id: string;
  uuid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  lastLogin?: string;
  language: string;
  gravatar: boolean;
  useTotp: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    servers: number;
    apiKeys: number;
  };
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  language?: string;
  gravatar?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailData {
  newEmail: string;
  password: string;
}

export interface UserActivity {
  id: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userProfileApi.getProfile();
      setProfile(response.data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: UpdateProfileData): Promise<UserProfile> => {
    setError(null);
    try {
      const response = await userProfileApi.updateProfile(profileData);
      const updatedProfile = response.data.data;
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (passwordData: ChangePasswordData): Promise<void> => {
    setError(null);
    try {
      await userProfileApi.changePassword(passwordData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const changeEmail = useCallback(async (emailData: ChangeEmailData): Promise<UserProfile> => {
    setError(null);
    try {
      const response = await userProfileApi.changeEmail(emailData);
      const updatedProfile = response.data.data;
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change email';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const fetchActivities = useCallback(async (page = 1, limit = 10) => {
    setLoadingActivities(true);
    setError(null);
    try {
      const response = await userProfileApi.getActivity(page, limit);
      setActivities(response.data.data.activities);
      return response.data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    activities,
    loading,
    loadingActivities,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    changeEmail,
    fetchActivities
  };
};

export default useProfile;
