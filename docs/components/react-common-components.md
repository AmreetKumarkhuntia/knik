# Reusable UI Components

All reusable UI components live in `src/apps/web/frontend/src/lib/components/` and are re-exported from the barrel file `index.ts`. Import via the `$components` path alias:

```tsx
import ActionButton from "$components/ActionButton";
import { Table } from "$components/Table";
import Modal from "$components/Modal";
```

## Component Reference

### ActionButton

A flexible button with variant, size, loading state, and icon-only mode.

```tsx
<ActionButton
  label="Save"
  variant="primary"
  size="md"
  icon={<SaveIcon />}
  onClick={() => handleSave()}
  loading={isSaving}
/>
```

| Prop        | Type                                              | Default     | Description                       |
| ----------- | ------------------------------------------------- | ----------- | --------------------------------- |
| `icon`      | `ReactNode`                                       | -           | Icon to display                   |
| `label`     | `string`                                          | -           | Button label (omit for icon-only) |
| `variant`   | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Visual style                      |
| `size`      | `'xs' \| 'sm' \| 'md' \| 'lg'`                    | `'md'`      | Button size                       |
| `onClick`   | `() => void`                                      | -           | Click handler                     |
| `disabled`  | `boolean`                                         | `false`     | Disable the button                |
| `loading`   | `boolean`                                         | `false`     | Show loading spinner              |
| `className` | `string`                                          | `''`        | Additional CSS classes            |
| `title`     | `string`                                          | -           | Tooltip text                      |

### Backdrop

A fullscreen overlay with configurable blur and opacity. Used internally by `Modal`.

```tsx
<Backdrop visible={isOpen} onClick={handleClose} blur="md" opacity={0.5} />
```

| Prop        | Type                   | Default | Description                            |
| ----------- | ---------------------- | ------- | -------------------------------------- |
| `visible`   | `boolean`              | -       | Show/hide the backdrop                 |
| `onClick`   | `() => void`           | -       | Click handler (typically closes modal) |
| `blur`      | `'sm' \| 'md' \| 'lg'` | -       | Backdrop blur amount                   |
| `opacity`   | `number`               | -       | Backdrop opacity                       |
| `className` | `string`               | -       | Additional CSS classes                 |

### Breadcrumb

A breadcrumb navigation trail.

```tsx
<Breadcrumb
  items={[
    { label: "Home", path: "/" },
    { label: "Workflows", path: "/workflows" },
    { label: "Edit" },
  ]}
/>
```

| Prop        | Type               | Default | Description                        |
| ----------- | ------------------ | ------- | ---------------------------------- |
| `items`     | `BreadcrumbItem[]` | -       | `{ label: string; path?: string }` |
| `className` | `string`           | -       | Additional CSS classes             |

### Card

A container with variant and padding options.

```tsx
<Card variant="elevated" padding="lg">
  <p>Card content</p>
</Card>
```

| Prop        | Type                                    | Default | Description            |
| ----------- | --------------------------------------- | ------- | ---------------------- |
| `children`  | `ReactNode`                             | -       | Card content           |
| `variant`   | `'default' \| 'bordered' \| 'elevated'` | -       | Visual style           |
| `padding`   | `'none' \| 'sm' \| 'md' \| 'lg'`        | -       | Inner padding          |
| `className` | `string`                                | -       | Additional CSS classes |

### ConfirmDialog

A modal dialog for confirming destructive or important actions.

```tsx
<ConfirmDialog
  isOpen={showDelete}
  title="Delete this item?"
  message="This action cannot be undone."
  variant="danger"
  onConfirm={() => handleDelete()}
  onCancel={() => setShowDelete(false)}
/>
```

| Prop           | Type                              | Default     | Description          |
| -------------- | --------------------------------- | ----------- | -------------------- |
| `isOpen`       | `boolean`                         | -           | Show/hide the dialog |
| `title`        | `string`                          | -           | Dialog title         |
| `message`      | `string`                          | -           | Dialog message       |
| `confirmLabel` | `string`                          | `'Confirm'` | Confirm button label |
| `cancelLabel`  | `string`                          | `'Cancel'`  | Cancel button label  |
| `variant`      | `'danger' \| 'warning' \| 'info'` | `'danger'`  | Visual style         |
| `onConfirm`    | `() => void \| Promise<void>`     | -           | Confirm handler      |
| `onCancel`     | `() => void`                      | -           | Cancel handler       |
| `loading`      | `boolean`                         | `false`     | Show loading state   |

