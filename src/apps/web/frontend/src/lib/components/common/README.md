# Common Components

This directory contains globally reusable UI components for the frontend application.

## Components

### ActionButton

A flexible button component with variant and size options.

```tsx
import { ActionButton } from '$common'

;<ActionButton
  label="Click me"
  variant="primary"
  size="md"
  onClick={() => console.log('clicked')}
/>
```

**Props:**

- `icon?: ReactNode` - Icon to display
- `label: string` - Button label
- `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'` - Visual style
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `onClick?: () => void` - Click handler
- `disabled?: boolean` - Disable the button
- `loading?: boolean` - Show loading state
- `className?: string` - Additional CSS classes

### StatusBadge

Displays execution status with appropriate styling and icons.

```tsx
import { StatusBadge } from '$common'

;<StatusBadge status="running" size="sm" />
```

**Props:**

- `status: ExecutionStatus` - Status to display
- `size?: 'sm' | 'md' | 'lg'` - Badge size

### LoadingSpinner

A simple loading indicator with size variants.

```tsx
import { LoadingSpinner } from '$common'

;<LoadingSpinner size="md" />
```

**Props:**

- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `className?: string` - Additional CSS classes

### ConfirmDialog

A modal dialog for confirming destructive or important actions.

```tsx
import { ConfirmDialog } from '$common'

;<ConfirmDialog
  isOpen={true}
  title="Delete this item?"
  message="This action cannot be undone."
  variant="danger"
  onConfirm={() => handleDelete()}
  onCancel={() => setIsOpen(false)}
/>
```

**Props:**

- `isOpen: boolean` - Show/hide the dialog
- `title: string` - Dialog title
- `message: string` - Dialog message
- `confirmLabel?: string` - Confirm button label (default: "Confirm")
- `cancelLabel?: string` - Cancel button label (default: "Cancel")
- `variant?: 'danger' | 'warning' | 'info'` - Visual style
- `onConfirm: () => void` - Confirm action handler
- `onCancel: () => void` - Cancel action handler
- `loading?: boolean` - Show loading state

### ToggleSwitch

A toggle switch component for boolean values.

```tsx
import { ToggleSwitch } from '$common'

;<ToggleSwitch checked={enabled} onChange={setEnabled} label="Enable feature" />
```

**Props:**

- `checked: boolean` - Toggle state
- `onChange: (checked: boolean) => void` - Change handler
- `disabled?: boolean` - Disable the toggle
- `label?: string` - Label text
- `className?: string` - Additional CSS classes

### Modal

A generic modal wrapper component.

```tsx
import { Modal } from '$common'

;<Modal isOpen={true} onClose={() => setIsOpen(false)} title="Modal Title">
  <p>Modal content goes here</p>
</Modal>
```

**Props:**

- `isOpen: boolean` - Show/hide the modal
- `onClose: () => void` - Close handler
- `children: React.ReactNode` - Modal content
- `title?: string` - Modal title
- `className?: string` - Additional CSS classes

### EmptyState

A component for displaying empty states with icon and message.

```tsx
import { EmptyState } from '$common'

;<EmptyState
  icon="📜"
  title="No items yet"
  description="Add items to get started"
  action={<Button>Add Item</Button>}
/>
```

**Props:**

- `icon?: string` - Icon (emoji) to display
- `title: string` - Title message
- `description?: string` - Additional description
- `action?: React.ReactNode` - Optional action button
- `className?: string` - Additional CSS classes

### FormField

A reusable form field component for text and select inputs.

```tsx
import { FormField } from '$common'

<FormField
  label="Name"
  type="text"
  value={name}
  onChange={setName}
  placeholder="Enter name"
  required
/>

<FormField
  label="Category"
  type="select"
  value={category}
  onChange={setCategory}
  options={[
    { value: 'cat1', label: 'Category 1' },
    { value: 'cat2', label: 'Category 2' }
  ]}
  required
/>
```

**Props:**

- `label?: string` - Field label
- `type?: 'text' | 'select' | 'number'` - Input type
- `name?: string` - Field name
- `value?: string` - Field value
- `onChange?: (value: string) => void` - Change handler
- `options?: Array<{ value: string; label: string }>` - Select options
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Required field indicator
- `disabled?: boolean` - Disable the field
- `className?: string` - Additional CSS classes

## Usage

Import components from the common directory:

```tsx
import { ActionButton, StatusBadge, Modal } from '$common'
```

Or import directly from the component file:

```tsx
import ActionButton from '$components/common/ActionButton'
```
