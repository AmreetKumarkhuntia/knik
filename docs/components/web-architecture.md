# Knik frontend architecture

The React/Vite frontend runs independently with widget-owned, in-memory demo state. It preserves the chat, workflows, builder, executions, schedules, and settings routes. Widgets select all application data, including settings catalogs, from their provider-scoped demo session. The frontend makes no application API calls, streaming connections, polling requests, or microphone capture requests. Backend source remains a separate, unchanged application.

## Ownership and dependencies

| Layer | Owns | May depend on |
| --- | --- | --- |
| App, pages, sections | Route selection/parameters, layout, widget composition | Public widgets, presentation components, shared types |
| Widgets | Domain selectors/actions, drafts, filters, dialogs, session state, browser operations | Other widgets, components, shared types/constants/pure utilities |
| Components | Props, emitted events, intrinsic focus/menu/layout behavior | Other components, shared types/constants/pure utilities |
| Types, constants, utilities | Contracts, design tokens, static configuration, pure transformations | Lower-level code and type-only interfaces |

A widget must never import a page or section. A page must not import the widget store, source adapter, context, or domain hooks. The public `DemoSessionProvider` export is the App-level entry point; store hooks remain internal to widgets. Re-exporting through another directory does not bypass these rules.

```text
App + route pages + layout sections
                  |
                  v
              feature widgets <---- shared session selectors/actions
                  |                            ^
             props | events                    |
                  v                            |
          shared components ------------- widget actions
```

Source layout:

```text
src/apps/web/frontend/
  eslint/frontend-boundaries.mjs   Local architecture rules
  src/
    App.tsx                        Providers, router, layout composition
    lib/
      pages/                       Route parameter adapters and widget composition
      widgets/
        session/                   Provider, source normalization, store and internal hook
        chat/ layout/ feedback/    Chat, navigation, notifications and browser actions
        workflows/ schedules/      Local workflow and schedule behavior
        settings/ theme/           Preferences, key scenarios, audio assets and CSS variables
      components/                  Shared controls and pure feature presentation
      constants/                   Tokens and static configuration
      utils/ data-structures/      Pure formatting and graph transformations
    types/                         Component, widget and demo source interfaces
    tests/                         Separate organized test suites
```

## Session data and interactions

`DemoSessionProvider` creates one vanilla Zustand store for its own mounted lifetime. App mounts it above all routes. Independent provider instances own independent stores; a parent rerender or route change does not replace an existing store.

```text
explicitly supplied DemoSource
    -> widget-owned normalizeDemoSource
    -> cloned initial snapshot
    -> provider-scoped store
    -> widget selectors
    -> component props

component callback
    -> widget validation/action
    -> committed session update
    -> subscribed widgets rerender
```

The source adapter fills missing collections with empty arrays/maps, supplies initial preference defaults, and clones the source so session actions cannot modify the caller's fixture objects.

Provider, model, voice, MCP tool, and API key collections are dynamic session data. The internal `useSettingsCatalog(key)` hook selects the typed collection from the same provider-scoped store used by other widgets. Widgets map these records into component props; components contain no provider names, model lists, voice options, or tool catalogs. Local actions update subscribed widgets synchronously. Missing source collections are empty and never trigger a network fallback, timer, loading simulation, or mock API.

No existing demo dataset is automatically selected. Historical demo modules remain disconnected until a source is explicitly chosen.

Committed records, shared selections, and preferences survive route navigation. Widget-local drafts, filters, sorting, dialogs, and playback state end with the owning widget. Saving validates before committing; invalid drafts remain editable; Cancel discards a draft. Reload mounts a new provider and restores the supplied source/defaults.

Appearance belongs to the same session: mode, accent, density, and corner radius. ThemeWidget applies the corresponding CSS variables and restores previous DOM values when it unmounts. The frontend does not read or write browser storage and does not clear keys left by older versions.

## Demo capabilities

The `DemoSource` contract lives in `src/types/demo-session.ts`. It can supply conversations, model/suggestion options, workflows, schedules, executions/timelines, preferences, providers, voices, tools, and key records, plus explicit chat/run/key scenarios.

| Interaction | Behavior |
| --- | --- |
| Create/edit a workflow or schedule | Validate and update the local session; no execution service is called |
| Send chat | Use a supplied matching chat scenario; otherwise retain the draft and explain unavailability |
| Run workflow | Use the supplied run scenario for that workflow; otherwise unavailable |
| View API keys | Read supplied key metadata from the demo session |
| Create a demo key | Use a matching supplied key scenario; never generate a real secret |
| Preview voice | Play only the selected supplied audio asset after a user action; stop when leaving the widget |
| Clipboard/export | Widget performs the browser operation and reports success/failure |
| Missing/deleted route ID | Render the relevant not-found/empty state |

No timer simulates progress, no generated response substitutes for a missing scenario, and no live/demo mode switch exists. Static assets, fonts, and explicitly supplied media may load normally; this is not an offline asset-packaging mode.

## Shared controls and enforcement

One Button renders native buttons. Table and Markdown compose the same TableParts primitives, and Table requires stable row keys. Input, Textarea, Select, Radio, Checkbox, ToggleSwitch, and Slider form the shared control vocabulary. Modal and Popover own focus and dismissal. See [the component reference](react-common-components.md) for APIs and examples.

ESLint enforces the ownership graph using configured TypeScript aliases, relative paths, direct exports, export-star barrels, and imported/re-exported aliases. Its browser rules reject all application fetch/XHR/WebSocket/EventSource transports, including catalog reads, telemetry beacons, microphone capture, browser storage, and component-owned clipboard/download/audio operations. Focus and layout DOM work remain allowed in components. Test fixtures/spies are exempt from application restrictions.

Interfaces and type aliases belong in `src/types`; module-level option arrays and lookup maps belong in `src/lib/constants`. Imports from `$types/widgets` or `$types/sections` are type contracts, not imports of those UI layers.

## Routes and development

| Path | Feature widget |
| --- | --- |
| `/` | Chat |
| `/workflows` | Workflow hub |
| `/workflows/create` | Workflow builder |
| `/workflows/:id/edit` | Workflow builder for a local record |
| `/workflows/executions` | Execution list |
| `/executions/:id` | Execution detail |
| `/schedules` | Schedule management |
| `/settings` | General, appearance, providers/tools, voice, demo keys |

From `src/apps/web/frontend`:

```bash
npm run dev          # Vite on port 8020; no backend is needed
npm test             # Vitest + React Testing Library/user-event
npm run lint         # Includes the local architecture rules
npm run type-check
npm run build        # Lint/type checking and production bundle
npm run test:browser # Playwright, using installed Chrome
```

Tests live under `src/tests/`, not alongside runtime components. Shared-control tests cover accessibility and event semantics; widget/session tests cover committed state, cancellation, validation, provider isolation, navigation, reset, and source immutability. Architecture tests use an in-memory module graph to exercise aliases and barrel bypasses. Browser tests cover routes, unsupported actions, themes, narrow layouts, and unexpected application requests. Browser tests reject all application data requests without catalog exceptions or API response fixtures; the backend is not started by the suite. Unit and integration tests supply arbitrary DemoSource records directly to the provider to verify dynamic catalog rendering and local updates.

The [consolidation plan](../plan/07-frontend-component-consolidation.md) links the validated architecture, data-flow, interaction-sequence, session-lifecycle, and migration-workflow diagrams. They are explicitly labeled proposed design specifications; final implementation verification is recorded separately in that plan.