Supports Escape key to cancel and auto-focuses on open.

### EmptyState

A centered placeholder for empty views.

```tsx
<EmptyState
  icon="📜"
  title="No workflows yet"
  description="Create your first workflow to get started"
  action={<ActionButton label="Create Workflow" onClick={handleCreate} />}
/>
```

| Prop          | Type                  | Default      | Description                      |
| ------------- | --------------------- | ------------ | -------------------------------- |
| `icon`        | `string \| ReactNode` | default icon | Icon (emoji or component)        |
| `title`       | `string`              | -            | Title message                    |
| `description` | `string`              | -            | Additional description           |
| `action`      | `ReactNode`           | -            | Optional action (e.g., a button) |
| `className`   | `string`              | default      | Additional CSS classes           |

### ExecutionFlowGraph

A ReactFlow-based graph visualization for workflow executions.

```tsx
<ExecutionFlowGraph execution={executionData} timeline={nodeSteps} />
```

| Prop        | Type                  | Default | Description          |
| ----------- | --------------------- | ------- | -------------------- |
| `execution` | `ExecutionDetail`     | -       | Execution data       |
| `timeline`  | `NodeExecutionStep[]` | -       | Node execution steps |

### ExecutionTimeline

A timeline view of node execution steps.

```tsx
<ExecutionTimeline timeline={steps} loading={isLoading} />
```

| Prop       | Type                               | Default | Description    |
| ---------- | ---------------------------------- | ------- | -------------- |
| `timeline` | `NodeExecutionStep[] \| undefined` | -       | Timeline steps |
| `loading`  | `boolean`                          | -       | Loading state  |

### FormField

A form field that renders text/number inputs or select dropdowns.

```tsx
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
    { value: "cat1", label: "Category 1" },
    { value: "cat2", label: "Category 2" },
  ]}
/>
```

| Prop          | Type                                      | Default  | Description             |
| ------------- | ----------------------------------------- | -------- | ----------------------- |
| `label`       | `string`                                  | -        | Field label             |
| `type`        | `'text' \| 'select' \| 'number'`          | `'text'` | Input type              |
| `name`        | `string`                                  | -        | Field name              |
| `value`       | `string`                                  | -        | Field value             |
| `onChange`    | `(value: string) => void`                 | -        | Change handler          |
| `options`     | `Array<{ value: string; label: string }>` | -        | Select options          |
| `placeholder` | `string`                                  | -        | Placeholder text        |
| `required`    | `boolean`                                 | `false`  | Required indicator (\*) |
| `disabled`    | `boolean`                                 | `false`  | Disable the field       |
| `className`   | `string`                                  | `''`     | Additional CSS classes  |

### HamburgerButton

A hamburger menu button.

```tsx
<HamburgerButton onClick={() => setSidebarOpen(!sidebarOpen)} />
```

| Prop        | Type         | Default | Description            |
| ----------- | ------------ | ------- | ---------------------- |
| `onClick`   | `() => void` | -       | Click handler          |
| `className` | `string`     | -       | Additional CSS classes |

### IconButton

An icon-only button with variant and aria label.

```tsx
<IconButton
  icon={<TrashIcon />}
  onClick={handleDelete}
  variant="danger"
  ariaLabel="Delete"
/>
```

| Prop        | Type                                              | Default | Description            |
| ----------- | ------------------------------------------------- | ------- | ---------------------- |
| `icon`      | `ReactNode`                                       | -       | Icon to display        |
| `onClick`   | `() => void`                                      | -       | Click handler          |
| `variant`   | `'ghost' \| 'secondary' \| 'primary' \| 'danger'` | -       | Visual style           |
| `size`      | `'sm' \| 'md' \| 'lg'`                            | -       | Button size            |
| `ariaLabel` | `string`                                          | -       | Accessibility label    |
| `disabled`  | `boolean`                                         | -       | Disable the button     |
| `className` | `string`                                          | -       | Additional CSS classes |

