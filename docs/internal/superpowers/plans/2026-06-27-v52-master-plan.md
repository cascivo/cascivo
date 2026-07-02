# v52 — Charts: nivo + visx Audit (Expressiveness · Performance · Composability) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between `@cascivo/charts` and the two React dataviz libraries teams reach for when they
outgrow a basic kit — [**nivo**](https://nivo.rocks/) (batteries-included components; SVG **+ Canvas**; patterns/
gradients; react-spring motion; ~29 types) and [**visx**](https://visx.airbnb.tech/) (a low-level composable toolkit
of ~30 primitive packages; first-class brush/zoom/drag/voronoi interaction) — per the audit in
`docs/ROADMAP-V52.md`. The study confirmed cascivo **leads both on accessibility and theming** (keyboard nav +
`aria-live` + fallback tables on every chart; CVD-safe across 14 themes) and on **zero runtime dependencies**. The
deficit is **expressiveness** (gradients/patterns/curves/glyphs), **performance** (no Canvas path for large data),
**interaction** (no brush/zoom/voronoi), **composability** (the engine is private, not a documented toolkit), and a
**focused set of exotic types** (Sankey/Sunburst/Stream/Calendar).

Governing thesis: **adopt the best ideas of nivo and visx without abandoning cascivo's identity.** Take visx's
composable-primitives + interaction toolkit and nivo's expressiveness + Canvas performance, but keep components
batteries-included, keep a11y + theming as the moat (Canvas never replaces the a11y tree), add **no** motion-library
dependency (CSS/SVG-native transitions only), and ship a **focused four** exotic types — explicitly deferring the GIS/
network/long-tail (Flow already covers node/edge graphs).

Deliver: **(T1)** gradient + pattern fills and an expanded curve set; **(T2)** point-glyph shapes + note/connector
annotations + threshold shading; **(T3)** Brush + zoom/pan + voronoi-mesh hover; **(T4)** a Canvas rendering path for
high-density Line/Scatter/Heatmap; **(T5)** the engine promoted to a documented composable toolkit; **(T6)** Sankey +
Sunburst + Stream + Calendar heatmap; **(T7)** reduced-motion-gated enter/update/exit transitions + a "vs nivo / vs
visx" comparison + toolkit reference + recipe gallery. Every change stays **inside `packages/charts/*` and the docs
surfaces that read from it**. **Do not** invert into a primitives-first library, add react-spring, ship an HTML
renderer, add GIS/network/long-tail types, or regress the a11y fallback.

Target state (verified after T7):

| Finding (lens · severity)                                   | Today                                                          | Target                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| N-1 No Canvas renderer (nivo · 🔴)                          | SVG only                                                      | opt-in `renderer="canvas"` (or auto) for dense Line/Scatter/Heatmap; SVG a11y table intact  |
| N-2 No gradient/pattern fills (nivo+visx · 🟠)              | solid token fills                                            | `<defs>` gradient + pattern fills derived from `--cascivo-chart-*`                            |
| N-3 Two curves only (nivo+visx · 🟠)                        | linear, monotone                                            | + step(before/after), natural, basis, cardinal, catmull-rom                                 |
| V-1 No brush/zoom/pan (visx · 🔴)                           | none                                                         | keyboard-operable Brush range-select + chart pan/zoom                                        |
| V-2 No voronoi-mesh hover (visx · 🟠)                       | rectilinear `nearest` only                                  | voronoi tessellation for precise dense-scatter/line hover                                    |
| V-3 No glyph shapes (visx · 🟠)                             | `<circle>` only                                             | circle/square/diamond/triangle/cross/star glyphs for scatter/line                            |
| V-4 No note/threshold annotations (visx+nivo · 🟠)         | reference line/area/dot (v51)                                | + note-with-connector/label + threshold/difference shading                                   |
| V-5 Engine private, undocumented (visx · 🟠)               | exported, undocumented                                       | documented public toolkit + "build your own chart" guide                                     |
| N-5 Missing exotic types (nivo · 🟠)                        | 18 types                                                     | + Sankey, Sunburst, Stream, Calendar heatmap (22)                                            |
| N-4 Thin transitions (nivo · 🟡)                           | fade-in only                                                 | enter/update/exit, fully off under `prefers-reduced-motion`, no react-spring                 |
| N-6 a11y + theming lead (✅ protect)                        | keyboard + aria-live + tables; 14 themes                    | unchanged — preserved in every new renderer/type/interaction                                 |
| Zero runtime deps (✅ protect)                              | none beyond peers                                            | unchanged — no react-spring, no d3                                                           |
| Full gate (`pnpm ready`)                                   | green                                                        | green                                                                                       |

