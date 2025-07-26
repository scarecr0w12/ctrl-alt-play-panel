# Notification System Documentation

## Overview

The Ctrl-Alt-Play Panel notification system provides a comprehensive solution for user feedback, including both simple toast messages and interactive notifications with actions. The system supports multiple notification types, auto-dismiss functionality, and persistent notifications.

## Architecture

### Components

1. **NotificationProvider** - Context provider that manages notification state
2. **NotificationContainer** - Renders notifications in a fixed position
3. **NotificationItem** - Individual notification component with animations
4. **useNotifications** - Hook for direct notification management
5. **useToast** - Simplified hook for common toast patterns

### Features

- 4 notification types: `success`, `error`, `warning`, `info`
- Auto-dismiss with configurable duration
- Persistent notifications
- Interactive notifications with action buttons
- Smooth animations and transitions
- Queue management with maximum notification limits
- Context-aware helper functions

## Basic Usage

### Setup

The notification system is already integrated into the main app. The `NotificationProvider` wraps the entire application in `_app.tsx`.

### Using the Toast Hook

```typescript
import { useToast } from '@/hooks';

const MyComponent = () => {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  // Context-specific toasts
  const handleServerStart = () => {
    toast.serverStarted('Game Server #1');
  };

  const handleProfileUpdate = () => {
    toast.profileUpdated();
  };
};
```

### Using the Notifications Hook

```typescript
import { useNotifications } from '@/hooks';

const MyComponent = () => {
  const { addNotification, removeNotification, clearAll } = useNotifications();

  const handleCustomNotification = () => {
    const id = addNotification({
      type: 'warning',
      title: 'Custom Notification',
      message: 'This is a custom notification with actions',
      persistent: true,
      actions: [
        {
          label: 'Confirm',
          onClick: () => console.log('Confirmed'),
          variant: 'primary'
        },
        {
          label: 'Cancel',
          onClick: () => removeNotification(id),
          variant: 'secondary'
        }
      ]
    });
  };
};
```

## API Reference

### NotificationProvider Props

```typescript
interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number; // Default: 5
  defaultDuration?: number;  // Default: 5000ms
}
```

### Notification Interface

```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}
```

### useNotifications Hook

```typescript
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
}
```

### useToast Hook Methods

#### Basic Toasts
- `success(message: string, options?)` - Simple success toast
- `error(message: string, options?)` - Simple error toast
- `warning(message: string, options?)` - Simple warning toast
- `info(message: string, options?)` - Simple info toast

#### Advanced Toasts
- `successWithTitle(title: string, message?: string, options?)`
- `errorWithTitle(title: string, message?: string, options?)`
- `warningWithTitle(title: string, message?: string, options?)`
- `infoWithTitle(title: string, message?: string, options?)`

#### Context-Specific Toasts

**Common Actions:**
- `saveSuccess()` - "Saved successfully"
- `saveError()` - "Failed to save changes"
- `deleteSuccess()` - "Deleted successfully"
- `deleteError()` - "Failed to delete"
- `connectionError()` - Connection failed message
- `loadingError()` - Failed to load data message

**Server Actions:**
- `serverStarting(serverName: string)` - Server starting notification
- `serverStarted(serverName: string)` - Server started notification
- `serverStopped(serverName: string)` - Server stopped notification
- `serverError(serverName: string, error?: string)` - Server error notification

**Workshop Actions:**
- `workshopInstalling(itemName: string)` - Workshop item installing
- `workshopInstalled(itemName: string)` - Workshop item installed
- `workshopUninstalled(itemName: string)` - Workshop item uninstalled
- `workshopError(error: string)` - Workshop operation error

**Profile Actions:**
- `profileUpdated()` - Profile updated successfully
- `passwordChanged()` - Password changed successfully
- `emailChanged()` - Email changed successfully
- `profileError(error: string)` - Profile operation error

**File Operations:**
- `fileUploaded(fileName: string)` - File uploaded successfully
- `fileDeleted(fileName: string)` - File deleted
- `fileError(error: string)` - File operation error

**Permission & Auth:**
- `permissionDenied()` - Permission denied message
- `loginRequired()` - Login required message

**Network Status:**
- `networkOffline()` - Connection lost (persistent)
- `networkOnline()` - Connection restored

**API Operations:**
- `apiSuccess(action: string)` - Generic API success
- `apiError(action: string, error?: string)` - Generic API error

#### Special Methods

**Confirmation Dialog:**
```typescript
confirmAction(
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void
)
```

## Examples

### Simple Toast

```typescript
const toast = useToast();

// Basic success toast
toast.success('Operation completed!');

// Error with custom duration
toast.error('Failed to save', { duration: 8000 });

// Persistent warning
toast.warning('System maintenance in progress', { persistent: true });
```

### Interactive Notification

```typescript
const { addNotification } = useNotifications();

addNotification({
  type: 'warning',
  title: 'Confirm Delete',
  message: 'Are you sure you want to delete this server?',
  persistent: true,
  actions: [
    {
      label: 'Delete',
      onClick: async () => {
        await deleteServer();
        toast.deleteSuccess();
      },
      variant: 'primary'
    },
    {
      label: 'Cancel',
      onClick: () => {},
      variant: 'secondary'
    }
  ]
});
```

### Context-Specific Usage

```typescript
const toast = useToast();

// Server management
const startServer = async () => {
  toast.serverStarting('Game Server #1');
  try {
    await api.startServer('server-1');
    toast.serverStarted('Game Server #1');
  } catch (error) {
    toast.serverError('Game Server #1', error.message);
  }
};

// Workshop management
const installWorkshopItem = async (itemId: string, itemName: string) => {
  toast.workshopInstalling(itemName);
  try {
    await api.installWorkshopItem(itemId);
    toast.workshopInstalled(itemName);
  } catch (error) {
    toast.workshopError(`Failed to install ${itemName}: ${error.message}`);
  }
};

// Profile updates
const updateProfile = async (data: UpdateProfileData) => {
  try {
    await api.updateProfile(data);
    toast.profileUpdated();
  } catch (error) {
    toast.profileError(error.message);
  }
};
```

## Styling

The notification system uses Tailwind CSS classes for styling. Each notification type has its own color scheme:

- **Success**: Green theme (`bg-green-50`, `border-green-200`, `text-green-400`)
- **Error**: Red theme (`bg-red-50`, `border-red-200`, `text-red-400`)
- **Warning**: Yellow theme (`bg-yellow-50`, `border-yellow-200`, `text-yellow-400`)
- **Info**: Blue theme (`bg-blue-50`, `border-blue-200`, `text-blue-400`)

## Positioning

- **Notifications**: Fixed position at `top-4 right-4` (top-right corner)
- **React Hot Toast**: Positioned at `top-left` to avoid conflicts

## Best Practices

1. **Use context-specific toasts** when available (e.g., `toast.serverStarted()` instead of `toast.success()`)
2. **Keep messages concise** but informative
3. **Use persistent notifications** for critical actions that require user attention
4. **Provide action buttons** for notifications that require user response
5. **Handle errors gracefully** with helpful error messages
6. **Use appropriate notification types** (success, error, warning, info)
7. **Test notification behavior** across different screen sizes

## Demo

Visit `/notification-demo` to see all notification types and features in action.

## Integration Notes

- The notification system works alongside the existing react-hot-toast system
- Both systems can be used simultaneously without conflicts
- The new system is positioned on the right side, while react-hot-toast remains on the left
- Gradually migrate from react-hot-toast to the new system for consistency