### Input

A styled text input extending native `<input>` props (uses `forwardRef`).

```tsx
<Input placeholder="Search..." error={errors.search} fullWidth />
```

| Prop        | Type                  | Default | Description               |
| ----------- | --------------------- | ------- | ------------------------- |
| `error`     | `string`              | -       | Error message to display  |
| `fullWidth` | `boolean`             | -       | Full-width mode           |
| `id`        | `string`              | -       | Input ID                  |
| ...rest     | `InputHTMLAttributes` | -       | Standard input attributes |

### LinkButton

A styled link-style button.

```tsx
<LinkButton icon="+" label="Add Item" onClick={handleAdd} active={isActive} />
```

| Prop        | Type         | Default | Description            |
| ----------- | ------------ | ------- | ---------------------- |
| `icon`      | `string`     | -       | Icon text              |
| `label`     | `string`     | -       | Button label           |
| `onClick`   | `() => void` | -       | Click handler          |
| `active`    | `boolean`    | -       | Active/selected state  |
| `className` | `string`     | -       | Additional CSS classes |

### LoadingSpinner

A CSS-based animated loading spinner.

```tsx
<LoadingSpinner size="md" text="Loading workflows..." />
```

| Prop        | Type                   | Default | Description                  |
| ----------- | ---------------------- | ------- | ---------------------------- |
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`  | Spinner size                 |
| `className` | `string`               | `''`    | Additional CSS classes       |
| `text`      | `string`               | -       | Optional label below spinner |

### MarkdownMessage

Renders markdown content with syntax highlighting. Named export (not default).

```tsx
import { MarkdownMessage } from "$components/MarkdownMessage";
<MarkdownMessage content={aiResponse} isStreaming={isTyping} />;
```

| Prop          | Type      | Default | Description             |
| ------------- | --------- | ------- | ----------------------- |
| `content`     | `string`  | -       | Markdown text to render |
| `isStreaming` | `boolean` | -       | Show streaming cursor   |

### MetricCard

A card displaying a metric value with optional trend indicator.

```tsx
<MetricCard
  icon="📊"
  label="Total Executions"
  value={1234}
  subtext="Last 30 days"
  trend={{ direction: "up", value: "+12%" }}
  color="primary"
/>
```

| Prop      | Type                                                                       | Default | Description     |
| --------- | -------------------------------------------------------------------------- | ------- | --------------- |
| `icon`    | `string`                                                                   | -       | Icon emoji      |
| `label`   | `string`                                                                   | -       | Metric label    |
| `value`   | `number \| string`                                                         | -       | Metric value    |
| `subtext` | `string`                                                                   | -       | Subtitle text   |
| `trend`   | `{ direction: 'up' \| 'down' \| 'neutral'; value: string; icon?: string }` | -       | Trend indicator |
| `color`   | `'primary' \| 'teal' \| 'rose' \| 'blue'`                                  | -       | Color theme     |
| `loading` | `boolean`                                                                  | -       | Loading state   |

### Modal

A generic modal wrapper with framer-motion animations and glass-morphism styling.

```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Settings"
  size="lg"
>
  <p>Modal content</p>
</Modal>
```

| Prop               | Type                           | Default | Description                  |
| ------------------ | ------------------------------ | ------- | ---------------------------- |
| `isOpen`           | `boolean`                      | -       | Show/hide the modal          |
| `onClose`          | `() => void`                   | -       | Close handler                |
| `children`         | `ReactNode`                    | -       | Modal content                |
| `title`            | `string`                       | -       | Modal title                  |
| `className`        | `string`                       | `''`    | Additional CSS classes       |
| `size`             | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`  | Modal width                  |
| `animationEnabled` | `boolean`                      | `true`  | Enable/disable framer-motion |

Supports Escape key and locks body scroll when open.

### NavLink

A sidebar navigation link with icon and active state.

