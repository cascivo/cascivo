# v38 — Cyberpunk Theme (Brutalism × Neon) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an eleventh first-party theme — `cyberpunk` — that fuses **neo-brutalist structure**
(zero radius, thick borders, hard offset shadows) with a **cyberpunk palette** (near-black base, neon
magenta + electric cyan accents, glow-tinted shadows) and a small set of **opt-in, CSS-only,
reduced-motion-safe animations** (hard snap, scanline, glitch, neon flicker). Register it **everywhere a
theme is registered** — themes package, both theme test lists, CLI, Storybook, the docs app, and (with
particular care, per the request) **every surface of the landing page**. No component TSX changes; the
theme stays a drop-in CSS file gated by the same parity + chart-CVD tests as every other theme.

Target state (verified after T5):

| Metric                                          | Today | Target |
| ----------------------------------------------- | ----- | ------ |
| First-party themes                              | 10    | 11     |
| Themes in `parity.test.ts`                      | 10    | 11     |
| Themes in `chart-palette.test.ts`               | 10    | 11     |
| Themes shipping CSS animations                  | 0     | 1 (`cyberpunk`, opt-in + reduced-motion-safe) |
| Themes in CLI / Storybook / docs lists          | 10    | 11     |
| Landing theme-list surfaces covering the theme  | 0/5   | 5/5 (switcher, tile wall, feature copy, css import, presets) |
| Full CI gate (`pnpm ready`)                     | green | green  |

**Architecture & evidence (reproduced in-repo before planning):**

- **Theme files** live in `packages/themes/src/*.css`; each is `@import '@cascivo/tokens';` then
  `@layer cascivo.theme { [data-theme='<name>'] { … } }`. `brutalist.css` is the structural reference
  (radius 0, `--cascivo-shadow-*: Npx Npx 0 …` hard shadows, `--cascivo-ring-width: 3px`).
- **Parity gate:** `packages/themes/src/parity.test.ts` builds the `--cascivo-*` key set from the first
  theme and asserts **every** other theme defines an identical set (no missing, no extra). The theme list
  is a hard-coded array in that file — the new theme must be added there.
- **Chart-CVD gate:** `packages/themes/src/chart-palette.test.ts` inlines oklch→sRGB + protan/deutan/tritan
  matrices and asserts the 8 chart series stay perceptually distinguishable under color-vision deficiency.
  It also enumerates themes — the new theme must be added.
- **Motion:** `packages/tokens/src/index.css:190` defines `--cascivo-motion-{enter,exit,emphasis}` from
  duration + ease tokens; `@media (prefers-reduced-motion: reduce)` (line ~254) collapses all durations to
  `0.01ms`, disabling library-wide motion. **No theme ships `@keyframes` today** — that is net-new in T2.
- **Theme registration is duplicated** across: `packages/themes/package.json` (`exports`, `description`,
  `keywords`), `packages/themes/README.md`, `parity.test.ts`, `chart-palette.test.ts`,
  `packages/cli/src/commands/theme.ts`, `apps/storybook/.storybook/preview.tsx`, `apps/docs/src/theme.ts`
  + `app.css` (+ `Layout.tsx`, `ChartsPage.tsx`), and on the landing side **two** arrays
  (`apps/landing/src/theme.ts` and `apps/landing/src/sections/ComponentField.tsx`), plus
  `apps/landing/src/sections/Features.tsx` (`'Ten themes'` copy), `apps/landing/src/landing.css` (`@import`),
  and `apps/landing/src/pages/create/presets.ts` (preset entry).
- **Font caveat:** `docs/THEME-PROPOSALS.md` notes brutalist/terminal "want" a mono/grotesk face but font is
  not per-theme themeable yet. v38 inherits `--cascivo-font-sans` (same caveat); no font work.

**Tech Stack:** CSS-only theme (vite+ `vp` for check/test); no runtime, no component changes; progressive
enhancement CSS (`@function`/`if()` only with static fallbacks — `fallback:check`).

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                                                  |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| T1      | Theme palette & structure          | Author `cyberpunk.css` with full token parity + passing chart-CVD; export it from the themes package.  |
| T2      | Brutalist/cyberpunk CSS animations | Override motion character to "hard snap"; add opt-in, reduced-motion-safe scanline/glitch/flicker effects. |
| T3      | System registration                | Register the theme in the CLI, Storybook, and the docs app.                                            |
| T4      | Landing-page integration           | Wire **every** landing surface: switcher, tile wall, feature copy/count, CSS import, `/create` preset. |
| T5      | Docs, proposals & final gate       | Document in `THEME-PROPOSALS.md` + README; `pnpm regen`; run the full gate incl. parity/chart/fallback. |

