import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  Button, 
  Modal, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Form,
  FormField,
  FormLabel,
  FormError
} from '@/components/ui';
import { useServers, useUsers } from '@/hooks';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ComponentsDemo() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { servers, loading: serversLoading } = useServers();
  const { users, loading: usersLoading } = useUsers();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Form submitted successfully!');
    setShowModal(false);
    setLoading(false);
    setFormData({ name: '', email: '' });
  };

  const buttonVariants = [
    { variant: 'default' as const, label: 'Default' },
    { variant: 'destructive' as const, label: 'Destructive' },
    { variant: 'outline' as const, label: 'Outline' },
    { variant: 'secondary' as const, label: 'Secondary' },
    { variant: 'ghost' as const, label: 'Ghost' },
    { variant: 'link' as const, label: 'Link' },
  ];

  const buttonSizes = [
    { size: 'sm' as const, label: 'Small' },
    { size: 'default' as const, label: 'Default' },
    { size: 'lg' as const, label: 'Large' },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">UI Components Demo</h1>
          <p className="mt-2 text-gray-600">
            Showcase of our new UI component library with live data integration.
          </p>
        </div>

        {/* Button Showcase */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>
              Various button styles and states available in our component library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Variants</h4>
                <div className="flex flex-wrap gap-3">
                  {buttonVariants.map(({ variant, label }) => (
                    <Button key={variant} variant={variant}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Sizes</h4>
                <div className="flex flex-wrap gap-3 items-center">
                  {buttonSizes.map(({ size, label }) => (
                    <Button key={size} size={size}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">States</h4>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button onClick={() => setShowModal(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Open Modal
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Display Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusIcon className="h-5 w-5 mr-2 text-blue-600" />
                Servers
              </CardTitle>
              <CardDescription>Active game servers</CardDescription>
            </CardHeader>
            <CardContent>
              {serversLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-gray-900">{servers.length}</div>
                  <div className="text-sm text-gray-500">
                    {servers.filter(s => s.status === 'online').length} online
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full">
                Manage Servers
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2 text-green-600" />
                Users
              </CardTitle>
              <CardDescription>Registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                  <div className="text-sm text-gray-500">
                    {users.filter(u => u.isActive).length} active
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full">
                Manage Users
              </Button>
            </CardFooter>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrashIcon className="h-5 w-5 mr-2 text-purple-600" />
                Glass Card
              </CardTitle>
              <CardDescription>Card with glass morphism effect</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">42</div>
              <div className="text-sm text-gray-500">Example metric</div>
            </CardContent>
          </Card>
        </div>

        {/* Form Example */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>
              Input fields and form elements with validation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  error={formErrors.email}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  helperText="Must be at least 8 characters"
                />
                <Input
                  label="Search"
                  placeholder="Search..."
                  leftIcon={<PlusIcon />}
                  rightIcon={<PencilIcon />}
                />
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Disabled Input"
                  placeholder="This is disabled"
                  disabled
                />
                <Input
                  label="Error Example"
                  placeholder="This has an error"
                  error="This field is required"
                />
                <Input
                  label="With Helper Text"
                  placeholder="Example input"
                  helperText="This is some helpful information"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal Example */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create New Item"
          description="Fill out the form below to create a new item."
          size="md"
        >
          <Form onSubmit={handleSubmit}>
            <FormField>
              <FormLabel htmlFor="modal-name" required>
                Name
              </FormLabel>
              <Input
                id="modal-name"
                placeholder="Enter item name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
              />
              <FormError message={formErrors.name} />
            </FormField>

            <FormField>
              <FormLabel htmlFor="modal-email" required>
                Email
              </FormLabel>
              <Input
                id="modal-email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={formErrors.email}
              />
              <FormError message={formErrors.email} />
            </FormField>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Item
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
}
