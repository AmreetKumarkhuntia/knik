## KNIK Design System

The full design system is in `docs/design/`. Key files:

- `docs/design/README.md` — brand overview, visual foundations, content guidelines, component index
- `docs/design/colors_and_type.css` — all CSS custom properties (colors, type scale, spacing, motion, shadows)
- `docs/design/SKILL.md` — Claude skill entrypoint
- `docs/design/assets/` — logo SVGs (knik-logo.svg, knik-mark.svg, knik-mark-mono.svg)
- `docs/design/preview/` — 85 HTML preview cards (buttons, badges, graph nodes, charts, etc.); older cards still show the previous teal/Inter look
- `docs/design/ui_kits/web/` — interactive HTML/JSX recreation of the web frontend (chat, workflows, builder)
- `docs/design/ui_kits/redesign/` — the "Knik Redesign" prototype the current identity comes from

### Quick reference

Current values from `docs/design/colors_and_type.css`, which mirrors `src/frontend/src/styles/tokens.css`:

| Token           | Value                                             |
| --------------- | ------------------------------------------------- |
| Primary accent  | `#9FB8FF` periwinkle (dark), `#4A63C9` (light)    |
| Base background | `#151311` warm graphite (dark), `#F3EFE9` (light) |
| Sans font       | Figtree                                           |
| Mono font       | DM Mono                                           |
| Icons           | Material Symbols Rounded                          |
| Easing          | `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`      |
