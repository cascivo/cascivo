# v48 — Consumer-Adoption Parity: Charts Fidelity + Editor Publish Fix — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock `@lifosy/ui`'s adoption of two Cascivo surfaces, per two consumer-feedback docs dated 2026-06-24
(`docs/feedback/feedback-lifosy-charts.md`, `docs/feedback/feedback-lifosy-editor.md`), verifying each item against
today's code first. Two corrections drive the plan: (1) the charts feedback's headline "blocker" — per-datum/
per-series `color` — **already exists in source** (`PieChartDatum.color` at `pie-chart.tsx:12`, `BarChartSeries.color`
at `bar-chart.tsx:16`); the consumer is on the stale published build and the override is undocumented (not in the
metas) + untested, so it's a **ship/doc/test** task, not a feature. (2) The editor's empty registry `files[]` is
**correct by design** (`generate.ts` marks the editor `isNpmInstalled` → `install: "@cascivo/editor"`), so that
feedback suggestion is **declined**. The verified editor root cause is narrower than the feedback guessed:
`@cascivo/editor` is **missing from the root `build:release` filter** in `package.json`, so the release workflow
never builds its `dist/` before `changeset publish` — the published `0.1.1` tarball is empty and unimportable.

Deliver: **(T1)** fix the editor publish pipeline + ship `0.1.2`; **(T2)** add donut center content +
thickness/innerRadius + square `size` to `PieChart`; **(T3)** add a visible empty-state + a `value (pct%)`
slice-colored tooltip to `PieChart`; **(T4)** add stacked-bar authoring ergonomics (`toStackedSeries` helper +
pivot cookbook) + a per-segment stacked tooltip + label-thinning + tiny-size verification to `BarChart`; **(T5)**
ship/document/test the per-datum color override, add a chart Preact-compat smoke test, and write the LifeOS bridge
recipe; **(T6)** docs/Storybook/registry/changesets/regen + full gate, flipping `docs/ROADMAP-V48.md` to Shipped.
Every change is **additive and backward-compatible** — defaults reproduce today's render pixel-for-pixel.
**Do not** add new chart types, an animation/interaction engine, or any editor feature work (the editor change is
purely the publish fix). The companion study (`docs/ROADMAP-V48.md`) verifies each finding against the current code
and records the decisions.

Target state (verified after T6):

| Finding (feedback severity)                         | Today                                          | Target                                                                          |
| --------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Editor `0.1.1` ships no `dist/` (🔴)                | absent from `build:release` filter → empty tarball | in the filter + defensive `prepack`; `0.1.2` published, `pack --dry-run` verified |
| Pie/Bar per-datum color (🔴, already in source)     | in source, unpublished/undocumented/untested   | shipped, in metas + cookbook, tested                                            |
| Donut center content (🔴)                           | none                                           | `centerValue?`/`centerLabel?` (+ optional `centerSlot?`)                        |
| Donut thickness (🟠)                                | hardcoded `outerR*0.6`                          | `thickness?`/`innerRadius?`, default = today's ratio, clamped                   |
| Square `size` (🟡)                                  | separate `width`/`height`                       | `size?` shorthand (`width===height`)                                            |
| Pie empty state (🟡)                                | `data-state="empty"` + a11y table only          | visible theme-aware `NO DATA` placeholder (i18n `emptyLabel?`)                   |
| Pie tooltip `value (pct%)` (🟡)                     | no formatter exposed, no percent                | slice-colored `value (pct%)` default + `tooltipFormat?` escape hatch            |
| Stacked authoring shape (🟠)                        | column `series[]` + accessors only              | `toStackedSeries(rows)` helper + cookbook pivot recipe                          |
| Stacked tooltip breakdown (🟡)                      | per-point `label: value`                        | `label · total` + per-layer non-zero values in layer colors + `tooltipFormat?` |
| X-label thinning (🟡)                               | `xTicks` count, last unconfirmed                | documented last-inclusion or `xLabelEvery?`                                     |
| Tiny embedded sizing < 200px (🟡)                   | unverified                                      | tested crisp, no clipped axis                                                   |
| Charts under Preact compat                          | verified for `Button`                           | smoke test mounts `PieChart` + `BarChart`                                       |
| Axis/grid bridge tokens (🟡)                        | tokens exist                                    | LifeOS bridge recipe documented                                                 |
| Full CI gate (`pnpm ready` / `ready:ci`)            | green                                          | green                                                                            |

**Architecture & evidence (reproduced in-repo before planning):**

