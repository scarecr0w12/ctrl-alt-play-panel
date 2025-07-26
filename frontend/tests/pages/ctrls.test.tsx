import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import CtrlsPage from '@/pages/ctrls';
import { nodesApi, serversApi } from '@/lib/api';

// Mock the API modules
jest.mock('@/lib/api');
const mockedNodesApi = nodesApi as jest.Mocked<typeof nodesApi>;
const mockedServersApi = serversApi as jest.Mocked<typeof serversApi>;

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/ctrls',
    query: {},
  }),
}));

// Mock auth context
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN' as const,
  isActive: true,
};

// Mock auth context and provider
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    loading: false,
    isAuthenticated: true,
    isAdmin: true,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-auth-provider">{children}</div>
  ),
}));

describe('CtrlsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses
    mockedNodesApi.getAll.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: 'ctrl-1',
            name: 'Minecraft Servers',
            description: 'Various Minecraft configurations',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            _count: { alts: 2 }
          },
          {
            id: 'ctrl-2',
            name: 'Discord Bots',
            description: 'Discord bot configurations',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            _count: { alts: 1 }
          }
        ]
      }
    } as any);

    mockedServersApi.getTemplates.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            id: 'alt-1',
            uuid: 'alt-uuid-1',
            name: 'Vanilla Minecraft',
            description: 'Standard Minecraft server',
            author: 'minecraft@example.com',
            dockerImages: {},
            startup: 'java -jar server.jar',
            configFiles: {},
            configStartup: {},
            configLogs: {},
            scriptEntry: './start.sh',
            scriptContainer: './entrypoint.sh',
            forceOutgoingIp: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            ctrlId: 'ctrl-1',
            _count: { servers: 3 }
          }
        ]
      }
    } as any);
  });

  it('renders categories and configurations', async () => {
    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Minecraft Servers')).toBeInTheDocument();
      expect(screen.getByText('Discord Bots')).toBeInTheDocument();
    });

    // Check category details
    expect(screen.getByText('2 configuration(s)')).toBeInTheDocument();
    expect(screen.getByText('1 configuration(s)')).toBeInTheDocument();
  });

  it('shows create category modal when button is clicked', async () => {
    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('New Category')).toBeInTheDocument();
    });

    // Click the "New Category" button
    fireEvent.click(screen.getByText('New Category'));

    // Check that modal appears
    expect(screen.getByText('Create New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Category Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('creates a new category when form is submitted', async () => {
    mockedNodesApi.create.mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 'new-ctrl-id',
          name: 'New Category',
          description: 'Test description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      }
    } as any);

    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('New Category')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText('New Category'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Category Name *'), {
      target: { value: 'New Category' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test description' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));

    // Verify API call
    await waitFor(() => {
      expect(mockedNodesApi.create).toHaveBeenCalledWith({
        name: 'New Category',
        description: 'Test description',
      });
    });
  });

  it('loads alts when category is selected', async () => {
    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Minecraft Servers')).toBeInTheDocument();
    });

    // Click on a category
    fireEvent.click(screen.getByText('Minecraft Servers'));

    // Wait for alts to load
    await waitFor(() => {
      expect(mockedServersApi.getTemplates).toHaveBeenCalledWith('ctrl-1');
    });
  });

  it('shows import modal when import button is clicked', async () => {
    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Minecraft Servers')).toBeInTheDocument();
    });

    // Select a category first
    fireEvent.click(screen.getByText('Minecraft Servers'));

    // Wait for the import button to appear
    await waitFor(() => {
      const importButtons = screen.getAllByText('Import Alt');
      expect(importButtons.length).toBeGreaterThan(0);
    });

    // Click import button
    fireEvent.click(screen.getAllByText('Import Alt')[0]);

    // Check that import modal appears
    expect(screen.getByText('Import Alt to Minecraft Servers')).toBeInTheDocument();
    expect(screen.getByLabelText('Alt JSON File *')).toBeInTheDocument();
  });

  it('handles delete category confirmation', async () => {
    mockedNodesApi.delete.mockResolvedValue({
      data: { success: true }
    } as any);

    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Minecraft Servers')).toBeInTheDocument();
    });

    // Find and click the menu button for the first category
    const menuButtons = screen.getAllByRole('button');
    const menuButton = menuButtons.find(button => 
      button.querySelector('svg') && 
      button.getAttribute('aria-expanded') !== null
    );
    
    if (menuButton) {
      fireEvent.click(menuButton);
      
      // Look for delete button in menu
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Verify confirmation dialog and API call
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete the category "Minecraft Servers"?')
      );
      
      await waitFor(() => {
        expect(mockedNodesApi.delete).toHaveBeenCalledWith('ctrl-1');
      });
    }

    mockConfirm.mockRestore();
  });

  it('displays empty state when no categories exist', async () => {
    mockedNodesApi.getAll.mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    } as any);

    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No categories found')).toBeInTheDocument();
      expect(screen.getByText('Create your first category')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    // Mock API to never resolve to test loading state
    mockedNodesApi.getAll.mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <CtrlsPage />
      </AuthProvider>
    );

    expect(screen.getByText('Loading configurations...')).toBeInTheDocument();
  });
});
