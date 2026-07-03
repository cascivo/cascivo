# v53 — Charts: Chart.js + ECharts Audit (Interaction · Data Pipeline · Reach) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between `@cascivo/charts` and the two most-installed JS charting libraries —
[**Chart.js**](https://www.chartjs.org/) (small canvas config library; tree-shakeable; LTTB decimation in core;
configurable animations; a plugin ecosystem) and [**Apache ECharts**](https://echarts.apache.org/en/feature.html)
(a Canvas+SVG engine with **dataZoom**, **visualMap**, **toolbox**, a **dataset/transform/encode** pipeline,
axis-pointer crosshairs, progressive rendering of millions of points, and SSR) — per the audit in
`docs/ROADMAP-V53.md`. The study confirmed cascivo (now 22 chart types after v52) **leads both on accessibility,
theming, and bundle size** (keyboard nav + `aria-live` + fallback tables; CVD-safe palette + patterns; **zero runtime
deps** vs ECharts ~1 MB) and that its annotation layer already covers ECharts' markLine/markPoint/markArea. The
deficit is **interaction depth** (no dataZoom/zoom-pan/connect, point-only tooltips), a **data pipeline** (no
transforms/encode), **big-data reach** (no decimation), a **utility belt** (no toolbox), and a few **high-demand
types** (Candlestick, Polar, Gauge).

Governing thesis: **adopt the dashboard primitives, refuse the monolith.** Take the high-leverage interaction + data
ideas both libraries prove — but keep the **component API** (no `setOption` config object), add **no runtime
dependency** (everything hand-rolled), keep SVG-first (Canvas for large data), refuse WebGL/3D/geo/network (Flow
covers node/edge), and **never regress** the keyboard/aria-live/fallback-table a11y or the CVD-safe palette.

Deliver: **(T1)** slider dataZoom + inside zoom/pan + chart connect/sync; **(T2)** a visualMap (continuous +
piecewise color/size encoding + legend); **(T3)** a data-transform pipeline (filter/sort/aggregate/bin/regression) +
`encode`; **(T4)** an axis crosshair + shared tooltip + LTTB decimation + progressive paint; **(T5)** a toolbox
(export PNG/SVG, data-view table, restore); **(T6)** Candlestick + Polar + Gauge; **(T7)** configurable animation +
a before/after-draw extension hook + a "vs chart.js / vs echarts" comparison + recipe gallery. Every change stays
**inside `packages/charts/*` and the docs surfaces that read from it**. **Do not** add a config-object API, a runtime
dependency, WebGL/3D/geo/network types, or regress the a11y fallback.

Target state (verified after T7):

| Finding (lens · severity)                                   | Today                                                          | Target                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| E-1 No dataZoom / zoom-pan (ECharts · 🔴)                   | Brush window only                                            | slider dataZoom + inside wheel/drag zoom-pan, keyboard-operable                          |
| E-2 No chart connect/sync (ECharts · 🟠)                    | none                                                         | `syncId`/`connect` — shared zoom + hovered-x across a group                              |
| E-3 No visualMap (ECharts · 🔴)                             | none                                                         | continuous + piecewise color/size encoding + a legend                                   |
| E-4 No data pipeline (ECharts · 🟠)                         | caller preps all data                                        | filter/sort/aggregate/bin/regression transforms + `encode`                              |
| E-5 Point tooltips only (ECharts · 🟠)                      | per-point tooltip                                            | axis crosshair + shared tooltip listing all series at the hovered x                     |
| C-1 No decimation (Chart.js · 🟠)                           | canvas paint (Scatter)                                       | LTTB / min-max downsampling + progressive paint for large series                        |
| E-6 No toolbox (ECharts · 🟠)                               | none                                                         | export PNG/SVG, data-view table, restore — keyboard-reachable                           |
| E-8 Missing Candlestick/Polar/Gauge (ECharts · 🟠)         | Meter/RadialBar partial                                      | Candlestick (OHLC), Polar (rose), Gauge (speedometer)                                    |
| C-2 Animations not configurable (Chart.js · 🟡)            | reduced-motion CSS transitions                              | duration/easing/per-property config, still reduced-motion gated                         |
| C-3 No extension hook (Chart.js · 🟡)                       | composable primitives only                                  | a before/after-draw render hook for custom overlays                                     |
| E-9/C-5 a11y + zero-deps lead (✅ protect)                  | keyboard + aria-live + tables; 0 deps                       | unchanged — preserved in every new interaction/type                                     |
| Full gate (`pnpm ready`)                                   | green                                                        | green                                                                                   |

**Architecture & evidence (reproduced in-repo before planning):**

- **Engine** (`packages/charts/src/engine/`): scales (`linear`/`band`/`log`/`time`), `shape.ts` (paths + the v52
  `Curve` set + `splitDefined`), `stacked.ts`, `nearest.ts` (rectilinear) + `voronoi.ts` (v52 cell find/polygons),
  `stats.ts`, `treemap.ts`, and the v52 layouts `stream.ts`/`hierarchy.ts`/`sankey.ts`. **No `transform`, `decimate`,
  `dataZoom`, or `visualMap` module exists** (verified: 0 grep hits) — these are the new engine pieces.
- **Chrome** (`chrome/`): `axis.tsx`, `grid-lines.tsx`, `legend.tsx` (interactive toggle), `reference.tsx`
  (annotations: line/area/dot/note/threshold — covers markLine/Point/Area), `data-label.tsx`, `defs.tsx` (gradients/
  patterns), `glyph.tsx`, `text.tsx` (wrapping), `brush.tsx` (v52 range window). **visualMap, toolbox, and a
  crosshair are new chrome.**
- **Frame/core** (`core/`): `chart-frame.tsx` owns the SVG `role="img"`, `useChartSize`, the focusable keyboard layer
  (Arrow/Home/End/Escape/Enter-Space), the `aria-live` region, `onSelect`, `hover='rect'|'voronoi'`, the v52
  `renderer='svg'|'canvas'` + `paint`, and the reduced-motion transitions (`chart-frame.module.css`). `canvas-layer.tsx`
  paints via `useSignalEffect`. **This is where zoom/pan transform, the crosshair, the shared tooltip, and progressive
  paint hook in** — most of T1/T4 lands in the frame.
- **Charts** (`charts/`, 22): area, bar, boxplot, bubble, bullet, calendar, combo, funnel, heatmap, histogram, kpi,
  line, meter, pie, radar, radial-bar, sankey, scatter, sparkline, stream, sunburst, treemap. The new T6 types
  (candlestick/polar/gauge) join here.
- **No data pipeline:** charts take already-shaped `series`/`data`. The T3 `transform`/`encode` helpers are *opt-in*
  pre-processors the caller pipes data through — they don't change the component contract.
- **Docs surfaces:** generated llms/registry/context (`pnpm regen`), `apps/storybook/stories/chart/*`,
  `apps/site/src/pages/ChartsPage.tsx` (docs), `apps/site/src/marketing/pages/ChartsPage.tsx` (the v51 marketing
  page). The comparison + recipe pages (T7) are new.
- **CLAUDE.md constraints (binding on every tranche):** signals only — `useSignal`/`useComputed`/`useSignalEffect`/
  `useMachine`; **no** `useState`/`useEffect`/`useContext`/`useReducer`; `useRef` for DOM only (zoom listeners, canvas,
  export `<canvas>`/`Blob` go through `useSignalEffect`); React example/bench apps call `useSignals()` first; motion is
  progressive + reduced-motion gated; touch targets ≥44px under `pointer: coarse`; no off-scale `@media`/`@container`
  literals; user-visible strings default from `@cascivo/i18n`; every component exported from the package index.
  **Dependency policy: no new runtime deps** (no chart.js, echarts, or d3).

**Tech Stack:** React 18+ SVG + (existing) Canvas 2D in `@cascivo/charts`; signals via `@cascivo/core`; i18n via
`@cascivo/i18n`; the existing engine/chrome/frame; CSS-token theming. PNG export via the existing Canvas layer; SVG
export by serializing the live `<svg>`. Docs in `apps/site` + `apps/storybook`. No new runtime dependencies.

---

## Tranche Overview

| Tranche | Title                                          | Goal                                                                                                                                                                                                       |
| ------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Zoom, pan & connect                            | Add a slider `DataZoom` chrome (a draggable window with two handles + a draggable body, generalizing the v52 Brush) **and** inside zoom-pan in `chart-frame` (wheel zoom toward cursor, drag pan, pinch, keyboard `+`/`-`/arrows/`0`-reset), re-ticking axes to the visible domain. Add a `core/sync.ts` registry so charts sharing a `syncId` share the zoom window **and** the hovered x-index. All keyboard-operable; reset always present. |
| T2      | visualMap                                      | A `chrome/visual-map.tsx` that maps a numeric data dimension to **color** (a sequential/diverging ramp) and/or **size**, `continuous` or `piecewise`, rendering an interactive legend (drag to filter the continuous range; click to toggle a piece). Wire it into Heatmap/Scatter/Calendar via a `visualMap` prop; CVD-safe ramps derived from the palette. |
| T3      | Data pipeline                                  | `engine/transform.ts` — pure, composable transforms: `filter`, `sort`, `aggregate` (group + sum/mean/min/max/count), `bin` (histogram bucketing), `regression` (linear/exponential/polynomial least-squares). A small `dataset`/`encode` helper maps a 2-D table + an `{x, y, …}` encoding to series. Opt-in pre-processors; the component contract is unchanged. |
| T4      | Crosshair, shared tooltip & decimation         | An axis-pointer **crosshair** (v/h rules following the hovered x) + a **shared (axis-trigger) tooltip** listing every series' value at that x (extends the frame's `TooltipModel` with an axis mode). `engine/decimate.ts` — **LTTB** + **min-max** downsampling; charts decimate dense series before scaling/painting, and the Canvas path paints **progressively** in chunks for very large series. |
| T5      | Toolbox                                        | A `chrome/toolbox.tsx` button cluster: **export PNG** (via the Canvas layer / an offscreen render), **export SVG** (serialize the live `<svg>` + inline computed token colors), **data view** (toggle a readable `<table>` of the series), and **restore** (reset zoom/visualMap/filters). Keyboard-reachable; ≥44px coarse targets. |
| T6      | Candlestick, Polar & Gauge                     | `Candlestick` (OHLC bodies + wicks, up/down colors, optional volume) for financial data; `Polar` (a polar coordinate system: angle = category/value, radius = value — a rose / polar bar-line, reusing `arcPath` + a radial scale); `Gauge` (a speedometer with a needle, value arc, threshold colors, and ticks — distinct from Meter/RadialBar). Each: component + meta (intent) + tests + story + generated docs. |
| T7      | Animation config, extension hook & docs        | A `transition` prop accepting `{ duration, easing, properties }` (reduced-motion gated; falls back to the v52 CSS transitions when unset). A `core/draw-hook` (`onBeforeDraw`/`onAfterDraw` render-prop slots in `ChartFrame`) for one-off custom SVG overlays — cascivo's answer to Chart.js plugins, within the owned-code model. A "vs chart.js / vs echarts" comparison page + a recipe gallery (folding in the v52 deferral). |

