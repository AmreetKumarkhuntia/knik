---
name: knik-design
description: Use this skill to generate well-branded interfaces and assets for KNIK, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the KNIK multi-interface AI assistant (chat, voice, workflows).
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, the cards under `preview/`, and the `ui_kits/web/` recreation of the KNIK web app).

If you are creating visual artifacts (slides, mocks, throwaway prototypes, marketing one-pagers, etc.), copy `colors_and_type.css` and `assets/` into your output directory and generate static HTML/JSX files that pull from those tokens. Always include the Material Symbols Outlined Google-Font link in `<head>` if you use icons.

If you are working on production code, you can copy the JSX components in `ui_kits/web/` as a starting point — they’re intentionally simple, prop-driven, and read every colour from CSS variables, so they translate cleanly into React / Tailwind / styled-components.

If the user invokes this skill without any other guidance, ask them what they want to build or design — chat surface? a slide? a marketing landing? a workflow node? — and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

Key constants to remember:

- **Dark-first.** Render every output on `--bg-base` (#07090D). Light mode is a fallback, not the canvas.
- **Primary accent is cyan/teal** (`--aurora-400` = #00D9F4). Use sparingly, mostly for the _one_ primary action on a screen.
- **Type** is Inter Variable (display 600 / body 400) with **tight tracking** (`-0.025em` for headings, `-0.04em` for display). Mono is JetBrains Mono.
- **Easing** is `cubic-bezier(0.16, 1, 0.3, 1)`. Use springs only for chat / node enter-exit.
- **Iconography** is Material Symbols Outlined (wght 400 / opsz 24). Don’t hand-draw SVG icons unless the system requires it.
- **Hairline borders, modest radii.** No big drop shadows, no gradient-purple cards, no emoji.
