# Shared frontend components

The frontend has one implementation for each control family under `src/apps/web/frontend/src/lib/components/`. Widgets supply domain data and handle actions; components render props and emit callbacks. Prop interfaces live under `src/types/`, and static design configuration lives under `src/lib/constants/`.

Use the `$components` barrel or a concrete component path:

```tsx
import Button from "$components/buttons/Button";
import Table from "$components/display/Table";
import Input from "$components/forms/Input";
import Select from "$components/forms/Select";
import Modal from "$components/surfaces/Modal";
```

## Buttons and navigation

`Button` is the only renderer of native button markup. It forwards native button attributes and refs, defaults to `type="button"`, and accepts `children` or `label`, `icon`, `endIcon`, `variant`, `size`, and `loading`. Loading disables the button and sets `aria-busy`. Use `type="submit"` explicitly inside forms and give icon-only buttons an accessible name.

```tsx
<Button type="submit" variant="primary" disabled={!dirty}>Save</Button>
<Button variant="ghost" aria-label="Remove workflow" onClick={onDelete} icon={<MS name="delete" />} />
```

Variants are `primary`, `secondary`, `danger`, `ghost`, `success`, and `warning`; sizes are `xs`, `sm`, `md`, and `lg`. Specialized controls compose Button. Do not add another native or `motion.button` implementation.

`NavLink` renders a router link for local paths, an anchor for external URLs, and Button for callback-only actions. Use links for navigation. It accepts an icon, label, `href`, active/collapsed state, and an optional click callback. `Breadcrumb` and the tabs components provide consistent navigation presentation. Tabs own focus/selection behavior; domain filtering belongs to widgets.

## Tables

`Table<T>` receives `data`, `columns`, and required `getRowKey`. Each column has a stable `id` or `key`, `label`, optional alignment/class, and optional `render(value, row)`. Supply real record IDs; never use row positions as identity.

```tsx
<Table
  data={workflows}
  getRowKey={(row) => row.id}
  columns={[
    {
      id: "name",
      key: "name",
      label: "Name",
      render: (_value, row) => (
        <Link to={`/workflows/${row.id}/edit`}>{row.name}</Link>
      ),
    },
    {
      id: "actions",
      key: "id",
      label: "Actions",
      render: (_value, row) => (
        <Button onClick={() => onRun(row.id)}>Run</Button>
      ),
    },
  ]}
  density="compact"
  empty={<EmptyState title="No workflows yet" />}
  stickyHeader
/>
```

Filtering, sorting, pagination and record selections belong to stores; widgets bind their actions and navigation callbacks. Table supports `loading`, `error`, `empty`, `maxHeight`, `stickyHeader`, and `density="compact" | "comfortable"`. Application tables use fixed compact density and one neutral outlined surface.

Optional pointer row navigation ignores nested links, buttons, inputs, selects, textareas, and relevant interactive roles. Include a keyboard-accessible primary link or button in a cell rather than making every table row a separate tab stop.

