import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { FileItem } from '@/hooks/useFiles';
import { filesApi } from '@/lib/api';

interface FilePermissionsDialogProps {
  file: FileItem | null;
  serverId: string;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated: () => void;
}

interface PermissionInfo {
  permissions: string;
  owner?: string;
  group?: string;
}

interface PermissionBit {
  name: string;
  value: number;
  label: string;
}

const PERMISSION_BITS: PermissionBit[] = [
  { name: 'read', value: 4, label: 'Read' },
  { name: 'write', value: 2, label: 'Write' },
  { name: 'execute', value: 1, label: 'Execute' },
];

const PERMISSION_GROUPS = [
  { name: 'owner', label: 'Owner' },
  { name: 'group', label: 'Group' },
  { name: 'other', label: 'Other' },
];

export default function FilePermissionsDialog({
  file,
  serverId,
  currentPath,
  isOpen,
  onClose,
  onPermissionsUpdated,
}: FilePermissionsDialogProps) {
  const [permissionInfo, setPermissionInfo] = useState<PermissionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<number[]>([0, 0, 0]); // owner, group, other

  useEffect(() => {
    if (isOpen && file) {
      loadPermissions();
    }
  }, [isOpen, file, serverId, currentPath]);

  const loadPermissions = async () => {
    if (!file || !serverId) return;
    
    setLoading(true);
    setError(null);

    try {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const response = await filesApi.getPermissions(serverId, filePath);
      const info = response.data.data || response.data;
      
      setPermissionInfo(info);
      
      // Parse octal permissions into individual digits
      const octal = info.permissions || '644';
      const digits = octal.split('').map((d: string) => parseInt(d, 10));
      
      // Ensure we have 3 digits (pad with 0 if needed)
      while (digits.length < 3) {
        digits.unshift(0);
      }
      
      setPermissions(digits.slice(-3)); // Take last 3 digits
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const savePermissions = async () => {
    if (!file || !serverId) return;
    
    setSaving(true);
    setError(null);

    try {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const octalPermissions = permissions.join('');
      
      await filesApi.setPermissions(serverId, filePath, octalPermissions);
      
      onPermissionsUpdated();
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (groupIndex: number, bitValue: number) => {
    const newPermissions = [...permissions];
    const current = newPermissions[groupIndex];
    
    if (current & bitValue) {
      // Remove the bit
      newPermissions[groupIndex] = current & ~bitValue;
    } else {
      // Add the bit
      newPermissions[groupIndex] = current | bitValue;
    }
    
    setPermissions(newPermissions);
  };

  const setCommonPermission = (preset: string) => {
    switch (preset) {
      case '755':
        setPermissions([7, 5, 5]); // rwxr-xr-x
        break;
      case '644':
        setPermissions([6, 4, 4]); // rw-r--r--
        break;
      case '600':
        setPermissions([6, 0, 0]); // rw-------
        break;
      case '777':
        setPermissions([7, 7, 7]); // rwxrwxrwx
        break;
      case '400':
        setPermissions([4, 0, 0]); // r--------
        break;
    }
  };

  const getPermissionString = () => {
    return permissions.map(perm => {
      let str = '';
      str += (perm & 4) ? 'r' : '-';
      str += (perm & 2) ? 'w' : '-';
      str += (perm & 1) ? 'x' : '-';
      return str;
    }).join('');
  };

  const getPermissionDescription = (groupIndex: number) => {
    const perm = permissions[groupIndex];
    const descriptions = [];
    
    if (perm & 4) descriptions.push('read');
    if (perm & 2) descriptions.push('write');
    if (perm & 1) descriptions.push('execute');
    
    return descriptions.length > 0 ? descriptions.join(', ') : 'no permissions';
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">File Permissions</h2>
            <p className="text-gray-400 text-sm mt-1">{file.name}</p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-panel-primary"></div>
              <span className="ml-3 text-gray-400">Loading permissions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <button
                onClick={loadPermissions}
                className="bg-panel-primary hover:bg-panel-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Info */}
              {permissionInfo && (
                <div className="bg-panel-surface rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Current Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Permissions:</span>
                      <span className="text-white ml-2 font-mono">
                        {permissionInfo.permissions} ({getPermissionString()})
                      </span>
                    </div>
                    {permissionInfo.owner && (
                      <div>
                        <span className="text-gray-400">Owner:</span>
                        <span className="text-white ml-2">{permissionInfo.owner}</span>
                      </div>
                    )}
                    {permissionInfo.group && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Group:</span>
                        <span className="text-white ml-2">{permissionInfo.group}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Permission Editor */}
              <div>
                <h3 className="text-white font-medium mb-3">Edit Permissions</h3>
                
                {/* Octal Display */}
                <div className="bg-panel-surface rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Octal:</span>
                    <span className="text-white font-mono text-lg">
                      {permissions.join('')}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-400">String:</span>
                    <span className="text-white font-mono ml-2">
                      {getPermissionString()}
                    </span>
                  </div>
                </div>

                {/* Permission Grid */}
                <div className="space-y-4">
                  {PERMISSION_GROUPS.map((group, groupIndex) => (
                    <div key={group.name} className="bg-panel-surface rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">{group.label}</h4>
                        <span className="text-gray-400 text-sm">
                          {getPermissionDescription(groupIndex)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {PERMISSION_BITS.map((bit) => (
                          <label
                            key={bit.name}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(permissions[groupIndex] & bit.value) !== 0}
                              onChange={() => togglePermission(groupIndex, bit.value)}
                              className="rounded border-gray-600 bg-panel-darker text-panel-primary focus:ring-panel-primary"
                            />
                            <span className="text-white text-sm">{bit.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Common Presets */}
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-3">Common Permissions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: '755', label: '755 (rwxr-xr-x)', desc: 'Executable files' },
                      { value: '644', label: '644 (rw-r--r--)', desc: 'Regular files' },
                      { value: '600', label: '600 (rw-------)', desc: 'Private files' },
                      { value: '777', label: '777 (rwxrwxrwx)', desc: 'Full access' },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setCommonPermission(preset.value)}
                        className="text-left p-2 bg-panel-darker hover:bg-panel-light rounded text-sm transition-colors"
                        title={preset.desc}
                      >
                        <div className="text-white font-mono">{preset.label}</div>
                        <div className="text-gray-400 text-xs">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={savePermissions}
            disabled={saving || loading}
            className="bg-panel-primary hover:bg-panel-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Apply Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}