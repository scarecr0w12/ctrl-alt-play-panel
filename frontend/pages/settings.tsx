import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Form, FormField, FormLabel, FormError } from '@/components/ui';
import { KeyIcon, UserIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('account');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) return;
    
    setIsSubmitting(true);
    try {
      // In a real implementation, this would call an API endpoint
      // await userProfileApi.changePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (id: string) => {
    // In a real implementation, this would call an API endpoint
    // to update the user's notification preferences
    toast.success('Notification settings updated!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-panel-darker via-panel-dark to-panel-surface p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and security settings</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'account' ? 'bg-panel-primary/20 text-panel-primary' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'security' ? 'bg-panel-primary/20 text-panel-primary' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <KeyIcon className="h-5 w-5" />
                    <span>Security</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'notifications' ? 'bg-panel-primary/20 text-panel-primary' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    <BellIcon className="h-5 w-5" />
                    <span>Notifications</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">
                  {activeTab === 'account' && 'Account Settings'}
                  {activeTab === 'security' && 'Security Settings'}
                  {activeTab === 'notifications' && 'Notification Preferences'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField>
                          <FormLabel htmlFor="firstName">First Name</FormLabel>
                          <Input
                            id="firstName"
                            placeholder="Enter your first name"
                          />
                        </FormField>
                        <FormField>
                          <FormLabel htmlFor="lastName">Last Name</FormLabel>
                          <Input
                            id="lastName"
                            placeholder="Enter your last name"
                          />
                        </FormField>
                        <FormField>
                          <FormLabel htmlFor="email">Email Address</FormLabel>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                          />
                        </FormField>
                        <FormField>
                          <FormLabel htmlFor="username">Username</FormLabel>
                          <Input
                            id="username"
                            placeholder="Enter your username"
                          />
                        </FormField>
                      </div>
                      <div className="mt-6">
                        <Button>Update Profile</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                      <Form onSubmit={handlePasswordChange}>
                        <div className="space-y-4">
                          <FormField>
                            <FormLabel htmlFor="currentPassword" required>Current Password</FormLabel>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              error={passwordErrors.currentPassword}
                              placeholder="Enter current password"
                            />
                            <FormError message={passwordErrors.currentPassword} />
                          </FormField>
                          <FormField>
                            <FormLabel htmlFor="newPassword" required>New Password</FormLabel>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              error={passwordErrors.newPassword}
                              placeholder="Enter new password"
                            />
                            <FormError message={passwordErrors.newPassword} />
                          </FormField>
                          <FormField>
                            <FormLabel htmlFor="confirmPassword" required>Confirm New Password</FormLabel>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              error={passwordErrors.confirmPassword}
                              placeholder="Confirm new password"
                            />
                            <FormError message={passwordErrors.confirmPassword} />
                          </FormField>
                        </div>
                        <div className="mt-6">
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Changing Password...' : 'Change Password'}
                          </Button>
                        </div>
                      </Form>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                      <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                        <div>
                          <p className="font-medium text-white">Enable 2FA</p>
                          <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                        </div>
                        <div className="relative inline-block w-12 h-6">
                          <input type="checkbox" className="sr-only" id="two-factor" />
                          <label htmlFor="two-factor" className="block w-12 h-6 rounded-full bg-gray-600 cursor-pointer transition-colors duration-200"></label>
                          <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                          <div>
                            <p className="font-medium text-white">Security Alerts</p>
                            <p className="text-sm text-gray-400">Get notified about security events</p>
                          </div>
                          <div className="relative inline-block w-12 h-6">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              id="security-alerts" 
                              defaultChecked 
                              onChange={() => handleNotificationToggle('security-alerts')}
                            />
                            <label 
                              htmlFor="security-alerts" 
                              className="block w-12 h-6 rounded-full bg-panel-primary cursor-pointer transition-colors duration-200"
                            ></label>
                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                          <div>
                            <p className="font-medium text-white">Server Status</p>
                            <p className="text-sm text-gray-400">Get notified about server status changes</p>
                          </div>
                          <div className="relative inline-block w-12 h-6">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              id="server-status" 
                              defaultChecked 
                              onChange={() => handleNotificationToggle('server-status')}
                            />
                            <label 
                              htmlFor="server-status" 
                              className="block w-12 h-6 rounded-full bg-panel-primary cursor-pointer transition-colors duration-200"
                            ></label>
                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                          <div>
                            <p className="font-medium text-white">Backup Completion</p>
                            <p className="text-sm text-gray-400">Get notified when backups are completed</p>
                          </div>
                          <div className="relative inline-block w-12 h-6">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              id="backup-completion" 
                              onChange={() => handleNotificationToggle('backup-completion')}
                            />
                            <label 
                              htmlFor="backup-completion" 
                              className="block w-12 h-6 rounded-full bg-gray-600 cursor-pointer transition-colors duration-200"
                            ></label>
                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
