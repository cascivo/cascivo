# v5 Master Plan — Outstanding by Design

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-11-v5-tranche-1.md` … `2026-06-11-v5-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Execute `docs/ROADMAP-V5.md` — design-language refresh (sharp & quiet), active-state
redesign (no left borders), input adornments, selectable cards, Storybook overhaul, docs/landing
dogfooding the v4 shell.

**Architecture:** Tokens-first. T1 changes only CSS custom properties (tokens + themes), so most
of the visual shift costs zero component edits. T2 rewrites the seven left-border components'
CSS. T3 adds component capability (new TSX). T4–T5 are app-level. T6 regenerates baselines and
verifies the DoD. Visual snapshots are intentionally broken from T1 until T6 — do not "fix" them
mid-stream (decision 7).

**Tech stack:** unchanged — vp (vite+), pnpm, signals (`@cascade-ui/core`), CSS modules with
`@layer cascade.component`, oklch colors, registry/llms/readme/schema generators, Playwright.

---

## Research findings (ground truth for all tranches)

### Current state (verified 2026-06-11)

**Left-border state indicators (the cliché to remove):**

| Component                     | File                                                          | Rule                                              | Width |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------- | ----- |
| Alert                         | `packages/components/src/alert/alert.module.css:7,13-31`      | `border-inline-start-width: 3px` + variant colors | 3px   |
| Toast                         | `packages/components/src/toast/toast.module.css:26,51-59`     | same pattern                                      | 3px   |
| SideNav                       | `packages/components/src/side-nav/side-nav.module.css:93,115` | `2px solid transparent` → accent when active      | 2px   |
| ShellHeader `.navLink`        | `shell-header.module.css:100,116`                             | `3px solid transparent` → accent                  | 3px   |
| ShellHeader `.navMenuTrigger` | `shell-header.module.css:135,154`                             | same                                              | 3px   |
| ShellHeader `.navMenuItem`    | `shell-header.module.css:206,217`                             | same                                              | 3px   |
| Switcher                      | `packages/components/src/switcher/switcher.module.css:20,36`  | `2px solid transparent` → accent                  | 2px   |

Structural 1px `border-inline-start` (KEEP): number-input stepper divider, header-panel edge,
sheet edge.

**Radius tokens** (`packages/tokens/src/index.css:124-137`): primitives none/sm 4px/md 6px/
lg 8px/xl 12px/2xl 16px/full + semantic `--cascivo-radius-base: 0.375rem`,
`control = base`, `surface = base*2`, `indicator = base/2`. Theme overrides: light base
**0.625rem (10px)**, card `*1.6` (16px) — the "too round" culprit. Dark base 10px but
button/input forced to 4px. Warm base 8px, card 12px. Flat all 0. Minimal base 12px, surface 20px.
Component CSS over-uses primitives directly: 34× `--cascivo-radius-sm`, 16× `radius-md` —
bypassing the semantic layer, so theme radius knobs don't fully work today.

**Shadows** (`packages/tokens/src/index.css:139-144`): xs→xl five-step. Used broadly.

**Color**: accent = blue `oklch(0.623 0.214 250)` light / `oklch(0.65 0.2 250)` dark. There is no
separate primary token; Button primary uses accent. Dark borders are solid grays.

**Card** (`packages/components/src/card/`): variants default/outlined/elevated, padding
none/sm/md/lg, sub-components CardHeader/Title/Content/Footer. No selection capability.

**Input** (`packages/components/src/input/`): label/hint/error/size only, bare `<input>`. No icon
support. **InputGroup** (`packages/components/src/input-group/`): `prefix`/`suffix` ReactNode
rendered as _boxed addons_ (bordered, bg-subtle, outside the field) — not inline icons.

**Storybook** (`apps/storybook/`, SB 10.4.2, addon-a11y only):

- Theme switching: custom `withTheme` decorator (`.storybook/preview.tsx:19-40`) wraps stories in
  `<div data-theme=…>`. Two defects: (a) Popover-API/top-layer elements (Menu, Tooltip, Modal,
  HeaderPanel…) escape the wrapper → unthemed; (b) document `<html>/<body>` never themed. Themes
  CSS itself loads fine (each theme `@import`s `@cascade-ui/tokens`).
