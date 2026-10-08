# Plan 07: Frontend consolidation with widget-owned data flow

**Status:** Implemented and verified — October 8, 2026
**Baseline:** `refactor/frontend-modularization`, `c0c2281`
**Scope:** Frontend source, tests, configuration, and documentation. Backend code remains unchanged.

## Ownership

| Layer | Responsibility |
| --- | --- |
| App, pages, sections | Routes, route parameters, layout, and widget composition |
| Widgets | Data selection, actions, drafts, filters, session state, and browser operations |
| Components | Render props and emit events; intrinsic focus/menu/animation state only |
| Types, constants, utilities | Shared contracts, tokens, configuration, and pure transformations |

Dependency direction is App/pages/sections → widgets → components. Widgets cannot import sections or pages. Store and fixture access stays internal to widgets, including aliases, relative paths, and re-exports.

## Session and interactions

- One provider-scoped Zustand store lives in the widget subsystem and remains mounted above all routes.
- Supplied demo source → widget adapter → immutable seed → cloned session → widget selectors → component props.
- Component events → widget validation/actions → committed session updates → subscribed widget rerenders.
- Committed records, global selections, and settings persist across navigation. Reload recreates the initial session.
- Widget drafts, dialogs, filters, and sorting reset on unmount. Save commits valid drafts, validation errors retain them, and Cancel discards them.
- Appearance settings share the session; a theme widget projects CSS variables. Remove browser-storage use without clearing existing browser data.
- Widgets own clipboard, downloads, notifications, and conversation actions. App and sections only compose them.
- The demo source will be supplied separately. Until then use empty/unavailable states; existing demo modules are not implicitly selected.
- Send, Run, key generation, and voice preview require supplied scenarios/assets. Never fabricate results, streaming, progress, or secrets.

## Canonical controls

- Button: one renderer, native attributes/ref, default type=button, explicit submit, icon/text variants, accessible labels, disabled/loading behavior.
- Table: typed columns, stable row/column keys, density, scrolling, loading/empty/error states, accessible cell actions, and nested-action isolation. Markdown shares table structure.
- Forms: Input, Textarea, Slider, Select, Radio, Checkbox, ToggleSwitch. One Select API supports native/rich presentation. Choice card/chip appearances are variants.
- Modal/Popover own overlay focus and dismissal; edit/confirmation widgets compose them.
- Consolidate cards, badges, headings, navigation, feedback, chat presentation, and code/JSON rendering. Preserve native link/keyboard semantics.
- Interfaces live under src/types. Replace remote response/callback contracts with local domain contracts.

## Implementation sequence

1. Update this plan and create the five Archify views.
2. Establish widget session, canonical control contracts, and dependency rules.
3. Migrate workflows/schedules/executions, chat/shell, and settings into widgets; preserve routes and visual design.
4. Remove frontend API clients, endpoints/environment configuration, remote CRUD, streaming, polling, coupled stores, and audio-stream initialization. No live/demo switch or mock API service.
5. Remove verified unused duplicates, update exports/aliases/docs/lint, and complete verification.

The integration owner maintains session, shared controls, tests, configuration, and documentation. Domain agents own workflow/schedule/execution widgets, chat/shell widgets, and settings widgets, using agreed contracts.

## Archify views

All views describe the proposed design, distinct from verified current-code observations. Each uses a separate timestamped .archify folder containing candidate JSON, standalone HTML, and validation/delivery/browser evidence. Static showcase presentation is the default.

| View | Coverage | Gate receipt |
| --- | --- | --- |
| [Architecture](../../.archify/architecture-widget-architecture-20261008-191748/widget-architecture.html) | Layer ownership, shared controls, widget session, browser boundary | [Passed](../../.archify/architecture-widget-architecture-20261008-191748/widget-architecture.finalize-summary.json) |
| [Data flow](../../.archify/dataflow-widget-dataflow-20261008-191748/widget-dataflow.html) | Source adaptation, seed/session separation, selectors, props, events, updates | [Passed](../../.archify/dataflow-widget-dataflow-20261008-191748/widget-dataflow.finalize-summary.json) |
| [Interaction sequence](../../.archify/sequence-session-interactions-20261008-191748/session-interactions.html) | Edit/validate/save/cancel, cross-widget updates, navigation, scenario availability | [Passed](../../.archify/sequence-session-interactions-20261008-191748/session-interactions.finalize-summary.json) |
| [Session lifecycle](../../.archify/lifecycle-session-lifecycle-20261008-191748/session-lifecycle.html) | Initialization, edits, drafts, navigation, reload, reseeding | [Passed](../../.archify/lifecycle-session-lifecycle-20261008-191748/session-lifecycle.finalize-summary.json) |
| [Migration workflow](../../.archify/workflow-frontend-migration-20261008-191748/frontend-migration.html) | Boundaries, controls, transport removal, data source, cleanup, verification | [Passed](../../.archify/workflow-frontend-migration-20261008-191748/frontend-migration.finalize-summary.json) |

