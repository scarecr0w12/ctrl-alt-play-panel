# UI Components Library

A comprehensive collection of reusable React components built with TypeScript, Tailwind CSS, and accessibility in mind.

## Components Overview

### ✅ Core Components
- **Button** - Various styles, sizes, and loading states
- **Modal** - Base modal with multiple variants
- **Input** - Text inputs with validation and icons  
- **Card** - Flexible container with header, content, footer
- **Form** - Form wrapper with field components

### ✅ Advanced Components
- **DataTable** - Sortable, filterable, paginated data tables
- **Loading States** - Spinners, progress bars, skeletons, overlays
- **Form Controls** - Select, checkbox, radio, textarea components
- **Charts** - Line, bar, pie chart components using Chart.js
- **FileUpload** - Drag & drop file upload with preview
- **ContextMenu** - Right-click context menus
- **Breadcrumb** - Navigation breadcrumbs
- **Tooltip** - Hover/click tooltips with positioning
- **Modal Variants** - Confirmation, alert, form, drawer modals

## Usage Examples

### DataTable
```tsx
import { DataTable, Column } from '@/components/ui';

const columns: Column<User>[] = [
  { key: 'name', title: 'Name', sortable: true, filterable: true },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'role', title: 'Role', sortable: true },
];

<DataTable 
  data={users} 
  columns={columns} 
  searchable={true}
  pageSize={10}
  onRowClick={(user) => console.log(user)}
/>
```

### Charts
```tsx
import { LineChart, createLineChartData } from '@/components/ui';

const data = createLineChartData(
  ['Jan', 'Feb', 'Mar'],
  'Sales',
  [100, 200, 150]
);

<LineChart data={data} height={300} title="Monthly Sales" />
```

### File Upload
```tsx
import { FileUpload } from '@/components/ui';

<FileUpload
  multiple={true}
  accept="image/*,.pdf"
  maxSize={5 * 1024 * 1024} // 5MB
  onFileSelect={(files) => console.log(files)}
  showPreview={true}
/>
```

### Modal Variants
```tsx
import { ConfirmationModal, AlertModal, FormModal } from '@/components/ui';

// Confirmation Modal
<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  description="This action cannot be undone."
  variant="danger"
/>

// Alert Modal
<AlertModal
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  title="Success"
  message="Operation completed successfully!"
  variant="success"
/>
```

### Context Menu
```tsx
import { ContextMenu } from '@/components/ui';

const menuItems = [
  { label: 'Edit', onClick: handleEdit },
  { label: 'Delete', onClick: handleDelete },
  { separator: true },
  { label: 'View Details', onClick: handleView },
];

<ContextMenu items={menuItems}>
  <div>Right-click me</div>
</ContextMenu>
```

### Tooltips
```tsx
import { Tooltip } from '@/components/ui';

<Tooltip content="This is helpful information" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

## Features

### ✅ TypeScript Support
All components have full TypeScript interfaces and type safety.

### ✅ Accessibility (WCAG)
- Semantic HTML elements
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

### ✅ Responsive Design
- Mobile-first approach
- Responsive grid layouts
- Flexible sizing options
- Touch-friendly interactions

### ✅ Theme Support
- Consistent design tokens
- Dark/light mode ready
- Customizable colors via Tailwind
- CSS custom properties

### ✅ Performance
- Tree-shakeable exports
- Lazy loading support
- Optimized re-renders
- Minimal bundle size

## Component Architecture

### Design Patterns
- **Compound Components** - Card with Header, Content, Footer
- **Render Props** - DataTable custom cell rendering
- **Hooks** - useTooltip, useContextMenu for state management
- **Polymorphic Components** - Flexible element types

### Styling Strategy
- **Tailwind CSS** for utility-first styling
- **CSS-in-JS** via `clsx` and `tailwind-merge`
- **Responsive utilities** for mobile-first design
- **Dark mode** support via CSS custom properties

### State Management
- **Local state** for component-specific logic
- **Controlled/Uncontrolled** patterns for flexibility
- **Event callbacks** for parent communication
- **Custom hooks** for complex state logic

## Testing

Components are tested with:
- **Jest** for unit testing
- **React Testing Library** for component testing
- **TypeScript** for type checking
- **ESLint** for code quality

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When adding new components:

1. Follow existing naming conventions
2. Include TypeScript interfaces
3. Add accessibility attributes
4. Write comprehensive tests
5. Update documentation
6. Ensure responsive design

## Dependencies

- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Headless UI (for base components)
- Chart.js (for chart components)
- Heroicons (for icons)