```tsx
<NavLink icon="🏠" label="Home" href="/" active={isHome} />
```

| Prop      | Type         | Default | Description          |
| --------- | ------------ | ------- | -------------------- |
| `icon`    | `string`     | -       | Icon emoji           |
| `label`   | `string`     | -       | Link label           |
| `active`  | `boolean`    | -       | Active state styling |
| `href`    | `string`     | -       | Link URL             |
| `onClick` | `() => void` | -       | Click handler        |

### NotificationButton

A button with an optional notification badge count.

```tsx
<NotificationButton badgeCount={3} onClick={handleNotifications} />
```

| Prop         | Type         | Default | Description                           |
| ------------ | ------------ | ------- | ------------------------------------- |
| `badgeCount` | `number`     | -       | Badge count (hidden when 0/undefined) |
| `onClick`    | `() => void` | -       | Click handler                         |

### PageHeader

A page header with breadcrumbs, optional back button, and right content slot.

```tsx
<PageHeader
  breadcrumbs={["Workflows", "My Workflow", "Edit"]}
  showBackButton
  onBackClick={() => navigate(-1)}
  rightContent={<ActionButton label="Save" onClick={handleSave} />}
/>
```

| Prop             | Type         | Default | Description         |
| ---------------- | ------------ | ------- | ------------------- |
| `breadcrumbs`    | `string[]`   | -       | Breadcrumb trail    |
| `rightContent`   | `ReactNode`  | -       | Right-side content  |
| `showBackButton` | `boolean`    | -       | Show back arrow     |
| `onBackClick`    | `() => void` | -       | Back button handler |
| `sticky`         | `boolean`    | -       | Sticky positioning  |

### Pagination

A pagination control with page numbers.

```tsx
<Pagination currentPage={1} totalPages={10} onPageChange={setPage} />
```

| Prop           | Type                     | Default | Description              |
| -------------- | ------------------------ | ------- | ------------------------ |
| `currentPage`  | `number`                 | -       | Current page (1-indexed) |
| `totalPages`   | `number`                 | -       | Total number of pages    |
| `onPageChange` | `(page: number) => void` | -       | Page change handler      |
| `disabled`     | `boolean`                | -       | Disable controls         |

### SearchBar

A search input field.

```tsx
<SearchBar placeholder="Search workflows..." />
```

| Prop          | Type     | Default | Description      |
| ------------- | -------- | ------- | ---------------- |
| `placeholder` | `string` | -       | Placeholder text |

### SectionHeader

A section title with optional action link and badge.

```tsx
<SectionHeader
  title="Recent Executions"
  actionText="View All"
  onActionClick={handleViewAll}
  badge="12"
/>
```

| Prop            | Type         | Default | Description            |
| --------------- | ------------ | ------- | ---------------------- |
| `title`         | `string`     | -       | Section title          |
| `actionText`    | `string`     | -       | Action link text       |
| `onActionClick` | `() => void` | -       | Action click handler   |
| `badge`         | `string`     | -       | Badge text             |
| `className`     | `string`     | -       | Additional CSS classes |

### StatusBadge

A colored pill badge for execution status with animated spinner for `running`.

```tsx
<StatusBadge status="running" size="md" />
```

| Prop        | Type                                              | Default | Description            |
| ----------- | ------------------------------------------------- | ------- | ---------------------- |
| `status`    | `'pending' \| 'running' \| 'success' \| 'failed'` | -       | Execution status       |
| `size`      | `'sm' \| 'md' \| 'lg'`                            | `'md'`  | Badge size             |
| `className` | `string`                                          | -       | Additional CSS classes |

### StructuredOutput

Displays structured input/output data (JSON-like).

```tsx
<StructuredOutput
  inputs={nodeInputs}
  outputs={nodeOutputs}
  loading={isLoading}
/>
```

| Prop      | Type                                   | Default | Description   |
| --------- | -------------------------------------- | ------- | ------------- |
| `inputs`  | `Record<string, unknown> \| undefined` | -       | Input data    |
| `outputs` | `Record<string, unknown> \| undefined` | -       | Output data   |
| `loading` | `boolean`                              | -       | Loading state |

