import React, { useState } from 'react';
import { 
  Button, 
  Modal, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Form,
  FormField,
  FormLabel,
  FormError
} from '@/components/ui';
import { useProfile, UpdateProfileData, ChangePasswordData, ChangeEmailData, UserActivity, useToast } from '@/hooks';
import { 
  UserIcon, 
  KeyIcon, 
  EnvelopeIcon, 
  ClockIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const UserProfileComponent: React.FC = () => {
  const { 
    profile, 
    activities, 
    loading, 
    loadingActivities,
    updateProfile, 
    changePassword, 
    changeEmail, 
    fetchActivities 
  } = useProfile();
  
  const toast = useToast();
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
    language: 'en',
    gravatar: true
  });

  const [passwordFormData, setPasswordFormData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [emailFormData, setEmailFormData] = useState<ChangeEmailData>({
    newEmail: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!editFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!passwordFormData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordFormData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordFormData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEmailForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!emailFormData.newEmail.trim()) {
      errors.newEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFormData.newEmail)) {
      errors.newEmail = 'Please enter a valid email address';
    }
    
    if (!emailFormData.password) {
      errors.password = 'Password is required for email change';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler functions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEditForm()) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile(editFormData);
      setShowEditModal(false);
      toast.profileUpdated();
    } catch (error) {
      toast.profileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    try {
      await changePassword(passwordFormData);
      setShowPasswordModal(false);
      resetPasswordForm();
      toast.passwordChanged();
    } catch (error) {
      toast.profileError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmailForm()) return;
    
    setIsSubmitting(true);
    try {
      await changeEmail(emailFormData);
      setShowEmailModal(false);
      resetEmailForm();
      toast.emailChanged();
    } catch (error) {
      toast.profileError(error instanceof Error ? error.message : 'Failed to change email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (profile) {
      setEditFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        language: profile.language,
        gravatar: profile.gravatar
      });
    }
    setFormErrors({});
    setShowEditModal(true);
  };

  const openActivitiesModal = () => {
    setShowActivitiesModal(true);
    fetchActivities(1, 20);
  };

  const resetPasswordForm = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setFormErrors({});
  };

  const resetEmailForm = () => {
    setEmailFormData({
      newEmail: '',
      password: ''
    });
    setFormErrors({});
  };

  // Role badge component
  const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const colors = {
      USER: 'bg-blue-100 text-blue-800',
      MODERATOR: 'bg-yellow-100 text-yellow-800',
      ADMIN: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role}
      </span>
    );
  };

  // Activity item component
  const ActivityItem: React.FC<{ activity: UserActivity }> = ({ activity }) => (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <ClockIcon className="h-4 w-4 text-blue-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
        <p className="text-xs text-gray-500">
          {new Date(activity.createdAt).toLocaleString()}
        </p>
        {activity.ipAddress && (
          <p className="text-xs text-gray-400">IP: {activity.ipAddress}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load user profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and account settings</p>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openEditModal}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-900">{profile.email}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowEmailModal(true)}
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Language</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.language}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gravatar</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.gravatar ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <RoleBadge role={profile.role} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">2FA</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.useTotp ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.useTotp ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {profile.lastLogin && (
                <div>
                  <span className="text-sm text-gray-600">Last Login</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(profile.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {profile._count && (
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Servers</span>
                  <span className="text-sm font-medium">{profile._count.servers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Keys</span>
                  <span className="text-sm font-medium">{profile._count.apiKeys}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-center space-x-2"
            >
              <KeyIcon className="h-4 w-4" />
              <span>Change Password</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(true)}
              className="flex items-center justify-center space-x-2"
            >
              <EnvelopeIcon className="h-4 w-4" />
              <span>Change Email</span>
            </Button>
            <Button
              variant="outline"
              onClick={openActivitiesModal}
              className="flex items-center justify-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>View Activity</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
        description="Update your personal information"
        size="md"
      >
        <Form onSubmit={handleUpdateProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="firstName" required>First Name</FormLabel>
              <Input
                id="firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                error={formErrors.firstName}
                placeholder="Enter first name"
              />
              <FormError message={formErrors.firstName} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
              <Input
                id="lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                error={formErrors.lastName}
                placeholder="Enter last name"
              />
              <FormError message={formErrors.lastName} />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="language">Language</FormLabel>
            <select
              id="language"
              value={editFormData.language}
              onChange={(e) => setEditFormData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </FormField>

          <FormField>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="gravatar"
                checked={editFormData.gravatar}
                onChange={(e) => setEditFormData(prev => ({ ...prev, gravatar: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <FormLabel htmlFor="gravatar">Use Gravatar for profile picture</FormLabel>
            </div>
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Update Profile
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        description="Update your account password"
        size="md"
      >
        <Form onSubmit={handleChangePassword}>
          <FormField>
            <FormLabel htmlFor="currentPassword" required>Current Password</FormLabel>
            <Input
              id="currentPassword"
              type="password"
              value={passwordFormData.currentPassword}
              onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              error={formErrors.currentPassword}
              placeholder="Enter current password"
            />
            <FormError message={formErrors.currentPassword} />
          </FormField>

          <FormField>
            <FormLabel htmlFor="newPassword" required>New Password</FormLabel>
            <Input
              id="newPassword"
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              error={formErrors.newPassword}
              placeholder="Enter new password"
            />
            <FormError message={formErrors.newPassword} />
          </FormField>

          <FormField>
            <FormLabel htmlFor="confirmPassword" required>Confirm New Password</FormLabel>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordFormData.confirmPassword}
              onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={formErrors.confirmPassword}
              placeholder="Confirm new password"
            />
            <FormError message={formErrors.confirmPassword} />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Change Password
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Change Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Change Email"
        description="Update your email address"
        size="md"
      >
        <Form onSubmit={handleChangeEmail}>
          <FormField>
            <FormLabel htmlFor="newEmail" required>New Email</FormLabel>
            <Input
              id="newEmail"
              type="email"
              value={emailFormData.newEmail}
              onChange={(e) => setEmailFormData(prev => ({ ...prev, newEmail: e.target.value }))}
              error={formErrors.newEmail}
              placeholder="Enter new email address"
            />
            <FormError message={formErrors.newEmail} />
          </FormField>

          <FormField>
            <FormLabel htmlFor="password" required>Current Password</FormLabel>
            <Input
              id="password"
              type="password"
              value={emailFormData.password}
              onChange={(e) => setEmailFormData(prev => ({ ...prev, password: e.target.value }))}
              error={formErrors.password}
              placeholder="Enter current password"
            />
            <FormError message={formErrors.password} />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmailModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Change Email
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Activity Log Modal */}
      <Modal
        isOpen={showActivitiesModal}
        onClose={() => setShowActivitiesModal(false)}
        title="Account Activity"
        description="Recent account activity and login history"
        size="lg"
      >
        <div className="space-y-4">
          {loadingActivities ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
              <p className="mt-1 text-sm text-gray-500">No recent account activity to display</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UserProfileComponent;
