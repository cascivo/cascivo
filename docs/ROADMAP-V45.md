# cascivo — Roadmap v45: Icon Catalog Expansion — More Icons, Visible in Docs & Landing

**Last updated:** 2026-06-23
**Status:** ✅ Shipped (T1–T6) — catalog grown 60 → ~440 via a regenerable chromicons SVG → `createIcon`
generator + `icons.catalog.json` manifest; a searchable `/icons` docs gallery; and a landing
`IconShowcase` section. Additive only; no existing icon changed.
**Plan documents:** `docs/superpowers/plans/2026-06-23-v45-master-plan.md` + tranches 1–6
**Builds on:** the existing **`@cascivo/icons`** package (`packages/icons/src/index.tsx`, 61 Feather-derived
stroked 24×24 icons built via `createIcon`), the `pnpm regen` generated-artifact pipeline (the model is
`pnpm catalog:generate` → `tokens.catalog.json` → `apps/docs/src/pages/TokensPage.tsx`), the docs app routing
(`apps/docs/src/App.tsx` + `nav.ts` + `Layout.tsx`), and the landing-page section model
(`apps/landing/src/sections/*` + `App.tsx` + `SectionNav.tsx`).

> **Version note.** The latest shipped roadmap is **v42**; **v43** and **v44** do not exist. This document is
> filed as **v45** per the brief — the gap is intentional, not an omission.

---

## Why this roadmap exists

`@cascivo/icons` today ships **61** icons. The geometry is adapted from **Feather Icons** (MIT) — stroked,
`viewBox="0 0 24 24"`, `currentColor`, `stroke-width: 2`, authored inline as `createIcon('Name', <…/>)` calls
in a single `index.tsx`. The set covers the essentials the components need (chevrons, arrows, check/x, alert,
search, …) but is too small to be a real product surface, and **there is no way to browse it** — no icon
gallery in the docs app, and no presence on the landing page.