- Layout: global `layout: 'fullscreen'` + decorator padding — full-width inputs.
- Grouping: only 7/63 stories have `title: 'Overlay/…'`; 56 are ungrouped root entries.
- Charts: zero stories; `@cascade-ui/charts` not a storybook dependency. 16 charts exist:
  area-chart, bar-chart, boxplot, bubble-chart, bullet, combo-chart, heatmap, histogram, kpi,
  line-chart, meter, pie-chart, radar, scatter-chart, sparkline, treemap.

**Docs** (`apps/docs/`, Preact + preact-iso, React components via preact/compat alias in
`vite.config.ts:11-23`):

- Sidebar/headers are hand-rolled HTML/CSS in `src/Layout.tsx:33-97` (not the library's SideNav).
- Nav from `src/nav.ts` (registry-driven, grouped by category, 5 categories shown, charts/layouts
  excluded). Theme on `document.documentElement` (`App.tsx`).
- Playwright: `test/visual.spec.ts` — 95 components × 3 themes screenshots of `.preview`;
  `test/perf.spec.ts` — DataTable budgets. Config: 900×700, 3% diff tolerance, `vp preview` :4173.

**Landing** (`apps/landing/`, native React): `sections/ComponentGrid.tsx:26-145` hardcodes 20
tiles, headline literally says "All 20 components, three themes" — stale (95 entries, 5 themes).

### External research (2026 state of the art)

- **shadcn/ui new-york**: radius one-knob `--radius: 0.625rem` with multiplier scale
  (`sm = *0.6` ≈ 6px for controls); monochrome primary `oklch(0.205 0 0)`; dark borders
  `oklch(1 0 0 / 10%)`, inputs 15%; shadows ≈ only `shadow-xs` on controls; focus =
  3px ring at 50% ring-color + border recolor (note: 50% on white fails 3:1 — use stronger);
  14px/medium typography.
- **Linear**: 2–6px radii; 1px inset box-shadow borders; layered micro-shadows on chrome, one
  `0 4px 32px` soft shadow on overlays; Inter at ~510/590 weights; active nav = translucent bg
  tint + full-contrast text, no bars.
- **Vercel Geist**: 6px radius dominates (12px modals/menus); 10-step gray scale, steps 1-3 bg /
  4-6 borders / 9-10 text; "favor the lowest elevation that reads as elevated".
- **Radix Themes**: radius-factor variable scales 6 steps (3/4/6/8/12/16px).
- **Carbon v11**: selectable tiles now use persistent 1px border + always-visible radio/checkbox
  glyph (not hover-revealed); notifications still use the 3px left border (the look we're leaving).
- **Active-state patterns**: shadcn sidebar = `bg-sidebar-accent + font-medium` pill; Vercel
  top-nav = 2px bottom underline + animated hover pill; Radix TabNav = 2px accent underline;
  alerts without left border = full 1px border, colored icon + title, clean bg (shadcn/Geist).
- **Input adornments**: modern shape is composition — shadcn `InputGroup > InputGroupAddon
(align inline-start/inline-end)`, Radix `TextField.Slot side`. Props-based (`startAdornment`)
  survives only in MUI.
- **Selectable cards**: hidden native input inside a label-styled card (Ark/Carbon) or Radix
  RadioGroup + `sr-only` item; selected = border color/weight + subtle tint; control glyph stays
  visible; `role=radiogroup` + arrow keys for single-select.
- **Storybook theming**: `@storybook/addon-themes` → `withThemeByDataAttribute({ themes,
defaultTheme, attributeName: 'data-theme', parentSelector: 'html' })`.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                     | Rationale                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Radius one-knob: semantic tokens derive from `--cascivo-radius-base` via multipliers; component CSS migrates off primitive radius tokens onto semantic ones                                                                                  | Makes the theme radius knob actually work (34 hard-wired `radius-sm` uses today); matches shadcn/Radix |
| 2   | Light/dark `--cascivo-radius-base: 0.375rem` (6px controls), card ≈ 10px, modal 12px. Warm stays rounder (base 8px). Flat 0, Minimal unchanged                                                                                               | The "too rounded" fix with theme character preserved                                                   |
| 3   | New `--cascivo-color-primary` / `--cascivo-color-primary-fg` semantic pair; Button primary + primary-actions consume it. Light: near-black; dark: near-white; warm: warm accent. `--cascivo-color-accent` keeps focus/links/active-tint/info | Monochrome-primary modern look without breaking accent-dependent components                            |
| 4   | Dark theme borders → alpha hairlines (`oklch(1 0 0 / 10%)`, strong 16%)                                                                                                                                                                      | shadcn/Linear dark-mode signature                                                                      |
| 5   | Shadow rationing: surfaces ≤ xs; new `--cascivo-shadow-overlay` (one soft large shadow) for all floating layers; elevated card keeps a restrained md                                                                                         | "lowest elevation that reads as elevated" (Geist)                                                      |
| 6   | Focus ring: `0 0 0 3px color-mix(in oklch, var(--cascivo-color-accent) 55%, transparent)` + border-color recolor on the control                                                                                                              | Soft halo, passes 3:1 unlike shadcn's 50%                                                              |
| 7   | Active states: nav/list = bg-tint + font-medium (token `--cascivo-color-active-bg`); horizontal header nav = 2px **bottom** underline; alerts/toasts = full hairline + colored icon/title + 6% tinted bg                                     | Per-context pattern palette, no bars                                                                   |
| 8   | Input adornments via composition: new `InputGroupAddon` (`align`) child of existing `InputGroup`; boxed `prefix`/`suffix` props stay for back-compat                                                                                         | shadcn-familiar; zero breaking change                                                                  |
| 9   | Selectable cards = new components `RadioCardGroup`/`RadioCard`/`CheckboxCard` (not a Card prop): hidden native inputs, visible glyph, group manages name/value                                                                               | Form semantics + a11y come free; Card stays presentational                                             |
| 10  | Storybook theming replaced wholesale by addon-themes with `parentSelector: 'html'`; custom side-by-side toolbar item dropped (deferred)                                                                                                      | Fixes top-layer popovers; standard tooling                                                             |
| 11  | Storybook default `layout: 'centered'`; shared `widthFor` decorator caps form-control stories at 24rem; shell/page stories opt into `fullscreen`                                                                                             | Realistic widths                                                                                       |
| 12  | One taxonomy: registry `meta.category` → Storybook title prefix and docs sidebar groups. Shell family gets `Shell/` prefix in Storybook (still `navigation` in registry)                                                                     | "Same grouping on docs and landing page"                                                               |
| 13  | Landing curated (12 tiles + live registry count); docs stay complete                                                                                                                                                                         | Decision 6 in roadmap; flagged as assumption                                                           |
| 14  | Visual baselines regenerate **once**, in T6, with human review                                                                                                                                                                               | Avoid churning 285 PNGs every tranche                                                                  |

## Tranche map

| Tranche | File                         | Contents                                                                                                                            | Risk                                       |
| ------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| T1      | `2026-06-11-v5-tranche-1.md` | Tokens + themes: radius knob, primary split, alpha borders, shadow rationing, focus ring, semantic-token migration in component CSS | Medium (visual blast radius, mechanical)   |
| T2      | `2026-06-11-v5-tranche-2.md` | Active-state redesign: Alert, Toast, SideNav, Switcher, ShellHeader (3 elements)                                                    | Low (CSS only, tests assert data-attrs)    |
| T3      | `2026-06-11-v5-tranche-3.md` | InputGroupAddon; RadioCardGroup/RadioCard/CheckboxCard + meta/registry/stories/docs                                                 | Medium (new API surface)                   |
| T4      | `2026-06-11-v5-tranche-4.md` | Storybook: addon-themes, layout/widths, grouping all stories, 16 chart stories                                                      | Low                                        |
| T5      | `2026-06-11-v5-tranche-5.md` | Docs shell dogfood (ShellHeader+AppShell+SideNav), landing curation                                                                 | Medium (Preact compat, snapshot selectors) |
| T6      | `2026-06-11-v5-tranche-6.md` | Compliance audit, drift sweep, visual baseline regeneration + review, DoD verification                                              | Low                                        |

## Cross-cutting rules (every tranche)

1. **CLAUDE.md applies**: no `useState`/`useEffect`/`useContext`/`useReducer`/`useLayoutEffect`
   in components; signals only; visual states in CSS; i18n via `t(builtin.…)` with `labels`
   override; export new components from `packages/react/src/index.ts` AND
   `packages/components/package.json#exports`.
2. **Gate before committing** (from CLAUDE.md): `pnpm exec vp check` → `pnpm build` →
   `pnpm exec vp run -r check` → `pnpm test` → regenerate
   (`pnpm registry:generate && pnpm readme:generate && pnpm llms:generate && pnpm schema:generate`)
   → `pnpm exec vp check --fix` → `git diff --exit-code`. **Exception** (decision 14): Playwright
   visual specs are excluded from the gate in T1–T5; they regenerate in T6.
3. **Lint baseline is 10 warnings** (pre-existing, none in v4/v5 code). Do not add an 11th.
4. **Components dist rebuilds**: after changing `packages/components`, rebuild
   `@cascade-ui/react` (`pnpm --filter @cascade-ui/react build`) and, if icons changed,
   `@cascade-ui/icons` — layouts/storybook consume the dist.
5. **New registry entries** need: `<name>.meta.ts`, package.json export, react re-export,
   Storybook story, docs demo entry (`apps/docs/src/demos.tsx`), regeneration commit.
6. **Branch**: create `feature/v5-design` off `main` (after v4 merges) or off `feature/v4-shell`
   if v4 is still in review — record which in the first commit message.

## Edge cases / risks registry

1. **Radius migration breaks pill shapes**: `--cascivo-radius-full` usages (14×) are
   intentional pills (Badge, Avatar, Toggle thumb) — do NOT migrate those to semantic tokens.
2. **Dark alpha borders on top of images/charts** may look weaker — check chart frames in dark
   theme during T6 review.
3. **`color-mix` in `@layer`**: supported in all target browsers (last 2 Chrome/FF/Safari) — no
   fallback needed, but keep the pattern `color-mix(in oklch, …)` consistent.
4. **ShellHeader underline + 3rem fixed height**: the 2px underline must be inset
   (`box-shadow: inset 0 -2px 0` or absolutely-positioned `::after`), NOT a border that changes
   layout height. Tests assert `data-state='active'` so CSS swaps are test-safe.
5. **SideNav rail mode**: the active bg-tint pill must also look right at rail width (icon-only,
   square-ish pill) — verify the `data-rail` styles in T2.
6. **InputGroupAddon + existing prefix/suffix**: both may appear in one group; addon (inside
   field) and prefix (boxed outside) must compose without double borders.
7. **RadioCard arrow keys**: native radios in the same `name` give arrow-key roving for free —
   use real `<input type="radio">`, don't re-implement.
8. **Preact docs app**: ShellHeader/SideNav/HeaderPanel run on signals + popover API — already
   proven in `demos.tsx`. But `AppShell` imports `@cascade-ui/storage` (localStorage) — SSR-safe,
   fine in docs. The docs Layout replacement must keep theme switching on `documentElement`.
9. **Visual spec selector**: `test/visual.spec.ts` screenshots `.preview` — the docs Layout
   rewrite must keep a `.preview` element on component pages or update the spec in the same
   commit.
10. **Storybook `parentSelector: 'html'`**: needs `body { background: var(--cascivo-color-bg) }`
    via `.storybook/preview-head.html` (or a global style import) or dark themes show a white
    canvas.
11. **`@storybook/addon-themes` version** must match SB 10.4.2 — install via
    `npx storybook add @storybook/addon-themes` so the CLI picks the right version.
12. **Landing tile drift**: import the registry count (`registryJson.components.length`) instead
    of hardcoding "95" — the number self-updates.
