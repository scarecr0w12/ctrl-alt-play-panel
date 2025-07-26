import React from 'react';
import { Button } from '@/components/ui';
import { useToast, useNotifications } from '@/hooks';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const NotificationDemo: React.FC = () => {
  const toast = useToast();
  const { addNotification, clearAll } = useNotifications();

  const handleBasicToasts = () => {
    toast.success('This is a success message!');
    setTimeout(() => toast.error('This is an error message!'), 500);
    setTimeout(() => toast.warning('This is a warning message!'), 1000);
    setTimeout(() => toast.info('This is an info message!'), 1500);
  };

  const handleServerToasts = () => {
    toast.serverStarting('Game Server #1');
    setTimeout(() => toast.serverStarted('Game Server #1'), 2000);
    setTimeout(() => toast.serverError('Game Server #2', 'Port already in use'), 3000);
  };

  const handleWorkshopToasts = () => {
    toast.workshopInstalling('CS2 Dust2 Map');
    setTimeout(() => toast.workshopInstalled('CS2 Dust2 Map'), 2000);
    setTimeout(() => toast.workshopError('Failed to download workshop item'), 3000);
  };

  const handleProfileToasts = () => {
    toast.profileUpdated();
    setTimeout(() => toast.passwordChanged(), 500);
    setTimeout(() => toast.emailChanged(), 1000);
  };

  const handleFileToasts = () => {
    toast.fileUploaded('config.cfg');
    setTimeout(() => toast.fileDeleted('old-config.cfg'), 1000);
    setTimeout(() => toast.fileError('Permission denied: Cannot write to directory'), 2000);
  };

  const handleNetworkToasts = () => {
    toast.networkOffline();
    setTimeout(() => toast.networkOnline(), 3000);
  };

  const handleConfirmationToast = () => {
    toast.confirmAction(
      'Delete Server?',
      'This action cannot be undone. Are you sure you want to delete this server?',
      () => toast.deleteSuccess(),
      () => toast.info('Action cancelled')
    );
  };

  const handlePersistentNotification = () => {
    addNotification({
      type: 'warning',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will begin in 30 minutes. Please save your work.',
      persistent: true,
      actions: [
        {
          label: 'Remind me later',
          onClick: () => toast.info('Reminder set for 10 minutes'),
          variant: 'secondary'
        },
        {
          label: 'Got it',
          onClick: () => {},
          variant: 'primary'
        }
      ]
    });
  };

  const handleCustomNotification = () => {
    addNotification({
      type: 'success',
      title: 'Custom Notification',
      message: 'This is a custom notification with actions and longer duration',
      duration: 10000,
      actions: [
        {
          label: 'View Details',
          onClick: () => toast.info('Opening details view...'),
          variant: 'primary'
        },
        {
          label: 'Dismiss',
          onClick: () => {},
          variant: 'secondary'
        }
      ]
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notification System Demo
            </h1>
            <p className="text-gray-600">
              Test all the different types of notifications and toasts available in the system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Toasts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Toasts</h2>
              <p className="text-gray-600 mb-4">
                Basic success, error, warning, and info messages.
              </p>
              <Button onClick={handleBasicToasts} className="w-full">
                Show Basic Toasts
              </Button>
            </div>

            {/* Server Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Server Actions</h2>
              <p className="text-gray-600 mb-4">
                Server lifecycle notifications (start, stop, errors).
              </p>
              <Button onClick={handleServerToasts} className="w-full">
                Show Server Toasts
              </Button>
            </div>

            {/* Workshop Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Workshop Actions</h2>
              <p className="text-gray-600 mb-4">
                Steam Workshop installation and management notifications.
              </p>
              <Button onClick={handleWorkshopToasts} className="w-full">
                Show Workshop Toasts
              </Button>
            </div>

            {/* Profile Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Actions</h2>
              <p className="text-gray-600 mb-4">
                User profile update notifications.
              </p>
              <Button onClick={handleProfileToasts} className="w-full">
                Show Profile Toasts
              </Button>
            </div>

            {/* File Operations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">File Operations</h2>
              <p className="text-gray-600 mb-4">
                File upload, delete, and error notifications.
              </p>
              <Button onClick={handleFileToasts} className="w-full">
                Show File Toasts
              </Button>
            </div>

            {/* Network Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Network Status</h2>
              <p className="text-gray-600 mb-4">
                Network connectivity status notifications.
              </p>
              <Button onClick={handleNetworkToasts} className="w-full">
                Show Network Toasts
              </Button>
            </div>

            {/* Confirmation Dialog */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Confirmation Dialog</h2>
              <p className="text-gray-600 mb-4">
                Persistent notification with action buttons.
              </p>
              <Button onClick={handleConfirmationToast} className="w-full">
                Show Confirmation
              </Button>
            </div>

            {/* Persistent Notification */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Persistent Notification</h2>
              <p className="text-gray-600 mb-4">
                Notifications that stay until manually dismissed.
              </p>
              <Button onClick={handlePersistentNotification} className="w-full">
                Show Persistent Notification
              </Button>
            </div>

            {/* Custom Notification */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Custom Notification</h2>
              <p className="text-gray-600 mb-4">
                Custom notification with actions and extended duration.
              </p>
              <Button onClick={handleCustomNotification} className="w-full">
                Show Custom Notification
              </Button>
            </div>

            {/* Clear All */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Clear All</h2>
              <p className="text-gray-600 mb-4">
                Remove all active notifications at once.
              </p>
              <Button onClick={clearAll} variant="secondary" className="w-full">
                Clear All Notifications
              </Button>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Notification Features
            </h3>
            <ul className="text-blue-800 space-y-1">
              <li>• 4 notification types: success, error, warning, info</li>
              <li>• Auto-dismiss with configurable duration</li>
              <li>• Persistent notifications that stay until dismissed</li>
              <li>• Action buttons for interactive notifications</li>
              <li>• Smooth animations and transitions</li>
              <li>• Queue management with maximum notification limit</li>
              <li>• Context-aware toast helper functions</li>
              <li>• Dual positioning (notifications on right, toasts on left)</li>
            </ul>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default NotificationDemo;