- **Editor root cause:** root `package.json` `build:release` =
  `vp run -F @cascivo/core -F @cascivo/i18n -F @cascivo/icons -F @cascivo/charts -F @cascivo/mcp -F @cascivo/react
  -F @cascivo/registry -F @cascivo/storage -F @cascivo/themes -F @cascivo/tokens -F cascivo build` — **ten packages,
  no `@cascivo/editor`.** Root `release` = `pnpm build:release && changeset publish`. `.github/workflows/release.yml`
  runs `regen` + `vp check --fix` (no `pnpm build`) then `changesets/action` with `publish: pnpm run release`. So
  `changeset publish` ships the editor (`private: false`) with no `dist/`. Its own `build` script
  (`vp build && flatten-types && check-types-flat`) is correct but never invoked in CI. No `prepack`/`prepublishOnly`.
- **Editor registry (decline E3):** `scripts/registry/generate.ts:127` — `isNpmInstalled = type === 'chart' || 'flow'
  || 'editor'`; the editor entry emits `install: "@cascivo/editor"` and `files: []` by design (copy-paste path is
  intentionally empty; consumers npm-install). Populating `files[]` would contradict the generator.
- **PieChart:** `packages/charts/src/charts/pie-chart/pie-chart.tsx` — `PieChartDatum { id, label, value, color? }`
  (color override present + honored at `:134`/`:157`); inner radius hardcoded `outerR * 0.6` (`:122`); donut renders
  only the ring (no center); tooltip points (`buildTooltip`) carry `label`/`value` but **no percent**; empty handled
  by `ChartFrame` `data-state="empty"` + the a11y `fallback` table (no visible placeholder). `pie-chart.meta.ts`
  does **not** list `color`.
- **BarChart:** `packages/charts/src/charts/bar-chart/bar-chart.tsx` — `BarChartSeries { id, label, data, color? }`
  (color honored at `:195`/`:281`); `mode: 'grouped' | 'stacked'` with `stackSeries()` offsets; `xTicks`/`yTicks`
  (counts); `tooltip` builds per-point `ChartPoint`s (no stacked breakdown). Column-oriented `series[]` + `x`/`y`
  accessors only — no row/stacked-friendly shape.
- **Chart frame + tooltip:** `core/chart-frame.tsx` + `core/data-point.ts` — `TooltipModel { points, format? }`,
  `defaultFormat(p) = "${label}: ${value}"`, aria-live announcement, focus ring. Formatter hook exists but is not
  surfaced as a prop on either chart.
- **Theming tokens:** `--cascivo-chart-1..8`, `--cascivo-chart-grid`, `--cascivo-chart-axis` already consumed by
  marks/`GridLines`/`Axis`. The consumer maps them in its own `cascivo.css` bridge — we document the recipe.
- **CLAUDE.md constraints:** signals only (no `useState`/`useEffect`/`useContext`/`useReducer`); `useSignalEffect`
  for DOM side effects; `useRef` only for DOM; React apps call `useSignals()` first; i18n built-ins for user-visible
  strings; reduced-motion + forced-colors safe; static fallback before progressive CSS; no off-scale breakpoint
  literals.

**Tech Stack:** owned TypeScript in `@cascivo/charts` (no new runtime deps; pure `toStackedSeries` helper);
`@cascivo/core` signals + `@cascivo/i18n` built-in catalog for the empty label; the existing `ChartFrame`/tooltip/
`Legend`/`Axis`/`GridLines` chrome + `engine/{shape,scale}.ts`; Vitest + @testing-library/react (+ a `preact/compat`
mount for the smoke test); changesets for the editor `0.1.2` + charts minor bump; `npm pack --dry-run` for the
tarball assertion; vite+ (`vp`) for check/build/test; `pnpm regen` + drift gate for generated artifacts.

---

## Tranche Overview

