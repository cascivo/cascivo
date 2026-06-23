---
'@cascivo/icons': minor
---

Expand the icon catalog from 60 to ~440 icons by adopting the full chromicons
set (MIT, stroked 24×24 — the same family as the existing Feather-derived
icons), generated from vendored SVG source via `scripts/icons/generate.mjs`.
Purely additive: no existing icon name, signature, or geometry changes;
collisions resolve in favor of the existing export. A new `icons.catalog.json`
manifest (name, keywords, category) powers the searchable `/icons` docs gallery.
