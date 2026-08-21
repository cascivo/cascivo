---
'@cascivo/charts': minor
---

An engine-free `Sparkline`, and area fills that read like the rest of the system.

**New: `@cascivo/charts/sparkline`.** `import { Sparkline } from '@cascivo/charts'` pulls in
the whole charting engine — tooltips, voronoi hit-testing, canvas, zoom/pan, toolbox,
PNG/SVG export — because `Sparkline` is built on the same frame as every other chart. An
adopter measured 44.87 kB / 14.84 kB gzip for one trend line on a landing page. The subpath
draws the identical chart on a minimal frame at ~3.5 kB gzip. Same props, same markup, same
styling (asserted by a DOM-parity test); the one difference is **no hover tooltip**, because
the tooltip is what requires the engine. A CI size budget keeps it that way.

**`AreaChart` warns on dual-axis area fills.** `warnScaleMismatch` steers a mismatched pair
onto two axes and stops there, which leaves two areas compositing into a muddy third colour
where they cross. The new warning names both series and the one-prop fix (`type: 'line'` on
the secondary series), matching the house style of the existing chart warnings.

**`AreaChart` defaults a single non-stacked series to `fill="gradient"`.** A lone solid area
renders as a block of colour from the curve to the baseline, heavier than the rest of the
system. Stacked and overlapping series keep `solid` — stacked bands need to read as areas,
and overlapping ones already drop to a lower opacity. Pass `fill` explicitly to override.
This changes the appearance of existing single-series area charts.

**`Histogram.label` now renders.** It was a required prop documented as "rendered visibly
beneath the axis", destructured as `_label` and never used. It is drawn as the x-axis title.
