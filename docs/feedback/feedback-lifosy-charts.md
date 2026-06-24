# Cascivo Charts — Feedback for Zero-Downside Adoption

**Goal:** what `@cascivo/react`'s chart components need so `@lifosy/ui`'s
`DonutChart` and `StackedBarChart` (used by `TodoAnalytics`) can be replaced by
Cascivo with **no loss of fidelity or behavior**.

**Date:** 2026-06-24

---

## Context

The app's two charts are small (126 + 171 lines), dependency-free SVG components
tuned to a dense, monospace analytics UI. They were deliberately **kept** in
Phase 3 because Cascivo's `chart/pie-chart` and `chart/bar-chart` can't yet
reproduce them without regressions. Below is exactly what's missing, per chart,
with the concrete API changes that would close each gap.

Cascivo today:
- **PieChart** — `data: PieChartDatum[]` (`{ label, value }`), `donut`, `width`,
  `height`, `legend`, `plain`. Colors come **only** from the theme palette
  `--cascivo-chart-1..8`.
- **BarChart** — `series: BarChartSeries<Datum>[]` + `x`/`y` accessors,
  `orientation`, `mode: 'grouped' | 'stacked'`, `xTicks`/`yTicks`, `legend`,
  `plain`.

---

## DonutChart → Cascivo PieChart

Current API: `segments: { label, value, color }[]`, `size`, `thickness`,
`centerLabel`, `centerValue`. Hover dims other slices and shows a
`label / value (pct%)` tooltip. Renders a `NO DATA` state when total is 0.

| # | Gap | Severity | Needed change in Cascivo |
|---|-----|----------|--------------------------|
| 1 | **Per-datum color.** The app assigns *semantic* status colors (backlog / in-progress / done). Cascivo rotates `--cascivo-chart-1..8`, so a slice's color is positional, not meaningful. | 🔴 Blocker | `PieChartDatum` gains an optional `color?: string` that overrides the palette for that slice. |
| 2 | **Center content.** The donut shows a center value + label (e.g. total count). Cascivo's `donut` has no center API. | 🔴 Blocker | Add `centerValue?: string` + `centerLabel?: string` (or a `centerSlot`/children render) for `donut`. |
| 3 | **Donut thickness.** App controls ring `thickness` (inner radius). Cascivo exposes only `width`/`height`. | 🟠 Major | Add `thickness?: number` (or `innerRadius?: number`) for `donut`. |
| 4 | **Square sizing.** App sizes by a single `size` (square) and renders crisply at ~120–160px. Cascivo takes separate `width`/`height` (default height 300). | 🟡 Minor | Accept `size?: number` shorthand, or document `width===height` for donuts. |
| 5 | **Empty state.** App renders a `NO DATA` placeholder at `total === 0`. | 🟡 Minor | Define/zero-data render (placeholder slot or documented behavior) instead of an empty/NaN arc. |
| 6 | **Tooltip format.** App tooltip shows `value (pct%)` in the slice color. | 🟡 Minor | Allow a tooltip formatter, or match `value (pct%)` + slice-colored text. |

---

## StackedBarChart → Cascivo BarChart (`mode: 'stacked'`)

Current API: `data: { label, segments: { value, color, label }[] }[]`,
`width`, `height`, `colors: { border, muted, bg }`. Vertical stacked bars;
dashed Y grid + Y tick labels; thinned X labels (every Nth + last); hover dims
other bars and shows a `label · total` + per-segment breakdown tooltip.

| # | Gap | Severity | Needed change in Cascivo |
|---|-----|----------|--------------------------|
| 1 | **Per-series / per-segment color.** Each stack layer has a semantic color. Need to confirm `BarChartSeries` carries a `color`; if not, stacked layers fall back to the palette. | 🔴 Blocker | `BarChartSeries` gains `color?: string` (per-layer override). |
| 2 | **Pre-stacked data shape.** App data is per-bar `{ label, segments[] }`; Cascivo wants column-oriented `series[]` + `x`/`y` accessors. A faithful swap forces a pivot. | 🟠 Major | Accept a row/stacked-friendly shape (e.g. `data: { label, segments: { key, value, color }[] }[]`) **or** document the canonical pivot recipe. |
| 3 | **Axis/grid theming.** App passes explicit `colors.border` / `colors.muted` for dashed grid + axis text. Cascivo uses `--cascivo-chart-grid` / `--cascivo-chart-axis`. | 🟡 Minor | These tokens cover it — just ensure they're honored in `plain`/small modes (add to the LifeOS bridge: map `--cascivo-chart-grid/axis` → `--los-border`/`--los-muted`). |
| 4 | **X-label thinning.** App shows every Nth label + always the last. Cascivo has `xTicks` (count). | 🟡 Minor | Confirm `xTicks` always includes the final category, or add `xLabelEvery?: number`. |
| 5 | **Tooltip content.** App tooltip lists `label · total` then each non-zero segment in its color. | 🟡 Minor | Tooltip formatter, or a stacked default that lists per-layer values in layer colors. |
| 6 | **Tiny embedded sizing.** Bars render inside small panels (responsive `width`/`height` from a measured container). | 🟡 Minor | Confirm `plain` + explicit `width`/`height` render crisply < 200px tall with no clipped axis. |

---

## Cross-cutting

- **Per-datum color is the headline ask.** Both charts encode *meaning* in
  color (status, category). Without a per-datum/per-series `color` override,
  every migration loses semantic color — the single biggest downside. This one
  change unblocks the majority of real-world adoption.
- **Preact compat.** Charts must mount under the established bridge
  (`preact/compat` + `@preact/signals-react → @preact/signals`). Verified for
  `Button`; add a chart smoke test to the spike when adopting.
- **Bridge tokens.** When charts are adopted, extend `packages/ui/src/cascivo.css`
  to map `--cascivo-chart-1..8`, `--cascivo-chart-grid`, `--cascivo-chart-axis`
  onto the LifeOS palette so chart colors match the app theme.

---

## Definition of done (acceptance checklist)

A Cascivo-backed `DonutChart`/`StackedBarChart` can replace the custom ones when:

- [ ] `PieChartDatum.color` and `BarChartSeries.color` overrides land (#1 both).
- [ ] Donut `centerValue`/`centerLabel` (or center slot) lands.
- [ ] Donut `thickness`/`innerRadius` is controllable.
- [ ] Zero-data and tiny-size (<160px) rendering are defined and crisp.
- [ ] Tooltips can show `value (pct%)` (pie) and per-segment breakdown (bar), or
      accept a formatter.
- [ ] Chart palette tokens are mapped in the LifeOS bridge and charts mount under
      Preact (smoke test green).

Until #1 (per-datum/series color) ships, keep the custom charts — that's the
only true blocker; the rest are polish that can follow.
