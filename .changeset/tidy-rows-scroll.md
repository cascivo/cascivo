---
'@cascivo/react': patch
---

`DataTable` handles a million rows: reachable to the last row, measured row height,
and search/sort/selection that no longer scale with the row count per render.

Measured at 1,000,000 rows in Chromium before this change: the scroller's height hit
the browser's element clamp (33.5M px in Chromium), so rows past 838,871 could never
be scrolled to; the window math assumed 40 px rows while the density presets render
36/48/60 px plus a border; a sort by a text column froze the page for ~4 s; each
search keystroke was a 500–850 ms task (the filtered set was re-sorted per key); and
with every row selected each render spent ~300 ms on `includes` checks.

Now the virtual canvas is capped and the scroll position is mapped onto the row space by
ratio (the technique the large grids use), so the bottom of the scrollbar is the last row
at any count; row height and viewport are measured (`rowHeight` and `windowSize` become
overrides rather than defaults); rows are sorted once and the sorted rows are filtered per
keystroke through a per-row lower-cased haystack that is primed in idle time and narrowed
from the previous result; text columns sort by ranked distinct values through one
`Intl.Collator`; and selection membership is a `Set` rebuilt only when the selection
changes.

Measured after, same page: the last row is reachable, wheel scrolling stays at 60 fps
with no long tasks, a search keystroke is ~200 ms in the worst case (a query every row
matches) and ~40 ms of that is the filter itself, a numeric sort is ~300 ms and a text
column with hundreds of distinct values ~450 ms. A million _distinct_ strings still take
~2.8 s to collate — that is the collator's floor, so use `sortMode: 'server'` there.
