# v39 — RetroUI Study → Adopt the Genuinely-Missing Pieces — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study [RetroUI](https://retroui.dev/) and adopt the **five** things cascivo genuinely lacks or
can learn from — **not** re-port its component library. A component-by-component map (in
`docs/ROADMAP-V39.md`) shows cascivo (~140 components) is already a superset of RetroUI (~40, on Base UI +
TailwindCSS, shadcn-distributed). The only net-new *component* is a **Table of Contents**. The other four
adoptions are an architecture/DX gap (**per-theme fonts**, which studying a font-driven library exposes), a
missing **theme** point (an **8-bit `arcade`** aesthetic — RetroUI's literal identity), a distribution
**interop** win (**shadcn-registry** compatibility), and a **layout** gap (a few reuse-only page-section
**blocks**). RetroUI's `cn`/Tailwind utility and Base UI dependency are explicitly **rejected** as
contrary to cascivo's CSS-native, own-primitives principles.

Target state (verified after T5):

| Metric                                   | Today                  | Target |
| ---------------------------------------- | ---------------------- | ------ |
| Font theming                             | global `sans`/`mono`   | `--cascivo-font-display` + per-theme `sans/mono/display` override |
| First-party themes                       | 11                     | 12 (`arcade`) |
| Themes in `parity.test.ts` / chart-CVD   | 11                     | 12 (font tokens in all) |
| Components                               | ~140 (no TOC)          | +1 `toc` (manifest + react export + registry + tests) |
| shadcn-registry interop                  | none                   | shadcn-schema items + `/r/<name>.json`; `npx shadcn add` works |
| Blocks                                   | 8                      | 8 + reuse-only sections (pricing, footer, faq, stats) |
| Full CI gate (`pnpm ready`)              | green                  | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Components:** `packages/components/src/*` (~140 dirs), re-exported from `packages/react/src/index.ts`.
  Mapping every RetroUI component to a cascivo equivalent leaves exactly one gap: **`toc`** (RetroUI's
  Table of Contents). `skip-nav.meta.ts` is the only file even mentioning "toc" today.
- **Fonts:** `packages/tokens/src/index.css` declares `--cascivo-font-sans` (line ~97) and
  `--cascivo-font-mono` (line ~99) in `:root` **only** — no `--cascivo-font-display`, no per-theme font.
  `docs/THEME-PROPOSALS.md` (lines ~108–110, ~210–214) records per-theme fonts as an **open question** with
  the current recommendation "(a) keep fonts global for now," noting that theming fonts "requires adding the
  key to _all_ themes for parity." v39 flips this.
- **Themes:** 11 files in `packages/themes/src/*.css` (incl. `cyberpunk` from v38). Each is
  `@import '@cascivo/tokens';` then `@layer cascivo.theme { [data-theme='<name>'] { … } }`.
  `parity.test.ts` asserts an identical `--cascivo-*` key set across all; `chart-palette.test.ts` runs
  protan/deutan/tritan CVD simulation on the 8-series ramp. Theme registration is duplicated across ~12
  files (themes `package.json`/`all.css`/`README`, both tests, CLI `theme.ts`, Storybook `preview.tsx`,
  docs `theme.ts`+`app.css`, and on landing: `theme.ts` + `sections/ComponentField.tsx` arrays +
  `sections/Features.tsx` copy + `landing.css` + `pages/create/presets.ts`) — see v38's master plan for the
  full enumeration; v39 reuses that sweep for `arcade`.
- **Registry / distribution:** `registry.json` uses cascivo's **own** schema (`{name,type,category,files:[raw
  GitHub URLs],meta}`), built by `packages/registry/src/build.ts` (with `validate.ts`, `directory.ts`,
  `types.ts`, `schema/`). Distribution is `npx cascivo add` (`packages/cli/src/commands/add.ts`). This is
  **not** shadcn-registry compatible. T4 adds a second emitter, leaving the existing schema untouched.
- **Blocks:** `packages/components/src/blocks/` has 8 compositions + `types.ts`. They compose existing
  components — the model T5 follows.
- **Charts:** `packages/charts` already covers RetroUI's recharts area/bar/line/pie — no work.
- **AI layer:** every component ships `component.meta.ts` feeding `@cascivo/mcp`, skills, and auto-docs —
  cascivo is far ahead of RetroUI (which has none). The only AI action here is *discipline*: the new `toc`
  ships a manifest so all AI surfaces pick it up.

**Tech Stack:** CSS-only for T1/T2; signal-driven TSX + CSS Modules for T3 (no Tailwind, no Base UI, no
`useState`/`useEffect`); TypeScript emitter + Vitest for T4; reuse-only compositions for T5. vite+ (`vp`)
for check/build/test throughout. Progressive-enhancement CSS (`@function`/`if()` only with static
fallbacks — `fallback:check`).

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                                                  |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| T1      | Per-theme font theming             | Add `--cascivo-font-display`; make `sans/mono/display` per-theme overridable across all 12 themes; keep parity green; flip the THEME-PROPOSALS recommendation. |
| T2      | `arcade` retro theme               | Author an 8-bit/pixel theme (uses T1's display font); opt-in reduced-motion-safe pixel/CRT effects; register **everywhere** (the v38 sweep). |
| T3      | Table of Contents (`toc`)          | New signal-driven scroll-spy component + manifest + react export + registry + tests. The one genuine component gap. |
| T4      | shadcn-registry interop            | Emit shadcn-schema items + `/r/<name>.json` from `packages/registry` (additive); document `npx shadcn add`. |
| T5      | Blocks expansion + docs & gate     | Add reuse-only page-section blocks; document the roadmap; `pnpm regen`; full gate + drift.             |

Ordering rationale: **T1 first** — the font token is the foundation `arcade` (T2) needs, and it pays off
the long-pending per-theme-font open question on its own. **T2** layers the theme on T1 (it may add a font
token row that must propagate to all themes for parity, so it follows T1 deliberately) and is the most
duplicated-surface tranche (the v38 registration sweep). **T3** (component) and **T4** (interop) are
independent of T1/T2 and of each other — they can run in parallel after T1 if desired, but are sequenced T3
→ T4 for a single reviewer. **T5** composes existing components, documents everything, and runs the final
gate including a drift check and a grep sweep proving `arcade` reached every registration surface.

---

## Files Created / Modified per Tranche

### T1 — Per-theme font theming

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/tokens/src/index.css` (add `--cascivo-font-display`; default = sans)         |
| Modify | `packages/themes/src/*.css` (all 12 — declare the font token(s) parity requires; ≥1 theme sets a real override) |
| Modify | `packages/themes/src/parity.test.ts` (font keys are part of the asserted set — confirm/extend) |
| Modify | `docs/THEME-PROPOSALS.md` ("Open questions": per-theme fonts deferred → shipped, RetroUI motivation) |
| Modify | `packages/tokens/README.md` / `packages/themes/README.md` (document `font-display` + per-theme override) |

