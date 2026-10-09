---
'@cascivo/tokens': patch
---

`@cascivo/editor`'s colour tokens (`--cascivo-editor-*`) are declared on `[data-theme]` as well as `:root`, so a code editor inside a scoped theme uses that theme's surface, text and syntax colours instead of the root theme's. A light section inside a dark page no longer keeps the dark syntax hues, and the reverse.
