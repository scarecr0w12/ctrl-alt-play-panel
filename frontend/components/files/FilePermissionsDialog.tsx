import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { filesApi } from '@/lib/api';

interface FilePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  filePath: string;
  fileName: string;
  onPermissionsChanged?: () => void;
}

interface FilePermissions {
  mode: string;
  owner: string;
  group: string;
  octal: string;
  symbolic: string;
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export default function FilePermissionsDialog({ 
  isOpen, 
  onClose, 
  serverId, 
  filePath, 
  fileName,
  onPermissionsChanged
}: FilePermissionsDialogProps) {
  const [permissions, setPermissions] = useState<FilePermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMode, setNewMode] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await filesApi.getPermissions(serverId, filePath);
      if (response.data.success) {
        const perms = response.data.permissions;
        setPermissions(perms);
        setNewMode(perms.octal || perms.mode || '644');
      } else {
        setError('Failed to load file permissions');
      }
    } catch (err) {
      setError('Error loading file permissions');
      console.error('Permissions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePermissions = async () => {
    if (!newMode) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await filesApi.setPermissions(serverId, filePath, newMode);
      if (response.data.success) {
        await loadPermissions(); // Reload to get updated permissions
        onPermissionsChanged?.();
      } else {
        setError('Failed to update file permissions');
      }
    } catch (err) {
      setError('Error updating file permissions');
      console.error('Set permissions error:', err);
    } finally {
      setSaving(false);
    }
  };

  const parseOctalPermissions = (octal: string) => {
    const digits = octal.padStart(3, '0');
    const owner = parseInt(digits[0]);
    const group = parseInt(digits[1]);
    const other = parseInt(digits[2]);
    
    return {
      owner: {
        read: (owner & 4) !== 0,
        write: (owner & 2) !== 0,
        execute: (owner & 1) !== 0
      },
      group: {
        read: (group & 4) !== 0,
        write: (group & 2) !== 0,
        execute: (group & 1) !== 0
      },
      other: {
        read: (other & 4) !== 0,
        write: (other & 2) !== 0,
        execute: (other & 1) !== 0
      }
    };
  };

  const updatePermission = (entity: 'owner' | 'group' | 'other', permission: 'read' | 'write' | 'execute', value: boolean) => {
    const current = parseOctalPermissions(newMode);
    current[entity][permission] = value;
    
    const calculateDigit = (perms: { read: boolean; write: boolean; execute: boolean }) => {
      return (perms.read ? 4 : 0) + (perms.write ? 2 : 0) + (perms.execute ? 1 : 0);
    };
    
    const newOctal = `${calculateDigit(current.owner)}${calculateDigit(current.group)}${calculateDigit(current.other)}`;
    setNewMode(newOctal);
  };

  const getCommonPermissions = () => [
    { name: 'Read only (444)', value: '444', description: 'Read only for all' },
    { name: 'Read/Write Owner (644)', value: '644', description: 'Standard file permissions' },
    { name: 'Executable (755)', value: '755', description: 'Standard executable permissions' },
    { name: 'Full Access (777)', value: '777', description: 'Full access for all (use with caution)' }
  ];

  const renderPermissionCheckboxes = () => {
    if (!newMode) return null;
    
    const perms = parseOctalPermissions(newMode);
    
    const PermissionRow = ({ 
      label, 
      icon, 
      entity 
    }: { 
      label: string; 
      icon: React.ReactNode; 
      entity: 'owner' | 'group' | 'other' 
    }) => (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-white font-medium">{label}</span>
        </div>
        <div className="flex space-x-4">
          {(['read', 'write', 'execute'] as const).map(permission => (
            <label key={permission} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={perms[entity][permission]}
                onChange={(e) => updatePermission(entity, permission, e.target.checked)}
                className="rounded border-gray-600 bg-panel-surface text-panel-primary focus:ring-panel-primary"
              />
              <span className="text-sm text-gray-300 capitalize">{permission}</span>
            </label>
          ))}
        </div>
      </div>
    );

    return (
      <div className="space-y-1">
        <PermissionRow 
          label="Owner" 
          icon={<UserIcon className="h-4 w-4 text-blue-400" />}
          entity="owner"
        />
        <PermissionRow 
          label="Group" 
          icon={<UsersIcon className="h-4 w-4 text-green-400" />}
          entity="group"
        />
        <PermissionRow 
          label="Others" 
          icon={<GlobeAltIcon className="h-4 w-4 text-yellow-400" />}
          entity="other"
        />
      </div>
    );
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        
        <div className="relative bg-panel-surface rounded-xl shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-panel-primary" />
              <div>
                <Dialog.Title className="text-lg font-semibold text-white">
                  File Permissions
                </Dialog.Title>
                <p className="text-sm text-gray-400">{fileName}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panel-primary"></div>
                <span className="ml-2 text-gray-400">Loading permissions...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
              </div>
            ) : permissions ? (
              <>
                {/* Current Permissions Display */}
                <div className="bg-panel-darker rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-2">Current Permissions</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Mode:</span>
                      <span className="ml-2 text-white font-mono">{permissions.symbolic}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Octal:</span>
                      <span className="ml-2 text-white font-mono">{permissions.octal}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Owner:</span>
                      <span className="ml-2 text-white">{permissions.owner}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Group:</span>
                      <span className="ml-2 text-white">{permissions.group}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Quick Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getCommonPermissions().map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => setNewMode(preset.value)}
                        className={`p-2 text-left rounded-lg border transition-colors ${
                          newMode === preset.value
                            ? 'border-panel-primary bg-panel-primary/20 text-white'
                            : 'border-white/20 hover:border-white/40 text-gray-300'
                        }`}
                      >
                        <div className="font-mono text-sm">{preset.name}</div>
                        <div className="text-xs text-gray-400">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Permission Settings */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Manual Settings</h3>
                  <div className="bg-panel-darker rounded-lg p-4 border border-white/10">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-white mb-2">
                        Octal Mode
                      </label>
                      <input
                        type="text"
                        value={newMode}
                        onChange={(e) => setNewMode(e.target.value.replace(/[^0-7]/g, '').slice(0, 3))}
                        className="w-24 px-3 py-2 bg-panel-surface border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:border-panel-primary"
                        placeholder="644"
                        maxLength={3}
                      />
                    </div>
                    
                    {renderPermissionCheckboxes()}
                  </div>
                </div>
              </>
            ) : null}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-white/10 bg-panel-darker">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={savePermissions}
              disabled={saving || !permissions || newMode === permissions.octal}
              className="px-4 py-2 bg-panel-primary hover:bg-panel-primary/80 disabled:bg-panel-primary/50 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{saving ? 'Saving...' : 'Apply Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}