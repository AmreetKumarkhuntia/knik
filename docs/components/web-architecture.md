# Knik frontend architecture

The React/Vite frontend uses provider-scoped, in-memory Zustand domain stores under `src/lib/stores`. Widgets obtain all application data and working state through public store hooks and actions. Components receive props and emit events. The frontend operates without application APIs, streaming, polling, browser persistence or microphone capture.

For a visual walkthrough, open [domain ownership](../../.archify/store-architecture/domain-stores/domain-stores.html), [data flow](../../.archify/store-architecture/store-dataflow/store-dataflow.html), [interactions](../../.archify/store-architecture/store-interactions/store-interactions.html), or [session lifetime](../../.archify/store-architecture/store-lifecycle/store-lifecycle.html). The [implementation plan](../plan/07-frontend-component-consolidation.md) separates approved contracts from verified baseline observations and acceptance evidence.

The Archify files preserve the earlier proposed design. The chat behavior clarified on 2026-10-09 is specified below: saving a user message does not require a model or reply scenario.

## Ownership

| Layer                          | Owns                                                                                                                         | Public dependencies                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| App, pages, sections           | Routing, route parameters, layout and composition                                                                            | Provider entry point, widgets, presentation components        |
| Stores                         | Committed records, settings, selections, drafts, feature dialogs, errors, filters, sorting, derived views and domain actions | Shared types, constants and pure transformations              |
| Widgets                        | Bind store state/actions to component props/events; perform browser effects                                                  | Public store/domain/view barrels, components and pure helpers |
| Shared hooks (`src/lib/hooks`) | Browser subscriptions shared by widgets, such as the viewport breakpoint and keyboard shortcuts                              | Public store hooks, types, constants and pure helpers         |
| Components                     | Supplied props/events and intrinsic focus/menu/layout behavior                                                               | Other components, types, tokens and pure helpers              |

```text
DemoSource → validate + clone → independent domain stores
                                        ↓
                             public hooks + joined views
                                        ↓
Routes compose widgets → widgets supply component props
                              ↑                 ↓
                        store actions ← component events
```

Store factories do not import peer domains. The session coordinator receives the store bundle and handles cross-domain commands. Joined views read multiple owners without copying records. Widgets cannot import store internals, raw Zustand APIs or demo modules. Pages/sections/components cannot select application state directly. A widget must not import a page or section. Shared hooks serve widgets only: they cannot import widgets, pages, sections or App, and components, stores, types and constants cannot import them.

## Domain relationships

| Store       | Stored data and working state                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Catalogs    | Providers, models, voices and tool definitions                                                  |
| Chat        | Conversations, messages, active selection, reply scenarios, composer and rename scopes          |
| Workflows   | Canonical workflow records, builder draft graph/name, selected node, validation and hub filters |
| Schedules   | Records referencing workflow IDs, create/edit/delete working state                              |
| Executions  | Records referencing workflow IDs, timelines, run scenarios, filters, sorting and pagination     |
| Settings    | Profile, preferences, appearance, enabled tool IDs and pane working state                       |
| Credentials | Key metadata, supplied key scenarios and create/reveal/delete state                             |
| Shell       | Sidebar collapse and command palette state                                                      |
| Feedback    | Toast queue                                                                                     |

Workflow names and definitions have one owner: the workflow store. Schedule and execution views join by workflow ID. Model options have explicit provider relationships, and chat/settings/builder select them from the same catalog. Dashboard metrics and recent conversation order are derived views, not independent datasets.

Each domain exposes hooks and actions through its public barrel, with private store creation and selectors kept inside the subsystem. Interfaces belong under `src/types/stores`. The store tree separates `session/`, `demo/`, the nine domain folders, and `views/` for cross-domain projections.

## Initialization and lifetime

`StoresProvider` creates one bundle above the routes and keeps it for the provider lifetime. An omitted source loads bundled demo data; an explicit source replaces that default. Normalize and validate before mounting consumers, then clone data to isolate both the fixture and each provider. Rerenders and navigation reuse the bundle.

| Action                               | Result                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| Open a widget                        | Create an isolated working scope for that instance/resource |
| Type, filter, select or edit a graph | Update that domain's scoped working state                   |
| Save                                 | Validate, commit the record and clear draft errors          |
| Invalid input                        | Retain the draft and expose its validation error            |
| Cancel                               | Discard the affected draft; keep saved records unchanged    |
| Unmount or change resource           | Release the affected scope                                  |
| Navigate and return                  | Reuse committed records; create fresh page working state    |
| Reload or mount another provider     | Create an independent session from a cloned seed            |

Chat composer drafts and workflow edits therefore live in stores but remain transient. Two mounted editors have independent drafts. Store scope hooks handle StrictMode mount/cleanup without writing during render.

