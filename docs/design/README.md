# KNIK Design System

> **Multi-interface AI assistant with voice, workflows, and tooling.**
> Dark, fast, cyan-on-ink.

KNIK is a multi-modal AI assistant. The product surfaces a chat thread, a DAG-based workflow builder, scheduled jobs, and a Kokoro-82M TTS engine across four interfaces — GUI (Tk), Console, Web (React + FastAPI), and Electron — backed by 7 AI providers and 31 MCP tools. This design system captures the visual + interaction language of the **Web/Electron** surface (the canonical product UI) and packages it so designers can spin up KNIK-branded mocks, prototypes, slides, and production code.

## Sources used to build this system

- **GitHub** — [`AmreetKumarkhuntia/knik`](https://github.com/AmreetKumarkhuntia/knik) — primary source-of-truth. Code lives under `src/apps/web/frontend/`.
  - `src/apps/web/frontend/src/index.css` — root CSS variables (dark + light)
  - `src/apps/web/frontend/src/lib/constants/themes.ts` — theme presets (purple / blue / teal)
  - `src/apps/web/frontend/src/lib/constants/variants.ts` — button / size variants
  - `src/apps/web/frontend/src/lib/components/*` — atomic UI primitives
  - `src/apps/web/frontend/src/lib/sections/*` — composed screens (Sidebar, ChatPanel, WorkflowHub, …)
- **README** — KNIK is _“Multi-Interface AI Assistant with TTS”_, built on **Kokoro-82M**, exposing 9 voices, 10 languages, 31 MCP tools across 7 categories, DAG workflows, conversation history.

Explore the repo above for deeper component code — this design system is a **distillation** of it, lightly recoloured to lean into the cyan/teal aurora that the user asked for as the new primary accent.

---

## Brand at a glance

|                    |                                                                 |
| ------------------ | --------------------------------------------------------------- |
| **Name**           | KNIK                                                            |
| **Product**        | Multi-interface AI assistant (chat, voice, workflows)           |
| **Personality**    | Technical, fast, dark, future-leaning. _Linear-meets-terminal._ |
| **Primary accent** | `#00D9F4` (KNIK cyan / aurora)                                  |
| **Secondary**      | `#14B8A6` deep teal · `#8B5CF6` violet (legacy)                 |
| **Base**           | Ink black `#07090D`                                             |
| **Type**           | Inter Variable + JetBrains Mono                                 |
| **Icon system**    | Material Symbols Outlined (300-wght)                            |
| **Density**        | Compact, IDE-adjacent. Generous radii, hairline borders.        |

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

KNIK’s look is **dark IDE plus aurora glow**. Imagine VSCode at midnight with a cyan particle accelerator humming in the corner.

### Color

- **Dark-first.** The light theme exists (because Electron users), but every screenshot, every marketing surface, and every brand asset is rendered on `#07090D` ink black with a faint blue undertone.
- **One accent, two siblings.** The aurora cyan (`#00D9F4`) is the only colour that should ever feel **bright**. Teal (`#14B8A6`) and violet (`#8B5CF6`) sit beside it for graph nodes and legacy theme presets — they should never **outshine** the primary.
- **Soft accent fills.** Buttons and active states use `rgba(0,217,244,0.12)` over the accent, not solid blocks — keeps the UI feeling like a glass overlay.
- **Semantic always borrowed from Tailwind.** Success `#10B981`, warning `#F59E0B`, danger `#EF4444`, info `#3B82F6`. These are recognisable to engineers, which is the audience.

### Backgrounds

- Page surface uses a **soft mesh gradient** — `radial-gradient` plumes of cyan top-left and teal bottom-right at very low opacity. Slow `animate-blob` motion (10s loop).
- The workflow canvas uses a **dotted / lined grid** at 20–40px pitch with `rgba(255,255,255,0.05–0.08)` lines.
- Glass surfaces (sidebar, top bar, modals) are `rgba(15,20,28,0.66)` with `backdrop-filter: blur(20px) saturate(140%)`.
- **No** stock photos, no hand-drawn illustrations, no organic shapes. Imagery is graph nodes, terminal traces, and waveform visualisations.

### Typography

- **Inter Variable** is the workhorse, used for everything from `11px` micro labels to `88px` display headings.
- Display & headings use **tightened tracking** (`-0.025em` to `-0.04em`) to match the Linear / Vercel / Stripe feel.
- Body copy at **15px / 1.5** for screens, **13px** for dense table rows.
- Mono is **JetBrains Mono** for code, model names, IDs, durations (`12.4s`), and TTS voice tokens (`af_heart`).
- Numbers use **tabular figures** in tables (`font-variant-numeric: tabular-nums`).

### Animation

- Easing: a single curve does most of the work — `cubic-bezier(0.16, 1, 0.3, 1)` (Linear-style snap, AKA `ease-out-expo`).
- Spring is reserved for chat messages and node enter/exit — `framer-motion` `{ stiffness: 300, damping: 25 }`.
- **Stagger** children by 100ms on lists; never animate more than 12 items.
- Page transitions: 200ms fade + 8px y-offset.
- Workflow edge dashes animate `stroke-dashoffset: -20` over 1s linear.
- Background blobs translate 10s ease-in-out, offset by 2s / 4s siblings.
- **Hover** scales by 1.05 on cards, 1.1 on icon buttons. Never above 1.1.
- **Press** scales to 0.95 / 0.9.

### States

| State                  | What changes                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Hover (filled btn)     | `background-color` lifts to `--primary-hover` + soft `box-shadow` cyan glow           |
| Hover (ghost btn)      | `background-color` -> `rgba(255,255,255,0.06)`, no scale                              |
| Hover (card)           | `border-color` shifts to `--primary` + 1px cyan glow + `translateY(-2px)`             |
| Focus                  | 2px ring `rgba(0,217,244,0.30)` outside, never inside the input                       |
| Pressed                | `scale(0.97)` + nothing else — never go dark                                          |
| Disabled               | `opacity: 0.5`, `cursor: not-allowed`. No greyscale filter.                           |
| Loading                | Replace label with a spinning circle (`border-2 border-current border-t-transparent`) |
| Selected (sidebar nav) | `bg: primary-soft`, `text: primary`                                                   |

### Borders & dividers

- **Hairline borders are the rule.** `1px solid rgba(255,255,255,0.10)` everywhere. The system has three depths only (`--border-1/2/3`).
- Border radius scale is **modest** — `6` (badges), `8` (buttons), `12` (cards), `16` (modals). No fully-rounded UI except pills/avatars.
- Dividers in tables use `border-bottom` of the hairline; never thicker.

### Shadows & elevation

- KNIK does **not** use heavy drop-shadows.
- Three shadow tokens only:
  - `--shadow-1` — sticky bars, raised buttons.
  - `--shadow-2` — popovers, cards on hover.
  - `--shadow-3` — modals, fullscreen sheets.
- A separate `--glow-primary` exists for **glow rings** around the primary action (Send, Create, Confirm).
- **Inner highlight** (top-edge `inset 1px rgba(255,255,255,0.04)`) appears on every raised surface to mimic OLED bezel lift.

### Transparency, blur, glass

- Blur is **structural**, not decorative — it’s reserved for the sidebar (`backdrop-blur-3xl`), the top bar, modals, and the chat input panel. Everywhere else uses solid surface tokens.
- Translucency uses **two opacity bands**: 10% (faint fill) and 60–70% (glass). Avoid in-between values.

### Cards

- Default: `bg-surface-2`, `border-1px`, `radius-12`. No shadow.
- Hover: cyan border + lift, no shadow.
- Glass card: same shape but with `--bg-glass` + blur — used for popovers and metric tiles.
- **Never** a left-border accent stripe. KNIK cards lift via border + glow.

### Layout rules

- Sidebar is **fixed left**, 80px collapsed, 320px expanded (animates on hover with `framer-motion` spring).
- Top bar is **80px** tall, sticky, glass.
- Content max-width is `1280px` for tables/dashboards, `768px` for chat (`max-w-3xl`), no max for the workflow canvas.
- Page padding is `32–48px` desktop, `16px` mobile.
- Workflow canvas runs **full bleed**, edge-to-edge.
- 8-pt grid; 4-pt sub-grid for icons and badges.

### Iconography (see also: ICONOGRAPHY)

- **Material Symbols Outlined** at `wght 400` / `opsz 24` is the canonical icon set. Loaded from Google Fonts on every shell page.
- Custom strokes (Menu, Play, Pause, Close, Trash, Settings) live in `src/lib/components/icons/Icons.tsx` for cases where the symbol font hasn’t loaded yet — 24×24, 2px stroke, `currentColor`.

### Imagery

- KNIK is a **terminal-flavoured** product. No photography. No people. No hands.
- When marketing surfaces need a hero, use **graph snapshots** (workflow nodes with animated edges) or **waveform/audio renders** (TTS scrubbers, level meters).
- All imagery sits on the ink-black base and **never** uses outer drop-shadows.

### Motion / vibe of brand colour

- Imagery is **cool** — cyan-to-teal-to-violet, never warm.
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
- **Primary accent shift:** the production app defaults to **violet `#8B5CF6`** as primary, with theme presets for blue/teal. Per the brief, this design system **promotes the cyan/teal aurora to primary** and treats violet as a legacy/optional accent. All UI kit recreations show the cyan variant.
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
- `components-message-input` — glass composer (attach / mic / send)
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
