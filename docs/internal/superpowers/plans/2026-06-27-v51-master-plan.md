# v51 — Charts: Recharts-Informed Parity & Docs — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between `@cascivo/charts` and [Recharts](https://recharts.github.io/en-US/) on the two axes
where Recharts genuinely leads — **composable enrichment primitives** (annotations, data labels, interaction, motion)
and **documentation depth** (live examples, complete coverage, recipe gallery) — per the audit in
`docs/ROADMAP-V51.md`. The study confirmed cascivo already *exceeds* Recharts on chart-type breadth (17 charts vs
~11; cascivo uniquely has Sparkline/KPI/Bullet/Meter/Boxplot/Histogram) and accessibility (keyboard-navigable
`aria-live` tooltips). The deficit is **horizontal**: any chart should be one prop away from a target line, a value
label, a click handler, or an animation — and one doc page away from a runnable example.

Governing thesis: **cascivo has the charts; it lacks the enrichment primitives that compose onto them and the docs
that surface them.** So six of seven tranches build composable primitives + docs; only T5 adds new chart types, and
it adds the two highest-value ones (RadialBar, Funnel) while deferring the two needing new layout engines (Sankey,
Sunburst).

Deliver: **(T1)** an annotation layer (`ReferenceLine`/`ReferenceArea`/`ReferenceDot`); **(T2)** opt-in data labels;
**(T3)** axis/scale/stacking completeness (axis titles + domain control, percent stacking, `connectNulls`, generalized
per-series axis); **(T4)** interaction & motion (`onDatumClick`/`onSelect`, `Brush`, `syncId`, reduced-motion-gated
animation); **(T5)** RadialBar + Funnel; **(T6)** complete generated docs coverage (per-chart pages, all 17
stories + LLM docs, `meta.intent` chooser); **(T7)** interactive examples + recipe gallery + engine reference. Every
change stays **inside `packages/charts/*` and the docs surfaces that read from it** (`apps/site` charts pages,
`apps/storybook/stories/chart`, `apps/site/public/llms/chart`). **Do not** rearchitect into a composition-first
(`<Chart><Line/></Chart>`) API, add a motion dependency, change the palette/theming model, or rewrite docs infra.

Target state (verified after T7):

| Finding (lens · severity)                                    | Today                                                                          | Target                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| C-F1 No annotation layer (feature · 🔴)                      | no reference primitives anywhere                                               | `ReferenceLine`/`ReferenceArea`/`ReferenceDot` compose onto every cartesian chart       |
| C-F2 No data labels (feature · 🔴)                           | bars/points/slices can't print values                                         | opt-in `labels` on bar/line/area/pie, collision-aware, a11y-safe                        |
| C-F3 No percent/100% stacking (feature · 🟠)                 | bar `mode` = grouped\|stacked only                                            | add `'percent'` stack; AreaChart gains stacked + percent                                |
| C-F4 No `connectNulls` (feature · 🟠)                        | null y → `NaN` path                                                            | `connectNulls` prop; default breaks the line at gaps                                    |
| C-F5 No axis titles / domain control (feature · 🟠)          | axis = scale+ticks only                                                        | `xAxisLabel`/`yAxisLabel` + explicit `domain`/`min`/`max`                                |
| C-F6 Per-series axis limited to ComboChart (feature · 🟡)    | only ComboChart `secondAxis`                                                   | a series can opt onto a right-hand axis on Line/Area/Bar                                 |
| C-F7 Charts not clickable (feature · 🔴)                     | only legend `onClick`                                                          | `onDatumClick`/`onSelect` on every data-bearing chart                                    |
| C-F8 No brush / range-select (feature · 🟠)                  | none                                                                           | `Brush` window subsets a long series; keyboard-operable                                  |
| C-F9 No `syncId` (feature · 🟡)                              | none                                                                           | charts sharing a `syncId` share hovered x-position                                      |
| C-F10 No animation (feature · 🟠)                            | none                                                                           | entrance/update animation, fully off under `prefers-reduced-motion`                     |
| C-F11 Missing RadialBar/Funnel/Sankey/Sunburst (feature · 🟡) | none                                                                          | RadialBar + Funnel ship; Sankey/Sunburst deferred                                       |
| C-D1 Stories 8/17 (docs · 🟠)                                | 8 stories                                                                      | all 17 charts + new types have a story                                                  |
| C-D2 LLM docs 7/17 (docs · 🟠)                               | 7 docs                                                                         | all 17 + new types have an LLM doc                                                       |
| C-D3 No per-chart page (docs · 🟠)                           | one static showcase                                                            | a per-chart doc page (demo + props + when-to-use)                                        |
| C-D4 `meta.intent` unused (docs · 🟡)                        | authored, not rendered                                                         | a "which chart?" chooser driven by `intent`                                             |
| C-D5 Static examples (docs · 🟠)                             | fixed demos                                                                    | live-edit + copy per example                                                            |
| C-D6 No recipe gallery (docs · 🟠)                           | none                                                                           | task-oriented recipe gallery                                                            |
| C-D7 Engine API undocumented (docs · 🟡)                     | exported, undocumented                                                         | scales/shapes/`toStackedSeries`/`stats` documented                                      |
| Full gate (`pnpm ready`)                                     | green                                                                          | green                                                                                   |

