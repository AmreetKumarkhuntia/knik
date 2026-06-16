# KNIK Redesign — UI kit

A single click-through prototype that re-imagines the full KNIK web app on the
KNIK design tokens (cyan-on-ink, Inter + JetBrains Mono, hairline borders, glass
surfaces). Exported from Claude Design and kept here as the visual source of
truth for the production implementation in `src/apps/web/frontend/`.

Open `index.html` directly in a browser to explore. It loads the bound design
system from `../../colors_and_type.css` + `../../_ds_bundle.js` and mounts into
`#app`.

## Screens (all reachable)

- **Chat home** — glyph hero, accent-gradient title, 2×2 suggestion cards with
  category tags, composer with an inline model picker.
- **Chat thread** — message metadata (model + time), a collapsible reasoning &
  tool-call block, and a code block with copy.
- **Workflow hub** — 4-up metric strip, search + status filter, a richer table
  with activity sparklines + pause/resume, and a recent-executions feed.
- **Workflow builder** — node palette + animated DAG canvas, a node inspector
  panel, and a run bar with a collapsible live log stream.
- **Schedules** — weekly upcoming strip + cron list with toggles.
- **Settings** — tabbed: General, Appearance (theme + accent + density +
  corners), Providers + MCP tools, Kokoro voice grid, and API-key management.

## Shell & tweaks

- Collapsible sectioned sidebar with a workspace switcher and a **local** account
  footer (no email, no plan — KNIK runs locally).
- Command-bar top bar with global **⌘K** command palette.
- Tweaks panel (toolbar): accent (cyan / teal / violet / amber), light/dark,
  density, and corner radius — all applied live via CSS variables.

## Files

- `index.html` — app shell + animations, wires the modules below.
- `tweaks-panel.jsx` — the live tweaks panel (accent / theme / density / radius).
- `app/icons.jsx` — Material Symbols helper + KNIK glyph.
- `app/data.jsx` — mock dataset (local account, models, workflows, schedules…).
- `app/primitives.jsx` — evolved atoms (Button, Card, Chip, StatusBadge…).
- `app/shell.jsx` — Sidebar + TopBar.
- `app/chat.jsx` — ChatHome / ChatThread / composer / reasoning block.
- `app/workflows.jsx` — Workflow hub + Schedules.
- `app/builder.jsx` — DAG canvas + node inspector + run bar.
- `app/settings.jsx` — tabbed settings.
- `app/App.jsx` — router + command palette + tweak-driven CSS variables.
