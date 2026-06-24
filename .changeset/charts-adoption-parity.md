---
'@cascivo/charts': minor
---

PieChart: donut `centerValue`/`centerLabel` (+ `centerSlot`), `thickness`/`innerRadius`, square
`size` shorthand, a visible "No data" empty-state (`emptyLabel`, i18n built-in), and a `value (pct%)`
slice-colored tooltip with a `tooltipFormat` escape hatch. BarChart: `toStackedSeries(rows)` pivot
helper (preserving per-segment color), a stacked per-segment tooltip (`label · total` + per-layer
breakdown) with `tooltipFormat`, and `xLabelEvery` x-label thinning. Per-datum/per-series `color`
override documented in the metas and covered by tests. Resolves the `@lifosy/ui` charts adoption
feedback (C1–C12).