**Architecture & evidence (reproduced in-repo before planning):**

- **Engine** (`packages/charts/src/engine/`): `scale.ts` (`linearScale`, `bandScale`), `scale-log.ts`,
  `scale-time.ts` (`timeScale` with `.ticks`/`.tickInterval`), `shape.ts` (`linePath(points, curve)` — `'linear'`/
  `'monotone'`), `stacked.ts`, `nearest.ts`, `stats.ts`, `treemap.ts`. Scales expose `.map(v)`, `.ticks(n)`,
  `.domain`, and (band) `.bandwidth`. These are the substrate every new primitive builds on.
- **Chrome** (`packages/charts/src/chrome/`): `axis.tsx` — `AxisProps = {scale, orientation, length, format?,
  tickCount?, labelEvery?, transform?}`; handles band/time/linear; **no label/title, no domain prop**. `grid-lines.tsx`
  — linear-scale grid only. `legend.tsx` — interactive toggle (`onClick` at `:38`, the only chart `onClick` in the
  package), drives a `hidden` `Set<string>` signal.
- **Frame/tooltip core** (`packages/charts/src/core/`): `chart-frame.tsx` owns the SVG `role="img"`, the
  responsive `useChartSize`, the focusable keyboard layer (Arrow/Home/End/Escape), the `aria-live` region, the focus
  ring, and the `ChartTooltip` overlay — driven by a `TooltipModel { points: ChartPoint[]; format? }`. `nearest.ts`
  does hit-testing. **This is where events (C-F7), brush (C-F8), sync (C-F9), and motion (C-F10) hook in** — most
  interaction lands in the frame, not per-chart.
- **Charts** (`packages/charts/src/charts/`, 17): area, bar, boxplot, bubble, bullet, combo, heatmap, histogram, kpi,
  line, meter, pie, radar, scatter, sparkline, treemap. `bar-chart.tsx` `mode?: 'grouped' \| 'stacked'` (`:26`);
  `combo-chart.tsx` `secondAxis?: boolean` (`:26`, the only dual-axis today); `line-chart.tsx` maps every datum into
  `linePath` (no gap handling). Each chart has a sibling `*.meta.ts` (`ComponentMeta`) with a populated `intent`
  block (`whenToUse`/`whenNotToUse`/`related`).
- **Docs surfaces:** `apps/site/src/pages/ChartsPage.tsx` (one static showcase, all 17 imported); 
  `apps/storybook/stories/chart/` (8 stories — area, bar, bubble, combo, line, pie, scatter, PlainCharts);
  `apps/site/public/llms/chart/` (7 docs — area, bar, bubble, combo, line, pie, scatter); `apps/site/public/r/chart-*.json`
  (registry entries). The per-chart page, recipe gallery, live-edit, and engine docs do not exist.
