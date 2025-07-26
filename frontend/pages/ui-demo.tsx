import React, { useState } from 'react';
import {
  DataTable,
  Column,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
  ProgressBar,
  Select,
  Checkbox,
  Tooltip,
  ConfirmationModal,
} from '../components/ui';

// Simple example data
const exampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', active: true },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', active: true },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', active: false },
];

const userColumns: Column<typeof exampleUsers[0]>[] = [
  { key: 'name', title: 'Name', sortable: true, filterable: true },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'role', title: 'Role', sortable: true },
  { 
    key: 'active', 
    title: 'Status', 
    render: (value) => (
      <span className={`px-2 py-1 rounded text-xs ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    )
  },
];

export default function QuickDemo() {
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(45);
  const [role, setRole] = useState('');

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'moderator', label: 'Moderator' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧩 UI Components Library
          </h1>
          <p className="text-gray-600">
            Comprehensive reusable components with TypeScript & accessibility
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={exampleUsers} 
                columns={userColumns}
                pageSize={2}
                searchable={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Select Role"
                options={roleOptions}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Choose role..."
              />
              <Checkbox 
                label="Enable notifications"
                description="Receive email updates"
              />
              <Tooltip content="This button shows a confirmation modal">
                <Button onClick={() => setShowModal(true)}>
                  Show Modal
                </Button>
              </Tooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
              <ProgressBar 
                value={progress} 
                showLabel={true}
                label="Upload Progress"
              />
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => setProgress(Math.max(0, progress - 20))}
                >
                  -20
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setProgress(Math.min(100, progress + 20))}
                >
                  +20
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Component Library Summary */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Implemented Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Display</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• DataTable (sortable, filterable)</li>
                  <li>• Charts (Line, Bar, Pie)</li>
                  <li>• Cards & Layouts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Form Controls</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Input, Select, Textarea</li>
                  <li>• Checkbox, Radio Groups</li>
                  <li>• File Upload (drag & drop)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Feedback</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Modals (Confirm, Alert, Form)</li>
                  <li>• Tooltips & Context Menus</li>
                  <li>• Loading States & Progress</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Navigation</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Breadcrumbs</li>
                  <li>• Buttons (all variants)</li>
                  <li>• Interactive Elements</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Features:</strong> TypeScript interfaces, WCAG accessibility compliance, 
                responsive design, theme support, comprehensive testing, and detailed documentation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <ConfirmationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            alert('✅ Action confirmed! The component system is working perfectly.');
            setShowModal(false);
          }}
          title="Component Test"
          description="This demonstrates the modal system working correctly with the new UI components library."
          variant="info"
          confirmText="Awesome!"
        />
      </div>
    </div>
  );
}