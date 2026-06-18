# Theme Proposals — Expanding from 5 to 10 First-Party Themes

> Status: **proposal only — nothing implemented.** This document specifies five
> new themes plus the wiring each one requires. Implementation is a follow-up.

## Goal

Cascade ships 5 first-party themes today. The ask is to reach **10**, and to make
them differ on **form** (radius, shadows, borders, focus, density) as much as on
**color** — a theme is a complete visual personality, not a recolor.

## What exists today

| Theme     | Scheme | Radius base | Shadows        | Borders                  | Accent                   | Personality               |
| --------- | ------ | ----------- | -------------- | ------------------------ | ------------------------ | ------------------------- |
| `light`   | light  | 6px         | soft, rationed | neutral gray             | blue, monochrome primary | clean default             |
| `dark`    | dark   | 6px         | soft on dark   | translucent white        | blue                     | developer-cool, editorial |
| `warm`    | light  | 8px         | warm-tinted    | warm gray                | amber (colored fill)     | organic, approachable     |
| `flat`    | light  | **0px**     | **none**       | **heavy, high-contrast** | vivid green              | stark, bordered           |
| `minimal` | light  | **12px**    | very subtle    | near-invisible           | monochrome               | soft, quiet               |

The existing five already span a wide form range (0 → 12px radius, none → soft
shadows, invisible → heavy borders). The five new themes are chosen to fill the
**gaps** in that space rather than add more recolors.

## The knobs a theme controls

Every theme overrides the semantic layer. The available levers:

- **Color**: surfaces, text, accent/primary, status colors, chart ramp.
- **Radius**: one knob — `--cascivo-radius-base` — the semantic scale derives from it.
- **Shadows**: `--cascivo-shadow-{xs,sm,md,overlay,lg}` — including non-standard
  forms like hard offset shadows (`Npx Npx 0 color`).
- **Borders**: `--cascivo-border-{subtle,default,strong}` width is fixed in
  components, but color/weight perception is driven by these tokens.
- **Focus ring**: `--cascivo-ring-{width,offset,color}` — thickness, offset, glow.
- **Color scheme**: `color-scheme: light | dark`.

> **Constraint — token parity.** `parity.test.ts` requires every theme to define
> the _exact same set_ of `--cascivo-*` keys. New themes must mirror the full token
> list of an existing theme (use `light.css` as the canonical template).

## Proposed five new themes

Chosen to balance the light/dark split and to occupy unused points in the
radius/shadow/border space.