| Tranche | Title                                                          | Goal                                                                                                                                                  |
| ------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Editor publish fix (unblocks Phase 4)                          | Add `@cascivo/editor` to the root `build:release` filter; add a defensive `prepack` build + a `npm pack --dry-run` assertion (3 dist entry points); changeset → `0.1.2`. Decline registry `files[]` (E3) with a note. The urgent, contained fix. |
| T2      | PieChart donut center + thickness/innerRadius + square `size`  | Add `centerValue?`/`centerLabel?` (+ optional `centerSlot?`) rendered in the donut center; `thickness?`/`innerRadius?` (default = today's `outerR*0.6`, clamped); `size?` shorthand. Meta + tests; default render pixel-identical. |
| T3      | PieChart empty-state + percentage tooltip                      | Visible theme-aware `NO DATA` placeholder (`emptyLabel?`, i18n built-in) at `total===0`; `tooltipFormat?` escape hatch + a `value (pct%)` slice-colored default (percent reaches the formatter). Meta + tests. |
| T4      | StackedBarChart ergonomics + tooltip + label-thinning + sizing | Pure `toStackedSeries(rows)` pivot helper (+ cookbook); stacked tooltip default (`label · total` + per-layer breakdown in layer colors) + `tooltipFormat?`; confirm/`xLabelEvery?` last-label; verify tiny (<200px) crisp render. Tests. |
| T5      | Charts adoption hardening: color ship/doc/test + Preact + bridge | Add `color` to both metas, add explicit override tests, document C1/C7 resolution; chart Preact-compat smoke test (pie + bar under the bridge); LifeOS bridge cookbook (`--cascivo-chart-*` → consumer palette). |
| T6      | Docs, meta, registry, Storybook, changesets, regen & gate      | Docs `ChartsPage` + Storybook stories for the new capabilities; changesets (charts minor + editor `0.1.2`); `pnpm regen` + drift + full gate + `ready:ci` + grep sweep; satisfy both feedback acceptance checklists; flip roadmap → Shipped. |

Ordering rationale: **T1 first** — it's the urgent, independent publish bug gating Phase 4 and touches only release
config (no chart code), so it ships value immediately and de-risks the rest. **T2→T3** build the `PieChart` feature
gaps in dependency order (center/geometry, then the empty/tooltip polish that reuses the same render path). **T4**
is the self-contained `BarChart` work (helper + tooltip + labels + sizing). **T5** closes the headline color
"blocker" as a ship/doc/test task and adds the cross-cutting adoption guards (Preact smoke, bridge recipe) that
depend on the props being final. **T6** lands all docs/Storybook/registry/changesets + the full gate and verifies
both feedback checklists. T2–T5 share the charts package and tooltip/meta seams and are sequenced for one reviewer;
T6 finalizes.

---

## Files Created / Modified per Tranche

### T1 — Editor publish fix

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `package.json` (add `-F @cascivo/editor` to the `build:release` script)                       |
| Modify | `packages/editor/package.json` (add `prepack`/`prepublishOnly` running `build`; version stays — changeset bumps it) |
| Create | `packages/editor/scripts/check-pack.mjs` (assert `npm pack --dry-run` lists the three `dist/` entry points) |
| Create | `.changeset/editor-dist-publish-fix.md` (patch bump `@cascivo/editor` → `0.1.2`)              |
| Modify | `docs/ROADMAP-V48.md` (record E3 declined; check off T1 when landed)                          |

### T2 — PieChart donut center + thickness + size

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.tsx` (`centerValue`/`centerLabel`/`centerSlot`; `thickness`/`innerRadius`; `size`) |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.meta.ts` (new props)                          |
| Modify | `packages/charts/src/engine/shape.ts` (only if `arcPath`/inner-radius helper needs a param; otherwise compute innerR in the component) |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.test.tsx` (center, thickness geometry, `size`, unchanged default) |

### T3 — PieChart empty-state + percentage tooltip

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/charts/src/core/chart-frame.tsx` (render a visible empty placeholder when `data-state="empty"`) |
| Modify | `packages/charts/src/core/data-point.ts` (optional `percent?`/context on `ChartPoint` for the formatter) |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.tsx` (`tooltipFormat?`; `emptyLabel?`; pct in points; slice-colored default) |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.meta.ts` (new props), i18n built-in catalog (empty label key) |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.test.tsx` (empty placeholder, pct default, custom formatter, aria-live) |

### T4 — StackedBarChart ergonomics + tooltip + labels + sizing

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/engine/stacked.ts` (`toStackedSeries(rows)` pure pivot) + `stacked.test.ts` |
| Modify | `packages/charts/src/index.ts` (export `toStackedSeries`)                                     |
| Modify | `packages/charts/src/charts/bar-chart/bar-chart.tsx` (`tooltipFormat?`; stacked tooltip default; `xLabelEvery?` if added) |
| Modify | `packages/charts/src/charts/bar-chart/bar-chart.meta.ts` (new props)                          |
| Modify | `packages/charts/src/charts/bar-chart/bar-chart.test.tsx` (stacked tooltip, label thinning, tiny-size crisp render) |
| Create | `docs/cookbooks/charts-stacked-bar.md` (pivot recipe + `toStackedSeries`)                     |

### T5 — Charts adoption hardening: color + Preact + bridge

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.meta.ts`, `bar-chart.meta.ts` (document `color`) |
| Modify | `packages/charts/src/charts/pie-chart/pie-chart.test.tsx`, `bar-chart.test.tsx` (explicit color-override assertions) |
| Create | `packages/charts/src/charts/charts-preact-compat.test.tsx` (mount pie + bar under `preact/compat` bridge) |
| Create | `docs/cookbooks/charts-lifeos-bridge.md` (map `--cascivo-chart-1..8`/`-grid`/`-axis` onto a consumer palette) |

### T6 — Docs, meta, registry, Storybook, changesets, regen & gate

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/docs/src/pages/ChartsPage.tsx` (new pie/stacked-bar capability sections)                |
| Create | `apps/storybook/stories/charts/*.stories.tsx` (center/thickness/size/empty/pct + stacked tooltip/helper) |
| Create | `.changeset/charts-adoption-parity.md` (minor bump `@cascivo/charts`)                         |
| Modify | `packages/charts/readme.body.md` (→ README via regen), `registry.json`/llms/schema (via `pnpm regen`) |
| Modify | `docs/feedback/feedback-lifosy-charts.md`, `feedback-lifosy-editor.md` (tick acceptance items / note deferrals) |
| Modify | `docs/ROADMAP-V48.md` (status → Shipped)                                                      |
| Verify | `pnpm regen`; drift gate; full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `pnpm ready:ci`); grep sweep |

