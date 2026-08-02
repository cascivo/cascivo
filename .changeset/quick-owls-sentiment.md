---
'@cascivo/core': minor
'@cascivo/charts': minor
---

Render `secondAxis.label`, and colour `Stat`/`Kpi` deltas by sentiment.

`AreaChart`/`LineChart`'s `secondAxis.label` was typed and documented but never drawn, so a
dual-axis chart had no way to say which series belonged to which scale. `Axis` gains a
`title`/`titleOffset` pair; the right margin now reserves room for it.

`Stat` and `Kpi` hard-coded "up is green, down is red", so a deploy console's two
most-watched tiles — errors and latency — rendered their worst news in green, and negating
the delta to correct the colour also reversed the arrow. Both now take
`goodDirection?: 'up' | 'down' | 'neutral'` (default `'up'`, so existing behaviour is
unchanged), backed by a shared `sentimentOf` in `@cascivo/core` so the two tiles in two
packages cannot drift apart.