**Architecture & evidence (reproduced in-repo before planning):**

- **Engine** (`packages/charts/src/engine/`): `scale.ts` (`linearScale`, `bandScale`, `niceTicks`), `scale-log.ts`,
  `scale-time.ts`, `shape.ts` (`linePath`/`areaPath`/`arcPath`/`stackSeries`/`splitDefined`; curve param is
  `'linear' | 'monotone'` at `shape.ts:31`), `nearest.ts` (rectilinear hit-test), `stats.ts`, `treemap.ts` (squarified
  layout — a template for Sunburst/Icicle layouts). These are the substrate every primitive and new type builds on.
- **Chrome** (`chrome/`): `axis.tsx`, `grid-lines.tsx`, `legend.tsx` (interactive toggle → `hidden` signal),
  `reference.tsx` (v51 annotations: `ReferenceLine`/`Area`/`Dot` + `renderAnnotations`), `data-label.tsx` (v51 value
  labels). **No gradient/pattern/glyph/brush/zoom/voronoi modules exist** (verified: 0 grep hits).
- **Frame/core** (`core/`): `chart-frame.tsx` owns the SVG `role="img"`, responsive `useChartSize`, the focusable
  keyboard layer (Arrow/Home/End/Escape/Enter-Space), the `aria-live` region, the focus ring, `onSelect`, the
  reduced-motion fade-in (`chart-frame.module.css`), and the `ChartTooltip`. `nearest.ts` does hit-testing. **This is
  where brush/zoom/voronoi/Canvas hook in** — most interaction + the renderer switch land here, not per-chart.
- **Charts** (`charts/`, 18): line, area, bar, pie, scatter, sparkline, meter, kpi, histogram, boxplot, bubble, combo,
  heatmap, treemap, radar, bullet, radial-bar, funnel. Scatter renders plain `<circle>` (`scatter-chart.tsx`); line/
  area take `curve?: 'linear' | 'monotone'`. Each has a sibling `*.meta.ts` with an `intent` block.
- **Renderers:** SVG only — `chart-frame.tsx` renders an `<svg>`; there is no `<canvas>` anywhere (N-1). nivo's Canvas
  variants exist because SVG DOM nodes are the bottleneck past ~5–10k marks.
- **Docs surfaces:** generated llms/registry/context (`pnpm regen`), `apps/storybook/stories/chart/*` (hand-written),
  `apps/site/src/pages/ChartsPage.tsx` (docs showcase), `apps/site/src/marketing/pages/ChartsPage.tsx` (the v51
  marketing page). The engine has no public-facing reference yet (V-5).
- **CLAUDE.md constraints (binding on every tranche):** signals only — `useSignal`/`useComputed`/`useSignalEffect`/
  `useMachine`; **no** `useState`/`useEffect`/`useContext`/`useReducer`; `useRef` for DOM only (Canvas `<canvas ref>`
  and imperative paint go through `useSignalEffect`); React example/bench apps call `useSignals()` first; motion is
  progressive + reduced-motion gated; touch targets ≥44px under `pointer: coarse`; no off-scale `@media`/`@container`
  literals; CSS `@function`/`if()` only with a static fallback; user-visible strings default from `@cascivo/i18n`;
  every component exported from the package index. **Dependency policy: no new runtime deps** (no d3, no react-spring).

**Tech Stack:** React 18+ SVG + (new) Canvas 2D in `@cascivo/charts`; signals via `@cascivo/core`; i18n via
`@cascivo/i18n`; the existing engine/chrome/frame; CSS-token theming (`--cascivo-chart-*`, `--cascivo-chart-grid`).
Docs in `apps/site` (Preact) + `apps/storybook`. No new runtime dependencies.

---

## Tranche Overview

