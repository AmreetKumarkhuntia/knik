# KNIK Web — UI Kit

An interactive recreation of the KNIK web frontend (`src/apps/web/frontend/`). Built as one HTML shell with composable JSX components.

## What's in here

- **`index.html`** — the live shell. Click between **Chat**, **Workflows**, and the **Workflow Builder** in the sidebar; type a message to switch from welcome → thread; send a message to see KNIK reply through the streaming markdown renderer.
- **`App.jsx`** — top-level layout + view router
- **`Sidebar.jsx`** — collapsible glass nav (80 ↔ 320 px)
- **`TopBar.jsx`** — sticky breadcrumb header with right-aligned actions
- **`ChatHome.jsx`** — welcome hero + suggestion grid (matches `WelcomePrompt` + `SuggestionCards`)
- **`ChatThread.jsx`** — chat messages with copy / like / regenerate actions
- **`InputPanel.jsx`** — glass composer (attach, mic, send) with ⌘K focus and Shift+Enter
- **`SuggestionCards.jsx`** — 4 prompt suggestion cards
- **`WorkflowHub.jsx`** — dashboard: 3 metric cards + workflows table + recent executions
- **`WorkflowBuilder.jsx`** — DAG canvas with start / LLM / end nodes and animated edges
- **`MetricCard.jsx`** — animated value tile with trend indicator
- **`StatusBadge.jsx`** — pending / running / success / failed
- **`Button.jsx`** — variants from `constants/variants.ts`
- **`Card.jsx`** — default / bordered / glass variants
- **`icons.jsx`** — Material-Symbols-Outlined helper + a handful of inline strokes

## Conventions

- All components consume CSS vars from `../../colors_and_type.css` — never hard-code colour.
- Spacing on a 4-pt grid (`--space-1` … `--space-20`).
- Animation easing is **always** `cubic-bezier(0.16, 1, 0.3, 1)` unless you’re doing a spring (chat messages, node enter/exit).
- Icons: prefer `<span class="material-symbols-outlined">name</span>` over inline SVG.

## What's intentionally simplified

- The chat sends a fake assistant reply after 600ms (no real API).
- The workflow builder is a static layout — no drag-to-connect, no node properties panel.
- The execution timeline / history table is replaced by a short demo dataset.
- No theme switcher — this kit ships in dark mode only (the production app supports light, but every brand asset assumes dark).
