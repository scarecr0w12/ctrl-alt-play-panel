import { useNotifications } from '../components/NotificationSystem';

/**
 * A simplified toast hook for common notification patterns
 */
export const useToast = () => {
  const { success, error, warning, info, addNotification } = useNotifications();

  return {
    // Basic toast methods
    success: (message: string, options?: { duration?: number; persistent?: boolean }) => 
      success('Success', message, options),
    
    error: (message: string, options?: { duration?: number; persistent?: boolean }) => 
      error('Error', message, options),
    
    warning: (message: string, options?: { duration?: number; persistent?: boolean }) => 
      warning('Warning', message, options),
    
    info: (message: string, options?: { duration?: number; persistent?: boolean }) => 
      info('Info', message, options),

    // Advanced toast methods with custom titles
    successWithTitle: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => 
      success(title, message, options),
    
    errorWithTitle: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => 
      error(title, message, options),
    
    warningWithTitle: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => 
      warning(title, message, options),
    
    infoWithTitle: (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => 
      info(title, message, options),

    // Common application toasts
    saveSuccess: () => success('Saved successfully'),
    saveError: () => error('Failed to save changes'),
    deleteSuccess: () => success('Deleted successfully'),
    deleteError: () => error('Failed to delete'),
    connectionError: () => error('Connection failed', 'Please check your internet connection'),
    loadingError: () => error('Failed to load data', 'Please try refreshing the page'),
    
    // Action confirmation toasts
    confirmAction: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => 
      addNotification({
        type: 'warning',
        title,
        message,
        persistent: true,
        actions: [
          {
            label: 'Confirm',
            onClick: onConfirm,
            variant: 'primary'
          },
          {
            label: 'Cancel',
            onClick: onCancel || (() => {}),
            variant: 'secondary'
          }
        ]
      }),

    // Server action toasts
    serverStarting: (serverName: string) => 
      info('Starting Server', `${serverName} is starting up...`, { duration: 3000 }),
    
    serverStarted: (serverName: string) => 
      success('Server Started', `${serverName} is now running`),
    
    serverStopped: (serverName: string) => 
      warning('Server Stopped', `${serverName} has been stopped`),
    
    serverError: (serverName: string, errorMsg?: string) => 
      error('Server Error', `${serverName}: ${errorMsg || 'Unknown error occurred'}`, { persistent: true }),

    // Workshop action toasts
    workshopInstalling: (itemName: string) => 
      info('Installing Workshop Item', `Installing ${itemName}...`, { duration: 5000 }),
    
    workshopInstalled: (itemName: string) => 
      success('Workshop Item Installed', `${itemName} has been installed`),
    
    workshopUninstalled: (itemName: string) => 
      warning('Workshop Item Uninstalled', `${itemName} has been removed`),
    
    workshopError: (errorMsg: string) => 
      error('Workshop Error', errorMsg, { persistent: true }),

    // Profile action toasts
    profileUpdated: () => success('Profile Updated', 'Your profile has been saved'),
    passwordChanged: () => success('Password Changed', 'Your password has been updated'),
    emailChanged: () => success('Email Changed', 'Your email has been updated'),
    profileError: (errorMsg: string) => error('Profile Error', errorMsg),

    // File operation toasts
    fileUploaded: (fileName: string) => 
      success('File Uploaded', `${fileName} has been uploaded successfully`),
    
    fileDeleted: (fileName: string) => 
      warning('File Deleted', `${fileName} has been removed`),
    
    fileError: (errorMsg: string) => 
      error('File Operation Failed', errorMsg),

    // Permission toasts
    permissionDenied: () => 
      error('Permission Denied', 'You don\'t have permission to perform this action'),
    
    loginRequired: () => 
      warning('Login Required', 'Please log in to continue'),

    // Network status toasts
    networkOffline: () => 
      error('Connection Lost', 'You appear to be offline', { persistent: true }),
    
    networkOnline: () => 
      success('Connection Restored', 'You\'re back online'),

    // API response toasts
    apiSuccess: (action: string) => 
      success('Success', `${action} completed successfully`),
    
    apiError: (action: string, errorMsg?: string) => 
      error('Request Failed', `${action} failed${errorMsg ? `: ${errorMsg}` : ''}`)
  };
};

export default useToast;
