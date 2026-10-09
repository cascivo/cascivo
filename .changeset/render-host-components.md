---
'@cascivo/render': minor
---

`<CascivoView components={{ Kpi, LineChart }}>` renders components beyond the built-in set: charts from `@cascivo/charts`, or an app's own. They are looked up before the built-ins and their props pass through unchecked. `validateView(view, { components })` accepts the same names, and `viewToMarkdown(view, { components })` reads them. `@cascivo/render` gains no dependency: only an app that renders charts installs `@cascivo/charts`.
