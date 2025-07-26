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
import { useNodes, Node, CreateNodeData, UpdateNodeData, NodeStats } from '@/hooks';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  SignalIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface NodeFormData {
  name: string;
  fqdn: string;
  scheme: string;
  port: number;
  publicPort: number;
  memory: number;
  disk: number;
  locationId: string;
  isPublic: boolean;
  isBehindProxy: boolean;
  description: string;
}

interface EditNodeFormData {
  name: string;
  description: string;
  fqdn: string;
  scheme: string;
  port: number;
  publicPort: number;
  memory: number;
  disk: number;
  locationId: string;
  isPublic: boolean;
  isBehindProxy: boolean;
  isMaintenanceMode: boolean;
}

const NodeManagement: React.FC = () => {
  const { nodes, loading, createNode, updateNode, deleteNode, getNodeStats } = useNodes();
  
  // State for modals and forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeStats, setNodeStats] = useState<NodeStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingStats, setLoadingStats] = useState(false);

  // Form state
  const [createFormData, setCreateFormData] = useState<NodeFormData>({
    name: '',
    fqdn: '',
    scheme: 'https',
    port: 8080,
    publicPort: 8080,
    memory: 0,
    disk: 0,
    locationId: '',
    isPublic: false,
    isBehindProxy: false,
    description: ''
  });
  
  const [editFormData, setEditFormData] = useState<EditNodeFormData>({
    name: '',
    description: '',
    fqdn: '',
    scheme: 'https',
    port: 8080,
    publicPort: 8080,
    memory: 0,
    disk: 0,
    locationId: '',
    isPublic: false,
    isBehindProxy: false,
    isMaintenanceMode: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered and searched nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.fqdn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'MAINTENANCE' && node.isMaintenanceMode) ||
        (statusFilter === 'ACTIVE' && !node.isMaintenanceMode);
      
      return matchesSearch && matchesStatus;
    });
  }, [nodes, searchTerm, statusFilter]);

  // Validation functions
  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!createFormData.name.trim()) {
      errors.name = 'Node name is required';
    } else if (createFormData.name.length < 3) {
      errors.name = 'Node name must be at least 3 characters';
    }
    
    if (!createFormData.fqdn.trim()) {
      errors.fqdn = 'FQDN is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(createFormData.fqdn)) {
      errors.fqdn = 'Please enter a valid FQDN (e.g., node1.example.com)';
    }
    
    if (!createFormData.locationId) {
      errors.locationId = 'Location is required';
    }
    
    if (createFormData.port <= 0 || createFormData.port > 65535) {
      errors.port = 'Port must be between 1 and 65535';
    }
    
    if (createFormData.publicPort <= 0 || createFormData.publicPort > 65535) {
      errors.publicPort = 'Public port must be between 1 and 65535';
    }
    
    if (createFormData.memory < 0) {
      errors.memory = 'Memory cannot be negative';
    }
    
    if (createFormData.disk < 0) {
      errors.disk = 'Disk space cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editFormData.name.trim()) {
      errors.name = 'Node name is required';
    } else if (editFormData.name.length < 3) {
      errors.name = 'Node name must be at least 3 characters';
    }
    
    if (!editFormData.fqdn.trim()) {
      errors.fqdn = 'FQDN is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(editFormData.fqdn)) {
      errors.fqdn = 'Please enter a valid FQDN';
    }
    
    if (!editFormData.locationId) {
      errors.locationId = 'Location is required';
    }
    
    if (editFormData.port <= 0 || editFormData.port > 65535) {
      errors.port = 'Port must be between 1 and 65535';
    }
    
    if (editFormData.publicPort <= 0 || editFormData.publicPort > 65535) {
      errors.publicPort = 'Public port must be between 1 and 65535';
    }
    
    if (editFormData.memory < 0) {
      errors.memory = 'Memory cannot be negative';
    }
    
    if (editFormData.disk < 0) {
      errors.disk = 'Disk space cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler functions
  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCreateForm()) return;
    
    setIsSubmitting(true);
    try {
      const nodeData: CreateNodeData = {
        name: createFormData.name.trim(),
        fqdn: createFormData.fqdn.trim(),
        scheme: createFormData.scheme,
        port: createFormData.port,
        publicPort: createFormData.publicPort,
        memory: createFormData.memory,
        disk: createFormData.disk,
        locationId: createFormData.locationId,
        isPublic: createFormData.isPublic,
        isBehindProxy: createFormData.isBehindProxy,
        description: createFormData.description.trim() || undefined
      };
      
      await createNode(nodeData);
      setShowCreateModal(false);
      resetCreateForm();
      toast.success('Node created successfully!');
    } catch (error) {
      console.error('Error creating node:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedNode || !validateEditForm()) return;
    
    setIsSubmitting(true);
    try {
      const nodeData: UpdateNodeData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        fqdn: editFormData.fqdn.trim(),
        scheme: editFormData.scheme,
        port: editFormData.port,
        publicPort: editFormData.publicPort,
        memory: editFormData.memory,
        disk: editFormData.disk,
        locationId: editFormData.locationId,
        isPublic: editFormData.isPublic,
        isBehindProxy: editFormData.isBehindProxy,
        isMaintenanceMode: editFormData.isMaintenanceMode
      };
      
      await updateNode(selectedNode.id, nodeData);
      setShowEditModal(false);
      setSelectedNode(null);
      toast.success('Node updated successfully!');
    } catch (error) {
      console.error('Error updating node:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    
    setIsSubmitting(true);
    try {
      await deleteNode(selectedNode.id);
      setShowDeleteModal(false);
      setSelectedNode(null);
      toast.success('Node deleted successfully!');
    } catch (error) {
      console.error('Error deleting node:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStats = async (node: Node) => {
    setSelectedNode(node);
    setLoadingStats(true);
    setShowStatsModal(true);
    
    try {
      const stats = await getNodeStats(node.id);
      setNodeStats(stats);
    } catch (error) {
      console.error('Error fetching node stats:', error);
      setNodeStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const openEditModal = (node: Node) => {
    setSelectedNode(node);
    setEditFormData({
      name: node.name,
      description: node.description || '',
      fqdn: node.fqdn,
      scheme: node.scheme,
      port: node.port,
      publicPort: node.publicPort,
      memory: node.memory,
      disk: node.disk,
      locationId: node.locationId,
      isPublic: node.isPublic,
      isBehindProxy: node.isBehindProxy,
      isMaintenanceMode: node.isMaintenanceMode
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (node: Node) => {
    setSelectedNode(node);
    setShowDeleteModal(true);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      fqdn: '',
      scheme: 'https',
      port: 8080,
      publicPort: 8080,
      memory: 0,
      disk: 0,
      locationId: '',
      isPublic: false,
      isBehindProxy: false,
      description: ''
    });
    setFormErrors({});
  };

  // Status badge component
  const StatusBadge: React.FC<{ node: Node }> = ({ node }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      node.isMaintenanceMode 
        ? 'bg-yellow-100 text-yellow-800' 
        : 'bg-green-100 text-green-800'
    }`}>
      {node.isMaintenanceMode ? 'Maintenance' : 'Active'}
    </span>
  );

  // Memory and disk formatters
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Node Management</h1>
          <p className="text-gray-600 mt-1">Manage system nodes, resources, and agent connections</p>
        </div>
        <Button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Node</span>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon />}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div></div>
            <div className="flex items-center text-sm text-gray-500">
              {filteredNodes.length} of {nodes.length} nodes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nodes ({filteredNodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="text-center py-12">
              <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No nodes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by creating a new node'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Node
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servers
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNodes.map((node) => (
                    <tr key={node.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <ServerIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{node.name}</div>
                            <div className="text-sm text-gray-500">{node.fqdn}:{node.publicPort}</div>
                            {node.description && (
                              <div className="text-xs text-gray-400">{node.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <CpuChipIcon className="h-4 w-4 text-gray-400" />
                            <span>Memory: {formatBytes(node.memory * 1024 * 1024)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Disk: {formatBytes(node.disk * 1024 * 1024)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge node={node} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {node._count?.servers || 0} servers
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewStats(node)}
                          >
                            <ChartBarIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(node)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteModal(node)}
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

      {/* Create Node Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Node"
        description="Add a new node to the system with appropriate resources and configuration."
        size="lg"
      >
        <Form onSubmit={handleCreateNode}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="name" required>Node Name</FormLabel>
              <Input
                id="name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
                placeholder="Enter node name"
              />
              <FormError message={formErrors.name} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="fqdn" required>FQDN</FormLabel>
              <Input
                id="fqdn"
                value={createFormData.fqdn}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, fqdn: e.target.value }))}
                error={formErrors.fqdn}
                placeholder="node1.example.com"
              />
              <FormError message={formErrors.fqdn} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="scheme">Scheme</FormLabel>
              <select
                id="scheme"
                value={createFormData.scheme}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, scheme: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="https">HTTPS</option>
                <option value="http">HTTP</option>
              </select>
            </FormField>

            <FormField>
              <FormLabel htmlFor="locationId" required>Location ID</FormLabel>
              <Input
                id="locationId"
                value={createFormData.locationId}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, locationId: e.target.value }))}
                error={formErrors.locationId}
                placeholder="Enter location ID"
              />
              <FormError message={formErrors.locationId} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="port">Port</FormLabel>
              <Input
                id="port"
                type="number"
                value={createFormData.port}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                error={formErrors.port}
                placeholder="8080"
              />
              <FormError message={formErrors.port} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="publicPort">Public Port</FormLabel>
              <Input
                id="publicPort"
                type="number"
                value={createFormData.publicPort}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, publicPort: parseInt(e.target.value) || 0 }))}
                error={formErrors.publicPort}
                placeholder="8080"
              />
              <FormError message={formErrors.publicPort} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="memory">Memory (MB)</FormLabel>
              <Input
                id="memory"
                type="number"
                value={createFormData.memory}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, memory: parseInt(e.target.value) || 0 }))}
                error={formErrors.memory}
                placeholder="0"
              />
              <FormError message={formErrors.memory} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="disk">Disk Space (MB)</FormLabel>
              <Input
                id="disk"
                type="number"
                value={createFormData.disk}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, disk: parseInt(e.target.value) || 0 }))}
                error={formErrors.disk}
                placeholder="0"
              />
              <FormError message={formErrors.disk} />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Input
              id="description"
              value={createFormData.description}
              onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional node description"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={createFormData.isPublic}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <FormLabel htmlFor="isPublic">Public node</FormLabel>
              </div>
            </FormField>

            <FormField>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isBehindProxy"
                  checked={createFormData.isBehindProxy}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, isBehindProxy: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <FormLabel htmlFor="isBehindProxy">Behind proxy</FormLabel>
              </div>
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Node
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Node Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Node"
        description={`Update configuration for ${selectedNode?.name}`}
        size="lg"
      >
        <Form onSubmit={handleEditNode}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="edit-name" required>Node Name</FormLabel>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
                placeholder="Enter node name"
              />
              <FormError message={formErrors.name} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-fqdn" required>FQDN</FormLabel>
              <Input
                id="edit-fqdn"
                value={editFormData.fqdn}
                onChange={(e) => setEditFormData(prev => ({ ...prev, fqdn: e.target.value }))}
                error={formErrors.fqdn}
                placeholder="node1.example.com"
              />
              <FormError message={formErrors.fqdn} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-scheme">Scheme</FormLabel>
              <select
                id="edit-scheme"
                value={editFormData.scheme}
                onChange={(e) => setEditFormData(prev => ({ ...prev, scheme: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="https">HTTPS</option>
                <option value="http">HTTP</option>
              </select>
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-locationId" required>Location ID</FormLabel>
              <Input
                id="edit-locationId"
                value={editFormData.locationId}
                onChange={(e) => setEditFormData(prev => ({ ...prev, locationId: e.target.value }))}
                error={formErrors.locationId}
                placeholder="Enter location ID"
              />
              <FormError message={formErrors.locationId} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-port">Port</FormLabel>
              <Input
                id="edit-port"
                type="number"
                value={editFormData.port}
                onChange={(e) => setEditFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                error={formErrors.port}
                placeholder="8080"
              />
              <FormError message={formErrors.port} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-publicPort">Public Port</FormLabel>
              <Input
                id="edit-publicPort"
                type="number"
                value={editFormData.publicPort}
                onChange={(e) => setEditFormData(prev => ({ ...prev, publicPort: parseInt(e.target.value) || 0 }))}
                error={formErrors.publicPort}
                placeholder="8080"
              />
              <FormError message={formErrors.publicPort} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-memory">Memory (MB)</FormLabel>
              <Input
                id="edit-memory"
                type="number"
                value={editFormData.memory}
                onChange={(e) => setEditFormData(prev => ({ ...prev, memory: parseInt(e.target.value) || 0 }))}
                error={formErrors.memory}
                placeholder="0"
              />
              <FormError message={formErrors.memory} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="edit-disk">Disk Space (MB)</FormLabel>
              <Input
                id="edit-disk"
                type="number"
                value={editFormData.disk}
                onChange={(e) => setEditFormData(prev => ({ ...prev, disk: parseInt(e.target.value) || 0 }))}
                error={formErrors.disk}
                placeholder="0"
              />
              <FormError message={formErrors.disk} />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="edit-description">Description</FormLabel>
            <Input
              id="edit-description"
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional node description"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isPublic"
                  checked={editFormData.isPublic}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <FormLabel htmlFor="edit-isPublic">Public node</FormLabel>
              </div>
            </FormField>

            <FormField>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isBehindProxy"
                  checked={editFormData.isBehindProxy}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isBehindProxy: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <FormLabel htmlFor="edit-isBehindProxy">Behind proxy</FormLabel>
              </div>
            </FormField>

            <FormField>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isMaintenanceMode"
                  checked={editFormData.isMaintenanceMode}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isMaintenanceMode: e.target.checked }))}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <FormLabel htmlFor="edit-isMaintenanceMode">Maintenance mode</FormLabel>
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
              Update Node
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Node"
        description="Are you sure you want to delete this node? This action cannot be undone."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                This will permanently delete the node
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Node: <strong>{selectedNode?.name}</strong> ({selectedNode?.fqdn})
              </p>
              {selectedNode?._count?.servers && selectedNode._count.servers > 0 && (
                <p className="text-sm text-red-700 mt-1">
                  ⚠️ This node has {selectedNode._count.servers} active servers
                </p>
              )}
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
              onClick={handleDeleteNode}
            >
              Delete Node
            </Button>
          </div>
        </div>
      </Modal>

      {/* Node Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title={`Node Statistics - ${selectedNode?.name}`}
        description="Real-time resource usage and performance metrics"
        size="lg"
      >
        <div className="space-y-6">
          {loadingStats ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : nodeStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CpuChipIcon className="h-5 w-5" />
                    <span>CPU Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {nodeStats.cpu.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChartBarIcon className="h-5 w-5" />
                    <span>Memory Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used: {formatBytes(nodeStats.memory.used * 1024 * 1024)}</span>
                      <span>Total: {formatBytes(nodeStats.memory.total * 1024 * 1024)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(nodeStats.memory.used / nodeStats.memory.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-lg font-semibold">
                      {((nodeStats.memory.used / nodeStats.memory.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disk Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ServerIcon className="h-5 w-5" />
                    <span>Disk Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used: {formatBytes(nodeStats.disk.used * 1024 * 1024)}</span>
                      <span>Total: {formatBytes(nodeStats.disk.total * 1024 * 1024)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(nodeStats.disk.used / nodeStats.disk.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-lg font-semibold">
                      {((nodeStats.disk.used / nodeStats.disk.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network & General Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SignalIcon className="h-5 w-5" />
                    <span>System Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uptime:</span>
                      <span className="text-sm font-medium">
                        {Math.floor(nodeStats.uptime / 3600)}h {Math.floor((nodeStats.uptime % 3600) / 60)}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Servers:</span>
                      <span className="text-sm font-medium">{nodeStats.servers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Network RX:</span>
                      <span className="text-sm font-medium">{nodeStats.network.rx.toFixed(1)} MB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Network TX:</span>
                      <span className="text-sm font-medium">{nodeStats.network.tx.toFixed(1)} MB/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load stats</h3>
              <p className="mt-1 text-sm text-gray-500">Unable to fetch node statistics</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NodeManagement;
