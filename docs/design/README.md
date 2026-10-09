# KNIK Design System

> **Multi-interface AI assistant with voice, workflows, and tooling.**
> Dark, fast, teal-on-graphite.

KNIK is a multi-modal AI assistant. The product surfaces a chat thread, a DAG-based workflow builder, scheduled jobs, and a Kokoro-82M TTS engine across four interfaces — GUI (Tk), Console, Web (React + FastAPI), and Electron — backed by 7 AI providers and 31 MCP tools. This design system captures the visual + interaction language of the **Web/Electron** surface (the canonical product UI) and packages it so designers can spin up KNIK-branded mocks, prototypes, slides, and production code.

## Sources used to build this system

- **GitHub** — [`AmreetKumarkhuntia/knik`](https://github.com/AmreetKumarkhuntia/knik) — primary source-of-truth. Code lives under `src/apps/web/frontend/`.
  - `src/apps/web/frontend/src/styles/tokens.css` — root CSS variables (dark + light)
  - `src/apps/web/frontend/src/lib/constants/themes.ts` — default mode and graph/canvas overlay colours (no theme presets)
  - `src/apps/web/frontend/src/lib/constants/variants.ts` — button / size variants
  - `src/apps/web/frontend/src/lib/components/*` — atomic UI primitives
  - `src/apps/web/frontend/src/lib/sections/*` — composed screens (Sidebar, ChatPanel, WorkflowHub, …)
- **README** — KNIK is _“Multi-Interface AI Assistant with TTS”_, built on **Kokoro-82M**, exposing 9 voices, 10 languages, 31 MCP tools across 7 categories, DAG workflows, conversation history.

Explore the repo above for deeper component code — this design system is a **distillation** of it. The palette, type scale and surface rules follow the approved compact workspace redesign in [`docs/plan/07-frontend-component-consolidation.md`](../plan/07-frontend-component-consolidation.md); `colors_and_type.css` mirrors `src/apps/web/frontend/src/styles/tokens.css`.

---

## Brand at a glance

|                    |                                                                 |
| ------------------ | --------------------------------------------------------------- |
| **Name**           | KNIK                                                            |
| **Product**        | Multi-interface AI assistant (chat, voice, workflows)           |
| **Personality**    | Technical, fast, dark, future-leaning. _Linear-meets-terminal._ |
| **Primary accent** | `#55B8AC` dark · `#147D73` light (KNIK teal / aurora)           |
| **Secondary**      | `#348F85` deep teal · `#8B5CF6` violet (legacy)                 |
| **Base**           | Graphite `#18191B` dark · `#F7F8F8` light                       |
| **Type**           | Inter Variable + JetBrains Mono                                 |
| **Icon system**    | Material Symbols Outlined (300-wght)                            |
| **Density**        | Compact, IDE-adjacent. Modest radii, hairline borders.          |

---

## CONTENT FUNDAMENTALS

### Voice

KNIK speaks **plain, technical, second-person**. It addresses the user directly (“you”), names the product as “KNIK” or “Knik AI”, and references its own capabilities with neutral, declarative copy — never marketing fluff. Tone is closer to a CLI manpage than a chatbot. There is **no first-person “I”** in product chrome.

### Casing

- **Sentence case** for almost everything: page titles (`Workflow Hub`), buttons (`Create workflow`, `New chat`), menu items.
- **UPPERCASE** sparingly, only for high-density labels and badges: `PRO`, `ADMIN`, `BASIC`, eyebrows above headings.
- Code identifiers / model names stay as written: `gemini-1.5-flash`, `af_heart`, `am_michael`.

### Punctuation & vibe

- Periods generally **omitted** at the end of UI strings (`Search workflows…`, `No history yet`).
- Ellipsis (`…`) reserved for inputs that lead somewhere (`Search…`, `Type your message…`).
- Em-dash / en-dash welcome in long-form copy; never in micro-copy.
- Numbers are **always localized** (`12,847` not `12847`).
- Time is relative-first: `Today`, `Yesterday`, `Mar 25`.

### Examples (real strings, copied from the product)

| Where                | Copy                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Welcome hero         | _“How can I help you today?”_                                                              |
| Welcome sub          | _“Knik AI can assist with coding, content generation, and complex workflows.”_             |
| Empty (no history)   | _Title_: “No history yet” · _Description_: “Start a conversation to see it here”           |
| Empty (no workflows) | _Title_: “No workflows found” · _Description_: “Create your first workflow to get started” |
| Input placeholder    | _“Type your message… (Shift+Enter for new line)”_                                          |
| Suggestion cards     | _“Refactor my Python script”_ · _“Optimize performance and readability”_                   |
| Status badges        | `Pending`, `Running`, `Success`, `Failed`                                                  |
| Section header       | _“Recent Conversations”_, _“Recent Executions”_                                            |

### Pronouns & tone rules

- ✅ **you / your** — addressing the user.
- ✅ **KNIK / Knik AI** — referring to the product.
- ❌ **we / our** — never in product chrome (fine in marketing).
- ❌ **I / me / mine** — never. KNIK is a tool, not a personality.

### Emoji

**Avoid.** The empty-state default uses a tiny 📜 in source as a fallback glyph, but every real surface uses a Material Symbol instead. No emoji in marketing copy, buttons, or chat affordances.

### Density

Copy is **short**. The longest sentence in product chrome is the welcome sub-headline (12 words). Form descriptions, helper text, and tooltips all clock under 80 characters when possible.

---

## VISUAL FOUNDATIONS

KNIK’s look is a **compact dark IDE**: solid graphite surfaces, hairline dividers and one teal accent. No ambient glow, glass or decorative gradients.

### Color

- **Dark-first, fixed palette.** Dark mode renders on `#18191B` graphite with `#202225` surfaces; light mode on `#F7F8F8` with `#FFFFFF` surfaces. There are no accent, density or radius presets — only the light/dark mode switch.
- **One accent.** The aurora teal (`#55B8AC` dark, `#147D73` light) is the only colour that should ever feel **bright**. Deep teal (`#348F85`) and violet (`#8B5CF6`) sit beside it for graph nodes and legacy accents — they should never **outshine** the primary.
- **Soft accent fills.** Selected and active states use `--primary-soft` (`color-mix` of the primary at 12% dark / 9% light), not solid blocks.
- **Semantic colours are Tailwind-derived, tuned for contrast.** Dark: success `#10B981`, warning `#F59E0B`, danger `#F87171`, info `#60A5FA`. Light: `#167348`, `#895600`, `#B42F2F`, `#285EAF`. Tints (`--*-bg`) are 12%. Status text must stay at 4.5:1 on `--bg-surface` and `--bg-surface-2`, including over its tint; `src/apps/web/frontend/src/tests/styles/token-contrast.test.ts` enforces this.

### Backgrounds

- Page surface is solid `--bg-base`. No mesh gradients and no animated background blobs.
- The workflow canvas uses a **dotted / lined grid** at 20–40px pitch with `rgba(255,255,255,0.05–0.08)` lines.
- Sidebar, top bar and modals use solid surface tokens (`--bg-glass` resolves to `--bg-surface`; `--blur-glass` is `none`).
- **No** stock photos, no hand-drawn illustrations, no organic shapes. Imagery is graph nodes, terminal traces, and waveform visualisations.

### Typography

- **Inter Variable** is the workhorse, used for everything from `12px` micro labels to `88px` display headings.
- Display & headings use **tightened tracking** (`-0.025em` to `-0.04em`) to match the Linear / Vercel / Stripe feel.
- Interface text at **14px / 1.5**, chat text at **16px**, **13px** for dense table rows. Page titles are **24px**, section titles **16px**.
- Mono is **JetBrains Mono** for code, model names, IDs, durations (`12.4s`), and TTS voice tokens (`af_heart`).
- Numbers use **tabular figures** in tables (`font-variant-numeric: tabular-nums`).

### Animation

- Easing: a single curve does most of the work — `cubic-bezier(0.16, 1, 0.3, 1)` (Linear-style snap, AKA `ease-out-expo`).
- Spring is reserved for chat messages and node enter/exit — `framer-motion` `{ stiffness: 300, damping: 25 }`.
- **Stagger** children by 100ms on lists; never animate more than 12 items.
- Page transitions: 200ms fade + 8px y-offset.
- Workflow edge dashes animate `stroke-dashoffset: -20` over 1s linear.
- No ambient or repeated entrance motion. `prefers-reduced-motion: reduce` collapses CSS animations and transitions.
- **Hover** never scales cards; small round triggers (avatar, hamburger) may scale, never above 1.1.
- **Press** scales to 0.95 / 0.9.

### States

| State                  | What changes                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Hover (filled btn)     | `background-color` lifts to `--primary-hover`; no glow                                                           |
| Hover (ghost btn)      | `background-color` -> `--bg-surface-3`, text -> `--fg-1`, no scale                                               |
| Hover (card)           | Nothing changes: the border stays `--border-2`, no lift, no glow                                                 |
| Focus                  | 2px `--border-focus` (= `--primary`) ring outside; the chat composer only recolours its single border to `--acc` |
| Pressed                | `scale(0.97)` + nothing else — never go dark                                                                     |
| Disabled               | `opacity: 0.5`, `cursor: not-allowed`. No greyscale filter.                                                      |
| Loading                | Replace label with a spinning circle (`border-2 border-current border-t-transparent`)                            |
| Selected (sidebar nav) | `bg: --acc-soft`, `text: --acc-text` (`--primary-hover` in light mode for 4.5:1)                                 |

### Borders & dividers

- **Hairline borders are the rule.** `1px solid var(--border-2)` (`#363A40` dark, `#DCE1E5` light) everywhere. The system has three depths only (`--border-1/2/3`).
- `--border-3` (`#707881` dark, `#7C8791` light) also outlines form controls — inputs, checkbox boxes and the off switch track — and must keep **3:1** against the surfaces they sit on.
- Border radius scale is **modest** — `6` (controls, badges), `10` (cards, panels), `12` (composer, modals). No fully-rounded UI except pills/avatars.
- Dividers in tables use `border-bottom` of the hairline; never thicker.

### Shadows & elevation

- KNIK does **not** use heavy drop-shadows.
- Three shadow tokens only:
  - `--shadow-1` — `none`; sticky bars and buttons sit flat.
  - `--shadow-2` — popovers, toasts and the elevated card variant.
  - `--shadow-3` — modals, fullscreen sheets.
- `--glow-primary` and `--glow-teal` remain as tokens but resolve to `none`. There are no glow rings.
- **Inner highlight** (top-edge `inset 1px rgba(255,255,255,0.04)`) appears on every raised surface to mimic OLED bezel lift.

### Transparency, blur, glass

- **No blur, no glass.** Every surface, including the sidebar, top bar, modals and the chat composer, uses solid surface tokens (`--blur-glass: none`).
- Translucency is limited to soft fills: the accent at 9–18% (`--primary-soft`, `--primary-soft-2`) and 12% status tints. Write opacity variants as `color-mix()` (Tailwind 3 drops `/NN` modifiers on `var()` colours).

### Cards

- Default (`.knik-card`): `bg-surface`, 1px `--border-2`, `radius-10`. No shadow.
- Hover: no change — the border stays `--border-2`, no lift, no shadow.
- There is no glass card; popovers and metric tiles use the default card.
- **Never** a left-border accent stripe. KNIK cards separate via border, not glow.

### Layout rules

- Sidebar is **fixed left**, 232px expanded, 64px rail (768–1023px uses the rail; below 768px a left drawer).
- Header is **52px** tall, sticky, solid.
- Content max-width is `1280px` for tables/dashboards, `800px` for the chat transcript and composer, `760px` for settings content, no max for the workflow canvas.
- Page padding is `32–48px` desktop, `16px` mobile.
- Workflow canvas runs **full bleed**, edge-to-edge.
- 8-pt grid; 4-pt sub-grid for icons and badges.

### Iconography (see also: ICONOGRAPHY)

- **Material Symbols Outlined** at `wght 400` / `opsz 24` is the canonical icon set. Loaded from Google Fonts on every shell page.
- Custom strokes (Menu, Play, Pause, Close, Trash, Settings) live in `src/lib/components/icons/Icons.tsx` for cases where the symbol font hasn’t loaded yet — 24×24, 2px stroke, `currentColor`.

### Imagery

- KNIK is a **terminal-flavoured** product. No photography. No people. No hands.
- When marketing surfaces need a hero, use **graph snapshots** (workflow nodes with animated edges) or **waveform/audio renders** (TTS scrubbers, level meters).
- All imagery sits on the graphite base and **never** uses outer drop-shadows.

### Motion / vibe of brand colour

- Imagery is **cool** — teal-led, violet as the only secondary hue, never warm.
- Avoid sepia, B&W, grain, or filmic LUTs. KNIK is digital, sharp, lit-from-within.

---

## ICONOGRAPHY

### Primary: Material Symbols Outlined

KNIK ships with **Material Symbols Outlined** from Google Fonts, loaded with `wght: 400; FILL: 0; GRAD: 0; opsz: 24`. This is rendered as a font (`.material-symbols-outlined` class), used by the metric cards, sidebar (`Chat`, `AccountTree`, `SmartToy`, `AddComment`, `Delete`, `Settings`), and tables (`account_tree`, `edit`, `delete`, `bolt`, `check_circle`, `trending_up`).

```html
<!-- include this in <head> of every shell -->
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
/>

<!-- usage -->
<span class="material-symbols-outlined">account_tree</span>
```

### Secondary: MUI Icons (legacy)

The current React code also pulls **`@mui/icons-material`** for cases where Material Symbols is overkill (e.g. inside framer-motion buttons that need direct SVG). Examples in the codebase: `Delete`, `Settings`, `SmartToy`, `AddComment`, `Chat`, `AccountTree`, `AutoAwesome`, `AttachFile`, `Mic`, `Send`, `ContentCopy`, `ThumbUp`, `Refresh`, `Code`, `EditNote`, `BugReport`, `Description`.

When recreating screens, prefer the **Material Symbols Outlined** font (CDN, free, no JS) and reach for MUI icon components only when you need React-style props.

### Custom inline SVGs

For very early-render situations (before the font has loaded), KNIK keeps a small set of **inline 24×24 stroke icons** at `src/lib/components/icons/Icons.tsx`:
`MenuIcon`, `PlayIcon`, `PauseIcon`, `StopIcon`, `CloseIcon`, `TrashIcon`, `SettingsIcon`. All are 2px stroke, `currentColor`, `viewBox="0 0 24"`.

### Logo

A wordmark + glyph live in `assets/`:

- `assets/knik-logo.svg` — full wordmark with aurora-glow glyph (use on dark)
- `assets/knik-mark.svg` — square glyph only (favicon, sidebar collapsed, app icon)
- `assets/knik-mark-mono.svg` — monochrome mark (use on coloured backgrounds)

The glyph is a **stylised soundwave / signal** — a nod to the TTS heritage of the product (Kokoro-82M).

### Rules

- **Always 24×24** unless inside a button (then 20×20) or a metric card (then 28×28).
- **Stroke width 2** for inline SVGs; let Material Symbols handle its own weight axis.
- **`currentColor`** for all icon fills/strokes — they inherit the surrounding text colour.
- No emoji. No unicode glyphs as icons (the `📜` empty-state default is the only exception, and it’s designed to be replaced).

---

## File index

```
KNIK-Design-System/
├── README.md                  ← you are here
├── colors_and_type.css        ← CSS variables + type scale + primitives
├── SKILL.md                   ← Claude Skill entrypoint
│
├── assets/                    ← logos, marks, brand glyphs
│   ├── knik-logo.svg
│   ├── knik-mark.svg
│   └── knik-mark-mono.svg
│
├── preview/                   ← Design System tab cards (small previews)
│   ├── type-*.html              type-display, type-headings, type-body, type-mono
│   ├── colors-*.html            aurora, teal-violet, surfaces, foreground, semantic
│   ├── spacing-*.html           scale, radii, shadows, motion
│   ├── brand-*.html             logo, mesh-bg, iconography, surfaces
│   └── components-*.html        50+ component cards (see Component index below)
│
└── ui_kits/
    └── web/                   ← React/JSX recreation of the Web app
        ├── README.md
        ├── index.html         ← interactive shell (chat → workflows)
        ├── Sidebar.jsx
        ├── TopBar.jsx
        ├── ChatHome.jsx
        ├── ChatThread.jsx
        ├── InputPanel.jsx
        ├── SuggestionCards.jsx
        ├── WorkflowHub.jsx
        ├── WorkflowBuilder.jsx
        ├── MetricCard.jsx
        ├── StatusBadge.jsx
        ├── Button.jsx
        ├── Card.jsx
        └── icons.jsx          ← Material-Symbols helpers
```

---

## Substitutions & caveats

- **Fonts:** the upstream KNIK repo uses Inter loaded as a system fallback. This design system pulls **Inter Variable** from `rsms.me/inter` and **JetBrains Mono** from Google Fonts. If you want the exact same Inter that ships in production, drop a `.woff2` into `fonts/`.
- **Primary accent:** the production app uses the fixed teal palette above (no theme presets); violet is a legacy accent. Some `preview/` cards and `ui_kits/web/` recreations predate the redesign and still hard-code the earlier cyan (`#00D9F4`); `colors_and_type.css` is authoritative where they disagree.
- **Logos:** KNIK does not ship a public brand mark in the repo (`assets/icon.png` is referenced for Electron builds but isn’t in the open tree). The marks in `assets/` here are **brand-derived** from the in-product `SmartToy` + `AutoAwesome` motifs.

---

## Component index (preview cards)

Open the **Design System** tab to browse each card. They're grouped here by area:

**Flow / graph**

- `components-graph-pill-node` — start & end pill nodes
- `components-graph-card-node` — AI / TTS / action card nodes
- `components-graph-edges` — edit, success, running, failed, pending edge variants
- `components-graph-execution` — mid-run DAG with animated edges
- `components-workflow-nodes` — simplified node row used in mocks

**Data & analytics**

- `components-execution-timeline` — vertical step timeline + error block
- `components-data-charts` — sparkline · bar · donut composition
- `components-area-chart` — trend chart with legend
- `components-activity-heatmap` — day × hour activity grid
- `components-data-table` — sortable, checkable table with status pills
- `components-metric-cards` — three metric tiles
- `components-pagination` — numbered pagination

**Chat & content**

- `components-chat-bubbles` — user / assistant messages with actions
- `components-message-input` — composer (attach / mic / send)
- `components-suggestions` — welcome prompt cards
- `components-markdown` — headings, lists, code fence, quote
- `components-agent-thinking` — compaction divider · tool call · diff block
- `components-json-viewer` — Inputs / Outputs tabs with copy

**Product-specific (KNIK)**

- `components-tts-player` — Kokoro player with waveform
- `components-voice-picker` — 9-voice grid
- `components-date-cron-picker` — calendar + cron schedule preview
- `components-command-palette` — ⌘ K command launcher

**Foundations**

- `components-buttons` · `components-badges` · `components-toggles`
- `components-forms` · `components-controls` · `components-chips`
- `components-tabs` · `components-sidebar-nav` · `components-user-profile`
- `components-modal` · `components-confirm-dialog` · `components-empty-state`
- `components-toasts` · `components-tooltip-popover`
- `components-page-section-header` · `components-progress-loaders`

---

> **Next:** open the **Design System** tab to see the card index, or jump into `ui_kits/web/index.html` for an interactive recreation of the KNIK web app.