### T2 — `arcade` retro theme

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/themes/src/arcade.css` (full `--cascivo-*` set; retro palette; pixel display font; blocky borders) |
| Modify | `packages/themes/src/parity.test.ts`, `chart-palette.test.ts` (add `arcade`)            |
| Modify | `packages/themes/package.json` (`exports`, `description`, `keywords`), `all.css`, `README.md` |
| Modify | `packages/cli/src/commands/theme.ts`                                                    |
| Modify | `apps/storybook/.storybook/preview.tsx`                                                  |
| Modify | `apps/docs/src/theme.ts`, `apps/docs/src/app.css` (+ `Layout.tsx`/`ChartsPage.tsx` if enumerated) |
| Modify | `apps/landing/src/theme.ts`, `apps/landing/src/sections/ComponentField.tsx`, `apps/landing/src/sections/Features.tsx`, `apps/landing/src/landing.css`, `apps/landing/src/pages/create/presets.ts` |

### T3 — Table of Contents (`toc`)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/components/src/toc/toc.tsx`, `toc.module.css`, `toc.meta.ts`, `toc.test.tsx`  |
| Create | `packages/components/src/toc/use-toc-from-region.ts` (optional DOM-scan helper)         |
| Modify | `packages/react/src/index.ts` (export `toc`)                                            |
| Modify | `registry.json` (regenerated via `pnpm regen`) + `packages/components/src/_all-metas.ts` if enumerated |

### T4 — shadcn-registry interop

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/registry/src/shadcn.ts` (map cascivo registry → shadcn `registry:component` items) |
| Create | `packages/registry/src/shadcn.test.ts` (shape/validation smoke test)                    |
| Modify | `packages/registry/src/build.ts` (emit `/r/<name>.json` + a shadcn index alongside existing output) |
| Modify | `packages/registry/README.md` (CSS-native caveats + `npx shadcn add` usage)             |

### T5 — Blocks expansion + docs & final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/components/src/blocks/{pricing,site-footer,faq,testimonials}/` (reuse-only compositions + manifests) |
| Modify | `packages/components/src/blocks/types.ts` (if a shared block type is enumerated)        |
| Modify | `docs/ROADMAP-V39.md` (status → in progress/done as tranches land)                      |
| Verify | `pnpm regen` (registry + any generated listings); commit drift                          |
| Verify | full gate: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, drift |

---

## Key Decisions

### Decision 1 — Do NOT re-port RetroUI's components (firm)

cascivo (~140 components) already supersedes RetroUI (~40). The component map in `docs/ROADMAP-V39.md`
shows every RetroUI component has a cascivo equivalent **except** `toc`. Re-porting would be redundant
work and would import RetroUI's stack assumptions (Tailwind, Base UI). **Decision: adopt only `toc` as a
net-new component (T3); reject the rest as already-shipped.** This is the central honest finding of the
study and the reason v39 is scoped around ideas, not ports.

### Decision 2 — Reject `cn`/Tailwind and Base UI (firm)

RetroUI's core utility is `cn` (`clsx` + `tailwind-merge`) and its components wrap Base UI primitives.
cascivo is CSS-native (`@layer`, CSS Modules, custom properties) and builds its own micro-FSM + signals in
`@cascivo/core`. **Decision: neither is adopted.** Adopting them would contradict two of the six core
principles. The study records them as "considered, rejected, with reason."