---

## Key Decisions

### Decision 1 — Editor fix is the `build:release` filter + a defensive `prepack` + a version bump (firm)

The verified root cause is that `@cascivo/editor` is absent from the root `build:release` `-F` list, so CI never
builds its `dist/` before `changeset publish`. **Decision: add `-F @cascivo/editor` to `build:release`, add a
`prepack` (or `prepublishOnly`) that runs the package `build` as defense-in-depth, add a `npm pack --dry-run`
assertion that the three `dist/` entry points (`index.js`, `index.d.ts`, `editor.css`) are present, and bump to
`0.1.2` via a changeset.** Rejected: adding `pnpm build` directly to `release.yml` (the filter is the single list
the project already uses — the missing entry *is* the bug; duplicating build logic in the workflow invites drift).
Rejected: hand-publishing (no manual publishes — release goes through changesets).

### Decision 2 — Decline populating the registry `files[]` (E3) (firm)

The editor's empty registry `files[]` is **intentional**: `generate.ts` marks `type: 'editor'` as `isNpmInstalled`
and emits `install: "@cascivo/editor"`. **Decision: leave `files[]` empty and record in `docs/ROADMAP-V48.md` why
the feedback's suggestion #3 is declined** — the copy-paste path is deliberately empty; consumers npm-install.
Following the feedback here would contradict the generator and the distribution model. Rejected: special-casing the
editor to emit files (breaks the npm-installed contract shared with charts/flow).

### Decision 3 — Color override (C1/C7) is a ship/doc/test task, not a feature (firm)

`PieChartDatum.color` and `BarChartSeries.color` already exist and are honored. **Decision: do not re-implement;
instead add them to the component metas, add explicit override tests (a per-datum color beats the positional
palette), and republish `@cascivo/charts` via the T6 changeset** so the consumer's "blocker" is closed by shipping
what's already there. Record in the roadmap that this was verified-not-built. Rejected: treating it as new work
(wasteful and risks regressing a working path).

### Decision 4 — Donut center is `centerValue`/`centerLabel` props (+ optional slot), not a children API (recommended)

The consumer's API is exactly `centerLabel` + `centerValue`. **Decision: mirror it with `centerValue?: string` +
`centerLabel?: string` as the primary, declarative API, plus an optional `centerSlot?: ReactNode` escape hatch for
custom content; render only when `donut`.** Keeps the props-driven model the rest of the component uses and makes
the swap a 1:1 prop map for the consumer. Rejected: a render-children API as the primary path (inconsistent with the
other props; harder to serialize in the manifest/docs).

### Decision 5 — Donut thickness: expose both `thickness` and `innerRadius`, default to today's ratio (firm)

