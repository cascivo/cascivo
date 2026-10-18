---
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/ai': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
---

Every component stylesheet now opens with the canonical `@layer` order statement. A sheet that
started `@layer cascivo.component{…}` fixed the layer order by being loaded first, so a page
that loaded it before the tokens (Astro dev with an MDX layout) ended up with `cascivo.component`
below `cascivo.reset`. Identical statements are idempotent, so nothing changes where the order was
already declared; the cost is about 120 bytes per file before gzip.
