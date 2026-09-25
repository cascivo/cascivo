---
'@cascivo/render': minor
---

`validatePartialView(text)` validates a view while an agent is still streaming it: it checks the longest finished prefix of the JSON text, reports an unknown component or bad prop as soon as it has fully arrived, holds back errors that only mean "not arrived yet", and returns the parsed prefix for progressive rendering. `fromA2UI(components)` turns an A2UI v0.9 surface into a `ViewConfig` that `<CascivoView>` renders, against cascivo's A2UI catalog at `https://cascivo.com/a2ui/v0_9/catalog.json` (`A2UI_CATALOG_ID`). A json-render catalog and registry is published at `https://cascivo.com/json-render/catalog.tsx`.
