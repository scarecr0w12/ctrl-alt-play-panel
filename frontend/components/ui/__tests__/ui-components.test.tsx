import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom'; // Disabled to prevent TypeScript issues

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
import { 
  DataTable, 
  Column,
  Spinner,
  ProgressBar,
  Select,
  Checkbox,
  ContextMenu,
  Breadcrumb,
  Tooltip,
  ConfirmationModal
} from '../index';

// Mock data for DataTable tests
const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator' },
];

const mockColumns: Column<typeof mockData[0]>[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'email', title: 'Email', sortable: true, filterable: true },
  { key: 'role', title: 'Role', sortable: true },
];

describe('UI Components', () => {
  describe('DataTable', () => {
    it('renders table with data', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Moderator')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<DataTable data={[]} columns={mockColumns} emptyMessage="No users found" />);
      
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<DataTable data={mockData} columns={mockColumns} loading={true} />);
      
      expect(screen.getByRole('table')).toHaveClass('animate-pulse');
    });

    it('handles search functionality', async () => {
      render(<DataTable data={mockData} columns={mockColumns} searchable={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'John' } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('handles sorting', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);
      
      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);
      
      // Should show sort icon
      expect(nameHeader.closest('th')).toContainHTML('svg');
    });
  });

  describe('Loading Components', () => {
    it('renders spinner with correct size', () => {
      render(<Spinner size="lg" />);
      
      const spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('renders progress bar with value', () => {
      render(<ProgressBar value={75} showLabel={true} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders progress bar with label', () => {
      render(<ProgressBar value={50} label="Upload Progress" />);
      
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });
  });

  describe('Form Controls', () => {
    it('renders select with options', () => {
      const options = [
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'User' },
      ];
      
      render(<Select options={options} placeholder="Select role" />);
      
      expect(screen.getByText('Select role')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('renders checkbox with label', () => {
      render(<Checkbox label="I agree to terms" />);
      
      expect(screen.getByLabelText('I agree to terms')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('handles checkbox change', () => {
      const handleChange = jest.fn();
      render(<Checkbox label="Test checkbox" onChange={handleChange} />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('ContextMenu', () => {
    it('shows menu on right click', () => {
      const menuItems = [
        { label: 'Edit', onClick: jest.fn() },
        { label: 'Delete', onClick: jest.fn() },
      ];
      
      render(
        <ContextMenu items={menuItems}>
          <div>Right click me</div>
        </ContextMenu>
      );
      
      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('handles menu item click', () => {
      const handleEdit = jest.fn();
      const menuItems = [
        { label: 'Edit', onClick: handleEdit },
      ];
      
      render(
        <ContextMenu items={menuItems}>
          <div>Right click me</div>
        </ContextMenu>
      );
      
      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(handleEdit).toHaveBeenCalled();
    });
  });

  describe('Breadcrumb', () => {
    it('renders breadcrumb items', () => {
      const items = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Users', href: '/users' },
        { label: 'Profile' },
      ];
      
      render(<Breadcrumb items={items} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument(); // showHome=true by default
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('handles breadcrumb click', () => {
      const handleClick = jest.fn();
      const items = [
        { label: 'Dashboard', onClick: handleClick },
      ];
      
      render(<Breadcrumb items={items} />);
      
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Tooltip', () => {
    it('shows tooltip on hover', async () => {
      render(
        <Tooltip content="This is a tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      render(
        <Tooltip content="This is a tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      
      const trigger = screen.getByText('Hover me');
      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(trigger);
      
      await waitFor(() => {
        expect(screen.queryByText('This is a tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('ConfirmationModal', () => {
    it('renders confirmation modal', () => {
      const handleConfirm = jest.fn();
      const handleClose = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onConfirm={handleConfirm}
          onClose={handleClose}
          title="Delete Item"
          description="Are you sure you want to delete this item?"
        />
      );
      
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', () => {
      const handleConfirm = jest.fn();
      const handleClose = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onConfirm={handleConfirm}
          onClose={handleClose}
          title="Delete Item"
        />
      );
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      expect(handleConfirm).toHaveBeenCalled();
    });

    it('calls onClose when cancel button clicked', () => {
      const handleConfirm = jest.fn();
      const handleClose = jest.fn();
      
      render(
        <ConfirmationModal
          isOpen={true}
          onConfirm={handleConfirm}
          onClose={handleClose}
          title="Delete Item"
        />
      );
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(handleClose).toHaveBeenCalled();
    });
  });
});