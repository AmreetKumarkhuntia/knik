# Shared frontend components

The frontend has one implementation for each control family under `src/frontend/src/lib/components/`. Widgets supply domain data and handle actions; components render props and emit callbacks. Prop interfaces live under `src/types/`, and static design configuration lives under `src/lib/constants/`.

Use the `$components` barrel or a concrete component path:

```tsx
import Button from "$components/buttons/Button";
import Table from "$components/display/Table";
import Input from "$components/forms/Input";
import Select from "$components/forms/Select";
import Modal from "$components/surfaces/Modal";
```

## Buttons and navigation

`Button` is the only renderer of native button markup. It forwards native button attributes and refs, defaults to `type="button"`, and accepts `children` or `label`, `icon`, `variant`, `size`, and `loading`. Loading disables the button and sets `aria-busy`. Use `type="submit"` explicitly inside forms and give icon-only buttons an accessible name.

```tsx
<Button type="submit" variant="primary" disabled={!dirty}>Save</Button>
<Button variant="ghost" aria-label="Remove workflow" onClick={onDelete} icon={<MS name="delete" />} />
```

Variants are `primary`, `secondary`, `danger`, and `ghost`; sizes are `xs`, `sm`, and `md`. Specialized controls compose Button. Do not add another native or `motion.button` implementation.

`NavLink` renders a router `Link`. It accepts an icon, label, `href`, active/collapsed state, and an optional click callback. `Breadcrumb` and the tabs components provide consistent navigation presentation. Tabs own focus/selection behavior; domain filtering belongs to widgets.

## Tables

`Table<T>` receives `data`, `columns`, and required `getRowKey`. Each column has a unique `key`, a `label`, and optional `render(value, row)`. Supply real record IDs; never use row positions as identity.

```tsx
<Table
  data={workflows}
  getRowKey={(row) => row.id}
  columns={[
    {
      key: "name",
      label: "Name",
      render: (_value, row) => (
        <Link to={`/workflows/${row.id}/edit`}>{row.name}</Link>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_value, row) => (
        <Button onClick={() => onRun(row.id)}>Run</Button>
      ),
    },
  ]}
  empty={<EmptyState title="No workflows yet" />}
  stickyHeader
/>
```

Filtering, sorting, pagination and record selections belong to stores; widgets bind their actions and navigation callbacks. Table supports `empty`, `maxHeight`, and `stickyHeader`, on one neutral outlined surface. Rows are not interactive; put a keyboard-accessible link or button in a cell.

`TableParts` owns all native table elements (`TableRoot`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`, and related parts). Both the generic Table and Markdown tables compose these parts.

## Forms

| Control          | Contract                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| Input / Textarea | Native attributes, refs, value/change events, optional inline error                    |
| Select           | `options`, `value`, `onValueChange`; `onChange(value)` remains supported               |
| Radio            | `name`, `options`, `value`, `onChange`; standard/card/chip/segmented presentation      |
| Checkbox         | `checked`, `onChange`, label                                                           |
| ToggleSwitch     | `checked`, `onChange`, disabled state, accessible label; native switch semantics       |
| Slider           | Numeric min/max/step/value, `id`, `onChange`; its FormRow labels it via `htmlFor`/`id` |

Select uses `presentation="native"` by default and supports `presentation="rich"` through the same API. Rich options may use `renderOption`. It handles arrow keys, Home/End, selection, Escape, and returning focus. Empty option collections and values absent from the option list remain explicit; widgets decide whether a control should be unavailable.

`FormRow` lays out a label, hint, and an existing control (props `label`, `hint`, `hintId`, `htmlFor`, `last`, `children`). With an explicit control, pass matching `htmlFor`/`id` and `hintId`/`aria-describedby`; groups such as Radio use their own legend (`hideLabel` keeps it for screen readers only when the row already shows the label, and `aria-describedby` takes the row's `hintId`). FormGroup is a titled section of rows. These helpers do not choose control types or access session records.

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

Reuse Badge, SectionHeader, Banner, EmptyState, LoadingSpinner, and Toast for presentation. Widgets decide when feedback appears and orchestrate dismissal/actions; components receive those values and callbacks.

## Chat, code, and settings presentation

ChatBubble supports supplied avatar, header, reasoning, and content, plus an `onCopy` callback. ChatComposer is controlled by its widget and preserves Enter/Shift+Enter, IME composition, focus, and textarea resizing behavior.

MarkdownMessage composes CodeBlock and TableParts; JsonViewer composes CodeBlock. Copyable views receive `onCopy(text)`; they never call the clipboard themselves. The widget owns clipboard success/failure feedback.

ToolGroupList and ApiKeyRow are pure settings views. Their widgets supply data, selections, and toggle/delete callbacks.

## Enforced boundaries and tests

The local ESLint architecture plugin resolves configured aliases, relative imports, and re-export barrels. Components cannot import widgets, pages, app hooks, stores, or demo fixtures. Raw button/table rendering is restricted to the canonical modules. Browser I/O belongs to widgets; DOM work needed for focus, layout, and overlays remains valid in components.

Tests are organized under `src/frontend/src/tests/`, with shared-control, widget, session, architecture, and browser suites. Run `npm test`, `npm run lint`, `npm run type-check`, and `npm run test:browser` from the frontend directory. See [frontend architecture](web-architecture.md) for session behavior and [the consolidation plan](../plan/07-frontend-component-consolidation.md) for the five Archify views.

## Fixed visual system

`styles/tokens.css` owns light/dark surfaces, text, borders, teal accent, typography and geometry. Appearance settings expose only color mode. ThemeWidget applies `data-theme`; components do not read stores or theme preferences.

SectionHeader uses `level="page"` for a 24px h1 and `level="section"` for a 16px h2. Controls have 36px desktop and 44px touch targets. Rich Select accepts Popover placement; the bottom-pinned chat composer uses `top-start` so model options remain in view. Code and graph rendering use the same semantic color tokens as the shell.
