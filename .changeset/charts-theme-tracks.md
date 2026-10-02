---
'@cascivo/charts': patch
---

`Meter`'s track is `--cascivo-color-surface-2` instead of `--cascivo-color-border` (near-black
in the hard-edged themes), and the bar's corners follow `--cascivo-radius-full` instead of a
baked-in pill, so a zero-radius theme gets a square bar. `Bullet`'s range bands are mixed from
the theme's foreground instead of fixed grey primitives that glared on dark themes. `Heatmap`
thins crowded axis labels the way `BarChart` does, so 24 hourly rows no longer overprint.