The brief: **include many more icons, and make them visible in the docs and on the landing page.** Constraints:
**SVG only**, and **either generate them all or adopt a reasonable, coherent set**. Two reference libraries
were named for study — [**chromicons**](https://lifeomic.github.io/chromicons.com/) and
[**hugeicons**](https://github.com/hugeicons/hugeicons).

This roadmap records the study of both, picks **chromicons** as the expansion baseline (with reasons), builds
a **regenerable SVG → `createIcon` pipeline** so the catalog is data-driven rather than hand-typed, then makes
the catalog **browsable in the docs** (a searchable `/icons` gallery) and **visible on the landing page** (an
icon-showcase section). It is deliberately **additive**: no existing icon name, signature, or render output
changes.

---

## The two libraries (what the study found)

| Dimension     | **chromicons** (lifeomic)                                             | **hugeicons**                                                            |
| ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Count         | **436** icons (one coherent set)                                       | **54,000+** total; **5,400+** free                                       |
| Free license  | **MIT** (whole set free)                                              | **MIT** for the **free** set + source; **Pro** packs under a separate paid license |
| Format        | **SVG** (+ optional webfont); stroke-based                            | **SVG**, crafted on a **24×24** grid                                     |
| Grid / style  | **24×24**, handcrafted, stroke geometry — **matches cascivo's existing Feather-style baseline** | **24×24**, but **10 styles** (Stroke, Solid, Bulk, Duotone, Twotone × rounded/sharp/standard) |
| Distribution  | SVG source in the GitHub repo (`lifeomic/chromicons.com`) + webfont    | `@hugeicons/core-free-icons` (path data) consumed via a `<HugeiconsIcon>` React **wrapper** |
| Categories    | All / App-UI / Science / Health                                       | Very broad (dozens of domains)                                           |
| Naming        | hyphenated descriptive (`alert-circle`, `arrow-down`, `check-file`)    | per-style symbol names                                                   |

**Both are SVG and MIT-for-free.** The decisive differences for cascivo:

- **Style coherence.** cascivo's existing 61 icons are single-style stroked 24×24 (Feather geometry).
  **chromicons is the same family** (handcrafted stroked 24×24) and drops in without a visual seam. hugeicons'
  value is its **10 styles**, but mixing a multi-style 54k library into a single-stroke catalog would create an
  inconsistent surface and force a style-selection API that cascivo's flat named-export model doesn't have.
- **License simplicity.** chromicons is MIT **in its entirety** (436 icons). hugeicons is MIT only for the
  **free subset** of a primarily commercial 54k library — vendoring it invites confusion about which icons are
  free, and the free set is itself a curated slice, not "all of them."
- **Distribution fit.** chromicons ships **raw SVG source** we can vendor and transform into cascivo's
  `createIcon` model (owned code, no runtime dep, tree-shakeable named exports). hugeicons expects its
  `<HugeiconsIcon icon={…}>` wrapper + a path-data package — a runtime-dependency, wrapper-component model that
  is **contrary** to cascivo's per-icon named-export, no-runtime-dep posture.

### Decision

- **Adopt the full chromicons set (436 MIT icons) as the expansion baseline.** This satisfies "generate them
  all" for **one coherent set**, takes the catalog from 61 → **~450** icons (after de-duplicating names that
  overlap the existing Feather set), preserves the exact stroked-24×24-`currentColor` style, stays
  tree-shakeable (named exports — catalog size does not affect consumer bundles), and keeps the owned-code,
  zero-runtime-dependency model.
- **Reject vendoring hugeicons wholesale.** Reasons: multi-style 54k library vs. cascivo's single-stroke flat
  catalog; free-vs-Pro license split; the `<HugeiconsIcon>` wrapper + path-data-package runtime model. Its
  ideas worth keeping — **24×24 grid discipline** and **rich per-icon search keywords/categories** — are
  adopted (T3) without taking the library.
- **hugeicons-free as an optional, documented gap-filler only.** If a genuinely needed icon is absent from
  chromicons, a small number of **hugeicons *free* (MIT) stroke** glyphs may be hand-vendored through the same
  `createIcon` pipeline, attributed in `NOTICE`. Not a bulk import; not in v45 scope unless a concrete gap
  appears.

---

## What exists today (verified against the codebase)

| Area                    | State                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `@cascivo/icons`        | **61** icons in `packages/icons/src/index.tsx`, each `createIcon('Name', <svg-children/>)`; stroked 24×24, `currentColor`, `stroke-width:2` (`create-icon.tsx`). Geometry adapted from **Feather (MIT)**. Tree-shakeable named exports; `aria-hidden` unless `aria-label` given. |
| Generation              | **None for icons** — every icon is hand-authored inline. (Tokens, by contrast, are generated: `pnpm catalog:generate` → `tokens.catalog.json` → `TokensPage`.) |
| Icon gallery in docs    | **None.** No `/icons` route, no `IconsPage`. Icons appear only *incidentally* inside `Layout.tsx`/`demos.tsx` as nav/demo glyphs. |
| Landing presence        | **None as a catalog.** Icons are used decoratively in `Footer`/`Ecosystem`/`AdvantageCarousel`; there is no icon-showcase section. `apps/landing/scripts/gen-icons.mjs` is about **PWA favicons**, unrelated. |
| Icon metadata / search  | **None** — no `icons.catalog.json`, no tags/keywords/categories, nothing in `registry.json`/`llms.txt` for icons. |
| Docs routing model      | `apps/docs/src/App.tsx` (`<Route path="/tokens" component={TokensPage} />`), `nav.ts`, `Layout.tsx` `exploreItems` list — the insertion points for a new `/icons` page. |

---

## Target state (after v45)

| Concern                | Today                                  | Target                                                                                          |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Icon count             | 61 (hand-authored)                     | **~450** (61 existing + chromicons, de-duplicated), generated from vendored SVG source           |
| Authoring model        | inline `createIcon` calls, hand-typed  | **regenerable**: vendored SVG source → generator → `generated.tsx`, wired into `pnpm regen`      |
| Icon metadata          | none                                   | **`icons.catalog.json`** (name, tags, keywords, category) — feeds docs search + AI surfaces       |
| Docs                   | no gallery                             | **searchable `/icons` gallery** (grid, filter, click-to-copy import, size/color/theme controls)   |
| Landing                | no catalog presence                    | an **icon-showcase section** (headline count + responsive grid/marquee + link to `/icons`)        |
| License hygiene        | Feather attribution in a code comment  | `NOTICE`/README attribution for **Feather + chromicons (both MIT)**                              |
| Style                  | single stroked 24×24                   | **unchanged** — chromicons is the same family; no multi-style API introduced                      |

---

## Key open decisions (recommendations in the master plan)

1. **Which library — chromicons, hugeicons, or both?** _Recommendation: **chromicons** as the sole baseline._
   It is MIT in full, the same stroked-24×24 family as cascivo's existing icons, ships raw SVG we can own and
   transform, and 436 is "a reasonable complete set." hugeicons' multi-style 54k catalog + free/Pro split +
   wrapper-component runtime model does not fit; keep it as a documented, optional gap-filler only.
2. **Generate or hand-author?** _Recommendation: **generate**._ Vendor chromicons' SVG source under
   `packages/icons/svg/`, add a generator (`scripts/icons/generate.mjs`) that normalizes each SVG (strip
   hardcoded colors/dimensions, keep inner geometry) and emits `packages/icons/src/generated.tsx` of
   `createIcon` calls, wired into `pnpm regen`. Hand-typing ~400 icons is error-prone and unmaintainable; a
   generator makes the catalog auditable and updatable, matching the tokens pipeline.
3. **`createIcon` reuse vs. new component?** _Recommendation: **reuse `createIcon` unchanged**._ It already
   accepts arbitrary SVG children, defaults to `currentColor`/stroke/24×24, and handles `aria-hidden`. chromicons
   are stroke geometry, so they slot straight in. No API change, no multi-style prop.
4. **Name collisions with the existing 61?** _Recommendation: **existing names win; never break a current
   export**._ Where chromicons and the Feather set name the same concept (e.g. `Search`, `Check`, `ArrowDown`),
   **keep the existing export** and skip the chromicons duplicate (the generator maintains an explicit
   skip/alias list). v45 is purely additive — no existing icon's geometry or name changes.
5. **Icon metadata & search — new file or extend registry?** _Recommendation: a dedicated
   **`icons.catalog.json`**_ (mirroring `tokens.catalog.json`), generated alongside the icons, carrying
   `name`, `pascalName`, `tags`, `keywords`, `category`. The docs gallery and any AI surface read it; this is
   the place hugeicons' rich-keyword idea is adopted. Keep it out of the component `registry.json` (icons are a
   package, not copy-paste components).
