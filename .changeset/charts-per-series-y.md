---
'@cascivo/charts': minor
---

`AreaChart`, `LineChart`, and `BarChart` series accept a per-series `y` accessor.

The chart-level `x`/`y` still apply to every series, but a series may now override `y` to
plot a different field from the same rows — e.g. two series over one `data` array with
`y: (d) => d.requests` and `y: (d) => d.errors`. Previously you had to pre-shape each
series into a uniform `{x,y}` array or it silently plotted the same field twice. `x` stays
chart-level (one x-domain per chart). Additive and backward-compatible: series with no
`y` use the chart-level accessor exactly as before.