Ordering rationale: **T1 first** — the CSS file and its passing parity/chart tests are the foundation; if
the palette can't satisfy parity + CVD, everything downstream is moot. **T2** layers motion on the
established file (it may introduce tokens that must propagate to all themes for parity, so it follows T1
deliberately). **T3 → T4** register the now-complete theme outward; T4 is called out separately because the
request emphasizes the landing page and it has the most duplicated surfaces (two arrays + copy + css +
presets). **T5** documents and gates everything, including a grep sweep to prove no registration surface was
missed.

---

## Files Created / Modified per Tranche

### T1 — Theme palette & structure

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/themes/src/cyberpunk.css` (full `--cascivo-*` token set, dark + neon + brutalist structure) |
| Modify | `packages/themes/src/parity.test.ts` (add `cyberpunk` to the theme list)               |
| Modify | `packages/themes/src/chart-palette.test.ts` (add `cyberpunk`; tune chart ramp to pass CVD) |
| Modify | `packages/themes/package.json` (`exports["./cyberpunk"]`/`["./cyberpunk.css"]`; `description`; `keywords`) |
| Modify | `packages/themes/src/all.css` (`@import` the new theme)                                 |
| Modify | `packages/themes/README.md` (list `cyberpunk`)                                          |

### T2 — Brutalist/cyberpunk CSS animations

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/themes/src/cyberpunk.css` (override `--cascivo-motion-*` to step/snap easing) |
| Modify | `packages/themes/src/cyberpunk.css` (theme-scoped `@keyframes` + opt-in marker rules: scanline, glitch/RGB-split, neon flicker; static fallbacks; `prefers-reduced-motion` guard) |
| Modify | `packages/themes/src/parity.test.ts` only if T2 introduces new tokens (then add them to **all** themes) |

