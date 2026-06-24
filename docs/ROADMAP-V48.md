# cascivo — Roadmap v48: Consumer-Adoption Parity — Charts Fidelity + Editor Publish Fix

**Last updated:** 2026-06-24
**Status:** 📋 Planned — T1–T6 specified (editor publish fix, pie center/thickness/size, pie empty-state +
tooltip, stacked-bar ergonomics + tooltip, charts adoption hardening, docs/regen/gate). Not yet implemented.
**Plan documents:** `docs/superpowers/plans/2026-06-24-v48-master-plan.md` + tranches 1–6
**Builds on:** the **`@cascivo/charts`** package (`packages/charts/src/charts/{pie-chart,bar-chart}/*`, the
`ChartFrame` + tooltip system in `packages/charts/src/core/*`, the `Legend`/`Axis`/`GridLines` chrome, the
`engine/{shape,scale}.ts` geometry) and the **`@cascivo/editor`** package shipped in v46/v47 — specifically the
release pipeline (root `build:release` filter in `package.json`, the changeset-driven `.github/workflows/release.yml`,
`packages/editor/package.json`'s own `build` script) and the registry generator
(`scripts/registry/generate.ts`, which marks the editor `isNpmInstalled`).

> **Source of this roadmap.** Two consumer-feedback documents from the `@lifosy/ui` adoption effort, both dated
> 2026-06-24: `docs/feedback/feedback-lifosy-charts.md` (what the chart components need so `lifosy`'s custom
> `DonutChart`/`StackedBarChart` can be replaced with **no loss of fidelity**) and
> `docs/feedback/feedback-lifosy-editor.md` (the `@cascivo/editor@0.1.1` publish blocker that gates `lifosy`'s
> CodeMirror → Cascivo migration, "Phase 4"). This roadmap verifies each item against today's code and plans the
> genuine gaps.

---

## Why this roadmap exists

`@lifosy/ui` is migrating off bespoke components onto Cascivo. Two surfaces are blocked, and the feedback is precise
about why. **The charts feedback's headline "blocker" — per-datum / per-series `color` — is, on inspection, already
implemented in source** (`PieChartDatum.color`, `BarChartSeries.color`); the consumer is testing against the
**stale published** `@cascivo/charts`, and the override is also undocumented (absent from the component metas) and
untested. So the charts work is: **ship + document + test the color override, then close the genuine remaining gaps**
(donut center content, donut thickness, square-size shorthand, visible empty state, percentage tooltips, stacked-bar
authoring ergonomics + per-segment tooltip). **The editor feedback is a real, urgent publish bug**: the published
`0.1.1` tarball contains no `dist/`, so every entry point resolves to a missing file and the package cannot be
imported — the single thing gating Phase 4.

### Framing: verify before building

The first job of this roadmap was to check the feedback against the code, not to take it at face value. Two
corrections came out of that:

1. **Charts color override already exists** — the fix is a *release + docs + tests* problem, not a feature.
2. **Editor registry `files: []` is correct by design** — the editor is intentionally **npm-installed**
   (`generate.ts` marks `type: 'editor'` as `isNpmInstalled`, emitting `install: "@cascivo/editor"` and empty
   `files`), so feedback suggestion #3 ("populate the registry `files[]`") is **declined**. The copy-paste path is
   deliberately empty; consumers `npm install @cascivo/editor`. Fixing the published tarball is the whole fix.

The verified editor root cause is narrower than the feedback guessed ("publish ran without the build"): the package's
own `build` script is correct, but **`@cascivo/editor` is missing from the root `build:release` filter** in
`package.json` (the `vp run -F …` list that the release workflow builds before `changeset publish`). It is never
built in CI, so `changeset publish` ships it with no `dist/`. Add it to the filter, add a defensive `prepack` guard,
and bump the version so consumers don't get served the cached-empty `0.1.1`.

---

## The findings, verified against today's code

Legend: ✅ already addressed (ship/doc/test only) · ⚠️ partially present · ❌ genuine gap.

### Charts — DonutChart → `PieChart`

| #   | Finding (feedback severity)                  | Verified state today                                                                                                                              | Tranche |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| C1  | Per-datum color (🔴 blocker)                 | ✅ **already in source** — `PieChartDatum.color?: string` exists (`pie-chart.tsx:12`) and overrides the palette (`:134`, `:157`). **Unpublished, undocumented (not in meta), untested.** | T5      |
| C2  | Donut center content (🔴 blocker)            | ❌ **gap** — no `centerValue`/`centerLabel`/center slot; donut renders only the ring.                                                              | T2      |
| C3  | Donut thickness / innerRadius (🟠 major)     | ❌ **gap** — inner radius hardcoded `outerR * 0.6` (`pie-chart.tsx:122`); not controllable.                                                         | T2      |
| C4  | Square `size` shorthand (🟡 minor)           | ❌ **gap** — only separate `width`/`height` (default height 300); no `size` shorthand.                                                              | T2      |
| C5  | Empty state (🟡 minor)                       | ⚠️ partial — `ChartFrame` sets `data-state="empty"` + renders the a11y fallback table at `total===0`, but **no visible `NO DATA` placeholder**.   | T3      |
| C6  | Tooltip `value (pct%)` in slice color (🟡)   | ⚠️ partial — `TooltipModel.format?` exists (`data-point.ts:19`) but `PieChart` exposes no formatter prop, points carry no percent, no slice color. | T3      |

### Charts — StackedBarChart → `BarChart` (`mode: 'stacked'`)

| #   | Finding (feedback severity)                  | Verified state today                                                                                                                              | Tranche |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| C7  | Per-series / per-segment color (🔴 blocker)  | ✅ **already in source** — `BarChartSeries.color?: string` exists (`bar-chart.tsx:16`) and overrides the palette (`:195`, `:281`). Same ship/doc/test gap as C1. | T5      |
| C8  | Pre-stacked data shape (🟠 major)            | ❌ **gap** — Cascivo wants column-oriented `series[]` + `x`/`y`; consumer data is per-bar `{ label, segments[] }`. No row-shape path or pivot recipe. | T4      |
| C9  | Axis / grid theming (🟡 minor)               | ✅ tokens exist — `--cascivo-chart-grid` / `--cascivo-chart-axis` drive `GridLines`/`Axis`. Needs the **bridge-mapping doc** only.                  | T5      |
| C10 | X-label thinning (🟡 minor)                  | ⚠️ `xTicks` (count) exists; not confirmed to always include the final category; no `xLabelEvery`.                                                  | T4      |
| C11 | Stacked tooltip per-segment breakdown (🟡)   | ⚠️ formatter hook exists; no stacked default that lists per-layer values in layer colors, no `label · total` header.                               | T4      |
| C12 | Tiny embedded sizing < 200px (🟡)            | ⚠️ `plain` + explicit `width`/`height` exist; crispness/no-clipped-axis under ~160px not verified by a test.                                       | T4      |

### Editor — publish blocker (gates Phase 4)

| #   | Finding                                                | Verified state today                                                                                                                              | Tranche |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| E1  | Published `0.1.1` ships no `dist/`                     | ❌ **confirmed gap** — `@cascivo/editor` is **absent from the root `build:release` filter** (`package.json`'s `vp run -F …` list omits it), so the release workflow never builds it before `changeset publish`. The package's own `build` script is correct. | T1      |
| E2  | Consumers served cached-empty `0.1.1`                  | ❌ — needs a **version bump** (e.g. `0.1.2`) via a changeset so npm/pnpm don't serve the stale same-version artifact.                               | T1      |
| E3  | Registry copy-paste path empty (`files: []`)           | ✅ **by design** — the editor is `isNpmInstalled` (`install: "@cascivo/editor"`); empty `files[]` is correct. **Decline** the feedback's suggestion to populate it. | T1      |
| E4  | No guard that the tarball contains `dist/`             | ❌ **gap** — nothing fails the release if `dist/` is missing. Add a defensive `prepack`/`prepublishOnly` build + a `npm pack --dry-run` assertion. | T1      |

**Net:** the editor is one urgent, contained release fix (T1). The charts color "blocker" is a ship/doc/test task
(T5), and the real chart feature work is the donut center/thickness/size (T2), the empty-state + percentage tooltip
(T3), and the stacked-bar authoring ergonomics + per-segment tooltip (T4).

---

## What exists today (verified against the codebase)

| Area                         | State                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PieChart`                   | `pie-chart.tsx` — `data: PieChartDatum[]` (`{ id, label, value, color? }`), `donut`, `width`/`height`, `legend`, `plain`. Inner radius hardcoded `outerR*0.6`; tooltip points have no percent; no center API. Meta (`pie-chart.meta.ts`) does **not** list `color`. |
| `BarChart`                   | `bar-chart.tsx` — `series: BarChartSeries<Datum>[]` (`{ id, label, data, color? }`) + `x`/`y` accessors, `orientation`, `mode: 'grouped' \| 'stacked'`, `xTicks`/`yTicks`, `legend`, `tooltip`, `plain`. Stacked layers honor `color`; tooltip is per-point (`x(d): y(d)`), no stacked breakdown. |
| `ChartFrame` + tooltip       | `core/chart-frame.tsx` + `core/data-point.ts` — `TooltipModel { points, format? }`, `defaultFormat = "label: value"`, an aria-live region + focus ring. Sets `data-state="empty"`; renders an a11y `fallback` table. No visible empty placeholder. |
| Theming tokens               | `--cascivo-chart-1..8` (palette), `--cascivo-chart-grid`, `--cascivo-chart-axis` — already consumed by marks/`GridLines`/`Axis`. The LifeOS bridge maps these onto the consumer palette (consumer-side; we document the recipe). |
| Charts distribution          | `@cascivo/charts` is npm-installed (in the root `build:release` filter; published). The color override exists in source but has not shipped in the version `lifosy` tested. |
| Editor release pipeline      | Root `release` = `pnpm build:release && changeset publish`; `build:release` = `vp run -F …build` over **ten** packages — **`@cascivo/editor` is not in the list**. `release.yml` runs `regen` + `vp check` (no `pnpm build`) before changesets. Editor `package.json` has `"files": ["dist"]`, a correct `build` script, no `prepack`. |
| Editor registry entry        | `generate.ts` marks `type: 'editor'` `isNpmInstalled` → `install: "@cascivo/editor"`, `files: []` (by design). |

---

## Target state (after v48)

| Concern                                  | Today                                                       | Target                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@cascivo/editor` publish                | `0.1.1` tarball has no `dist/` — unimportable                | built in the release filter + defensive `prepack`; `0.1.2` published with `dist/{index.js,index.d.ts,editor.css}` verified by `npm pack --dry-run` |
| Pie/Bar per-datum color                  | in source, unpublished, undocumented, untested              | shipped, documented in metas + a cookbook, covered by tests (the headline adoption unblock)            |
| Donut center                             | none                                                        | `centerValue?`/`centerLabel?` (+ optional center slot) rendered in the ring center                     |
| Donut thickness                          | hardcoded `outerR*0.6`                                       | `thickness?` / `innerRadius?` controllable (clamped, sensible default = today's ratio)                 |
| Square sizing                            | separate `width`/`height`, default height 300               | `size?` shorthand (sets `width===height`); documented for donuts                                       |
| Empty state                              | `data-state="empty"` + a11y table only                      | visible, theme-aware `NO DATA` placeholder (configurable label) — no NaN arc, keyboard-reachable        |
| Pie tooltip                              | no formatter exposed, no percent                            | `value (pct%)` default in slice color + a `tooltipFormat?` escape hatch; percent available to formatter |
| Stacked-bar authoring                    | column `series[]` + accessors only                          | documented pivot recipe **and** a tiny `toStackedSeries()` helper from `{ label, segments[] }`          |
| Stacked tooltip                          | per-point `label: value`                                    | stacked default: `label · total` header + per-layer non-zero values in layer colors; `tooltipFormat?` escape hatch |
| X-label thinning                         | `xTicks` count, last-label unconfirmed                      | `xTicks` documented to always include the final category, or `xLabelEvery?` added                       |
| Tiny embedded sizing                     | unverified                                                  | tested: `plain` + explicit `width`/`height` render crisply < 200px tall with no clipped axis            |
| Preact compat                            | verified for `Button`                                       | chart smoke test mounts `PieChart` + `BarChart` under the `preact/compat` bridge                        |
| Out of scope                             | —                                                           | no new chart types, no animation/interaction engine, no editor feature work (only the publish fix)      |

---

## Key open decisions (recommendations in the master plan)

1. **Editor fix scope.** *Recommendation: add `@cascivo/editor` to the root `build:release` filter, add a defensive
   `prepack` (build) + a `pack --dry-run` assertion, and ship `0.1.2` via a changeset.* This is the minimal, correct
   fix for the verified root cause. Do **not** add `pnpm build` to `release.yml` directly — the filter is the single
   list the project already uses; the missing entry is the bug. Decline populating the registry `files[]` (E3).
2. **Donut center API.** *Recommendation: `centerValue?: string` + `centerLabel?: string` as the primary API
   (matches the consumer's `centerLabel`/`centerValue` exactly), with an optional `centerSlot?: ReactNode` for
   custom content.* Render only when `donut`. Avoid a children-render API as the primary path (keeps the
   declarative-props model the other props use).
3. **Donut thickness API.** *Recommendation: expose `thickness?: number` (ring width in px) **and** accept
   `innerRadius?: number`; derive whichever isn't given; default to today's `outerR*0.6` so existing donuts are
   pixel-identical.* Clamp to `[0, outerR)`. Document that `thickness` is the consumer-friendly name (matches their
   API), `innerRadius` the geometric one.
4. **Stacked authoring ergonomics.** *Recommendation: ship a tiny pure helper `toStackedSeries(rows)` that pivots
   `{ label, segments: { key, value, color }[] }[]` into `BarChartSeries[]` + `x`/`y`, **and** document the manual
   pivot in a cookbook.* A helper beats forcing every consumer to hand-roll the pivot; keep it dependency-free in
   `@cascivo/charts`. Do **not** add a second data-shape prop to `BarChart` (keeps the component's contract single).
5. **Tooltip formatting.** *Recommendation: add a `tooltipFormat?: (p) => string` escape hatch to both charts
   (threads into `TooltipModel.format`), and make the **stacked** bar + **pie** defaults richer (pie: `value (pct%)`
   in slice color; stacked: `label · total` + per-layer breakdown).* Percent/segment data must reach the formatter —
   extend `ChartPoint` with optional `percent?`/`series` context as needed without breaking existing points.
6. **Empty state.** *Recommendation: a small, theme-aware centered `NO DATA` text inside `ChartFrame` when
   `data-state="empty"`, with a configurable `emptyLabel?` (i18n built-in default), replacing the empty SVG.* Keep
   the a11y fallback table. Never an NaN arc.
7. **Preact compat for charts.** *Recommendation: add a chart smoke test mounting `PieChart` + `BarChart` under the
   established `preact/compat` + `@preact/signals-react → @preact/signals` bridge (as done for `Button`).* Charts use
   `useSignals()` already; confirm they mount and update.
8. **Scope discipline.** *Recommendation: this roadmap is adoption-parity for the two named consumer surfaces only —
   no new chart types, no animation, no editor features. The editor work is purely the publish fix.*

---

## Cross-cutting rules

1. **Verify-then-build.** Where the feedback names a "blocker" that already exists in source (C1/C7 color, C9
   tokens), the work is ship + document + test — not re-implementing. Where the registry/`files[]` reflects an
   intentional design (E3), the feedback is declined with a note, not silently followed.
2. **Additive & backward-compatible.** Every new prop is optional with a default that preserves today's render
   pixel-for-pixel (donut inner radius stays `outerR*0.6` unless overridden; no tooltip/empty change unless opted
   into a richer default). `tokenizeDocument`-style public surfaces unchanged. No prop renames.
3. **Signals, not hooks (CLAUDE.md).** Charts stay `useSignals()`-first; no `useState`/`useEffect`/`useContext`/
   `useReducer`; DOM side effects via `useSignalEffect`; `useRef` only for DOM. New helpers (`toStackedSeries`) are
   pure and framework-free.
4. **i18n built-ins.** User-visible strings (the `NO DATA` empty label) default from the `@cascivo/i18n` built-in
   catalog (`t(builtin.…)`), overridable per-instance — never hardcoded English.
5. **Responsive / a11y unchanged.** No off-scale breakpoint literals; static fallback before any progressive CSS;
   touch targets and the a11y fallback table preserved; reduced-motion / forced-colors safe; tiny sizes stay crisp.
6. **Release safety.** The editor publish fix is guarded by a `pack --dry-run` assertion that the three `dist/`
   entry points exist; the version bump goes through a changeset; the `@cascivo/charts` changes ship via a changeset
   too. No manual publishes.
7. **Generated artifacts in sync.** Prop/meta/string changes flow through `pnpm regen` (registry/llms/README/
   schema/context/specs); drift gate (`pnpm regen && vp check --fix && git diff --exit-code`) green; generated files
   committed.
8. **Full gate green before each commit.** `pnpm ready` (regen → `vp check --fix` → build → type check → tests),
   plus `breakpoint:check` / `fallback:check`. For release-pipeline changes, also `pnpm ready:ci` (cold-cache,
   sequential build) to catch build-ordering regressions.
9. **Out-of-scope stays out.** No new chart types, no chart animation/interaction engine, no editor feature work;
   the component metas keep the parity boundary honest.

---

## Definition of Done

### T1 — Editor publish fix (unblocks Phase 4)

- [ ] `@cascivo/editor` is added to the root `build:release` filter in `package.json` so the release workflow builds
      its `dist/` before `changeset publish`. A defensive `prepack` (or `prepublishOnly`) running the package `build`
      is added so a stray manual publish cannot ship an empty tarball.
- [ ] A `npm pack --dry-run` assertion (script or CI step) confirms the tarball lists `dist/index.js`,
      `dist/index.d.ts`, and `dist/editor.css`; it **fails** against today's no-`dist` state and passes after the fix.
- [ ] A changeset bumps `@cascivo/editor` to `0.1.2` (so consumers aren't served the cached-empty `0.1.1`); the
      registry `files: []` is **left as-is** (npm-installed by design) with a one-line note recording why E3 is
      declined.
- [ ] `pnpm ready:ci` green (cold-cache build includes editor); `pnpm exec vp run @cascivo/editor#build` then
      `npm pack --dry-run` shows the three entry points.

### T2 — PieChart donut center + thickness + square size

- [ ] `centerValue?: string` + `centerLabel?: string` (and optional `centerSlot?: ReactNode`) render in the donut
      center (only when `donut`); pixel-centered, theme-aware, in the a11y tree. Pie (non-donut) is unaffected.
- [ ] `thickness?: number` / `innerRadius?: number` control the ring; default reproduces today's `outerR*0.6`
      exactly; values are clamped to a valid range. `size?: number` shorthand sets `width===height`.
- [ ] Meta (`pie-chart.meta.ts`) lists the new props; tests cover center content, custom thickness geometry, and
      `size` shorthand; default render is unchanged (snapshot).

### T3 — PieChart empty-state + percentage tooltip

- [ ] At `total === 0`, a visible, theme-aware `NO DATA` placeholder renders (configurable `emptyLabel?`, i18n
      built-in default) instead of an empty/NaN arc; the a11y fallback table is preserved.
- [ ] A `tooltipFormat?: (p) => string` escape hatch is added; the pie default tooltip shows `value (pct%)` in the
      slice color (percent reaches the formatter via `ChartPoint`). Existing non-tooltip render unchanged.
- [ ] Meta updated; tests cover the empty placeholder, the percentage default, and a custom formatter; a11y aria-live
      announcement still fires.

### T4 — StackedBarChart ergonomics + per-segment tooltip + label thinning + tiny sizing

- [ ] A pure, dependency-free `toStackedSeries(rows)` helper pivots `{ label, segments: { key, value, color }[] }[]`
      into `BarChartSeries[]` + `x`/`y`, preserving per-segment `color`; exported from `@cascivo/charts` and unit-tested.
      A cookbook documents both the helper and the manual pivot recipe.
- [ ] The stacked tooltip default lists `label · total` then each non-zero segment in its layer color; a
      `tooltipFormat?` escape hatch is available. `xTicks` is documented to always include the final category, or
      `xLabelEvery?` is added and tested.
- [ ] A test confirms `plain` + explicit `width`/`height` render crisply < 200px tall with no clipped axis; meta
      updated; default grouped/stacked render unchanged.

### T5 — Charts adoption hardening: color (ship/doc/test), Preact compat, bridge docs

- [ ] `PieChartDatum.color` and `BarChartSeries.color` are added to the component metas, covered by explicit tests
      (palette override beats positional color), and called out in a migration/cookbook doc as the resolution of the
      feedback's headline blocker (C1/C7). `@cascivo/charts` is queued for republish via the T6 changeset.
- [ ] A chart **Preact-compat smoke test** mounts `PieChart` + `BarChart` under the `preact/compat` +
      `@preact/signals-react → @preact/signals` bridge and asserts they render + update (mirrors the `Button` spike).
- [ ] A cookbook documents the **LifeOS bridge recipe**: mapping `--cascivo-chart-1..8`, `--cascivo-chart-grid`,
      `--cascivo-chart-axis` onto a consumer palette (C9), with a worked `cascivo.css` example.

### T6 — Docs, meta, registry, Storybook, changeset, regen & gate

- [ ] `ChartsPage.tsx` (docs) + Storybook stories show the new pie (center/thickness/size, empty, pct tooltip) and
      stacked-bar (helper, per-segment tooltip) capabilities; React stories call `useSignals()`, no banned hooks; apps
      build without a prior full build (charts source alias intact).
- [ ] Changesets land the `@cascivo/charts` minor bump (new props + helper) and the `@cascivo/editor` `0.1.2` patch;
      `CHANGELOG`s/versions updated via changesets; both feedback files' acceptance checklists are satisfied or their
      remaining items explicitly deferred with a note.
- [ ] `pnpm regen` + drift gate clean; full CI gate green (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`,
      `breakpoint:check`, `fallback:check`, `pnpm ready:ci`); grep sweep confirms the new chart surface reached the
      metas, READMEs, registry, and tests; `docs/ROADMAP-V48.md` status flipped to Shipped.
