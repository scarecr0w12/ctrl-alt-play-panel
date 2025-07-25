import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userProfileApi } from '@/lib/api';
import {
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  ClockIcon,
  CogIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  uuid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  language: string;
  gravatar: boolean;
  useTotp: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    servers: number;
    apiKeys: number;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    language: 'en',
    gravatar: true,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userProfileApi.getProfile();
      if (response.data.success && response.data.data) {
        const profileData = response.data.data;
        setProfile(profileData);
        setProfileForm({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          language: profileData.language,
          gravatar: profileData.gravatar,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userProfileApi.updateProfile(profileForm);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        loadProfile(); // Reload profile data
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userProfileApi.changePassword(passwordForm);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userProfileApi.changeEmail(emailForm);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Email updated successfully' });
        setEmailForm({
          newEmail: '',
          password: '',
        });
        loadProfile(); // Reload to get updated email
      }
    } catch (error: any) {
      console.error('Failed to change email:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change email' 
      });
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (message) {
      clearMessage();
    }
  }, [message]);

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout title="Profile">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Profile">
        <div className="space-y-6">
          {/* Header */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-blue-500/20 rounded-full">
                <UserIcon className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="text-gray-400">@{profile?.username}</p>
                <p className="text-sm text-gray-500">
                  Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Servers</p>
                    <p className="text-2xl font-bold text-white">{profile?._count?.servers || 0}</p>
                  </div>
                  <CogIcon className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">API Keys</p>
                    <p className="text-2xl font-bold text-white">{profile?._count?.apiKeys || 0}</p>
                  </div>
                  <KeyIcon className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Last Login</p>
                    <p className="text-sm font-medium text-white">
                      {profile?.lastLogin 
                        ? new Date(profile.lastLogin).toLocaleDateString() 
                        : 'Never'
                      }
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`glass-card border ${
              message.type === 'success' 
                ? 'border-green-500/20 bg-green-500/10' 
                : 'border-red-500/20 bg-red-500/10'
            }`}>
              <p className={`${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="glass-card rounded-xl p-6">
            <div className="border-b border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'profile', name: 'Profile Settings', icon: UserIcon },
                  { id: 'password', name: 'Change Password', icon: KeyIcon },
                  { id: 'email', name: 'Change Email', icon: EnvelopeIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={profileForm.language}
                    onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                    className="input-field"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gravatar"
                    checked={profileForm.gravatar}
                    onChange={(e) => setProfileForm({ ...profileForm, gravatar: e.target.checked })}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="gravatar" className="ml-2 text-sm text-gray-300">
                    Use Gravatar for profile picture
                  </label>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary">
                    Update Profile
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field"
                    minLength={8}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary">
                    Change Password
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'email' && (
              <form onSubmit={handleEmailChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="input-field opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Email
                  </label>
                  <input
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password (for confirmation)
                  </label>
                  <input
                    type="password"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary">
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