### T3 — System registration

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/cli/src/commands/theme.ts` (add `cyberpunk` to the theme list)               |
| Modify | `apps/storybook/.storybook/preview.tsx` (`import '@cascivo/themes/cyberpunk'`; add to `themes` map) |
| Modify | `apps/docs/src/theme.ts` (type union + `THEMES` array + legacy-migration guard)        |
| Modify | `apps/docs/src/app.css` (`@import '@cascivo/themes/cyberpunk.css'`)                     |
| Modify | `apps/docs/src/Layout.tsx`, `apps/docs/src/pages/ChartsPage.tsx` (theme references if enumerated) |

### T4 — Landing-page integration

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `apps/landing/src/theme.ts` (`THEMES` array)                                            |
| Modify | `apps/landing/src/sections/ComponentField.tsx` (local `THEMES` tile array)              |
| Modify | `apps/landing/src/sections/Features.tsx` (`'Ten themes'` → `'Eleven themes'` + add to enumerated list) |
| Modify | `apps/landing/src/landing.css` (`@import '@cascivo/themes/cyberpunk.css'`)              |
| Modify | `apps/landing/src/pages/create/presets.ts` (add `cyberpunk` preset: swatch + config)   |

### T5 — Docs, proposals & final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `docs/THEME-PROPOSALS.md` (document `cyberpunk`; update the ten→eleven count/table)     |
| Verify | `pnpm regen` (regenerate any theme listing / registry surfaces); commit drift          |
| Verify | full gate: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, drift |

---

## Key Decisions

### Decision 1 — Name the theme `cyberpunk` (recommended)

The name lands in ~12 files, so it is chosen once. **Decision: `cyberpunk`** — single-word (matches
`brutalist`/`terminal`/`midnight`/`pastel`), immediately communicates the dark-neon mood, and does not
collide with the existing `brutalist`. Alternatives rejected: `neon` (names the palette but loses the
brutalist structural read), `neobrutal` (conceptually overlaps the existing theme), `synthwave` (narrower
80s connotation; the brief said "cyberpunk"). If the maintainer prefers a different name, it changes only
the literal string in T1–T4 — the plan is otherwise name-agnostic.

### Decision 2 — A new, independent theme — not a `brutalist` variant (recommended)

The brief is "brutalism **and** cyberpunk." **Decision: ship a standalone `cyberpunk.css`** that borrows
brutalist **structure tokens** (radius 0, thick borders, hard shadows, fat focus ring) but defines its own
dark+neon palette. It does **not** `@import` or extend `brutalist.css`. Rationale: `parity.test.ts` treats
each theme file as an independent peer that must define the identical token set; a standalone file is the
simplest thing that satisfies that and keeps the two themes' palettes decoupled. Author it by copying a
**dark** theme's token skeleton (`terminal` or `midnight`) so every required `--cascivo-*` key is present,
then re-color + apply brutalist structure values.

### Decision 3 — Chart palette: re-use the neutral-anchored ramp, do not hand-pick neon (recommended)

`chart-palette.test.ts` runs protan/deutan/tritan simulation and asserts the 8 series stay distinguishable.
Eight saturated neon hues will collapse under CVD. **Decision: start from an existing dark theme's
chart ramp (proven to pass) and adjust lightness/chroma minimally**, keeping the neutral anchor (`chart-8`)
and the hue spacing. The neon identity comes from the **accent/surface** tokens (buttons, borders, glow),
not from forcing the data-viz ramp to be neon. This keeps data visualisations accessible while the UI
chrome reads cyberpunk.

### Decision 4 — Animations are CSS-only, opt-in, and reduced-motion-safe (recommended)

The brief asks whether "the usual brutalist animations" can be added, "ideally just with CSS." **Answer:
yes — entirely in CSS.** Two layers:

1. **Ambient (automatic) — motion character.** Override `--cascivo-motion-{enter,exit,emphasis}` to a
   stepped/snap easing (e.g. `steps()` or a sharp `cubic-bezier`) so existing component transitions
   (modals, dropdowns, toggles) inherit a brutalist "hard snap" feel with **zero component changes**.
2. **Loud (opt-in) — signature effects.** Theme-scoped `@keyframes` for a scanline/CRT overlay, a
   glitch/RGB-split on hover, and a neon flicker, attached to **opt-in markers** (a marker class or
   `data-` attribute) so they never fire on arbitrary components unasked. Used by the landing page's
   showcase tile and available to consumers who opt in.

**Guards (mandatory):** every animated declaration has a static fallback immediately preceding it
(`fallback:check`); all effects are wrapped so `@media (prefers-reduced-motion: reduce)` disables them
(belt-and-suspenders with the existing token-duration collapse); no animation drives layout in a way that
breaks the mobile-overflow sweep; no off-scale breakpoint literals. If an effect needs `@function`/`if()`,
it is progressive enhancement with a static fallback, per CLAUDE.md.

### Decision 5 — No component or token-architecture changes; parity stays whole (firm)

The theme adds **no** new component tokens and changes **no** component TSX/CSS. If T2's effects need a new
custom property (e.g. a glow color used by opt-in rules), it is added to **every** theme file (a sane
neutral value elsewhere) so `parity.test.ts` still passes — parity is a hard gate, and the cheapest way to
keep it green is to avoid net-new tokens; introduce one only if unavoidable, and then everywhere.

### Decision 6 — Font stays `--cascivo-font-sans` (firm, scoped-out)

A per-theme mono/grotesk face is the long-standing open item for `brutalist`/`terminal`
(`docs/THEME-PROPOSALS.md`). v38 does **not** solve per-theme fonts; `cyberpunk` inherits the default sans
and is documented with the same caveat. Adding font theming is a separate, larger change (touches the base
layer + every theme) and is out of scope.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` must pass after each tranche; `pnpm ready` green before each commit.
2. **Parity is a hard gate:** `cyberpunk.css` defines exactly the same `--cascivo-*` set as the other
   themes. Any token introduced in T2 is added to **all** themes in the same tranche.
3. **Chart-CVD is a hard gate:** the new theme is added to `chart-palette.test.ts` and its ramp passes the
   protan/deutan/tritan checks.
4. **Animations: progressive enhancement + reduced-motion.** Static fallback precedes every progressive
   declaration (`fallback:check`); `prefers-reduced-motion: reduce` disables all keyframe effects; CSS
   `@function`/`if()` only with a static fallback.
5. **Responsive:** no off-scale breakpoint literals (`pnpm breakpoint:check`); never `display:none` content
   away; the theme passes the mobile sweep at 320/360/390/414 (it adds no layout, but the animation overlays
   must not introduce overflow).
6. **Every duplicate updated:** the theme name has ~12 registration sites and **two** of them are on the
   landing page (`theme.ts` + `ComponentField.tsx`). T5 greps for the name across `packages` and `apps` to
   prove none was missed.
7. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and regenerated files committed;
   `pnpm brand:check` green.