The controlled workflow builder reads its name, nodes, edges, selection and errors from the workflow draft. Save reads the draft through the store command, rather than calling a canvas method. Cross-domain commands validate before any authoritative write; invalid references cannot produce partial domain updates.

## Demo capabilities and browser effects

| Interaction                        | Behavior                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Create/edit workflow or schedule   | Validate and commit in memory                                                                                                          |
| Send nonblank chat text            | Save the user message locally and clear the composer, regardless of model or scenario availability                                     |
| Add a chat reply                   | Optionally append replies from a matching authored scenario; otherwise keep only the user message, with no warning or fabricated reply |
| Blank text or deleted conversation | Reject the send, retain the draft and show the validation error                                                                        |
| Run workflow                       | Require a scenario matching the committed definition; write execution and timeline together                                            |
| Create demo key                    | Require an explicitly supplied sample-secret scenario; never generate a secret                                                         |
| Preview voice                      | Play a supplied audio asset only after the user's action                                                                               |
| Clipboard or export                | Widget performs the browser operation and updates store-owned status/feedback                                                          |
| Missing/deleted route ID           | Show a not-found or empty state                                                                                                        |

ThemeWidget applies the light/dark `data-theme` attribute from the settings store. `styles/tokens.css` owns the fixed palette, spacing and corner radii; appearance state contains only `mode`. Audio elements, object URLs, DOM refs and focus mechanics remain browser resources rather than serializable store data. Their owning widgets clean them up. Existing storage keys are neither read nor cleared.

No network fallback, progress simulation, mock API or live/demo switch is present. Static assets and explicitly supplied media may load normally; this architecture does not promise offline packaging.

Chat reply availability never blocks a valid local send. An unmatched message is still part of the conversation and appears in subscribed chat/sidebar views without a warning or reply-unavailable status. Authored scenarios provide optional local replay. No assistant message is fabricated and no provider is called. Whitespace-only drafts and sends targeting deleted conversations remain validation failures.

## Controls, routes and verification

Canonical Button, Table/TableParts, form controls, Modal and Popover retain their shared responsibilities. See [component contracts](react-common-components.md). The compact workspace redesign uses these same controls with solid surfaces and a fixed teal palette. Routes and store ownership remain unchanged.

| Path                    | Feature                                                   |
| ----------------------- | --------------------------------------------------------- |
| `/`                     | Chat                                                      |
| `/workflows`            | Workflow hub                                              |
| `/workflows/create`     | Workflow builder                                          |
| `/workflows/:id/edit`   | Builder for a saved workflow                              |
| `/workflows/executions` | Execution list                                            |
| `/executions/:id`       | Execution detail                                          |
| `/schedules`            | Schedule management                                       |
| `/settings`             | Profile, appearance, providers/tools, voice and demo keys |

From `src/apps/web/frontend`:

```bash
npm run dev
npm test
npm run lint
npm run type-check
npm run build
npm run test:browser
```

Tests live separately under `src/tests`, including domain store, component, widget, architecture and browser suites. Architecture tests enforce aliases, relative paths, barrels and dynamic imports. Browser tests exercise all routes, themes and narrow layouts while rejecting application transports, persistence and microphone access. The [plan's acceptance checklist](../plan/07-frontend-component-consolidation.md#implementation-and-acceptance) is the verification contract for this migration.

## Compact workspace presentation

The shell uses a 232px desktop sidebar, 64px rail and 52px header. Below 768px navigation opens in a modal drawer; tablet widths use a rail without overwriting the desktop collapse preference. Mobile navigation state belongs to the existing shell scope. Each route owns its primary scroller.

Chat aligns the transcript and composer to an 800px reading column. Model selection remains beside the composer. A tools drawer uses the chat scope's `toolsOpen` state and the same props-driven tool group list as Settings. Tool selections remain session-wide, and opening the drawer keeps the composer draft mounted.

The builder renders a 320px right inspector only for a selected node; below 1024px it uses the shared Modal's drawer presentation. Execution detail tabs and collapse state belong to a route-scoped execution view. Run continues to open the execution route. Schedules, workflows and execution history use the canonical compact Table.

Workflow graphs share one node presentation and viewport toolbar. Execution layouts align node centers and switch to top-to-bottom when the canvas is narrower than 900px; this presentation transform never rewrites builder coordinates. Handle IDs remain stable across orientation changes. The toolbar reserves its own space beside the minimap, and explicit zoom/pan stays unchanged until the canvas resizes or the user chooses Fit View.

Settings uses category navigation beside flat sections and aligned rows. Appearance offers light/dark mode only. Reload restores the seed mode; no browser storage migration or access occurs. The shared Modal handles centered dialogs and left/right drawers through one focus and dismissal implementation.
