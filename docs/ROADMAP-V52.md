# cascivo — Roadmap v52: Charts — nivo + visx Audit (Expressiveness, Performance & Composability)

**Last updated:** 2026-06-27
**Status:** 📋 Planned — gap analysis complete and verified against today's `@cascivo/charts` source (post-v51); no
code written yet. This roadmap defines the work; the plan documents below decompose it into seven tranches.
**Plan documents:** `docs/superpowers/plans/2026-06-27-v52-master-plan.md` + tranches 1–7
**Builds on:** the v51 charts work — the engine (`packages/charts/src/engine/{scale,scale-log,scale-time,shape,stacked,nearest,stats,treemap}.ts`),
the chrome (`chrome/{axis,grid-lines,legend,reference,data-label}.tsx`), the frame/tooltip core
(`core/{chart-frame,chart-tooltip,use-chart,data-point,nearest}.*`), the 18 chart components (`charts/*`), and the
docs/showcase surfaces (`apps/site/src/pages/ChartsPage.tsx`, `apps/site/src/marketing/pages/ChartsPage.tsx`,
`apps/storybook/stories/chart/*`).

> **Source of this roadmap.** A structured study of two more React dataviz libraries, each a different philosophy:
> [**nivo**](https://nivo.rocks/) — a *batteries-included component* library (~29 chart types) built on D3 + React,
> with SVG **and Canvas** renderers, react-spring transitions, SVG patterns/gradients, and an annotations module; and
> [**visx**](https://visx.airbnb.tech/) — Airbnb's *low-level composable toolkit* of ~30 unstyled primitive packages
> (scale, shape, axis, grid, curve, glyph, gradient, pattern, brush, zoom, drag, voronoi, annotation, threshold,
> hierarchy, sankey, stats…) plus a higher-level declarative `XYChart`. Measured against today's `@cascivo/charts`,
> they expose the same question from two angles: **where is cascivo less expressive, less performant, or less
> composable than the libraries teams reach for — and which of their ideas are worth adopting without abandoning
> cascivo's a11y-first, zero-dependency, theme-native identity?** Each finding below is verified against the source.

---

## Why this roadmap exists

After v51, `@cascivo/charts` is a strong **batteries-included, accessibility-first** library: 18 chart types, a
from-scratch zero-dependency engine, keyboard-navigable `aria-live` tooltips, CVD-safe palettes across 14 themes,
annotations, data labels, percent stacking, `connectNulls`, click-to-drill `onSelect`, and reduced-motion-gated
entrance motion. On **accessibility and theming it leads both nivo and visx** (nivo's ARIA story is partial; visx is
unstyled by design and ships no a11y). That lead is an asset to protect, not a gap to close.

The study found the gaps are **expressiveness, performance, and composability** — the three things nivo and visx are
each known for:

- **No Canvas renderer.** cascivo is SVG-only. nivo ships SVG **and Canvas** variants (`LineCanvas`, `ScatterPlotCanvas`,
  `HeatMapCanvas`…) precisely because SVG falls over at tens of thousands of marks. A line chart with 50k points is a
  real use case cascivo can't serve today.
- **No gradient or pattern fills.** Fills are solid theme tokens. nivo and visx both expose SVG `<defs>` gradients and
  patterns (`@visx/gradient`, `@visx/pattern`, nivo `defs`/`fill`) — the difference between a flat area and a
  product-grade one.
- **Two curves only.** `shape.ts` offers `linear` + `monotone`. nivo/visx (via d3-shape / `@visx/curve`) offer step,
  natural, basis, cardinal, catmull-rom — needed for stepped counters, smoothed trends, and closed loops.
- **Plain circles for points.** Scatter renders `<circle>` only; there are no **glyph shapes** (square, diamond,
  triangle, cross, star) the way `@visx/glyph` provides for encoding a categorical dimension by shape.
- **No brush, zoom, or voronoi-mesh hover.** visx's interaction packages (`@visx/brush`, `@visx/zoom`, `@visx/drag`,
  `@visx/voronoi`) are its signature. cascivo has rectilinear `nearest` hit-testing but no range-select, no pan/zoom,
  and no voronoi for precise nearest-point detection on dense scatter.
- **A private engine, not a documented toolkit.** cascivo *exports* its scales/shapes/stats, but they're undocumented
  and not positioned as a composable "build your own chart" surface — which is **visx's entire reason to exist**.
- **~18 types vs nivo's ~29.** Missing the highest-demand exotics: **Sankey, Sunburst, Stream, Calendar heatmap**
  (and a long tail: Chord, Bump, Swarm, Waffle, Network, Icicle/Tree, ParallelCoordinates, Marimekko, GeoMap,
  CirclePacking, PolarBar, TimeRange, Wordcloud, Voronoi-as-chart, ViolinPlot).
- **Thin transitions.** v51 added a fade-in; nivo animates enter/update/exit with react-spring. cascivo has no
  data-change transitions — but must stay reduced-motion-safe and dependency-free (no react-spring).

### Framing: adopt the ideas, keep the identity

The first job of this roadmap was to resist two wrong conclusions: "rebuild as a visx-style unstyled toolkit" and
"ship all 29 nivo chart types." Both abandon what makes cascivo cascivo — **components that are correct, accessible,
and theme-true by default, with zero runtime dependencies.** So v52 adopts the *best ideas* of each within those
constraints: visx's **composable primitives + interaction toolkit** (T1/T3/T5), nivo's **expressiveness + Canvas
performance** (T1/T2/T4), and a **focused four** of the exotic chart types (T6) — while explicitly deferring the GIS,
network, and long-tail types (cascivo's `@cascivo/flow` already covers node/edge graphs), refusing a react-spring
dependency, and **never** regressing the a11y fallback (Canvas charts keep the visually-hidden data table +
`aria-live`).

---

## The findings, verified against today's code

Legend: ✅ already strong / a lead to protect · ⚠️ partial / present-but-limited · ❌ genuine gap. Severity is impact
on *real-world expressiveness, performance, and adoption*.

### Lens 1 — nivo (expressiveness & performance of a components library)

| #     | Finding (severity)                                          | Verified state today                                                                                                  | Tranche |
| ----- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| N-1   | No Canvas renderer for large datasets (🔴)                  | ❌ `grep -ri canvas\|getContext packages/charts/src` → 0 hits. SVG-only; thousands of marks tank. nivo ships `*Canvas` variants. | T4      |
| N-2   | No gradient / pattern fills (🟠)                            | ❌ no `<defs>`/`linearGradient`/`<pattern>` in the charts. Fills are solid `--cascivo-chart-*`. nivo `defs`/`fill`, visx Gradient/Pattern. | T1      |
| N-3   | Only two curve interpolations (🟠)                          | ❌ `shape.ts:31` `curve: 'linear' \| 'monotone'`. No step/natural/basis/cardinal/catmull. nivo/d3 + `@visx/curve`. | T1      |
| N-4   | No enter / update / exit transitions (🟡)                   | ⚠️ v51 added a reduced-motion fade-in only; data changes snap. nivo animates with react-spring (which cascivo won't take as a dep). | T7      |
| N-5   | Missing high-demand chart types (🟠)                        | ❌ no Sankey, Sunburst, Stream, Calendar (Sankey/Sunburst were deferred in v51). nivo has all four + ~7 more cascivo lacks. | T6      |
| N-6   | A11y + theming **lead** both libraries (✅ protect)         | ✅ keyboard nav + `aria-live` + fallback `<table>` (every chart); CVD-safe across 14 themes. nivo ARIA is partial; this is cascivo's moat — do not regress. | all     |

### Lens 2 — visx (composability & interaction of a toolkit)

| #     | Finding (severity)                                          | Verified state today                                                                                                  | Tranche |
| ----- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| V-1   | No brush / zoom / pan / drag (🔴)                           | ❌ `grep -ri brush\|zoom\|voronoi packages/charts/src` → 0 hits. visx's signature interaction packages. (Brush was deferred in v51.) | T3      |
| V-2   | No voronoi-mesh hover (🟠)                                  | ⚠️ `core/nearest.ts` does rectilinear nearest-point; no voronoi tessellation for precise dense-scatter hover (`@visx/voronoi`). | T3      |
| V-3   | No point-glyph shape variety (🟠)                           | ❌ scatter renders `<circle>` only; no square/diamond/triangle/cross/star glyphs (`@visx/glyph`) to encode a 2nd categorical dim. | T2      |
| V-4   | No note-with-connector annotations or threshold shading (🟠) | ⚠️ v51 reference line/area/dot exist, but no leader-line **note/label** (`@visx/annotation`) and no difference/threshold band (`@visx/threshold`, `@visx/marker`). | T2      |
| V-5   | Engine is private, not a documented toolkit (🟠)            | ⚠️ scales/shapes/stats are exported from `index.ts` but undocumented and not positioned as composable primitives — visx's entire value proposition. | T5      |
| V-6   | No `Text` with wrapping / `clip-path` helpers (🟡)          | ⚠️ axis/labels use raw `<text>` with manual thinning; no wrapping `Text` primitive (`@visx/text`) or shared clip helpers for overflow. | T5      |

**Net:** the highest-leverage work is **Canvas** (N-1 — the one thing SVG fundamentally can't do) and the
**interaction toolkit** (V-1/V-2 — brush/zoom/voronoi, visx's signature). Close behind: **visual enrichment**
(N-2/N-3/V-3 — gradients/patterns/curves/glyphs, cheap and ubiquitous) and **the four exotic types** (N-5). The
**composable-toolkit** framing (V-5/V-6) is mostly documentation + light API hardening over the engine that already
exists. Transitions (N-4) and the docs comparison are the closing polish. **a11y/theming (N-6) is a lead to protect
in every tranche, not a tranche of its own.**

---

## Tranche map

| Tranche | Lens(es)        | Theme                                                                                                               |
| ------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| T1      | nivo + visx     | **Visual enrichment** — SVG `<defs>` gradient + pattern fills, and an expanded curve-factory set (step/natural/basis/cardinal/catmull). (N-2/N-3) |
| T2      | visx + nivo     | **Glyphs & richer annotations** — point-glyph shapes (circle/square/diamond/triangle/cross/star) and note-with-connector annotations + threshold/difference shading. (V-3/V-4) |
| T3      | visx            | **Interaction toolkit** — Brush (range-select), zoom/pan, and voronoi-mesh precise hover — all keyboard-operable, a11y-preserving. (V-1/V-2) |
| T4      | nivo            | **Canvas rendering path** — opt-in `renderer="canvas"` for high-density Line/Scatter/Heatmap, with the SVG a11y fallback table + `aria-live` preserved and an auto-switch threshold. (N-1) |
| T5      | visx            | **Composable primitives toolkit** — promote the engine to a documented, public `@cascivo/charts` primitive surface (scales, shapes, axes, grids, curves, glyphs, gradients, patterns, a wrapping `Text`) with a "build your own chart" guide. (V-5/V-6) |
| T6      | nivo            | **High-demand exotic types** — Sankey + Sunburst (close the v51 deferral) + Stream graph + Calendar heatmap. (N-5) |
| T7      | nivo + docs     | **Transitions + comparison docs** — CSS/SVG-native enter/update/exit transitions (reduced-motion gated, no react-spring) and a "cascivo vs nivo vs visx" comparison + toolkit reference + recipe gallery (folding in v51's deferred docs). (N-4) |

Ordering rationale: **T1 first** — gradients/patterns/curves are cheap, ubiquitous, and unblock richer demos for
everything after. **T2** adds glyphs + annotation notes (small, self-contained). **T3** is the signature interaction
work and wants the visual layer settled. **T4** (Canvas) is the heaviest and most isolated — a parallel renderer
behind a flag. **T5** documents/handles the toolkit (depends on T1–T3's new primitives existing). **T6** adds the
exotic types. **T7** animates and documents the finished surface. T1–T4 are largely independent; T5–T7 depend on them.

---

## Out of scope

- **Becoming a visx-style unstyled toolkit.** cascivo stays batteries-included: components correct + accessible +
  themed by default. T5 *exposes* primitives as a documented escape hatch; it does not invert the library into
  primitives-first.
- **A react-spring (or any motion-library) dependency.** Transitions (T7) are CSS/SVG-native and reduced-motion
  gated, per the zero-dependency policy.
- **An HTML renderer.** SVG (default) + Canvas (T4, large data) cover the spectrum; nivo's third HTML path is not
  worth the surface.
- **The exotic long tail.** GeoMap/Choropleth and ParallelCoordinates/Marimekko/Icicle/Wordcloud/CirclePacking/
  PolarBar/TimeRange/Chord/Bump/Swarm/Waffle/ViolinPlot are **not** in v52. **Network/force graphs are covered by
  `@cascivo/flow`** (node/edge), so cascivo will not add nivo's Network. T6 ships only the four highest-demand types.
- **Regressing accessibility.** Every new renderer/type/interaction keeps the keyboard path, the `aria-live` readout,
  and the visually-hidden data table. Canvas is an *additional* paint, not a replacement for the a11y tree.
- **Changing the palette / theming model.** New fills (gradients/patterns) derive from the existing
  `--cascivo-chart-*` tokens; no new theming system.

---

## Definition of done (verified after T7)

- Areas/bars/pie can fill with theme-derived gradients and patterns; the curve set covers step/natural/basis/cardinal/
  catmull alongside linear/monotone.
- Scatter/line points can be glyph shapes; annotations can carry a connector + note; threshold/difference shading is
  available.
- A keyboard-operable Brush subsets a series, charts pan/zoom, and dense scatter uses voronoi-mesh hover.
- High-density Line/Scatter/Heatmap can render to Canvas behind `renderer="canvas"` (or auto), with the SVG a11y
  fallback table + `aria-live` intact.
- The engine is documented as a public composable toolkit with a "build your own chart" walkthrough.
- Sankey, Sunburst, Stream, and Calendar heatmap ship with metas, tests, stories, and generated docs.
- Data-change transitions run and are fully suppressed under `prefers-reduced-motion`; a "vs nivo / vs visx"
  comparison page and recipe gallery are published.
- `pnpm ready` green; CVD/theme checks pass across all 14 themes; the charts mobile sweep passes at 320/360/390/414;
  zero runtime dependencies added.

---

## Notes

- This roadmap is **Planned, not Shipped** — per the task that produced it (study nivo + visx, plan the gaps, do not
  implement). The tranche docs carry the task-by-task steps for when implementation begins.
- v52 **subsumes the v51 deferrals**: Brush + voronoi (→ T3), Sankey + Sunburst (→ T6), the engine/toolkit reference +
  recipe gallery (→ T5/T7). The v51 follow-up list is closed by this plan.
- The verification figures (0 Canvas/brush/zoom/voronoi/gradient hits, 2 curves, 18 types) are point-in-time reads of
  `main` at 2026-06-27 and should be re-confirmed at implementation start.
