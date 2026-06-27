# cascivo — Roadmap v53: Charts — Chart.js + ECharts Audit (Interaction, Data Pipeline & Reach)

**Last updated:** 2026-06-27
**Status:** ✅ Shipped (core) — T1–T7 implemented: a DataZoom slider + inside wheel/drag/keyboard zoom-pan + `syncId`
chart connect; a `visualMap` (continuous + piecewise, CVD-safe oklch ramps); a pure `transform`/`encode` data
pipeline (filter/sort/aggregate/bin/regression); an axis-pointer crosshair + shared tooltip + LTTB/min-max
decimation; a `toolbox` (PNG/SVG export, data view, restore); three new types (Candlestick, Polar, Gauge); and
configurable, reduced-motion-gated animation + `onBeforeDraw`/`onAfterDraw` draw hooks. `@cascivo/charts` is now
**~25 chart types** with **zero runtime dependencies still intact**. Deferred to a follow-up: Bar/Scatter zoom
windowing (Line/Area shipped), progressive Canvas paint for Line/Area, and the interactive apps/site recipe gallery
(an honest comparison + copyable recipes ship as `docs/CHART-LIBRARIES.md`). See the implementation log at the end.
`pnpm ready` green.
**Plan documents:** `docs/superpowers/plans/2026-06-27-v53-master-plan.md` + tranches 1–7
**Builds on:** the v51 + v52 charts work — the engine (`packages/charts/src/engine/{scale,scale-log,scale-time,shape,stacked,nearest,voronoi,stats,treemap,stream,hierarchy,sankey}.ts`),
the chrome (`chrome/{axis,grid-lines,legend,reference,data-label,defs,glyph,text,brush}.tsx`), the frame/canvas core
(`core/{chart-frame,canvas-layer,chart-tooltip,use-chart,data-point,nearest}.*`), the 22 chart components
(`charts/*`), and the docs/showcase surfaces (`apps/site/src/{pages,marketing/pages}/ChartsPage.tsx`,
`apps/storybook/stories/chart/*`).

