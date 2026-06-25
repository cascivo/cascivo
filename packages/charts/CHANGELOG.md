# @cascivo/charts

## 0.3.3

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2
  - @cascivo/i18n@0.1.10

## 0.3.2

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1
  - @cascivo/i18n@0.1.9

## 0.3.1

### Patch Changes

- 4554af1: Make object-valued prop shapes machine-readable. `ComponentMeta` gains an optional
  `typeDefs` field (`TypeDefMeta`/`TypeFieldMeta`) describing the fields of object props —
  the per-datum/per-series `color` override was previously only discoverable in prose, so
  AI/registry consumers filtering props by name never found it. `PieChart` and `BarChart`
  now declare `typeDefs` for `PieChartDatum`, `BarChartSeries`, `StackedRow`/`StackedSegment`,
  and the `ChartPoint` tooltip-callback argument; these flow into `registry.json`, the MCP
  `get_component` payload, and a new `## Object types` section in the generated `llms.txt`
  component docs. The `@cascivo/charts` README now documents coloring, donut center labels,
  and `toStackedSeries` row-pivot usage. Resolves the `@lifosy/ui` charts discoverability gap.
- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0
  - @cascivo/i18n@0.1.8

## 0.3.0

### Minor Changes

- 75ab15e: PieChart: donut `centerValue`/`centerLabel` (+ `centerSlot`), `thickness`/`innerRadius`, square
  `size` shorthand, a visible "No data" empty-state (`emptyLabel`, i18n built-in), and a `value (pct%)`
  slice-colored tooltip with a `tooltipFormat` escape hatch. BarChart: `toStackedSeries(rows)` pivot
  helper (preserving per-segment color), a stacked per-segment tooltip (`label · total` + per-layer
  breakdown) with `tooltipFormat`, and `xLabelEvery` x-label thinning. Per-datum/per-series `color`
  override documented in the metas and covered by tests. Resolves the `@lifosy/ui` charts adoption
  feedback (C1–C12).

### Patch Changes

- 75ab15e: Improvements
- Updated dependencies [75ab15e]
  - @cascivo/i18n@0.1.7

## 0.2.1

### Patch Changes

- fa55081: SideNav improvements
- Updated dependencies [fa55081]
  - @cascivo/core@0.1.3
  - @cascivo/i18n@0.1.3

## 0.2.0

### Minor Changes

- 30b0f20: Publish `@cascivo/charts` to npm. The package was previously private and
  source-only; it now builds to `dist/` (ESM + flat `.d.ts` + `charts.css`) with a
  proper export map (`@cascivo/charts` and `@cascivo/charts/styles.css`), so
  `pnpm add @cascivo/charts` works. Ships token-themed `LineChart`, `AreaChart`,
  `BarChart`, `Sparkline`, and the rest of the chart set the registry already
  pointed at.

### Patch Changes

- 72d0086: New location
- Updated dependencies [72d0086]
  - @cascivo/core@0.1.2
  - @cascivo/i18n@0.1.2