| Theme       | Scheme | Radius          | Shadow signature              | Border                  | Accent            | Fills which gap                        |
| ----------- | ------ | --------------- | ----------------------------- | ----------------------- | ----------------- | -------------------------------------- |
| `midnight`  | dark   | 10px            | soft **colored glow**         | luminous, subtle        | violet/indigo     | premium dark (vs developer `dark`)     |
| `pastel`    | light  | **16px** (pill) | diffuse, soft, tinted         | very light              | candy pink + mint | playful / consumer                     |
| `brutalist` | light  | **0px**         | **hard offset** `4px 4px 0`   | **2px solid black**     | acid yellow       | bold editorial (vs flat's _no_ shadow) |
| `corporate` | light  | **2px**         | tight, minimal                | crisp cool hairline     | conservative blue | enterprise / data-dense (Carbon-like)  |
| `terminal`  | dark   | **0px**         | none / green glow on overlays | hairline phosphor green | phosphor green    | developer / CLI                        |
| `cyberpunk` | dark   | **0px**         | **hard offset + neon glow**   | thick neon magenta      | magenta + cyan    | brutalism × cyberpunk (added in v38)   |

Resulting radius spread across all 11: `0` (flat, brutalist, terminal, cyberpunk) ·
`2px` (corporate) · `6px` (light, dark) · `8px` (warm) · `10px` (midnight) · `12px`
(minimal) · `16px` (pastel). Scheme split: 7 light / 4 dark.

---

### 1. `midnight` — premium dark

Deep indigo-black surfaces, vibrant violet accent, soft colored glow. The
"luxury SaaS" dark theme, distinct from the cooler, flatter developer `dark`.

- `color-scheme: dark`
- Background `oklch(0.16 0.02 280)`, surface `oklch(0.2 0.025 280)`, raised `oklch(0.24 0.028 280)`
- Text `oklch(0.96 0.01 280)`, muted `oklch(0.68 0.02 285)`
- Accent `oklch(0.62 0.22 290)` (violet), hover darker, foreground white
- `--cascivo-radius-base: 0.625rem` (10px)
- Shadows: violet-tinted soft glow, e.g. overlay `0 8px 40px oklch(0.5 0.2 290 / 0.25)`
- Borders: subtle luminous `oklch(1 0 0 / 0.08–0.16)`
- Focus ring: wider violet halo (`--cascivo-ring-width: 3px`)

### 2. `pastel` — playful light

Soft candy palette, very rounded (pill controls, 16px cards), diffuse soft
shadows. Friendly/consumer personality.

- `color-scheme: light`
- Background `oklch(0.99 0.01 330)` (barely-pink white), surface soft tints
- Text `oklch(0.32 0.03 320)` (soft charcoal, **not** pure black — keeps the gentle feel)
- Accent `oklch(0.72 0.13 350)` (pink), secondary/info `oklch(0.78 0.1 165)` (mint)
- `--cascivo-radius-base: 1rem` (16px); badges + small controls read as pills
- Shadows: diffuse, low-opacity, slightly colored
- Borders: very light `oklch(0.93 0.02 330)`
- Focus ring: thick soft ring with offset (`width: 3px`, `offset: 2px`)
- **Contrast caveat**: soft charcoal text on tinted surfaces must still clear WCAG
  AA 4.5:1 — verify the `*-foreground` status tokens especially.

### 3. `brutalist` — bold editorial

Neo-brutalism: zero radius, thick black borders, and the signature **hard offset
drop shadow**. Differs from `flat` (which has _no_ shadow and thinner borders) by
the chunky offset shadow that makes elements pop off the page.

- `color-scheme: light`
- Background `oklch(0.97 0.02 95)` (cream), surface pure white
- Text pure black `oklch(0.1 0 0)`
- Accent acid yellow `oklch(0.88 0.19 105)` with **black** text-on-accent
- `--cascivo-radius-base: 0` everywhere
- Borders: `--cascivo-border-strong: oklch(0.1 0 0)` (black), weighted up
- Shadows: hard offset — `--cascivo-shadow-sm: 2px 2px 0 oklch(0.1 0 0)`,
  `md: 4px 4px 0 …`, overlay `6px 6px 0 …`. No blur.
- Focus ring: solid black, 3px, with offset
- **Font note**: brutalism often pairs with a mono/grotesk face. Font is currently
  a primitive token (`--cascivo-font-sans` in `tokens/index.css`, not themed). See
  "Open questions" — theming fonts requires adding the key to _all_ themes for parity.

### 4. `corporate` — enterprise / data-dense

Restrained, professional, Carbon-adjacent. Crisp 2px radius, conservative blue,
tight hairline borders, minimal shadows. Built for dashboards and data apps.

- `color-scheme: light`
- Background `oklch(0.99 0.003 250)` (cool white), surface `oklch(0.97 0.004 250)`
- Text `oklch(0.2 0.01 250)`, muted cool gray
- Accent `oklch(0.5 0.16 255)` (corporate blue), monochrome-leaning primary
- `--cascivo-radius-base: 0.125rem` (2px)
- Shadows: tight and minimal (`md: 0 1px 4px oklch(0 0 0 / 0.08)`)
- Borders: crisp cool hairlines `oklch(0.9 0.005 250)`
- Focus ring: 2px solid blue, **no offset** (Carbon-style inset focus)
- **Density note**: enterprise UIs are denser. Control heights are primitive
  tokens (`--cascivo-control-height-*`), not currently themed — true density would
  need the same parity treatment as fonts (see "Open questions").

### 5. `terminal` — developer / CLI

Phosphor green on near-black, monospace feel, zero radius, hairline green borders.
A second dark theme that's unmistakably different from `midnight` and `dark`.

- `color-scheme: dark`
- Background `oklch(0.17 0.01 150)` (green-tinted near-black), surface `oklch(0.21 0.012 150)`
- Text phosphor `oklch(0.9 0.06 150)`, muted dimmer green
- Accent bright phosphor `oklch(0.82 0.2 145)`, text-on-accent near-black
- `--cascivo-radius-base: 0`
- Borders: hairline green `oklch(0.4 0.08 150)`
- Shadows: none on surfaces; green glow on overlays (`0 0 0 1px oklch(0.82 0.2 145 / 0.3)`)
- Focus ring: green glow, 2px
- **Font note**: ideally monospace — same caveat as `brutalist`.

### 6. `cyberpunk` — brutalism × cyberpunk (added in v38)

Neo-brutalist structure (zero radius, thick borders, hard offset shadows) fused with a
dark cyberpunk palette: near-black blue-violet base, neon magenta primary, electric cyan
secondary, glow-tinted hard shadows. A third zero-radius dark theme, unmistakably louder
than `terminal` and `dark`.

- `color-scheme: dark`
- Background `oklch(0.16 0.03 285)` (near-black blue-violet), surface stepped lighter
- Text `oklch(0.95 0.03 320)`, muted `oklch(0.7 0.05 300)`, text-on-accent near-black
- Accent neon magenta `oklch(0.7 0.25 330)`; secondary/info electric cyan `oklch(0.78 0.16 200)`
- `--cascivo-radius-base: 0` everywhere
- Borders: thick neon magenta (`oklch(0.6 0.2 320 / 60%)`, strong brighter)
- Shadows: hard offset tinted with neon glow — `md: 4px 4px 0 oklch(0.7 0.25 330)`,
  overlay adds a cyan offset + soft magenta glow. No soft drop shadow.
- Focus ring: neon cyan, 3px, with offset
- **Animations (CSS-only, opt-in)**: three theme-scoped effects ship behind marker classes —
  `.cascivo-cyber-scanline` (CRT overlay), `.cascivo-cyber-glitch` (RGB-split on hover/focus),
  `.cascivo-cyber-flicker` (neon flicker). Each declares a static resting look first and is
  disabled under `prefers-reduced-motion`. They never fire unless a consumer opts in.
- **Font note**: inherits `--cascivo-font-sans` — same caveat as `brutalist`/`terminal`.
- **Motion note**: an ambient "hard-snap" motion-character override was considered but **not**
  shipped — `--cascivo-motion-*` is a global `@cascivo/tokens` contract, and per-theme motion
  tokens would force a parity change across all themes (see "Open questions"). The opt-in
  effects deliver the brutalist animation read without that.

---

## Implementation surface (per new theme)

Each theme is more than a CSS file — these are the touch points discovered in the
codebase. A new theme is "done" only when all are updated and the drift/parity
checks pass.

1. **`packages/themes/src/<name>.css`** — the theme, mirroring the full token set
   of `light.css` (parity requirement).
2. **`packages/themes/package.json`** — add `"./<name>": "./src/<name>.css"` to
   `exports`; update the `description` field (currently says "light, dark, warm").
3. **`packages/themes/src/parity.test.ts`** — add `<name>` to the `themeFiles` array.
4. **`apps/docs/src/theme.ts`** — extend the `Theme` union, the `THEMES` array, and
   the legacy-migration `if` check.
5. **`apps/docs/src/app.css`** — add `@import '@cascivo/themes/<name>';`.
6. **`apps/landing/src/theme.ts`** — add to the `THEMES` tuple.
7. **`apps/landing/src/landing.css`** — add the `@import`.
8. **`apps/landing/src/sections/ThemeDemo.tsx`** — add to its `THEMES` tuple.
9. **`apps/storybook/.storybook/preview.tsx`** — add the import and the
   `globalTypes` toolbar option.
10. **`packages/cli/src/commands/theme.ts`** — **already stale** (lists only
    `light, dark, warm`; missing `flat, minimal`). Update to the full set of 10.
11. **README / generated docs** — `readme.body.md`, theme README, and any
    `pnpm readme:generate` / `llms:generate` output. Run the drift check.

## Pre-merge gates (from CLAUDE.md)

- `pnpm exec vp check` (format + lint)
- `pnpm build`
- `pnpm exec vp run -r check` (type check)
- `pnpm test` — **includes the parity test**; the new theme must define the exact
  semantic token set.
- Drift: `pnpm registry:generate && pnpm readme:generate && pnpm llms:generate`
  then `git diff --exit-code`.
- **WCAG AA contrast** per the `cascade:create-theme` skill — verify text/surface
  and `*-foreground` status pairs clear 4.5:1 (most relevant for `pastel`).

## Open questions / decisions needed before implementing

1. **Font theming.** `brutalist`, `terminal`, and `cyberpunk` want non-default
   (mono/grotesk) fonts, but `--cascivo-font-sans`/`-mono` live in `tokens/index.css
   :root`, not in themes. Options: (a) keep fonts global, skip per-theme fonts; (b) add
   font tokens to _all 11_ themes to satisfy parity. Recommendation: **(a) for now** —
   convey personality through radius/shadow/border/color; revisit fonts as a
   separate "themeable typography" change.
2. **Density theming.** Same situation for `corporate`'s tighter density
   (`--cascivo-control-height-*` are primitives). Recommendation: defer; ship
   `corporate` at default density first.
3. **Two more dark themes** (`midnight`, `terminal`) brings the split to 7 light /
   3 dark. Acceptable, but if a more even split is wanted, one light proposal could
   become dark (e.g. a dark `pastel`/synthwave variant). Recommendation: keep as
   proposed — the three darks are clearly differentiated.
4. **Naming.** `corporate` could read as pejorative; alternatives: `slate`,
   `enterprise`, `carbon`. `terminal` alt: `matrix`, `phosphor`. Confirm before
   the names get baked into exports and the persisted-theme storage values.
5. **System-default mapping.** `apps/landing` picks `dark` vs `light` from
   `prefers-color-scheme`. The new dark themes don't change that default; confirm
   that's intended (they remain opt-in via the switcher).
