---
'@cascivo/charts': minor
---

Rename the calendar-heatmap chart to `CalendarHeatmap`.

`Calendar` named two different components with incompatible APIs: this heatmap, and
`@cascivo/react`'s date picker. A dashboard importing from both packages got whichever
resolved last, with no error — and because the docs generator resolved a component's
distribution channel by display name rather than by its own module, the heatmap's page told
adopters to `import { Calendar } from '@cascivo/react'`, which hands back the date picker.

**Breaking:** `Calendar`, `CalendarProps` and `CalendarDatum` are removed, not deprecated.
Migrate to `CalendarHeatmap`, `CalendarHeatmapProps` and `CalendarHeatmapDatum`. The aliases
were kept briefly during development and deleted before release, because keeping them would
have kept the symbol colliding with `@cascivo/react`'s `Calendar` — the exact hazard the
rename exists to remove. A one-line find-and-replace; the props are unchanged.

The copy-paste `layout/app-shell` was renamed in the same pass — `AppShell` → `AppFrame` —
for the same reason. It is not published, so no npm consumer is affected; adopters who
already copied the source own their copy and are unaffected.