All five candidates passed showcase validation, deterministic delivery, strict artifact/provenance checks, and real Chrome browser checks on October 8, 2026. Each folder retains `candidate.json`, HTML, delivery metadata, full/compact finalization receipts, and the artifact-bound browser receipt. Browser checks cover light/dark themes and desktop containment; no screenshots or perceptual visual review were performed (`visualReview: not-requested`). The lifecycle and migration workflow receipts retain advisory route-readability notes; automated gates passed with zero diagnostics.

These are design specifications based on the accepted plan, not a claim that future behavior was already implemented at the baseline commit. Accordingly they do not attach misleading HEAD source citations to proposed nodes.

## Follow-up: session-driven catalogs and highlight correction

Dynamic means widgets select provider, model, voice, MCP tool, and key records from the supplied demo source through the provider-scoped session. The internal typed `useSettingsCatalog` selector provides that shared access pattern. Components render supplied props; no catalogs are embedded in presentation code. Empty collections stay empty until source data is supplied. No API client, endpoint configuration, proxy, API fixture, or asynchronous loading simulation is used.

The mistakenly added catalog HTTP layer has been removed, and lint/browser guards reject all application data requests again. The original zero-API architecture and all five linked design views remain applicable. Backend code is unchanged.

The chat composer retains a single outer focus cue, and passive settings cards no longer acquire a cyan hover border or lift. These visual fixes and frontend formatting are preserved.

Correction verified on October 8: 85 unit/integration tests and all 9 Chrome browser cases pass. Tests exercise arbitrary supplied catalog records, widget updates, provider isolation, empty catalogs, and every settings pane. Browser guards observed zero application data or media-capture requests, with no catalog exceptions or API fixtures. Build, lint, TypeScript, source/configuration formatting, and whitespace checks pass; four existing chart warnings remain.

## Original consolidation verification

Use Vitest, React Testing Library, and user-event for control contracts, validation, table action isolation, session consistency, draft cancellation, navigation retention, refresh reset, provider independence, seed immutability, and missing-route states.

Run lint, type checking, build, and browser checks for chat, workflows, builder, executions, schedules, and settings, including light/dark and narrow layouts. All actions must work with the backend stopped and make zero application API/provider, stream, polling, or microphone-permission requests. Static asset loading remains allowed.

Tests are organized separately under `src/apps/web/frontend/src/tests/`, grouped into components, widgets, session, architecture, and browser suites. See the [test directory guide](../../src/apps/web/frontend/src/tests/README.md), [component reference](../components/react-common-components.md), and [implemented architecture](../components/web-architecture.md).

Final verification on October 8, 2026:

- Vitest: 17 files and 78 tests passed, including 40 architecture-rule cases.
- Chrome/Playwright: all 7 browser tests passed. Routes, local CRUD, draft cancellation, cross-route updates, session reload/reset, missing IDs, unavailable actions, light/dark themes, and narrow layouts were exercised.
- Browser guards observed zero application API/stream or media-capture attempts and zero uncaught page errors. Static assets and Vite development traffic remain allowed.
- Lint, TypeScript checking, production build, source formatting, and whitespace checks passed. Four existing chart lint warnings remain; the baseline had eight warnings.
- App screenshots were inspected for desktop dark chat, desktop light settings, and the narrow workflow builder. The builder controls, graph bounds, and narrow properties dialog were corrected and verified. This app visual review is separate from the Archify automated browser checks above.
- Backend source has no changes.

The application intentionally starts with empty collections and explicit unavailable states until a demo source is supplied. Connecting that source remains a future input, not an implicit selection of historical fixtures. No backend connection, simulated execution, fabricated response, or generated secret is used.