### Table

A generic, typed data table with sorting, row click, loading state, and sticky header.

```tsx
<Table
  columns={[
    { key: "name", label: "Name" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]}
  data={workflows}
  onRowClick={(row) => navigate(`/workflows/${row.id}/edit`)}
  loading={isLoading}
  empty={<EmptyState title="No workflows" />}
  stickyHeader
/>
```

| Prop             | Type               | Default | Description            |
| ---------------- | ------------------ | ------- | ---------------------- |
| `columns`        | `TableColumn<T>[]` | -       | Column definitions     |
| `data`           | `T[]`              | -       | Row data               |
| `onRowClick`     | `(row: T) => void` | -       | Row click handler      |
| `loading`        | `boolean`          | -       | Loading state          |
| `empty`          | `ReactNode`        | -       | Empty state content    |
| `className`      | `string`           | -       | Additional CSS classes |
| `maxHeight`      | `string`           | -       | Max table height       |
| `stickyHeader`   | `boolean`          | -       | Sticky header          |
| `glassContainer` | `boolean`          | -       | Glass-morphism styling |

### Tabs

A generic tab component with underline or pill variants.

```tsx
<Tabs
  tabs={[
    { id: "overview", label: "Overview" },
    { id: "history", label: "History" },
  ]}
  active="overview"
  onChange={setActiveTab}
  variant="underline"
/>
```

| Prop        | Type                     | Default | Description                |
| ----------- | ------------------------ | ------- | -------------------------- |
| `tabs`      | `Tab<T>[]`               | -       | `{ id: T; label: string }` |
| `active`    | `T`                      | -       | Active tab ID              |
| `onChange`  | `(id: T) => void`        | -       | Tab change handler         |
| `variant`   | `'underline' \| 'pills'` | -       | Visual style               |
| `className` | `string`                 | -       | Additional CSS classes     |

### ToggleSwitch

A toggle switch for boolean values.

```tsx
<ToggleSwitch checked={enabled} onChange={setEnabled} label="Enable feature" />
```

| Prop        | Type                         | Default | Description            |
| ----------- | ---------------------------- | ------- | ---------------------- |
| `checked`   | `boolean`                    | -       | Toggle state           |
| `onChange`  | `(checked: boolean) => void` | -       | Change handler         |
| `disabled`  | `boolean`                    | `false` | Disable the toggle     |
| `label`     | `string`                     | -       | Label text             |
| `className` | `string`                     | `''`    | Additional CSS classes |

### UserProfile

A user profile display with avatar and optional badge.

```tsx
<UserProfile
  name="John Doe"
  account="john@example.com"
  showBadge
  badgeType="pro"
/>
```

| Prop          | Type                          | Default | Description             |
| ------------- | ----------------------------- | ------- | ----------------------- |
| `avatar`      | `string`                      | -       | Avatar image URL        |
| `avatarColor` | `string`                      | -       | Avatar background color |
| `name`        | `string`                      | -       | Display name            |
| `account`     | `string`                      | -       | Account/email           |
| `displayOnly` | `boolean`                     | -       | Read-only mode          |
| `showBadge`   | `boolean`                     | -       | Show badge              |
| `badgeType`   | `'pro' \| 'basic' \| 'admin'` | -       | Badge type              |

## Icon Components

The `icons/` subdirectory exports SVG icon components (all accept `{ className?: string }`):

- `MenuIcon`
- `PlayIcon`
- `PauseIcon`
- `StopIcon`
- `CloseIcon`
- `TrashIcon`
- `SettingsIcon`

```tsx
import { PlayIcon, StopIcon } from "$components/icons";
```

## Graph Components

The `graph/` subdirectory contains ReactFlow-based components used by `ExecutionFlowGraph`:

- `FlowCanvas` -- ReactFlow canvas wrapper
- `FlowEdge` -- Custom animated edge
- `BaseNode` -- Base node component
- `NodeContent` -- Node content renderer

## Type Definitions

All component prop types are defined in `src/apps/web/frontend/src/types/components.ts` and exported from `$types/components`.