- **CLAUDE.md constraints (binding on every tranche):** signals only — `useSignal`/`useComputed`/`useSignalEffect`/
  `useMachine`; **no** `useState`/`useEffect`/`useContext`/`useReducer`; `useRef` for DOM only; React example/bench
  apps need `useSignals()` as the first statement of any signal-reading component; DOM side effects (listeners,
  imperative SVG) use `useSignalEffect`; motion is progressive + reduced-motion gated; touch targets ≥44px under
  `pointer: coarse`; never `display:none` content (relocate to a disclosure); no off-scale `@media`/`@container`
  width literals (canonical scale only — `breakpoint:check`); CSS `@function`/`if()` only with a static fallback
  (`fallback:check`); user-visible strings default from `@cascivo/i18n` (`t(builtin.charts.*)`); every component
  exported from `packages/react/src/index.ts`.

**Tech Stack:** React 18+ chart components in `@cascivo/charts` (SVG, signals via `@cascivo/core`, i18n via
`@cascivo/i18n`); the existing engine/chrome/frame; CSS-token theming (`--cascivo-chart-*`, `--cascivo-chart-grid`).
Docs in `apps/site` (Preact) + `apps/storybook`. No new runtime dependencies; no motion library; no docs-framework
change.

---

## Tranche Overview