6. **Docs gallery shape?** _Recommendation: a single **`/icons` `IconsPage`** modeled on `TokensPage`_ — a
   responsive grid rendered from `icons.catalog.json`, a search/filter box, click-to-copy the
   `import { Name } from '@cascivo/icons'` snippet, and size/color/theme controls. Registered in `App.tsx`,
   `nav.ts`/`Layout.tsx` `exploreItems`, sitemap, and SEO.
7. **Landing presence — new section or fold into an existing one?** _Recommendation: a **new lightweight
   `IconShowcase` section**_ (headline "~450 icons, one import", a responsive/auto-scrolling grid of a
   representative subset, link to `/icons`), lazy-loaded like the other sections and added to `SectionNav`.
   Reduced-motion-safe; no `display:none` data loss.
8. **Bundle-size risk of a bigger catalog?** _Recommendation: **none — confirm with a test**._ Named exports
   are individually tree-shakeable (`sideEffects: false`), so consumer bundles scale with usage, not catalog
   size. Add a guard test asserting a single-icon import does not pull the whole catalog.

---

## Cross-cutting rules

1. **SVG only.** Every icon is a stroked `<svg viewBox="0 0 24 24">` rendered through `createIcon` — no
   webfonts, no raster, no `<img>`.
2. **Owned code, zero runtime deps.** chromicons SVG source is **vendored and transformed** into cascivo's own
   `createIcon` exports — never an npm runtime dependency, never the `<HugeiconsIcon>` wrapper model.
   `@cascivo/icons` keeps `"sideEffects": false` and its existing peer-only deps.
3. **Additive only.** No existing icon's name, signature, or rendered geometry changes. Collisions resolve in
   favor of the existing export (skip list). `VERSION` is bumped; the public surface only grows.
4. **Generated artifacts stay in sync.** The icon generator runs under `pnpm regen`; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) must be green and the generated files
   (`generated.tsx`, `icons.catalog.json`) committed. Vendored SVG source is committed under `packages/icons/`.
5. **License hygiene.** Attribute **Feather** (existing) and **chromicons** (new) — both MIT — in a `NOTICE`
   file and the package README; preserve their copyright notices. Any optional hugeicons-free glyph is
   attributed the same way.