`TableParts` owns all native table elements (`TableRoot`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`, and related parts). Both the generic Table and Markdown tables compose these parts.

## Forms

| Control          | Contract                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| Input / Textarea | Native attributes, refs, value/change events, optional inline error                    |
| Select           | `options`, `value`, `onValueChange`; `onChange(value)` remains supported               |
| Radio            | `name`, `options`, `value`, `onChange`; standard/card/chip/segmented presentation      |
| Checkbox         | `checked`, `onChange`, label, optional indeterminate state; standard/chip presentation |
| ToggleSwitch     | `checked`, `onChange`, disabled state, accessible label; native switch semantics       |
| Slider           | Numeric min/max/step/value, `onChange`, and accessible label                           |

Select uses `presentation="native"` by default and supports `presentation="rich"` through the same API. Rich options may use `renderOption`. It handles arrow keys, Home/End, selection, Escape, and returning focus. Empty option collections and values absent from the option list remain explicit; widgets decide whether a control should be unavailable.

FormField is a widget composition helper for a label, hint, error, and an existing control. Its child callback supplies the control ID and accessibility attributes:

```tsx
import FormField from "$widgets/FormField";

<FormField label="Name" hint="Visible in this session" error={error} required>
  {(field) => (
    <Input
      {...field}
      value={name}
      onChange={(event) => setName(event.target.value)}
    />
  )}
</FormField>;
```

`FormRow` is the row-layout wrapper around FormField. With an explicit control, pass matching `htmlFor`/`id` and `hintId`/`aria-describedby`; groups such as Radio use their own legend (`hideLabel` keeps it for screen readers only when the row already shows the label, and `aria-describedby` takes the row's `hintId`). FormGroup composes a titled Card. These helpers do not choose control types or access session records.

A widget owns draft values and validation. Save commits a valid draft, validation errors preserve it, Cancel discards it, and widget unmount discards unsaved values. Settings toggles and choices commit their local session preferences directly.

## Overlays and feedback

`Modal` accepts `isOpen`, `onClose`, optional title/size, `placement="center" | "left" | "right"`, and children. Centered dialogs and side drawers share the same implementation. It owns the portal, focus containment/restoration, Escape handling, backdrop dismissal, and body scroll lock. `ConfirmDialog` composes Modal and Button with confirm/cancel callbacks.

Popover receives a render callback for its single actual trigger:

```tsx
<Popover
  label="Workflow actions"
  renderTrigger={(triggerProps) => <Button {...triggerProps}>Actions</Button>}
  content={<Button onClick={onEdit}>Edit</Button>}
/>
```

Forward all trigger props and its ref. Popover owns outside-pointer dismissal, Escape, and trigger focus restoration. Do not nest a button in an extra element with `role="button"`.

Reuse Card, Badge, SectionHeader, Banner, EmptyState, LoadingSpinner, and Toast for presentation. Widgets decide when feedback appears and orchestrate dismissal/actions; components receive those values and callbacks.

## Chat, code, and settings presentation

ChatBubble supports supplied avatar, header, reasoning, content, timestamp, and action slots. ChatComposer is controlled by its widget and preserves Enter/Shift+Enter, IME composition, focus, and textarea resizing behavior.

MarkdownMessage composes CodeBlock and TableParts. StructuredOutput and JsonViewer share code/JSON presentation. Copyable views receive `onCopy(text)`; they never call the clipboard themselves. The widget owns clipboard success/failure feedback.

ProfileSummary, ToolGroupList, VoiceOption, ApiKeyRow, and KeyReveal are pure settings views. Their widgets supply data, selections, deletion/copy callbacks, and scenario availability. Voice preview playback exists only in the voice widget and only for an explicitly supplied audio asset.

## Enforced boundaries and tests

The local ESLint architecture plugin resolves configured aliases, relative imports, and re-export barrels. Components cannot import widgets, pages, sections, app hooks, services, stores, or demo fixtures. Raw button/table rendering is restricted to the canonical modules. Browser I/O belongs to widgets; DOM work needed for focus, layout, and overlays remains valid in components.

Tests are organized under `src/apps/web/frontend/src/tests/`, with shared-control, widget, session, architecture, and browser suites. Run `npm test`, `npm run lint`, `npm run type-check`, and `npm run test:browser` from the frontend directory. See [frontend architecture](web-architecture.md) for session behavior and [the consolidation plan](../plan/07-frontend-component-consolidation.md) for the five Archify views.

## Fixed visual system

`styles/tokens.css` owns light/dark surfaces, text, borders, teal accent, typography and geometry. Appearance settings expose only color mode. ThemeWidget applies `data-theme`; components do not read stores or theme preferences.

SectionHeader uses `level="page"` for a 24px h1 and `level="section"` for a 16px h2. Controls have 36px desktop and 44px touch targets. Rich Select accepts Popover placement; the bottom-pinned chat composer uses `top-start` so model options remain in view. Code and graph rendering use the same semantic color tokens as the shell.
