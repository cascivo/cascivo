# v45 — Icon Catalog Expansion (More Icons, Visible in Docs & Landing) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow `@cascivo/icons` from **61** hand-authored icons to **~450** by adopting the full
[**chromicons**](https://lifeomic.github.io/chromicons.com/) set (436 MIT, stroked 24×24 — the same family as
cascivo's existing Feather-derived icons), via a **regenerable SVG → `createIcon` generator** rather than
hand-typing; then make the catalog **browsable in the docs** (a searchable `/icons` gallery) and **visible on
the landing page** (an icon-showcase section). The companion study (`docs/ROADMAP-V45.md`) evaluates
chromicons **and** [hugeicons](https://github.com/hugeicons/hugeicons) and records why chromicons is the
baseline and hugeicons (multi-style 54k library, free/Pro split, `<HugeiconsIcon>` wrapper runtime model) is
**rejected** as a bulk source — kept only as an optional, attributed gap-filler. **SVG only. Owned code, no
runtime dependency. Additive — no existing icon changes.**

Target state (verified after T6):

| Metric                         | Today                               | Target                                                                 |
| ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| Icon count                     | 61 (hand-authored inline)           | ~450 (61 + chromicons, de-duplicated), generated                        |
| Authoring                      | inline `createIcon` calls           | vendored SVG → `scripts/icons/generate.mjs` → `generated.tsx`, in `pnpm regen` |
| Icon metadata                  | none                                | `icons.catalog.json` (name, tags, keywords, category)                   |
| Docs                           | no gallery                          | searchable `/icons` page (grid, filter, copy-import, size/color/theme)  |
| Landing                        | no catalog presence                 | `IconShowcase` section (count + grid + link to `/icons`)                |
| License attribution            | Feather comment only                | `NOTICE` + README: Feather + chromicons (both MIT)                      |
| Full CI gate (`pnpm ready`)    | green                               | green                                                                   |

**Architecture & evidence (reproduced in-repo before planning):**

- **Icons package:** `packages/icons/src/create-icon.tsx` exports `createIcon(name, children)` →
  `<svg viewBox="0 0 24 24" fill="none" stroke={color=currentColor} stroke-width={2} …>`, `aria-hidden` unless
  `aria-label` is passed. `packages/icons/src/index.tsx` calls it 61 times with inline SVG children (geometry
  "adapted from Feather Icons (MIT)"). `package.json` is `"sideEffects": false`, peer `react >=18`, built via
  `vp pack src/index.tsx`. **`createIcon` accepts arbitrary SVG children → chromicons stroke geometry slots in
  unchanged.**
- **Generated-artifact precedent:** tokens are generated, not hand-listed — `pnpm catalog:generate` →
  `tokens.catalog.json` → `apps/docs/src/pages/TokensPage.tsx` reads the JSON and renders. The icon pipeline
  mirrors this exactly (generator → `icons.catalog.json` → `IconsPage`), and hangs off `pnpm regen` like the
  other generators in `scripts/`.
- **Docs routing:** `apps/docs/src/App.tsx` registers routes (`<Route path="/tokens" component={TokensPage} />`,
  `/charts`, `/layouts`, …); `apps/docs/src/Layout.tsx` has an `exploreItems` array
  (`{ label, href, icon }`) for the side nav; `apps/docs/src/nav.ts` builds the component nav from the
  registry. `/icons` is registered in all three plus sitemap/SEO.
- **Landing sections:** `apps/landing/src/App.tsx` lazy-imports sections from `apps/landing/src/sections/*`
  (`Hero`, `Ecosystem`, `Features`, …) and lists them with `SectionNav`. The new `IconShowcase` follows the
  same lazy + `SectionNav` pattern. The React landing gets **no signals Babel transform**, so any section
  reading a signal during render must call `useSignals()` first (CLAUDE.md).
- **Two reference libraries:** chromicons — 436, MIT, stroked 24×24, raw SVG source on GitHub
  (`lifeomic/chromicons.com`); hugeicons — 54k total / 5,400 free, MIT-free + Pro, 24×24, consumed via
  `@hugeicons/core-free-icons` + a `<HugeiconsIcon>` wrapper. Style coherence + license simplicity +
  distribution fit all favor chromicons (see `docs/ROADMAP-V45.md` study table).

**Tech Stack:** Node generator script (`scripts/icons/generate.mjs`) parsing SVG → emitting TSX + JSON; the
existing `createIcon` model (no new component, no multi-style API); Preact docs page (`IconsPage`) + React
landing section (`IconShowcase`), both signal-driven per CLAUDE.md; vite+ (`vp`) for check/build/test; the
`pnpm regen` + drift gate for generated artifacts. No runtime dependencies; SVG only.

---

## Tranche Overview

| Tranche | Title                                | Goal                                                                                                  |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| T1      | Icon source pipeline & generator     | Vendor chromicons SVG source + `NOTICE`; add `scripts/icons/generate.mjs` (normalize → PascalCase → skip/alias collisions → emit `generated.tsx`); wire into `pnpm regen`. `createIcon` unchanged. |
| T2      | Full catalog generation, exports & tests | Re-export generated icons from `index.tsx` (~450, no dup names, existing wins); bump `VERSION`; tests (render/`currentColor`/`aria-hidden`, no-dup, tree-shaking guard). |
| T3      | Icon catalog manifest + AI surface   | Emit `icons.catalog.json` (name/tags/keywords/category — hugeicons' keyword idea); wire into docs search + `llms.txt`; document schema. `registry.json` untouched. |
| T4      | Docs icon gallery page (`/icons`)    | `IconsPage` modeled on `TokensPage`: grid from catalog, search/filter, click-to-copy import, size/color/theme controls; route + nav + sitemap + SEO. |
| T5      | Landing icon showcase                | `IconShowcase` section: count headline + responsive (reduced-motion-safe) grid + `/icons` link; lazy-loaded, in `SectionNav`, `useSignals()` as needed. |
| T6      | Docs, regen, license, final gate     | README/`NOTICE`/roadmap-status updates; `pnpm regen`; drift + full CI gate; grep sweep proving `/icons` + new exports reached every surface. |

Ordering rationale: **T1** builds the pipeline (everything downstream depends on it). **T2** turns it into the
real expanded public surface + tests. **T3** adds the metadata the docs/AI surfaces consume. **T4** (docs
gallery) and **T5** (landing showcase) both read T3's catalog and can run in parallel after T3, sequenced T4 →
T5 for one reviewer. **T6** finalizes docs/license, runs `pnpm regen`, the drift gate, the full CI gate, and a
grep sweep proving the new route + exports reached every registration surface.

---

## Files Created / Modified per Tranche

### T1 — Icon source pipeline & generator

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/icons/svg/**` (vendored chromicons SVG source, license preserved)            |
| Create | `scripts/icons/generate.mjs` (SVG → normalize → `generated.tsx` + later `icons.catalog.json`) |
| Create | `packages/icons/src/generated.tsx` (generator output — `createIcon` calls)             |
| Create/Modify | `NOTICE` (attribute Feather + chromicons, both MIT)                             |
| Modify | `package.json` root scripts / regen wiring (add `icons:generate` to `pnpm regen`)      |

### T2 — Full catalog generation, exports & tests

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/icons/src/index.tsx` (re-export generated icons; bump `VERSION`; keep the 61 existing) |
| Modify | `packages/icons/src/index.test.tsx` (render/`currentColor`/`aria-hidden`, no-dup-names, tree-shaking guard) |
| Verify | `pnpm exec vp run @cascivo/icons#build` + `#test` green                                 |

### T3 — Icon catalog manifest + AI surface

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `scripts/icons/generate.mjs` (also emit `icons.catalog.json`)                          |
| Create | `icons.catalog.json` (or `packages/icons/icons.catalog.json` — co-located with consumers) |
| Modify | docs search index builder + `llms.txt` generation to include icons                     |
| Modify | regen docs / schema note documenting the manifest                                       |

### T4 — Docs icon gallery page (`/icons`)

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `apps/docs/src/pages/IconsPage.tsx`                                                     |
| Modify | `apps/docs/src/App.tsx` (`<Route path="/icons" component={IconsPage} />`)               |
| Modify | `apps/docs/src/Layout.tsx` (`exploreItems` entry) + `apps/docs/src/nav.ts` (if surfaced) |
| Modify | docs sitemap (`scripts/sitemap/*`) + `apps/docs/src/seo.ts` (route SEO)                 |

### T5 — Landing icon showcase

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `apps/landing/src/sections/IconShowcase.tsx` (+ CSS module if used)                    |
| Modify | `apps/landing/src/App.tsx` (lazy import + render the section)                           |
| Modify | `apps/landing/src/sections/SectionNav.tsx` (nav entry) + `route-head`/SEO if needed     |
| Verify | landing builds without a prior full build (icons alias in `apps/landing/vite.config.ts` if required) |

### T6 — Docs, regen, license, final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/icons/readme.body.md` (→ generated `README.md`) — expanded catalog + `/icons` link |
| Modify | `NOTICE` finalized; `docs/ROADMAP-V45.md` status                                        |
| Verify | `pnpm regen`; drift gate (`git diff --exit-code`); full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`); grep sweep |

---

## Key Decisions

### Decision 1 — chromicons is the baseline; do NOT bulk-import hugeicons (firm)

chromicons (436, MIT-in-full, stroked 24×24) is the **same family** as cascivo's existing Feather-derived
icons, ships **raw SVG** we can vendor and transform into the owned `createIcon` model, and is "a reasonable
complete set." hugeicons is a **multi-style 54k** library with a **free/Pro license split** and a
`<HugeiconsIcon>` wrapper + path-data-package **runtime model** — adopting it wholesale would fracture the
single-stroke catalog, muddy licensing, and break the no-runtime-dep / named-export posture. **Decision: vendor
all of chromicons; reject hugeicons as a bulk source; keep hugeicons-*free* only as an optional, attributed,
case-by-case gap-filler through the same pipeline.** Recorded in `docs/ROADMAP-V45.md`.

### Decision 2 — Generate, don't hand-author (firm)

The existing 61 are hand-typed; ~400 more cannot be. **Decision: a generator** (`scripts/icons/generate.mjs`)
vendors the SVG source under `packages/icons/svg/`, normalizes each file (strip hardcoded
`stroke`/`fill`/`width`/`height`/`stroke-width`/`class`, keep inner geometry, assert `viewBox="0 0 24 24"`),
maps `kebab-case` → `PascalCase`, and emits `packages/icons/src/generated.tsx` of `createIcon` calls — wired
into `pnpm regen`, idempotent. This mirrors the tokens pipeline (`catalog:generate` → `tokens.catalog.json`)
and keeps the catalog auditable/updatable. Rejected: hand-typing (unmaintainable) and a runtime SVG loader
(defeats tree-shaking, adds a dep).

### Decision 3 — Reuse `createIcon` unchanged; no multi-style API (recommended)

`createIcon` already defaults to `currentColor`/stroke/24×24 and handles `aria-hidden`; chromicons are stroke
geometry. **Decision: reuse it verbatim** — the generated file is just more `createIcon(...)` calls. No
`variant`/`style` prop, no second component. This keeps the surface a flat set of tree-shakeable named exports
(the whole point of the package). Rejected: a `<HugeiconsIcon>`-style wrapper or a styles prop (a hugeicons
concept that does not apply to a single-style set).

### Decision 4 — Existing names always win on collision (firm)

Some chromicons duplicate existing concepts (`Search`, `Check`, `ArrowDown`, …). **Decision: the existing
export is authoritative; the generator carries an explicit skip/alias list and never overwrites a current
export.** v45 changes **no** existing icon's name or geometry — purely additive, so no consumer breaks.
Rejected: replacing Feather geometry with chromicons (silent visual change to shipped icons).

### Decision 5 — Metadata lives in `icons.catalog.json`, not `registry.json` (recommended)

The docs gallery and AI surfaces need name/tags/keywords/category per icon — exactly the **rich-keyword/category
discipline** worth borrowing from hugeicons. **Decision: the generator emits a dedicated
`icons.catalog.json`** (mirroring `tokens.catalog.json`); the docs search index and `llms.txt` read it.
**`registry.json` is untouched** — it indexes copy-paste *components*, and icons are an npm package, not a
copied component. Rejected: stuffing icons into `registry.json` (wrong abstraction) and hardcoding the gallery
list in the page (defeats the generator).

### Decision 6 — One `/icons` docs page modeled on `TokensPage` (recommended)

**Decision: a single `IconsPage`** at `/icons` that reads `icons.catalog.json` and renders a responsive grid
with a search/filter box, click-to-copy of the exact `import { Name } from '@cascivo/icons'` snippet (via
`useClipboard`), and size/color/theme controls — all signal-driven (no `useState`/`useEffect`). Registered in
`App.tsx`, `Layout.tsx` `exploreItems`, `nav.ts`, sitemap, and `seo.ts`. This is the same shape as the existing
tokens gallery, so it is consistent and low-risk. Rejected: per-icon routes (~450 pages — noise) and a static
markdown list (not searchable, not regenerable).

### Decision 7 — A dedicated, lightweight landing `IconShowcase` (recommended)

**Decision: a new lazy-loaded `IconShowcase` section** — a count headline ("~450 icons, one import"), a
responsive grid (optionally an auto-scrolling marquee, **reduced-motion-safe**, static fallback) of a
representative subset, and a link to `/icons` — added to `App.tsx` + `SectionNav`, `useSignals()` if it reads a
signal during render. Rejected: cramming icons into `Ecosystem`/`Features` (dilutes both) and animating without
a reduced-motion guard (CLAUDE.md violation).

### Decision 8 — Confirm tree-shaking holds at the larger size (firm)

A ~450-icon catalog must not regress consumer bundle size. **Decision: a guard test** asserts a single named
import does not drag in the whole catalog (`"sideEffects": false` + named exports already guarantee this; the
test makes it durable). Rejected: shipping without the guard (a future barrel-import refactor could silently
break tree-shaking).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **SVG only; owned code; zero runtime deps.** Every icon is a stroked `<svg viewBox="0 0 24 24">` via
   `createIcon`. chromicons SVG is vendored + transformed, never an npm runtime dependency, never the hugeicons
   wrapper model. `@cascivo/icons` keeps `"sideEffects": false`.
3. **Additive only.** No existing icon name/signature/geometry changes; collisions resolve to the existing
   export via the generator skip list. The public surface only grows; `VERSION` bumps.
4. **Generated artifacts in sync.** The icon generator runs under `pnpm regen`; `generated.tsx` +
   `icons.catalog.json` are committed; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green. Vendored SVG source committed.
5. **License hygiene.** `NOTICE` + README attribute Feather + chromicons (both MIT), copyright preserved; any
   optional hugeicons-free glyph attributed identically.
6. **Docs/landing obey CLAUDE.md.** `IconsPage` (Preact) + `IconShowcase` (React) use signals, not
   `useState`/`useEffect`; `useSignals()` first where the landing reads a signal during render; copy uses
   `useClipboard`; no off-scale breakpoint literals; static fallback before any progressive/animated CSS,
   disabled under `prefers-reduced-motion`; never `display:none` data loss; ≥44px coarse tap targets.
7. **No external network at runtime.** Vendoring happens once at authoring time; the built package and pages
   ship only owned SVG/JSON — no fetch of an external icon CDN.