### Decision 3 — Flip the per-theme-font open question (recommended)

`THEME-PROPOSALS.md` currently recommends keeping fonts global. RetroUI demonstrates how much of a theme's
identity rides on its typeface. **Decision: add `--cascivo-font-display` (default = `--cascivo-font-sans`)
and make `--cascivo-font-{sans,mono,display}` per-theme overridable**, declared in **all 12** theme files so
`parity.test.ts` stays green. This is the cheapest mechanism (token rows, no component change), unblocks
`arcade` (T2), and retroactively grants the brutalist/terminal/cyberpunk font wishes. Alternative (keep
global) is rejected: it leaves `arcade` unable to carry a pixel face, defeating the point of the study.

### Decision 4 — Ship `arcade` as a distinct 8-bit theme; allow clean deferral (recommended)

cascivo already has `brutalist` (quiet/structural) and `cyberpunk` (dark/neon, v38). **Decision: `arcade`
occupies the missing 8-bit/pixel-arcade point** — a limited bright retro palette, a pixel **display** font
(via T1), blocky pixel borders, hard shadows, and opt-in pixel/CRT effects. It must not read as neon
(that's `cyberpunk`) or as quiet (that's `brutalist`). Name: **`arcade`** (single-word, matches the
convention; `retro`/`pixel`/`8bit` rejected per ROADMAP-V39 Decision 3). Because only T1's font token is a
hard dependency, **T2 can be deferred or cut without blocking T3/T4/T5** if the maintainer is theme-fatigued
after v38 — flagged here so the cut is clean.

### Decision 5 — `toc` is controlled-first, signal-driven, no `useEffect` (recommended)

**Decision: the primary API is a controlled `items` prop** (`{ id, label, level }[]`) rendering a `<nav>`
of anchor links; the active item is a `useSignal` updated by a `useSignalEffect`-driven
`IntersectionObserver` (per CLAUDE.md: DOM side effects use `useSignalEffect`, never `useEffect`; visual
states via CSS). An optional `useTocFromRegion(ref)` helper derives `items` from headings inside a
container for convenience. WCAG AA, keyboard-navigable, label defaults from `@cascivo/i18n`. Ships a
`component.meta.ts` so MCP/docs/Storybook/registry pick it up automatically. Rejected: a `useEffect`/
`useState` observer (violates the reactivity rules) and a DOM-scan-only API (non-deterministic, hard to
test).

### Decision 6 — shadcn interop is a second emitter, not a schema change (recommended)

cascivo's `registry.json` schema is consumed by the CLI, MCP, and docs; changing it is high-blast-radius.
**Decision: add `packages/registry/src/shadcn.ts` that maps the existing registry into shadcn's
`registry:component` item schema and writes `/r/<name>.json`** alongside the current output. cascivo's own
schema is untouched. CSS-native caveats (cascivo ships CSS Modules + a `@cascivo/themes` import, not a
Tailwind config or `cssVars` block) are documented; file contents are inlined or base-URL'd per shadcn's
schema. This is purely additive interop — no behavior change to `npx cascivo add`.

### Decision 7 — Blocks are reuse-only (firm)

**Decision: new blocks compose existing components only** (Card, Button, Badge, Accordion, Avatar, Stat,
Separator, …). No new primitive may be introduced in T5. Scope: `pricing`, `site-footer`, `faq`,
`testimonials`/`stats` (the high-value RetroUI page sections cascivo lacks). Anything requiring a new
component is out of scope and would become its own roadmap item.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **Parity is a hard gate:** T1's font tokens and T2's `arcade.css` keep the identical `--cascivo-*` set
   across **all 12** themes (`parity.test.ts`); any token added in one tranche is added to every theme in the
   same tranche. `arcade` passes `chart-palette.test.ts` (CVD-safe ramp — borrow a passing ramp, don't
   hand-pick 8 retro hues).
3. **No Tailwind, no Base UI, no banned hooks.** New TSX (`toc`, blocks) obeys CLAUDE.md: no
   `useState`/`useEffect`/`useContext`/`useReducer`; `useSignal*` + `useRef` only; CSS handles
   hover/focus/active/disabled; i18n-defaulted strings; `useSignals()` if read during render in React apps.
4. **Animations: progressive enhancement + reduced-motion.** `arcade`'s pixel/CRT effects have a static
   fallback before every progressive declaration (`fallback:check`); all keyframe motion is disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); no
   `display:none` data loss.
5. **Every theme-registration surface updated (v38 sweep).** `arcade` reaches ~12 files incl. **both**
   landing arrays; T5 greps `arcade` across `packages` + `apps` to prove none was missed.
6. **Interop is additive:** the shadcn emitter is net-new output; `registry.json`'s own schema is untouched.
7. **AI-first:** `toc` and every new block ship a `component.meta.ts`; `toc` is added to
   `packages/react/src/index.ts`; `pnpm regen` refreshes `registry.json` and the shadcn output.
8. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check`
   green.