| Tranche | Title                                          | Goal                                                                                                                                                                                            |
| ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Visual enrichment: gradients, patterns, curves | Add SVG `<defs>` gradient + pattern fills (a `chrome/defs.tsx` registry that mints theme-derived `linearGradient`/`pattern` ids) wired into Area/Bar/Pie via a `fill="gradient"`/`fill="pattern"` opt-in; expand `engine/shape.ts` curve factories to step/stepBefore/stepAfter/natural/basis/cardinal/catmull-rom alongside linear/monotone. |
| T2      | Glyphs & richer annotations                    | A `chrome/glyph.tsx` set (circle/square/diamond/triangle/cross/star) usable as scatter/line point marks (`glyph` prop), encoding a 2nd categorical dimension. Extend `chrome/reference.tsx` with a note-with-connector annotation (subject + leader line + label, like `@visx/annotation`) and a threshold/difference band (`@visx/threshold`). |
| T3      | Interaction toolkit                            | `chrome/brush.tsx` (keyboard-operable range selector subsetting a series), zoom/pan in `core/chart-frame.tsx` (wheel + pinch + keyboard, with a reset), and `engine/voronoi.ts` (a dependency-free Fortune/Delaunay-lite tessellation) feeding precise nearest-point hover for dense scatter/line. All keyboard-reachable; the `aria-live` readout follows the active point. |
| T4      | Canvas rendering path                          | A `core/canvas-frame.tsx` (or a `renderer` branch in `chart-frame`) that paints Line/Scatter/Heatmap marks to a `<canvas>` via `useSignalEffect` when `renderer="canvas"` (or auto, past a density threshold). The SVG chrome (axes/grid/legend/annotations) and the **full a11y fallback table + `aria-live` + keyboard layer** stay in the DOM over the canvas. |
| T5      | Composable primitives toolkit                  | Promote the engine to a documented, public surface: stable exports + JSDoc for scales, shapes, curves, `nearest`/`voronoi`, plus the chrome primitives (`Axis`, `GridLines`, `Glyph`, gradient/pattern `defs`, a new wrapping `Text`). Ship a "build your own chart with `ChartFrame` + primitives" guide. Harden any rough edges the toolkit framing exposes (e.g. axis `Text` wrapping, V-6). |
| T6      | High-demand exotic types                       | `Sankey` (flow layout: node ranks + link routing), `Sunburst` (radial hierarchy, reusing `arcPath` + a partition layout), `Stream` (stacked area with wiggle/silhouette offset — extends `stackSeries`), and `Calendar` (GitHub-style day grid heatmap). Each: component + `*.meta.ts` (intent) + tests + Storybook story + LLM/registry/context docs + index export. |
| T7      | Transitions + comparison docs                  | CSS/SVG-native enter/update/exit transitions (line-draw, bar-grow, arc-sweep, fade), all under `@media (prefers-reduced-motion: no-preference)` and driven by `useSignalEffect` — no react-spring. Publish a "cascivo vs nivo vs visx" comparison page (honest: a11y/deps/themes win; Canvas/exotic-types parity), the toolkit/primitives reference, and a recipe gallery (folding in v51's deferred docs). |

Ordering rationale: **T1 → T2** are cheap, ubiquitous expressiveness wins that unblock richer demos. **T3** is the
signature interaction work and wants the visual layer settled. **T4** (Canvas) is the heaviest and most isolated — a
parallel paint behind a flag. **T5** documents the toolkit (needs T1–T3's primitives to exist). **T6** adds the
exotic types. **T7** animates + documents the finished surface. T1–T4 are largely independent; T5–T7 depend on them.

---

## Files Created / Modified per Tranche

### T1 — Visual enrichment

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/defs.tsx` (gradient + pattern `<defs>` registry + `useChartDefs` id minting) + `defs.test.tsx` |
| Modify | `packages/charts/src/engine/shape.ts` (curve factories: step/stepBefore/stepAfter/natural/basis/cardinal/catmull) + `shape.test.ts` |
| Modify | `charts/{area-chart,bar-chart,pie-chart,line-chart}/*.tsx` (`fill`/`curve` prop additions) + their `*.meta.ts` |
| Modify | `packages/charts/src/index.ts` (export defs + curve types) |

### T2 — Glyphs & richer annotations

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/glyph.tsx` (`Glyph` + shape set) + `glyph.test.tsx` |
| Modify | `packages/charts/src/chrome/reference.tsx` (add `note` annotation with connector + `threshold` band) + `reference.test.tsx` |
| Modify | `charts/{scatter-chart,line-chart,bubble-chart}/*.tsx` (`glyph` prop) + metas |
| Modify | `packages/charts/src/index.ts` |

### T3 — Interaction toolkit

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/brush.tsx` + `brush.test.tsx`; `engine/voronoi.ts` + `voronoi.test.ts` |
| Modify | `packages/charts/src/core/chart-frame.tsx` (zoom/pan transform + voronoi hover option; brush slot) |
| Modify | `charts/{line-chart,area-chart,bar-chart,scatter-chart}/*.tsx` (forward `brush`/`zoom`/`hover="voronoi"`) + metas |

### T4 — Canvas rendering path

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/core/canvas-layer.tsx` (a `<canvas>` painted via `useSignalEffect`) + `canvas-layer.test.tsx` |
| Modify | `packages/charts/src/core/chart-frame.tsx` (`renderer?: 'svg' \| 'canvas' \| 'auto'`; paint marks to canvas, keep SVG chrome + a11y in DOM) |
| Modify | `charts/{line-chart,scatter-chart,heatmap}/*.tsx` (accept `renderer`, provide a canvas paint callback) + metas |

### T5 — Composable primitives toolkit

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/chrome/text.tsx` (wrapping/measured `Text`) + `text.test.tsx` |
| Modify | engine + chrome exports with JSDoc; `packages/charts/src/index.ts` (curated public toolkit surface) |
| Create | `apps/site` engine/toolkit reference page + a "build your own chart" walkthrough |

### T6 — Exotic types

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `engine/{sankey,hierarchy,stream}.ts` (layouts) + tests |
| Create | `charts/{sankey,sunburst,stream,calendar}/{*.tsx,*.meta.ts,*.test.tsx}` |
| Modify | `packages/charts/src/index.ts`; add stories `apps/storybook/stories/chart/{sankey,sunburst,stream,calendar}.stories.tsx`; regen llms/registry/context |

### T7 — Transitions + docs

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/core/transitions.module.css` (keyframes under `prefers-reduced-motion: no-preference`) |
| Modify | charts to tag marks with transition classes; `core/chart-frame.tsx` (update-transition hook via `useSignalEffect`) |
| Create | `apps/site` "vs nivo / vs visx" comparison page + recipe gallery; update `docs/ROADMAP-V52.md` → Shipped |

---

## Key Decisions

### Decision 1 — Adopt visx's ideas as additive primitives, not a library inversion (firm)

visx is primitives-first and unstyled; cascivo is components-first and styled. **Decision: add visx's primitives
(glyphs, brush, zoom, voronoi, gradient/pattern, wrapping Text) and *document the engine as a toolkit* (T5), but keep
the default experience batteries-included — a `<LineChart>` still Just Works.** The toolkit is an escape hatch for
power users, not the primary API. Rejected: re-architecting into a `@cascivo/charts/primitives`-first model (a
different product; throws away cascivo's "correct + accessible by default" thesis).

### Decision 2 — Canvas is an additional paint; the a11y tree stays in the DOM (firm)

nivo's Canvas variants are separate components that lose the SVG DOM. **Decision: when `renderer="canvas"`, paint only
the dense marks to a `<canvas>` via `useSignalEffect`; keep the axes/grid/legend/annotations as SVG and keep the
**full keyboard layer + `aria-live` readout + visually-hidden fallback `<table>`** in the DOM over the canvas.** Canvas
is a performance paint, never a replacement for the a11y tree (N-6). Rejected: a standalone `LineCanvas` component that
drops accessibility (nivo's tradeoff — unacceptable for cascivo).

### Decision 3 — No motion-library dependency; transitions are CSS/SVG-native (firm)

nivo animates with react-spring. **Decision: enter/update/exit transitions are CSS keyframes + SVG attribute
transitions (`stroke-dashoffset` line-draw, `transform` bar-grow, arc-sweep), wrapped in
`@media (prefers-reduced-motion: no-preference)`, with any JS timing via `useSignalEffect` — no react-spring, no
d3-transition.** Preserves the zero-dependency lead. Rejected: react-spring (dependency weight; fights signals).

### Decision 4 — Dependency-free voronoi + layouts (firm)

visx/nivo lean on d3 (`d3-delaunay`, `d3-sankey`, `d3-hierarchy`). **Decision: implement voronoi (T3), Sankey/partition/
stream layouts (T6) from scratch in `engine/*`, matching the existing zero-dependency engine (which already hand-rolls
scales, monotone curves, and squarified treemap).** Accept the implementation cost to keep the dependency policy.
Rejected: adding `d3-*` packages (violates the policy; the engine already proves hand-rolling is viable).

### Decision 5 — Ship a focused four exotic types; defer the long tail and refuse GIS/network (firm)

nivo has ~29 types. **Decision: T6 ships only Sankey, Sunburst, Stream, and Calendar — the four highest-demand types
cascivo lacks. Defer Chord/Bump/Swarm/Waffle/Marimekko/Icicle/ParallelCoordinates/CirclePacking/PolarBar/TimeRange/
Wordcloud/ViolinPlot; refuse GeoMap/Choropleth (GIS is its own domain) and Network (covered by `@cascivo/flow`).**
Rejected: chasing type-count parity (a different, much larger product; most of the tail is rarely used).

### Decision 6 — Gradients/patterns derive from existing tokens; no new theming model (firm)

**Decision: the `defs.tsx` registry mints gradients/patterns from the existing `--cascivo-chart-*` palette (e.g. a
series color → a same-hue vertical gradient; a pattern stroked in the series color), so they stay CVD-safe and
theme-true with no new tokens.** Rejected: a separate gradient/pattern token system (theming sprawl; risks CVD
regressions the palette already guarantees).

### Decision 7 — Docs/comparison are honest about where cascivo loses (firm)

**Decision: the T7 "vs nivo / vs visx" page states plainly where cascivo wins (a11y, zero deps, theming, owned code)
and where the others still lead (nivo's type-count + maturity; visx's primitive breadth + ecosystem) — a credibility
asset, not a hit piece.** Rejected: a one-sided comparison (undercuts the "we sweat the details / are honest" brand).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final push
   if build config or workspace deps changed.
2. **Charts blast radius.** Changes stay in `packages/charts/*` and the docs surfaces that read from charts
   (`apps/site` charts/comparison/recipe pages, `apps/storybook/stories/chart`, generated `public/llms|r|context`).
   No token-model or theming change; `@cascivo/i18n` touched only for new built-in strings.
3. **Zero new runtime dependencies.** No `d3-*`, no `react-spring`. Voronoi, Sankey/partition/stream layouts, and all
   transitions are hand-rolled in-repo (Decision 3/4).
4. **Signals, not hooks.** `useSignal`/`useComputed`/`useSignalEffect`/`useMachine`/`useRef`-for-DOM only. Canvas paint
   and zoom/brush listeners go through `useSignalEffect`; no `useState`/`useEffect`/`useContext`/`useReducer`.
5. **Accessibility is the moat — never regress it.** Every new renderer (Canvas), type (Sankey/Sunburst/Stream/
   Calendar), and interaction (brush/zoom/voronoi) keeps the `role="img"` + `aria-live` tooltip + keyboard layer +
   visually-hidden fallback `<table>`. Canvas keeps the DOM a11y tree (Decision 2). WCAG 2.2 AA.
6. **Motion safety.** All transitions wrapped in `@media (prefers-reduced-motion: no-preference)`, produce a correct
   static frame when suppressed, no layout shift, no infinite motion.
7. **Theming + CVD.** Gradients/patterns/glyphs/new types read `--cascivo-chart-*` / `--cascivo-chart-grid`; the
   CVD-safe palette + 14-theme check stay green; no hard-coded colors.
8. **i18n.** New user-visible strings default from the `@cascivo/i18n` built-in catalog; no hard-coded English.
9. **Responsive + breakpoints.** New chrome respects `useChartSize`; brush handles / interactive marks ≥44px under
   `pointer: coarse`; no off-scale `@media`/`@container` literals; the charts mobile sweep passes at 320/360/390/414.
10. **Single source of truth for docs.** Per-type/LLM docs derive from `*.meta.ts`; after `pnpm regen` the drift check
    (`git diff --exit-code`) is clean; every new chart is exported from the package index.
11. **Out-of-scope stays out.** No primitives-first inversion; no motion/d3 dependency; no HTML renderer; no GIS/
    network/long-tail types; no palette/theming change; the a11y fallback is never dropped.