6. **Docs & landing obey CLAUDE.md.** The `IconsPage` (Preact docs) and the `IconShowcase` (React landing) use
   signals, not `useState`/`useEffect`; the landing section calls `useSignals()` if it reads a signal during
   render; copy-to-clipboard uses `useClipboard`; no off-scale breakpoint literals (`breakpoint:check`); any
   animation has a static fallback (`fallback:check`) and is disabled under `prefers-reduced-motion`; never
   `display:none` content away; ≥44px coarse tap targets on interactive controls.
7. **Full gate green before each commit.** `pnpm ready` (regen → `vp check --fix` → build → type check →
   tests), plus `breakpoint:check`, `fallback:check`, and the drift check.

---

## Definition of Done

### T1 — Icon source pipeline & generator

- [ ] chromicons SVG source vendored under `packages/icons/svg/` (license + copyright preserved); `NOTICE`
      added/updated attributing Feather + chromicons (both MIT).
- [ ] `scripts/icons/generate.mjs` reads the vendored SVGs, normalizes them (strip hardcoded
      `stroke`/`fill`/`width`/`height`/`stroke-width`, keep inner geometry, `viewBox 0 0 24 24`), maps
      hyphenated names → PascalCase, applies the skip/alias list for existing-name collisions, and emits
      `packages/icons/src/generated.tsx` of `createIcon` calls.
- [ ] Generator wired into `pnpm regen`; running it twice is idempotent (no diff). `createIcon`/`IconProps`
      unchanged.

### T2 — Full catalog generation, exports & tests

- [ ] `packages/icons/src/index.tsx` re-exports the generated icons alongside the existing 61 (no duplicate
      exports; collisions resolved in favor of existing). Catalog ≈ 450 icons. `VERSION` bumped.
- [ ] Tests: every exported icon renders an `<svg viewBox="0 0 24 24">` with `currentColor`/stroke and the
      `aria-hidden` default; no duplicate export names; a tree-shaking guard (single import ≠ whole catalog);
      `pnpm exec vp run @cascivo/icons#test` green.

### T3 — Icon catalog manifest (`icons.catalog.json`) + AI surface

- [ ] Generator also emits **`icons.catalog.json`** (`name`, `pascalName`, `tags`, `keywords`, `category`,
      inner-SVG markup) — adopting hugeicons' rich-keyword/category idea — committed and refreshed by
      `pnpm regen`.
- [ ] Catalog wired into the docs search index and any relevant AI surface (`llms.txt` icon note); component
      `registry.json` unchanged (icons stay a package, not copy-paste components). Manifest schema documented.

### T4 — Docs icon gallery page (`/icons`)

- [ ] `apps/docs/src/pages/IconsPage.tsx` renders a responsive grid from `icons.catalog.json` with a
      search/filter box, click-to-copy `import { Name } from '@cascivo/icons'`, and size/color/theme controls
      (signals; no `useState`/`useEffect`).
- [ ] Route added in `App.tsx` (`/icons`), nav entry in `Layout.tsx` `exploreItems` + `nav.ts`, sitemap + SEO
      updated. Mobile sweep (320/360/390/414) and ≥44px targets pass; `breakpoint:check`/`fallback:check` green.

### T5 — Landing icon showcase

- [ ] `apps/landing/src/sections/IconShowcase.tsx` — headline (catalog count), a responsive (optionally
      auto-scrolling, reduced-motion-safe) grid of a representative subset, and a link to `/icons`. Lazy-loaded
      in `App.tsx`, added to `SectionNav`, `useSignals()` if reading a signal during render.
- [ ] No `display:none` data loss, no off-scale literals, static fallback before any progressive/animated
      declaration; landing builds without a prior full build (icons alias already present if needed).

### T6 — Docs, regen, license, final gate

- [ ] `packages/icons/readme.body.md` (→ generated README) updated for the expanded catalog + the `/icons`
      gallery link; `NOTICE` finalized; `docs/ROADMAP-V45.md` status updated as tranches land.
- [ ] `pnpm regen` (icons generator + catalogs + llms + sitemap); drift gate green and all generated artifacts
      committed. Full gate passes: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`,
      `breakpoint:check`, `fallback:check`, `brand:check`. Grep sweep confirms `/icons` reached App route, nav,
      sitemap, and SEO, and that the new icons are exported from `@cascivo/icons`.
