---
'@cascivo/core': minor
'@cascivo/charts': patch
---

Make object-valued prop shapes machine-readable. `ComponentMeta` gains an optional
`typeDefs` field (`TypeDefMeta`/`TypeFieldMeta`) describing the fields of object props —
the per-datum/per-series `color` override was previously only discoverable in prose, so
AI/registry consumers filtering props by name never found it. `PieChart` and `BarChart`
now declare `typeDefs` for `PieChartDatum`, `BarChartSeries`, `StackedRow`/`StackedSegment`,
and the `ChartPoint` tooltip-callback argument; these flow into `registry.json`, the MCP
`get_component` payload, and a new `## Object types` section in the generated `llms.txt`
component docs. The `@cascivo/charts` README now documents coloring, donut center labels,
and `toStackedSeries` row-pivot usage. Resolves the `@lifosy/ui` charts discoverability gap.