Ordering rationale: **T1 first** — zoom/pan/connect is the twice-deferred headline and the substrate for crosshair
(T4). **T2/T3** add encoding + data primitives (independent). **T4** layers crosshair/shared-tooltip on the zoomable
plot and finishes large-data. **T5** is the self-contained toolbox. **T6** adds the new types. **T7** tunes motion,
opens the extension seam, and documents. T1–T5 largely independent; T6/T7 depend on them.

---

## Files Created / Modified per Tranche

### T1 — Zoom, pan & connect

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/data-zoom.tsx` (slider window, generalizes Brush) + `data-zoom.test.tsx`; `core/sync.ts` (syncId registry) + `sync.test.ts` |
| Modify | `core/chart-frame.tsx` (zoom/pan transform signal; wheel/drag/pinch/keyboard; reset; `syncId` mirror) |
| Modify | `charts/{line-chart,area-chart,bar-chart,scatter-chart}/*.tsx` (forward `dataZoom`/`zoom`/`syncId`) + metas |

### T2 — visualMap

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/visual-map.tsx` (continuous + piecewise; color + size; legend) + `visual-map.test.tsx`; `engine/ramp.ts` (CVD-safe sequential/diverging ramps) |
| Modify | `charts/{heatmap,scatter-chart,calendar}/*.tsx` (`visualMap` prop) + metas |

### T3 — Data pipeline

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/engine/transform.ts` (filter/sort/aggregate/bin/regression) + `transform.test.ts`; `engine/dataset.ts` (`encode` table→series) + `dataset.test.ts` |
| Modify | `packages/charts/src/index.ts` (export the pipeline) |

### T4 — Crosshair, shared tooltip & decimation

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/engine/decimate.ts` (LTTB + min-max) + `decimate.test.ts` |
| Modify | `core/chart-frame.tsx` (crosshair rules; `TooltipModel` axis mode + shared tooltip; progressive canvas paint); `core/chart-tooltip.tsx` (multi-series layout) |
| Modify | `charts/{line-chart,area-chart}/*.tsx` (axis tooltip + decimate dense series) + metas |

### T5 — Toolbox

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/toolbox.tsx` (export PNG/SVG, data-view, restore) + `toolbox.test.tsx`; `core/export.ts` (svg-serialize + png-render helpers) |
| Modify | charts to accept `toolbox` + expose a data-view + a reset of zoom/visualMap; metas |

### T6 — Candlestick, Polar & Gauge

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `charts/candlestick/*`, `charts/polar/*`, `charts/gauge/*` (`*.tsx`/`*.meta.ts`/`*.test.tsx`); `engine/polar.ts` (angle/radius coordinate helpers) |
| Modify | `packages/charts/src/index.ts`; add stories `apps/storybook/stories/chart/{candlestick,polar,gauge}.stories.tsx`; regen docs |

### T7 — Animation, extension hook & docs

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `core/chart-frame.tsx` (`transition` config via `useSignalEffect`; `onBeforeDraw`/`onAfterDraw` slots) + `transitions` CSS |
| Create | `apps/site` "vs chart.js / vs echarts" comparison page + recipe gallery; update `docs/ROADMAP-V53.md` → Shipped |

---

## Key Decisions

### Decision 1 — Keep the component API; no `setOption` config monolith (firm)

ECharts is one imperative `setOption({...})` engine. **Decision: every v53 feature is a prop or a component
(`dataZoom`, `visualMap`, `<Toolbox>`, `transform()` helpers) on cascivo's existing component model — never a config
schema.** Rejected: a config-object façade (a different, much larger product; abandons the typed-prop ergonomics and
tree-shaking cascivo has).

### Decision 2 — Generalize the v52 Brush into dataZoom; finally ship inside zoom-pan (firm)

cascivo deferred zoom/pan in v51 and v52. **Decision: T1 generalizes the v52 `Brush` (a fixed window) into a
`DataZoom` slider (draggable window + draggable body) and adds *inside* zoom-pan (wheel/drag/pinch/keyboard) in the
frame, re-ticking axes to the visible domain, with an always-present reset.** Rejected: shipping only the slider
(inside zoom-pan is the more-used half) or deferring again (it's now the top gap).

### Decision 3 — visualMap is CVD-safe by construction; ramps derive from the palette (firm)

**Decision: the visualMap's continuous/diverging ramps are generated from the existing CVD-safe `--cascivo-chart-*`
anchors (`engine/ramp.ts`), so a data→color encoding stays color-vision-safe by default, matching ECharts' visualMap
without its CVD risk.** Rejected: arbitrary user gradients as the default (re-introduces the CVD problem the palette
solves).

### Decision 4 — Transforms are pure, opt-in pre-processors, not a component contract change (firm)

**Decision: `engine/transform.ts` + `dataset/encode` are pure functions the caller pipes data through *before*
passing it to a chart — `<BarChart {...encode(aggregate(rows, …), …)} />`. Charts still take plain `series`/`data`;
the pipeline never becomes required.** Rejected: a `dataset` prop that bakes the pipeline into every component
(couples data shaping to rendering; bloats every chart's API).

### Decision 5 — Everything hand-rolled; no chart.js / echarts / d3 dependency (firm)

**Decision: dataZoom, visualMap, transforms, LTTB decimation, the candlestick/polar/gauge layouts, and PNG/SVG export
are all implemented from scratch in `engine/*`/`chrome/*` — matching the existing zero-dependency engine (which
already hand-rolls scales, curves, voronoi, sankey, partition, stream).** Rejected: pulling `d3-*`/`simple-statistics`
for regression or `lttb` (violates the policy; the engine proves hand-rolling is viable).

### Decision 6 — Decimation + progressive paint, not streaming (firm)

**Decision: T4 adds LTTB/min-max downsampling + chunked (progressive) Canvas painting so a large *static* series
renders fast and crisp; live WebSocket/`appendData` streaming is out of scope.** Rejected: a streaming/real-time data
layer (a different concern; most "big data" charts are large static series).

### Decision 7 — Three focused new types; refuse 3D/geo/network (firm)

**Decision: T6 ships Candlestick (the most-requested missing type — financial), Polar (a reusable coordinate system
unlocking rose/polar bar-line), and Gauge (a true speedometer). Refuse WebGL/3D, geo/choropleth, and force/network
(Flow covers node/edge).** Rejected: chasing ECharts' full series list (3D/geo/GL is a different product).

### Decision 8 — Extensibility via a draw hook, within owned-code (recommended)

Chart.js's extensibility is plugins. **Decision: add a minimal `onBeforeDraw`/`onAfterDraw` render-prop on
`ChartFrame` for one-off custom SVG overlays — a tiny seam, not a plugin framework — since cascivo's primary
extensibility is owned/copy-paste code + the v52 composable primitives.** Rejected: a full plugin registry/lifecycle
(over-engineered for a component library; the primitives + a draw hook cover the real need).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final push
   if build config or workspace deps changed.
2. **Charts blast radius.** Changes stay in `packages/charts/*` and the docs surfaces that read from charts
   (`apps/site` charts/comparison/recipe pages, `apps/storybook/stories/chart`, generated `public/llms|r|context`).
   No token-model or theming change; `@cascivo/i18n` touched only for new built-in strings.
3. **Zero new runtime dependencies.** dataZoom, visualMap, transforms, decimation, the new-type layouts, and PNG/SVG
   export are hand-rolled (Decision 5).
4. **Signals, not hooks.** `useSignal`/`useComputed`/`useSignalEffect`/`useMachine`/`useRef`-for-DOM only. Zoom/pan
   listeners, the export `<canvas>`/`Blob`, and progressive paint go through `useSignalEffect`; no
   `useState`/`useEffect`/`useContext`/`useReducer`.
5. **Accessibility is the moat — never regress it.** Every new interaction (zoom/pan/crosshair/toolbox), encoding
   (visualMap), and type (candlestick/polar/gauge) keeps the `role="img"` + `aria-live` tooltip + keyboard layer +
   visually-hidden fallback `<table>`. The toolbox + data-view are keyboard-reachable. WCAG 2.2 AA.
6. **Motion safety.** Configurable animation stays under `@media (prefers-reduced-motion: no-preference)`, produces a
   correct static frame when suppressed, no layout shift, no infinite motion.
7. **Theming + CVD.** visualMap ramps + new-type marks read `--cascivo-chart-*`; the CVD-safe palette + 14-theme check
   stay green; no hard-coded colors.
8. **i18n.** New user-visible strings (toolbox labels, data-view, gauge units) default from the `@cascivo/i18n`
   built-in catalog; no hard-coded English.
9. **Responsive + breakpoints.** New chrome (dataZoom slider, visualMap legend, toolbox, crosshair) respects
   `useChartSize`; interactive handles ≥44px under `pointer: coarse`; no off-scale `@media`/`@container` literals; the
   charts mobile sweep passes at 320/360/390/414.
10. **Single source of truth for docs.** Per-type/LLM docs derive from `*.meta.ts`; after `pnpm regen` the drift check
    (`git diff --exit-code`) is clean; every new chart exported from the package index.
11. **Out-of-scope stays out.** No config-object API; no chart.js/echarts/d3 dependency; no WebGL/3D/geo/network types;
    no streaming layer; no canvas-only rewrite; the a11y fallback is never dropped.