Inner radius is hardcoded `outerR*0.6`. **Decision: accept `thickness?: number` (ring width, the consumer-friendly
name) **and** `innerRadius?: number` (geometric); derive whichever isn't supplied; when neither is given, reproduce
`outerR*0.6` exactly so existing donuts are pixel-identical; clamp to `[0, outerR)`.** Rejected: only `innerRadius`
(forces the consumer to convert from their `thickness`); changing the default ratio (would silently alter every
existing donut).

### Decision 6 — Stacked authoring: a pure `toStackedSeries` helper + a cookbook, not a second data prop (firm)

The consumer's data is row-oriented (`{ label, segments[] }`); `BarChart` wants column `series[]` + accessors.
**Decision: ship a pure, dependency-free `toStackedSeries(rows)` that pivots
`{ label, segments: { key, value, color }[] }[]` → `BarChartSeries[]` (preserving per-segment `color`) plus the
`x`/`y` accessors, exported from `@cascivo/charts`, and document both the helper and the manual pivot in a
cookbook.** Rejected: adding a second `data` shape prop to `BarChart` (two ways to feed one component muddies the
contract and the manifest); forcing every consumer to hand-roll the pivot (the feedback's "🟠 Major" friction).

### Decision 7 — Tooltips: a `tooltipFormat?` escape hatch + richer pie/stacked defaults (firm)

`TooltipModel.format` exists but isn't surfaced. **Decision: add `tooltipFormat?: (p) => string` to both charts
(threads into `TooltipModel.format`), and ship richer defaults — pie: `value (pct%)` in the slice color (percent
reaches the formatter via an optional `ChartPoint.percent`); stacked bar: `label · total` then each non-zero segment
in its layer color.** Percent/segment context is added to `ChartPoint` additively. Rejected: only the escape hatch
(the consumer wants the default to match without writing a formatter); baking pct/segment formatting non-overridably
(the escape hatch is needed for the long tail).

### Decision 8 — Empty state: a visible, theme-aware `NO DATA` placeholder with an i18n label (recommended)

Today `total===0` yields `data-state="empty"` + the a11y table but an empty SVG. **Decision: render a centered,
theme-aware `NO DATA` text inside `ChartFrame` when `data-state="empty"`, with a configurable `emptyLabel?`
defaulting from the `@cascivo/i18n` built-in catalog; keep the a11y fallback table; never render a NaN arc.**
Rejected: a hardcoded English string (violates the i18n rule); leaving it empty (the feedback's "🟡 Minor" but a
real visual gap).

### Decision 9 — Scope discipline: adoption parity only (firm)

**Decision: this roadmap fixes only the two named consumer surfaces.** No new chart types, no animation/interaction
engine, no editor feature work (the editor change is purely the publish fix). The component metas keep the parity
boundary honest. Rejected: bundling unrelated chart/editor improvements (scope creep against the feedback's precise
asks).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit; `pnpm ready:ci` for the T1
   release-pipeline change and before the final T6 push.
2. **Additive & backward-compatible.** Every new prop is optional with a default that preserves today's render
   pixel-for-pixel (donut inner radius stays `outerR*0.6`; no tooltip/empty change unless opted into the richer
   default or a formatter). No prop renames; no breaking signature changes.
3. **Verify-then-build / decline-with-note.** C1/C7 (color) and C9 (tokens) are ship/doc/test, not re-implementation;
   E3 (registry `files[]`) is declined in writing. The roadmap records each correction.
4. **Signals, not hooks.** Charts stay `useSignals()`-first; no `useState`/`useEffect`/`useContext`/`useReducer`;
   DOM side effects via `useSignalEffect`; `useRef` only for DOM. `toStackedSeries` is pure and framework-free.
5. **i18n built-ins.** The `NO DATA` empty label (and any new user-visible string) defaults from the `@cascivo/i18n`
   built-in catalog, overridable per-instance; never hardcoded English.
6. **Release safety.** Editor publish guarded by the `pack --dry-run` assertion; version bumps via changesets only;
   `@cascivo/charts` republished via a changeset. No manual publishes.
7. **Generated artifacts in sync.** Prop/meta/string changes flow through `pnpm regen` (registry/llms/README/schema/
   context/specs); drift gate (`pnpm regen && vp check --fix && git diff --exit-code`) green; generated files
   committed.
8. **Responsive / a11y unchanged.** No off-scale breakpoint literals; static fallback before progressive CSS; touch
   targets + a11y fallback table preserved; reduced-motion / forced-colors safe; tiny chart sizes stay crisp.
9. **Out-of-scope stays out.** No new chart types, no chart animation/interaction engine, no editor feature work; the
   metas + READMEs keep the parity boundary honest.