| Tranche | Title                                          | Goal                                                                                                                                                                                                          |
| ------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Annotation layer                               | Add `ReferenceLine` / `ReferenceArea` / `ReferenceDot` chrome primitives (in `chrome/`) that take a chart's scales and render a horizontal/vertical threshold line, a shaded band, or a labelled marker. Wire an opt-in `annotations` prop (or slot children) into the cartesian charts (Line/Area/Bar/Scatter/Combo). Labels via i18n; `aria` description so the annotation is announced. |
| T2      | Data labels                                    | Add opt-in value labels rendered at each mark — a `labels` prop on Bar/Line/Area/Pie (`labels?: boolean \| { format?, position? }`). Collision-aware placement (above/inside/auto), respects the formatter, sits in the a11y tree (or `aria-hidden` with the value already in the tooltip/fallback table). One shared `data-label` chrome helper. |
| T3      | Axis, scale & stacking completeness            | Axis titles (`xAxisLabel`/`yAxisLabel`) + explicit domain (`domain`/`min`/`max`) on `AxisProps` and the charts that own axes. Percent/100% stacking (`mode: 'percent'`) on Bar; add stacked + percent to Area. `connectNulls` on Line/Area (default: break at `null`). Generalize per-series right-axis assignment (a series `axis?: 'left' \| 'right'`) beyond ComboChart's `secondAxis`. |
| T4      | Interaction & motion                           | `onDatumClick`/`onSelect(datum, series)` wired through `chart-frame`'s focusable layer (click + Enter/Space) on every data-bearing chart. A keyboard-operable `Brush` range-select that subsets a long series. `syncId` so charts sharing an id share the hovered x-index (a small shared signal registry). Reduced-motion-gated entrance (line-draw / bar-grow / area-reveal) + update animation, all suppressed under `prefers-reduced-motion`. |
| T5      | New chart types: RadialBar + Funnel            | `RadialBar` (concentric/stacked radial bars — a circular gauge family, reusing the band/linear scales mapped to angle) and `Funnel` (stacked-stage trapezoids). Each: component + `*.meta.ts` (with `intent`) + tests + Storybook story + LLM doc + registry entry + export from `@cascivo/react`. Sankey + Sunburst explicitly deferred. |
| T6      | Complete, generated docs coverage              | A per-chart documentation page (focused demo + props table from `meta.props` + when-to-use from `meta.intent`). Fill the coverage gaps: a Storybook story and an LLM doc for **all 17** charts + the two new types. Surface `meta.intent` as a "which chart should I use?" chooser. Drift-checked so docs regenerate from metas. |
| T7      | Interactive examples + recipe gallery + engine reference | Make examples live-editable + copyable (reuse the docs app's existing code-block/playground capability). Build a task-oriented recipe gallery (add a target line; label the bars; stack to 100%; connect-nulls; dual-axis; brush a long series; sparkline-in-a-table-cell; a synced dashboard row). Document the public engine API (`linearScale`/`timeScale`/`logScale`, `linePath`, `toStackedSeries`, `stats`). |

Ordering rationale: **T1 → T2** are the highest-leverage, most-requested features and self-contained chrome
additions. **T3** fixes the data/axis correctness gaps (some latent bugs). **T4** is the heaviest and wants the chart
internals settled. **T5** adds the new types. **T6 → T7** document the finished surface (including T1–T5's new
primitives), so docs come last. T1–T5 are largely independent; T6/T7 depend on them.

---

## Files Created / Modified per Tranche

### T1 — Annotation layer

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/reference.tsx` (`ReferenceLine`, `ReferenceArea`, `ReferenceDot` + shared types) |
| Create | `packages/charts/src/chrome/reference.test.tsx`                                                |
| Modify | `packages/charts/src/charts/{line-chart,area-chart,bar-chart,scatter-chart,combo-chart}/*.tsx` (accept + render an `annotations` prop using the resolved scales) |
| Modify | the same charts' `*.meta.ts` (document the `annotations` prop + an example)                    |
| Modify | `packages/charts/src/index.ts` (export the reference primitives); `packages/react/src/index.ts` |

### T2 — Data labels

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/data-label.tsx` (shared label-placement helper) + `*.test.tsx`     |
| Modify | `packages/charts/src/charts/{bar-chart,line-chart,area-chart,pie-chart}/*.tsx` (`labels` prop) |
| Modify | the same charts' `*.meta.ts`                                                                   |
| Modify | `packages/charts/src/index.ts`; `packages/i18n` built-in catalog if a default label string is needed |

### T3 — Axis, scale & stacking completeness

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/charts/src/chrome/axis.tsx` (`label`/title + `domain`/`min`/`max` on `AxisProps`)    |
| Modify | `packages/charts/src/engine/stacked.ts` (percent/expand offset mode)                           |
| Modify | `packages/charts/src/charts/bar-chart/*` (`mode: 'percent'`), `area-chart/*` (stacked + percent), `line-chart/*` + `area-chart/*` (`connectNulls`), per-series `axis?: 'left'\|'right'` on Line/Area/Bar |
| Modify | the touched charts' `*.meta.ts`                                                                |

### T4 — Interaction & motion

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/charts/src/core/chart-frame.tsx` (`onDatumClick`/`onSelect` via the focusable layer; click + Enter/Space; `syncId` hooks; motion classes) |
| Create | `packages/charts/src/core/sync.ts` (a small shared signal registry keyed by `syncId`) + `*.test.ts` |
| Create | `packages/charts/src/chrome/brush.tsx` (keyboard-operable range selector) + `*.test.tsx`        |
| Create | `packages/charts/src/core/motion.module.css` (entrance/update keyframes, all under `@media (prefers-reduced-motion: no-preference)`) |
| Modify | the data-bearing charts to forward `onDatumClick`/`onSelect`/`syncId`/`brush` and tag marks with the motion classes |

### T5 — New chart types: RadialBar + Funnel

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/charts/radial-bar/{radial-bar.tsx,radial-bar.meta.ts,radial-bar.test.tsx}` |
| Create | `packages/charts/src/charts/funnel/{funnel.tsx,funnel.meta.ts,funnel.test.tsx}`                 |
| Modify | `packages/charts/src/index.ts`; `packages/react/src/index.ts`                                  |
| Create | `apps/storybook/stories/chart/{radial-bar,funnel}.stories.tsx`; `apps/site/public/llms/chart/{radial-bar,funnel}.md`; registry entries under `apps/site/public/r/` |

### T6 — Complete, generated docs coverage

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `apps/storybook/stories/chart/{boxplot,bullet,heatmap,histogram,kpi,meter,radar,sparkline,treemap}.stories.tsx` (the 9 missing) |
| Create | `apps/site/public/llms/chart/{boxplot,bullet,heatmap,histogram,kpi,meter,radar,sparkline,treemap}.md` (the 10 missing — incl. the 9 + any new) |
| Create | per-chart doc page + a "which chart?" chooser in `apps/site` (route + component reading `meta` + `meta.intent`) |
| Modify | the docs/registry generator (if LLM docs are generated) so all 17 metas produce a doc; ensure `git diff --exit-code` clean after `pnpm regen` |

### T7 — Interactive examples + recipe gallery + engine reference

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/site` charts pages — make example code blocks live-editable + copyable (reuse existing playground/code-block) |
| Create | a recipe gallery (route + recipes) covering target-line, data-labels, percent-stack, connect-nulls, dual-axis, brush, sparkline-in-cell, synced dashboard |
| Create | engine-reference doc page (scales, shapes, `toStackedSeries`, `stats`) sourced from `index.ts` exports |
| Modify | `docs/ROADMAP-V51.md` (status → Shipped) once T1–T7 land                                       |

---

## Key Decisions

### Decision 1 — Build composable primitives within the existing whole-chart-component model (firm)

Recharts composes children (`<LineChart><Line/><ReferenceLine/></LineChart>`); cascivo uses whole-chart components
with props. **Decision: keep cascivo's props model and add primitives as props (`annotations`, `labels`, `onDatumClick`,
`syncId`, `brush`) plus chrome components usable directly inside `ChartFrame` children when authoring a custom chart —
do not rearchitect into a composition-first API.** Rejected: a Recharts-style children API (a different library, a
breaking rewrite, and it abandons cascivo's "one component, sensible defaults" simplicity thesis). This keeps the
adoption story ("one prop away") intact.

### Decision 2 — Annotations and interaction live in chrome/frame, not duplicated per chart (firm)

The annotation render, the focusable keyboard layer, the tooltip, and hit-testing already live in `chrome/` +
`core/chart-frame.tsx`. **Decision: implement `ReferenceLine`/`Area`/`Dot` as chrome components that take scales, and
implement `onDatumClick`/`syncId`/`brush`/motion in `chart-frame` so every chart inherits them by forwarding props —
no per-chart reimplementation.** Rejected: per-chart event/annotation code (N copies, drift, the exact maintenance
problem the frame abstraction exists to prevent).

### Decision 3 — Charts lead on type-count; spend the type budget on RadialBar + Funnel only (firm)

cascivo has 17 charts to Recharts' ~11 and uniquely owns Sparkline/KPI/Bullet/Meter/Boxplot/Histogram. **Decision:
add only RadialBar (high demand, reuses existing scales mapped to angle) and Funnel (small, stage-trapezoid layout);
defer Sankey + Sunburst — each needs a new layout engine (flow routing / radial hierarchy) and is a roadmap of its
own.** Rejected: chasing 1:1 type parity (lowest-leverage work; the library already leads on breadth).

### Decision 4 — Motion is CSS/SVG-native and reduced-motion gated, no dependency (firm)

CLAUDE bans `useEffect` and mandates reduced-motion safety; the dependency policy keeps `@cascivo/core` lean.
**Decision: entrance/update animation is CSS keyframes + SVG (`stroke-dasharray` line-draw, `transform` bar-grow),
wrapped in `@media (prefers-reduced-motion: no-preference)` so it is fully off for users who opt out; any JS-driven
timing uses `useSignalEffect`, never `useEffect`.** Rejected: `framer-motion`/`d3-transition` (dependency weight, and
they fight the signals model).

### Decision 5 — `connectNulls` defaults to OFF (breaks the line at gaps) (firm)

Today a `null` y silently produces `NaN` (a latent bug). **Decision: a missing/`null` y breaks the line by default;
`connectNulls` opt-in bridges the gap.** This matches Recharts and is the honest default — a gap in the data should
read as a gap, not an invented straight segment. Rejected: defaulting to connect (hides missing data, the misleading
choice).

### Decision 6 — Data labels are opt-in and a11y-correct, not on by default (firm)

Labels crowd dense charts and duplicate the tooltip/fallback-table values already exposed to screen readers.
**Decision: `labels` is opt-in; when on, labels are `aria-hidden` (the value is already in the a11y tree via the
fallback table + `aria-live` tooltip) and collision-aware (auto above/inside).** Rejected: labels on by default
(clutters the common case); labels in the a11y tree (double-announces values already present).

### Decision 7 — Docs come last and regenerate from metas; coverage must hit 17/17 (firm)

Half the catalog lacks a story/LLM doc, and `meta.intent` is authored but unrendered. **Decision: T6/T7 run after the
features land, generate per-chart docs from `*.meta.ts` (single source of truth), and the definition of done is
**every** chart + new type has a story, an LLM doc, and a page — verified by `git diff --exit-code` after `pnpm regen`.**
Rejected: documenting as we go (the new primitives wouldn't be captured); hand-writing per-chart docs (drifts from
the metas — the exact CLAUDE anti-pattern).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final
   push if build config or workspace deps changed.
2. **Charts blast radius.** Changes stay in `packages/charts/*`, the chart exports in `packages/react/src/index.ts`,
   and the docs surfaces that read from charts (`apps/site` charts pages + recipe/engine pages,
   `apps/storybook/stories/chart`, `apps/site/public/llms/chart`, `apps/site/public/r/chart-*`). No token-model or
   theming change; no other package touched except `@cascivo/i18n` if a new built-in string is required.
3. **Signals, not hooks.** Every chart/chrome/frame change uses `useSignal`/`useComputed`/`useSignalEffect`/
   `useMachine`/`useRef`-for-DOM only. No `useState`/`useEffect`/`useContext`/`useReducer`. New signal-reading
   components in React example/bench apps call `useSignals()` first.
4. **Accessibility is non-negotiable.** Annotations carry an accessible description; data labels are `aria-hidden`
   with the value already in the a11y tree; `onDatumClick` is reachable by keyboard (Enter/Space on the focusable
   layer); the brush is keyboard-operable; the `role="img"` + `aria-live` tooltip + fallback table contract is
   preserved. WCAG 2.2 AA.
5. **Motion safety.** All animation is wrapped in `@media (prefers-reduced-motion: no-preference)` and produces a
   correct static frame when suppressed; no layout shift; no infinite motion.
6. **Theming + CVD.** New marks/primitives read `--cascivo-chart-*` / `--cascivo-chart-grid`; the CVD-safe palette
   and the 14-theme check stay green; no hard-coded colors.
7. **i18n.** Any new user-visible string defaults from the `@cascivo/i18n` built-in catalog
   (`t(builtin.charts.<key>)`), overridable per-instance; no hard-coded English.
8. **Responsive + breakpoints.** New chrome respects `useChartSize`; touch targets (brush handles, clickable marks)
   ≥44px under `pointer: coarse`; no off-scale `@media`/`@container` literals (`breakpoint:check`); the charts
   mobile sweep passes at 320/360/390/414.
9. **Single source of truth for docs.** Per-chart docs + LLM docs derive from `*.meta.ts`; after `pnpm regen` the
   drift check (`git diff --exit-code`) is clean; every new/changed chart is exported from `packages/react`.
10. **Out-of-scope stays out.** No composition-first API; no Sankey/Sunburst; no motion dependency; no
    palette/theming change; no docs-framework rewrite.