> **Source of this roadmap.** A structured study of the two most-installed JS charting libraries, each a different
> point on the spectrum: [**Chart.js**](https://www.chartjs.org/) — a small, canvas-based, config-object library
> (~8 chart types, tree-shakeable, a plugin ecosystem, built-in LTTB decimation, rich configurable animations); and
> [**Apache ECharts**](https://echarts.apache.org/en/feature.html) — a heavyweight Canvas **and** SVG engine (~15
> series types + a custom series; **dataZoom**, **visualMap**, **toolbox**, **brush**, a **dataset/transform/encode**
> data pipeline, axis-pointer crosshairs, markLine/Point/Area, progressive rendering of *millions* of points, SSR,
> and `aria`/decal accessibility). Measured against today's `@cascivo/charts` (now 22 types after v52), they sharpen
> a different question than nivo/visx did: **where is cascivo less *interactive*, less *data-capable*, and less
> *reachable* than the engines teams pick for dashboards and big data — and which of their ideas are worth adopting
> without becoming a 1 MB config-driven monolith or abandoning the a11y-first, zero-dependency, signal-driven
> identity?** Each finding below is verified against the source.

---

## Why this roadmap exists

After v51 + v52, `@cascivo/charts` is a deep **batteries-included, accessibility-first** library: 22 chart types, a
from-scratch zero-dependency engine, gradients/patterns/curves/glyphs, an annotation layer (line/area/dot/note/
threshold — covering ECharts' markLine/markPoint/markArea), a Voronoi engine + keyboard Brush, an opt-in Canvas
renderer, and reduced-motion transitions. On **accessibility, theming, and bundle size it leads both** Chart.js
(minimal a11y; ~200 KB + a date adapter) and ECharts (decal/aria help, but ~1 MB and imperative) — keyboard nav +
`aria-live` + fallback tables on every chart, CVD-safe palettes *and* patterns, zero runtime deps. That lead is the
moat to protect.

The study found the gaps are **interaction depth, a data pipeline, and reach into big-data / financial use cases** —
the things Chart.js and (especially) ECharts are reached for:

- **No dataZoom / zoom-pan.** cascivo has a Brush *window* (v52) but no slider-dataZoom, no inside wheel/drag
  zoom-pan, and no way to **connect** charts so one zoom/tooltip drives several. ECharts' `dataZoom` + `connect` is
  its signature dashboard feature; cascivo deferred zoom/pan twice (v51, v52).
- **No visualMap.** There is no component to map a *data dimension* to **color or size** on a continuous or piecewise
  scale, with a legend — the thing that makes ECharts heatmaps, scatter, and calendars encode a third dimension.
- **No data pipeline.** ECharts' `dataset` + `transform` (filter / sort / aggregate / bin / regression) + `encode`
  lets a chart declare its data shaping. cascivo makes the *caller* prepare everything; there are no transforms.
- **No toolbox.** No export-to-PNG/SVG, no data-view table toggle, no restore/reset — ECharts' utility belt that
  users expect on a dashboard.
- **Point tooltips only.** There is no **axis-pointer crosshair** or **shared (axis-trigger) tooltip** that lists all
  series at the hovered x — the standard multi-series hover in both libraries.
- **No large-data decimation.** v52 added a Canvas paint for Scatter, but there is no **LTTB / min-max downsampling**
  (Chart.js ships it in core) or progressive paint to actually serve hundreds of thousands of points.
- **Missing high-demand types: Candlestick/OHLC, a Polar coordinate system (rose), and a speedometer Gauge.** cascivo
  has Meter + RadialBar (partial gauges) but no financial chart and no general polar plotting.
- **Animations aren't configurable.** v52 added reduced-motion CSS transitions; there's no per-property/easing/
  duration animation config (Chart.js's default-on, tunable animations), and no extension/plugin hook for custom draw.

### Framing: adopt the dashboard primitives, refuse the monolith

The first job of this roadmap was to resist the obvious-but-wrong conclusion — "match ECharts." ECharts is a ~1 MB
imperative engine with 3D/WebGL, geographic maps, and force graphs; reproducing it would betray everything cascivo
is. So v53 takes the **high-leverage interaction + data primitives** both libraries prove out — dataZoom + zoom-pan +
chart-connect (T1), visualMap (T2), a data-transform pipeline (T3), axis crosshair + shared tooltip + decimation
(T4), a toolbox (T5) — plus the **three most-requested missing chart types** (Candlestick, Polar, Gauge — T6), and a
**configurable-animation + extension-hook** pass (T7). It **refuses** WebGL/3D (`echarts-gl`), geographic maps, and
force/network graphs (`@cascivo/flow` already covers node/edge), keeps the **component API** (no config-object
monolith), adds **no runtime dependency**, and **never regresses** the keyboard/aria-live/fallback-table a11y or the
CVD-safe palette.

---

## The findings, verified against today's code

Legend: ✅ already a lead to protect · ⚠️ partial / present-but-limited · ❌ genuine gap. Severity is impact on
*dashboard interaction, data capability, and real-world reach*.

### Lens 1 — ECharts (the dashboard/big-data engine)

| #     | Finding (severity)                                              | Verified state today                                                                                              | Tranche |
| ----- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| E-1   | No dataZoom / zoom-pan (🔴)                                     | ❌ `grep -ri datazoom\|zoom packages/charts/src` → 0. A Brush *window* exists (v52) but no slider-dataZoom, no inside wheel/drag zoom-pan. Deferred twice. | T1      |
| E-2   | No chart connect / sync (🟠)                                   | ❌ no `connect`/`syncId` — one chart's zoom/hover can't drive others (deferred since v51).                         | T1      |
| E-3   | No visualMap (continuous / piecewise color+size encoding) (🔴) | ❌ no component maps a data dimension → color/size with a legend (ECharts visualMapContinuous/Piecewise).         | T2      |
| E-4   | No dataset / transform / encode pipeline (🟠)                  | ❌ no filter/sort/aggregate/bin/regression transforms; the caller preps all data.                                 | T3      |
| E-5   | No axis-pointer crosshair / shared tooltip (🟠)                | ⚠️ tooltip is per-point (v51 frame); no crosshair or axis-trigger tooltip listing all series at the hovered x.    | T4      |
| E-6   | No toolbox (export / data-view / restore) (🟠)                 | ❌ no PNG/SVG export, no data-view table, no reset — the dashboard utility belt.                                   | T5      |
| E-7   | markLine / markPoint / markArea (✅ covered)                   | ✅ v51/v52 annotations (line/area/dot/note/threshold) cover these — leave as-is.                                   | —       |
| E-8   | Missing types: Candlestick, Polar (rose), Gauge (🟠)           | ❌ no OHLC/financial; no polar coordinate system; Meter + RadialBar are partial gauges, no speedometer.            | T6      |
| E-9   | a11y + zero-deps **lead** both (✅ protect)                    | ✅ keyboard nav + `aria-live` + fallback tables; CVD-safe palette **+ patterns**; **zero runtime deps** vs ECharts ~1 MB. The moat. | all     |

### Lens 2 — Chart.js (the small canvas config library)

| #     | Finding (severity)                                              | Verified state today                                                                                              | Tranche |
| ----- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| C-1   | No large-data decimation (LTTB / min-max) (🟠)                 | ❌ v52 added a Canvas paint (Scatter) but no downsampling; Chart.js ships LTTB in core for 1M+ points.            | T4      |
| C-2   | Animations not configurable (🟡)                               | ⚠️ v52 added reduced-motion CSS transitions; no per-property/easing/duration config (Chart.js default-on tunable).| T7      |
| C-3   | No extension / plugin hook (🟡)                                | ⚠️ cascivo answers extensibility with composable primitives + owned code (v52 T5), but there's no before/after-draw render hook for one-off custom overlays. | T7      |
| C-4   | Mixed/combo limited to bar+line (🟡)                           | ⚠️ `ComboChart` is bar+line only; no arbitrary per-series type mixing (lower-leverage — noted, not a tranche).    | —       |
| C-5   | Chart.js a11y is minimal; cascivo leads (✅ protect)           | ✅ Chart.js offers alt/aria-label only; cascivo's keyboard + fallback-table + aria-live model is far stronger.     | all     |

**Net:** the two headline gaps are **dataZoom + zoom-pan + connect** (E-1/E-2 — the dashboard interaction cascivo has
deferred twice) and **visualMap** (E-3 — a genuinely missing encoding primitive). Close behind: the **data pipeline**
(E-4), the **crosshair + shared tooltip + decimation** trio (E-5/C-1), and the **toolbox** (E-6). New chart types
(E-8) are real but one focused tranche. Configurable animation + an extension hook (C-2/C-3) are the closing polish.
**a11y + zero-deps (E-9/C-5) is a lead to protect in every tranche, not a tranche of its own.**

---

## Tranche map

| Tranche | Lens(es)         | Theme                                                                                                                  |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| T1      | ECharts          | **Zoom, pan & connect** — a slider `dataZoom` + inside wheel/drag zoom-pan (finally closing the v51/v52 deferral) and a `connect`/`syncId` registry so one chart's zoom + hover drive others. (E-1/E-2) |
| T2      | ECharts          | **visualMap** — a continuous + piecewise component mapping a data dimension to **color** and/or **size**, with a legend; wired into Heatmap/Scatter/Calendar. (E-3) |
| T3      | ECharts          | **Data pipeline** — `engine/transform.ts` (filter / sort / aggregate / bin / regression) + a small `dataset`/`encode` helper, so a chart can declare its data shaping. (E-4) |
| T4      | ECharts + Chart.js | **Crosshair, shared tooltip & decimation** — an axis-pointer crosshair + an axis-trigger tooltip listing every series at the hovered x; plus `engine/decimate.ts` (LTTB / min-max) + progressive paint to serve large series. (E-5/C-1) |
| T5      | ECharts          | **Toolbox** — export to PNG/SVG, a data-view `<table>` toggle, and a restore/reset control; a11y-friendly. (E-6) |
| T6      | ECharts          | **New types** — `Candlestick` (OHLC/financial), `Polar` (a polar coordinate system: rose / polar bar-line), and `Gauge` (a speedometer, distinct from Meter/RadialBar). (E-8) |
| T7      | Chart.js + docs  | **Configurable animation + extension hook + comparison docs** — a per-property/easing/duration animation config (reduced-motion gated), a before/after-draw render hook for custom overlays, and a "vs chart.js / vs echarts" comparison + recipe gallery. (C-2/C-3) |

Ordering rationale: **T1 first** — zoom/pan/connect is the most-requested, twice-deferred dashboard feature and the
foundation everything interactive builds on. **T2/T3** add the encoding + data primitives (independent, high-value).
**T4** layers crosshair/shared-tooltip onto the (now-zoomable) plot and completes the large-data story. **T5** is the
self-contained utility belt. **T6** adds the new types. **T7** tunes motion, opens an extension seam, and documents
the finished surface. T1–T5 are largely independent; T6/T7 depend on them.

---

## Out of scope

- **The ECharts config-object monolith.** cascivo stays a **component** library (`<LineChart …>`), not a single
  `setOption({...})` engine. New features are props/components, not a config schema.
- **WebGL / 3D (`echarts-gl`), geographic maps / choropleth, and force/network graphs.** GIS and 3D are their own
  domains; **node/edge graphs are `@cascivo/flow`**. None enters v53.
- **A new runtime dependency.** dataZoom, visualMap, transforms, decimation (LTTB), candlestick/polar/gauge layouts,
  and PNG/SVG export are all hand-rolled in-repo, per the zero-dependency policy (no chart.js, no echarts, no d3).
- **Regressing accessibility.** Every new interaction (zoom/brush/crosshair), encoding (visualMap), and type
  (candlestick/polar/gauge) keeps the keyboard path, the `aria-live` readout, and the visually-hidden fallback table.
- **Streaming/real-time data sources.** T4 adds *decimation + progressive paint* for large static series; live
  WebSocket/`appendData` streaming is a separate concern, not v53.
- **A canvas-only rewrite.** SVG stays the default (crisp, accessible, themeable); Canvas (v52) + decimation (T4)
  cover large data.

---

## Definition of done (verified after T7)

- Charts pan/zoom (slider dataZoom + inside wheel/drag) and can be connected so one chart's zoom + hover drive a
  group; all keyboard-operable.
- A visualMap maps a data dimension to color/size (continuous + piecewise) with a legend, used by Heatmap/Scatter/
  Calendar.
- A data-transform pipeline (filter/sort/aggregate/bin/regression) + `encode` lets a chart shape its own data.
- An axis crosshair + shared tooltip list all series at the hovered x; large series downsample via LTTB and paint
  progressively.
- A toolbox exports PNG/SVG, toggles a data-view table, and resets — keyboard-reachable.
- Candlestick, Polar (rose), and Gauge ship with metas, tests, stories, and generated docs.
- Animations are configurable (duration/easing/per-property) and fully off under `prefers-reduced-motion`; a
  before/after-draw hook exists; a "vs chart.js / vs echarts" comparison + recipe gallery are published.
- `pnpm ready` green; CVD/theme checks pass across all 14 themes; the charts mobile sweep passes at 320/360/390/414;
  **zero runtime dependencies added**.

---

## Notes

- This roadmap is **Planned, not Shipped** — per the task that produced it (study Chart.js + ECharts, plan the gaps,
  do not implement). The tranche docs carry the task-by-task steps for when implementation begins.
- v53 **closes the long-standing deferrals**: zoom/pan (v51 T4 → v52 T3 → here T1) and chart sync/`syncId`
  (v51 → here T1), plus the v52 follow-ups it can absorb (crosshair/shared tooltip).
- The verification figures (0 dataZoom/visualMap/transform/toolbox/decimation/candlestick/polar/gauge hits, 22 types)
  are point-in-time reads of `main` at 2026-06-27 and should be re-confirmed at implementation start.

---

## Implementation log (2026-06-27)

Shipped across seven commits; `pnpm ready` green (build + type-check + 414 chart tests + repo-wide gate). **No
runtime dependency added** — the moat (zero deps + a11y + theming) is intact.

- **T1 — dataZoom + zoom-pan + connect.** `chrome/data-zoom.tsx` (a Brush with a pannable body), `core/zoom.ts`
  (pure window math) + in-frame wheel/drag/keyboard zoom-pan with a reset and re-ticked axes, and `core/sync.ts`
  (a ref-counted `syncId` registry) so connected charts mirror zoom + hover. Wired into Line/Area. **Closes E-1/E-2.**
  *Deferred:* Bar/Scatter window slicing.
- **T2 — visualMap.** `engine/ramp.ts` (CVD-safe sequential/diverging ramps interpolated in oklch) +
  `chrome/visual-map.tsx` (`mapVisual` + a continuous/piecewise legend that filters the range). Wired into
  Heatmap/Scatter/Calendar. **Closes E-3.**
- **T3 — data pipeline.** `engine/transform.ts` (filter/sort/aggregate/bin/least-squares regression) +
  `engine/dataset.ts` (`encode` a table → series) — pure, composable, dependency-free pre-processors; the component
  contract is unchanged. **Closes E-4.**
- **T4 — crosshair + shared tooltip + decimation.** `TooltipModel` gains `mode:'axis'` → an axis crosshair + one
  tooltip listing every series at the hovered x (keyboard + `aria-live` follow the x); `engine/decimate.ts`
  (LTTB + min-max) decimates dense Line/Area while the fallback table keeps full data. **Closes E-5/C-1.**
  *Deferred:* progressive Canvas paint.
- **T5 — toolbox.** `core/export.ts` (standalone SVG with tokens inlined + a dpr PNG + download) +
  `chrome/toolbox.tsx` (real `<button>`s: PNG/SVG/data-view/restore, i18n-labelled, ≥44px coarse). Wired into
  Line/Area/Heatmap/Scatter, off by default. **Closes E-6.**
- **T6 — new types.** **Candlestick** (OHLC wicks + bodies, up/down colours, optional volume), a **Polar**
  coordinate system (`engine/polar.ts`) powering rose / polar line-area, and a **Gauge** speedometer (value arc +
  threshold zones + ticks + needle + readout) — each with a meta (intent), tests, a story, and generated docs.
  3D/geo/network stay out of scope. **Closes E-8.**
- **T7 — animation + draw hook + docs.** A `transition` prop tunes the reduced-motion-gated enter/update animation
  (duration/easing/properties → CSS vars); `onBeforeDraw`/`onAfterDraw` render slots inject custom SVG behind/over
  the marks (the owned-code answer to Chart.js plugins); `docs/CHART-LIBRARIES.md` publishes an honest
  cascivo/Chart.js/ECharts matrix + a copyable recipe gallery covering the v53 surface. **Closes C-2/C-3.**

### Deferred to a follow-up

- **Bar/Scatter zoom windowing** — Line/Area slice to the zoom window; Bar/Scatter forward the props in a follow-up.
- **Progressive Canvas paint** for very large Line/Area series (decimation already keeps them fast).
- **Interactive apps/site recipe gallery** — the comparison + recipes ship as `docs/CHART-LIBRARIES.md`; a live,
  embedded gallery on the marketing/docs site is the remaining step.
