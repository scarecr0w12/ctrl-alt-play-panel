import React, { useState, useMemo } from 'react';
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
import { 
  useUsers, 
  useUserStats, 
  useUserActivity,
  User, 
  CreateUserData, 
  UpdateUserData,
  UserStats,
  UserActivityLog
} from '@/hooks';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  firstName: string;
  lastName: string;
}

interface EditUserFormData {
  username: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  firstName: string;
  lastName: string;
}

const UserManagement: React.FC = () => {
  const { 
    users, 
    loading, 
    createUser, 
    updateUser, 
    deleteUser,
    bulkDeleteUsers,
    bulkUpdateRole,
    bulkUpdateStatus
  } = useUsers();
  const { stats, loading: statsLoading } = useUserStats();
  const { activities, loading: activityLoading } = useUserActivity(1, 5);
  
  // State for modals and forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Bulk operations state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'delete' | 'role' | 'status'>('delete');
  const [bulkRole, setBulkRole] = useState<'USER' | 'MODERATOR' | 'ADMIN'>('USER');
  const [bulkStatus, setBulkStatus] = useState<boolean>(true);

  // Form state
  const [createFormData, setCreateFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    firstName: '',
    lastName: ''
  });
  
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    username: '',
    email: '',
    role: 'USER',
    isActive: true,
    firstName: '',
    lastName: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered and searched users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && user.isActive) ||
        (statusFilter === 'INACTIVE' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Validation functions
  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!createFormData.username.trim()) {
      errors.username = 'Username is required';
    } else if (createFormData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!createFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!createFormData.password) {
      errors.password = 'Password is required';
    } else if (createFormData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (createFormData.password !== createFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editFormData.username.trim()) {
      errors.username = 'Username is required';
    } else if (editFormData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler functions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCreateForm()) return;
    
    setIsSubmitting(true);
    try {
      const userData: CreateUserData = {
        username: createFormData.username.trim(),
        email: createFormData.email.trim(),
        password: createFormData.password,
        role: createFormData.role
      };
      
      await createUser(userData);
      setShowCreateModal(false);
      resetCreateForm();
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !validateEditForm()) return;
    
    setIsSubmitting(true);
    try {
      const userData: UpdateUserData = {
        username: editFormData.username.trim(),
        email: editFormData.email.trim(),
        role: editFormData.role,
        isActive: editFormData.isActive,
        profile: {
          firstName: editFormData.firstName.trim() || undefined,
          lastName: editFormData.lastName.trim() || undefined
        }
      };
      
      await updateUser(selectedUser.id, userData);
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.size === 0) return;
    
    setIsSubmitting(true);
    try {
      const userIds = Array.from(selectedUsers);
      
      switch (bulkAction) {
        case 'delete':
          await bulkDeleteUsers(userIds);
          break;
        case 'role':
          await bulkUpdateRole(userIds, bulkRole);
          break;
        case 'status':
          await bulkUpdateStatus(userIds, bulkStatus);
          break;
      }
      
      setShowBulkModal(false);
      setSelectedUsers(new Set());
      toast.success(`Bulk ${bulkAction} completed successfully!`);
    } catch (error) {
      console.error(`Error performing bulk ${bulkAction}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
      firstName: '',
      lastName: ''
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

  // Status badge component
  const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  // User Stats Component
  const UserStatsCards: React.FC<{ stats: UserStats }> = ({ stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactiveUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Signups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentSignups}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Activity Feed Component
  const ActivityFeed: React.FC<{ activities: UserActivityLog[] }> = ({ activities }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user.username}
                  </p>
                  <p className="text-xs text-gray-500">{activity.action}</p>
                  {activity.details && (
                    <p className="text-xs text-gray-400">{activity.details}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowStatsModal(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ChartBarIcon className="h-4 w-4" />
            <span>Statistics</span>
          </Button>
          <Button
            onClick={() => setShowActivityModal(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ClockIcon className="h-4 w-4" />
            <span>Activity</span>
          </Button>
          <Button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create User</span>
          </Button>
        </div>
      </div>

      {/* User Statistics Cards */}
      {stats && <UserStatsCards stats={stats} />}

      {/* Recent Activity Feed */}
      {activities.length > 0 && <ActivityFeed activities={activities} />}

      {/* Filters and Search */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon />}
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.size} user(s) selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkAction('role');
                    setShowBulkModal(true);
                  }}
                >
                  Change Role
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkAction('status');
                    setShowBulkModal(true);
                  }}
                >
                  Change Status
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setBulkAction('delete');
                    setShowBulkModal(true);
                  }}
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by creating a new user'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.profile?.firstName && user.profile?.lastName 
                                ? `${user.profile.firstName} ${user.profile.lastName}`
                                : user.username}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.profile?.firstName && user.profile?.lastName && (
                              <div className="text-xs text-gray-400">@{user.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteModal(user)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        description="Add a new user to the system with appropriate role and permissions."
        size="lg"
      >
        <Form onSubmit={handleCreateUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="username" required>Username</FormLabel>
              <Input
                id="username"
                value={createFormData.username}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                error={formErrors.username}
                placeholder="Enter username"
              />
              <FormError message={formErrors.username} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="email" required>Email</FormLabel>
              <Input
                id="email"
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                error={formErrors.email}
                placeholder="Enter email address"
              />
              <FormError message={formErrors.email} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="firstName">First Name</FormLabel>
              <Input
                id="firstName"
                value={createFormData.firstName}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="lastName">Last Name</FormLabel>
              <Input
                id="lastName"
                value={createFormData.lastName}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="password" required>Password</FormLabel>
              <Input
                id="password"
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                error={formErrors.password}
                placeholder="Enter password"
              />
              <FormError message={formErrors.password} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="confirmPassword" required>Confirm Password</FormLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={createFormData.confirmPassword}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                error={formErrors.confirmPassword}
                placeholder="Confirm password"
              />
              <FormError message={formErrors.confirmPassword} />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="role" required>Role</FormLabel>
            <select
              id="role"
              value={createFormData.role}
              onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value as 'USER' | 'MODERATOR' | 'ADMIN' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USER">User - Basic access</option>
              <option value="MODERATOR">Moderator - Limited admin access</option>
              <option value="ADMIN">Admin - Full system access</option>
            </select>
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        description={`Update information for ${selectedUser?.username}`}
        size="lg"
      >
        <Form onSubmit={handleEditUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="edit-username" required>Username</FormLabel>
              <Input
                id="edit-username"
                value={editFormData.username}
                onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                error={formErrors.username}
                placeholder="Enter username"
              />
              <FormError message={formErrors.username} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-email" required>Email</FormLabel>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                error={formErrors.email}
                placeholder="Enter email address"
              />
              <FormError message={formErrors.email} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-firstName">First Name</FormLabel>
              <Input
                id="edit-firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-lastName">Last Name</FormLabel>
              <Input
                id="edit-lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-role" required>Role</FormLabel>
              <select
                id="edit-role"
                value={editFormData.role}
                onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as 'USER' | 'MODERATOR' | 'ADMIN' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USER">User - Basic access</option>
                <option value="MODERATOR">Moderator - Limited admin access</option>
                <option value="ADMIN">Admin - Full system access</option>
              </select>
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-status">Status</FormLabel>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-status"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-status" className="text-sm text-gray-700">
                  Account is active
                </label>
              </div>
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Update User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                This will permanently delete the user account
              </h4>
              <p className="text-sm text-red-700 mt-1">
                User: <strong>{selectedUser?.username}</strong> ({selectedUser?.email})
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={isSubmitting}
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={`Bulk ${bulkAction === 'delete' ? 'Delete' : bulkAction === 'role' ? 'Role Change' : 'Status Change'}`}
        description={`Apply ${bulkAction} to ${selectedUsers.size} selected user(s)`}
        size="md"
      >
        <div className="space-y-4">
          {bulkAction === 'delete' && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  This will permanently delete {selectedUsers.size} user account(s)
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {bulkAction === 'role' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                New Role
              </label>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as 'USER' | 'MODERATOR' | 'ADMIN')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USER">User - Basic access</option>
                <option value="MODERATOR">Moderator - Limited admin access</option>
                <option value="ADMIN">Admin - Full system access</option>
              </select>
            </div>
          )}

          {bulkAction === 'status' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                New Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bulkStatus"
                    checked={bulkStatus === true}
                    onChange={() => setBulkStatus(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bulkStatus"
                    checked={bulkStatus === false}
                    onChange={() => setBulkStatus(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              loading={isSubmitting}
              onClick={handleBulkAction}
            >
              {bulkAction === 'delete' ? 'Delete Users' : 
               bulkAction === 'role' ? 'Update Roles' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="User Statistics"
        description="Detailed user statistics and analytics"
        size="lg"
      >
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900">Total Users</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900">Active Users</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Users by Role</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Administrators</span>
                    <span className="text-xl font-bold text-red-600">{stats.usersByRole.ADMIN}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Moderators</span>
                    <span className="text-xl font-bold text-yellow-600">{stats.usersByRole.MODERATOR}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Users</span>
                    <span className="text-xl font-bold text-blue-600">{stats.usersByRole.USER}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-900">Recent Signups</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.recentSignups}</p>
                  <p className="text-sm text-purple-700">Last 30 days</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-indigo-900">Recent Activity</h3>
                  <p className="text-3xl font-bold text-indigo-600">{stats.recentActivity}</p>
                  <p className="text-sm text-indigo-700">Last 24 hours</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">Failed to load statistics</p>
          )}
        </div>
      </Modal>

      {/* Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="User Activity"
        description="Recent user activity and actions"
        size="lg"
      >
        <div className="space-y-4">
          {activityLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {activity.user.username}
                        </span>
                        <span className="text-gray-500">({activity.user.email})</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.action}</p>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                      )}
                      {activity.ipAddress && (
                        <p className="text-xs text-gray-400 mt-1">
                          IP: {activity.ipAddress}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent activity found</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
