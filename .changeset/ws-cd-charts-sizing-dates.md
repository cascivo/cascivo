---
'@cascivo/charts': minor
---

Charts: document responsive sizing, clamp over-wide charts, and give `AreaChart` a time axis.

- **`AreaChart` now accepts a `Date` x accessor** (`x: (d) => number | Date`), reaching parity with `LineChart`: return Dates and the chart uses a time scale with date-formatted ticks ("Jul 10"), instead of forcing you to encode day-of-month as an integer. Numeric x is unchanged.
- **Sizing is documented where it's read.** Charts are responsive by default — omit `width` and the chart fills/tracks its container. The `width`/`height` prop JSDoc, the `useChartSize()` hook JSDoc, and a new README "Sizing" section now say so; the manifests regenerate accordingly.
- **Over-wide charts are clamped, not clipped.** An explicit `width` larger than the container now scales down (`max-inline-size: 100%` on the SVG, which carries a viewBox) instead of overflowing its card — so a `width={420}` chart in a 320px card shows all its data.
